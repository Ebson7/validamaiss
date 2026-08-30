/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 *  Backend de Pagamento — Mercado Pago (Checkout Pro) — Cloudflare Worker
 * ============================================================================
 *  Dois endpoints HTTP (POST):
 *   - POST /criarPreferencia  { reservaId }  → cria a cobrança e devolve o link
 *   - POST /mpWebhook                         → confirma o pagamento (Mercado Pago)
 *
 *  O Worker fala com o Firestore via REST API, autenticando com uma
 *  Service Account do Google (JWT RS256 assinado com Web Crypto). Assim ele
 *  lê o PREÇO da reserva no servidor (nunca confia no cliente) e grava o
 *  status do pagamento — mesmo com as regras de segurança do Firestore.
 *
 *  Segredos/variáveis (wrangler secret / [vars]) — NUNCA no front-end:
 *    MP_ACCESS_TOKEN           (secret) Access Token do Mercado Pago (comece com TESTE)
 *    FIREBASE_SERVICE_ACCOUNT  (secret) JSON da service account (uma linha)
 *    FIRESTORE_DATABASE_ID     (var)    id do banco Firestore (nomeado)
 *    APP_URL                   (var)    URL pública do app (para os back_urls)
 * ============================================================================
 */

const MP_API = 'https://api.mercadopago.com';
const FS_BASE = 'https://firestore.googleapis.com/v1';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

// ── CORS ───────────────────────────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });

function mapStatus(mpStatus) {
  if (mpStatus === 'approved') return 'aprovado';
  if (mpStatus === 'rejected' || mpStatus === 'cancelled') return 'rejeitado';
  if (mpStatus === 'refunded' || mpStatus === 'charged_back') return 'reembolsado';
  return 'pendente';
}

// Take rate da plataforma (0–1). Configurável via env TAKE_RATE; padrão 18%.
function takeRate(env) {
  const n = Number(env && env.TAKE_RATE);
  return Number.isFinite(n) && n >= 0 && n < 1 ? n : 0.18;
}
const round2 = (v) => Math.round(v * 100) / 100;

// ── Google OAuth (Service Account → access token) ───────────────────────────
function b64url(bytes) {
  let bin = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

let _cachedToken = null; // { token, exp }
async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (_cachedToken && _cachedToken.exp - 60 > now) return _cachedToken.token;

  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claim = b64url(
    new TextEncoder().encode(
      JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/datastore',
        aud: TOKEN_URL,
        iat: now,
        exp: now + 3600,
      })
    )
  );
  const signingInput = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput)
  );
  const jwt = `${signingInput}.${b64url(sig)}`;

  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`OAuth falhou: ${JSON.stringify(data)}`);
  _cachedToken = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return _cachedToken.token;
}

// ── Firestore REST helpers ──────────────────────────────────────────────────
function fsDocPath(env, collection, id) {
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const dbId = env.FIRESTORE_DATABASE_ID || '(default)';
  return `${FS_BASE}/projects/${sa.project_id}/databases/${dbId}/documents/${collection}/${id}`;
}
function fsParseValue(v) {
  if (v == null) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  return null;
}
function fsParseFields(fields = {}) {
  const out = {};
  for (const k of Object.keys(fields)) out[k] = fsParseValue(fields[k]);
  return out;
}
function fsToValue(val) {
  if (typeof val === 'number') return { doubleValue: val };
  if (typeof val === 'boolean') return { booleanValue: val };
  return { stringValue: String(val) };
}
async function fsGet(env, token, collection, id) {
  const resp = await fetch(fsDocPath(env, collection, id), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`Firestore GET falhou: ${resp.status}`);
  const doc = await resp.json();
  return fsParseFields(doc.fields);
}
async function fsPatch(env, token, collection, id, updates) {
  const mask = Object.keys(updates)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join('&');
  const fields = {};
  for (const k of Object.keys(updates)) fields[k] = fsToValue(updates[k]);
  const resp = await fetch(`${fsDocPath(env, collection, id)}?${mask}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });
  if (!resp.ok) throw new Error(`Firestore PATCH falhou: ${resp.status} ${await resp.text()}`);
  return resp.json();
}

// ── 1. Cria a preferência de pagamento ──────────────────────────────────────
async function criarPreferencia(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }
  const { reservaId } = body || {};
  if (!reservaId) return json({ error: 'reservaId é obrigatório' }, 400);

  const token = await getAccessToken(env);
  const reserva = await fsGet(env, token, 'reservas', reservaId);
  if (!reserva) return json({ error: 'Reserva não encontrada' }, 404);
  if (reserva.status === 'cancelado') return json({ error: 'Reserva cancelada' }, 400);
  if (reserva.pagamentoStatus === 'aprovado') return json({ error: 'Reserva já paga' }, 400);

  const appUrl = env.APP_URL || 'https://gen-lang-client-0971671639.web.app';
  const workerBase = new URL(request.url).origin;
  const quantidade = Number(reserva.quantidade) || 1;
  const precoTotal = Number(reserva.precoTotal) || 0;

  const preference = {
    items: [
      {
        id: reserva.produtoId,
        title: reserva.nomeProduto,
        description: `Reserva em ${reserva.nomeLoja}`,
        quantity: quantidade,
        currency_id: 'BRL',
        unit_price: Number((precoTotal / quantidade).toFixed(2)),
      },
    ],
    external_reference: reservaId,
    payer: { email: reserva.usuarioEmail },
    back_urls: {
      success: `${appUrl}/?payment=success&reservaId=${reservaId}`,
      pending: `${appUrl}/?payment=pending&reservaId=${reservaId}`,
      failure: `${appUrl}/?payment=failure&reservaId=${reservaId}`,
    },
    auto_return: 'approved',
    notification_url: `${workerBase}/mpWebhook`,
  };

  const mpRes = await fetch(`${MP_API}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(preference),
  });
  const data = await mpRes.json();
  if (!mpRes.ok) {
    console.error('Erro MP ao criar preferência:', JSON.stringify(data));
    return json({ error: 'Falha ao criar cobrança no Mercado Pago' }, 502);
  }

  await fsPatch(env, token, 'reservas', reservaId, {
    pagamentoStatus: 'pendente',
    mpPreferenceId: data.id,
    atualizadoEm: new Date().toISOString(),
  });

  return json({ init_point: data.init_point, preferenceId: data.id });
}

