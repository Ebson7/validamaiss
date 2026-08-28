/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 *  Backend de Pagamento — Mercado Pago (Checkout Pro)
 * ============================================================================
 *  Duas funções HTTPS:
 *   - criarPreferencia: cria a cobrança no Mercado Pago e devolve o link.
 *   - mpWebhook: recebe a confirmação do MP e marca a reserva como paga.
 *
 *  Segredo necessário (NUNCA no front-end):
 *    MP_ACCESS_TOKEN  → Access Token do Mercado Pago (comece com o de TESTE)
 *  Config:
 *    APP_URL          → URL pública do app (ex: https://gen-lang-client-...web.app)
 *
 *  Deploy (Firebase Functions, requer plano Blaze):
 *    firebase functions:secrets:set MP_ACCESS_TOKEN
 *    firebase deploy --only functions
 *  Veja functions/README.md para o passo a passo e alternativas (Cloudflare).
 * ============================================================================
 */

const { onRequest } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const FIRESTORE_DATABASE_ID = 'ai-studio-a3fd2431-2a08-4b72-853b-bad27ade6996';
const MP_API = 'https://api.mercadopago.com';

initializeApp();
const db = getFirestore(FIRESTORE_DATABASE_ID);

const cors = (res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
};

function mapStatus(mpStatus) {
  if (mpStatus === 'approved') return 'aprovado';
  if (mpStatus === 'rejected' || mpStatus === 'cancelled') return 'rejeitado';
  if (mpStatus === 'refunded' || mpStatus === 'charged_back') return 'reembolsado';
  return 'pendente';
}

// ── 1. Cria a preferência de pagamento ────────────────────────────────────
exports.criarPreferencia = onRequest({ secrets: ['MP_ACCESS_TOKEN'], cors: true }, async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).send('');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { reservaId } = req.body || {};
    if (!reservaId) return res.status(400).json({ error: 'reservaId é obrigatório' });

    // Preço é lido do servidor — nunca confiar no valor vindo do cliente.
    const snap = await db.collection('reservas').doc(reservaId).get();
    if (!snap.exists) return res.status(404).json({ error: 'Reserva não encontrada' });
    const reserva = snap.data();

    if (reserva.status === 'cancelado') return res.status(400).json({ error: 'Reserva cancelada' });
    if (reserva.pagamentoStatus === 'aprovado') return res.status(400).json({ error: 'Reserva já paga' });

    const appUrl = process.env.APP_URL || 'https://gen-lang-client-0971671639.web.app';

    const preference = {
      items: [
        {
          id: reserva.produtoId,
          title: reserva.nomeProduto,
          description: `Reserva em ${reserva.nomeLoja}`,
          quantity: reserva.quantidade,
          currency_id: 'BRL',
          unit_price: Number((reserva.precoTotal / reserva.quantidade).toFixed(2)),
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
      notification_url: `${req.protocol}://${req.get('host')}/mpWebhook`,
    };

    const mpRes = await fetch(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });
    const data = await mpRes.json();
    if (!mpRes.ok) {
      console.error('Erro MP ao criar preferência:', data);
      return res.status(502).json({ error: 'Falha ao criar cobrança no Mercado Pago' });
    }

    await snap.ref.set(
      { pagamentoStatus: 'pendente', mpPreferenceId: data.id, atualizadoEm: new Date().toISOString() },
      { merge: true }
    );

    return res.json({ init_point: data.init_point, preferenceId: data.id });
  } catch (err) {
    console.error('criarPreferencia erro:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

// ── 2. Webhook do Mercado Pago ────────────────────────────────────────────
exports.mpWebhook = onRequest({ secrets: ['MP_ACCESS_TOKEN'] }, async (req, res) => {
  try {
    // MP envia { type/topic: 'payment', data: { id } } (varia por versão)
    const topic = req.query.type || req.query.topic || (req.body && req.body.type);
    const paymentId =
      (req.query['data.id']) || (req.body && req.body.data && req.body.data.id) || req.query.id;

    if (topic !== 'payment' || !paymentId) {
      return res.status(200).send('ignored'); // 200 para o MP não reenviar indefinidamente
    }

    const payRes = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const pay = await payRes.json();
    if (!payRes.ok) {
      console.error('Erro MP ao buscar pagamento:', pay);
      return res.status(200).send('error-fetch');
    }

    const reservaId = pay.external_reference;
    if (!reservaId) return res.status(200).send('sem-referencia');

    await db.collection('reservas').doc(reservaId).set(
      {
        pagamentoStatus: mapStatus(pay.status),
        mpPaymentId: String(pay.id),
        valorPago: pay.transaction_amount,
        atualizadoEm: new Date().toISOString(),
      },
      { merge: true }
    );

    return res.status(200).send('ok');
  } catch (err) {
    console.error('mpWebhook erro:', err);
    return res.status(200).send('erro'); // sempre 200 para o MP
  }
});