// ── 2. Webhook do Mercado Pago ──────────────────────────────────────────────
async function mpWebhook(request, env) {
  // MP envia { type/topic: 'payment', data: { id } } (varia por versão)
  const url = new URL(request.url);
  let body = {};
  try {
    body = await request.json();
  } catch {
    /* pode vir só por querystring */
  }
  const topic = url.searchParams.get('type') || url.searchParams.get('topic') || body.type;
  const paymentId =
    url.searchParams.get('data.id') || (body.data && body.data.id) || url.searchParams.get('id');

  if (topic !== 'payment' || !paymentId) {
    return new Response('ignored', { status: 200 }); // 200 p/ o MP não reenviar
  }

  const payRes = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
  });
  const pay = await payRes.json();
  if (!payRes.ok) {
    console.error('Erro MP ao buscar pagamento:', JSON.stringify(pay));
    return new Response('error-fetch', { status: 200 });
  }

  const reservaId = pay.external_reference;
  if (!reservaId) return new Response('sem-referencia', { status: 200 });

  const statusPt = mapStatus(pay.status);
  const valorPago = Number(pay.transaction_amount) || 0;
  const updates = {
    pagamentoStatus: statusPt,
    mpPaymentId: String(pay.id),
    valorPago,
    atualizadoEm: new Date().toISOString(),
  };

  // Ao aprovar: calcula a comissão da plataforma e o repasse líquido do lojista.
  // O repasse nasce 'pendente' — só é liberado quando a retirada é confirmada
  // no app (gatilho = validação do código/QR). A taxa do MP é absorvida pela
  // plataforma (sai da comissão), então o lojista vê um repasse previsível.
  if (statusPt === 'aprovado') {
    const comissao = round2(valorPago * takeRate(env));
    updates.comissaoValor = comissao;
    updates.repasseValor = round2(valorPago - comissao);
    updates.repasseStatus = 'pendente';
  }

  const token = await getAccessToken(env);
  await fsPatch(env, token, 'reservas', reservaId, updates);

  return new Response('ok', { status: 200 });
}

// ── Router ──────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response('', { status: 204, headers: corsHeaders });

    try {
      if (pathname === '/criarPreferencia' && request.method === 'POST') {
        return await criarPreferencia(request, env);
      }
      if (pathname === '/mpWebhook') {
        return await mpWebhook(request, env);
      }
      if (pathname === '/' || pathname === '/health') {
        return json({ ok: true, service: 'validamais-pagamento' });
      }
      return json({ error: 'Rota não encontrada' }, 404);
    } catch (err) {
      console.error('Worker erro:', err && err.stack ? err.stack : String(err));
      // Webhook deve responder 200 mesmo em erro para o MP não reenviar em loop
      if (pathname === '/mpWebhook') return new Response('erro', { status: 200 });
      return json({ error: 'Erro interno' }, 500);
    }
  },
};
