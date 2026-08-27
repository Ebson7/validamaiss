/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ============================================================================
 *  RESET DE PRODUÇÃO — Firebase Admin SDK  (OPERAÇÃO DESTRUTIVA E IRREVERSÍVEL)
 * ============================================================================
 *
 *  Apaga contas do Firebase Authentication e/ou coleções do Firestore
 *  (usuarios, reservas, produtos) do projeto ValidaMais.
 *
 *  ── Como rodar ──────────────────────────────────────────────────────────
 *  Preferencial: pela aba GitHub → Actions → "Reset Platform Data"
 *  (usa o secret FIREBASE_SERVICE_ACCOUNT; nada para baixar).
 *
 *  Local (avançado):
 *    npm install firebase-admin
 *    export FIREBASE_SERVICE_ACCOUNT="$(cat caminho/para/serviceAccount.json)"
 *    node scripts/reset-platform.mjs --confirm APAGAR-TUDO --scope auth-and-data
 *
 *  ── Segurança ───────────────────────────────────────────────────────────
 *  Sem a confirmação exata (APAGAR-TUDO) o script roda em modo DRY-RUN:
 *  apenas conta e mostra o que SERIA apagado, sem apagar nada.
 * ============================================================================
 */

import { readFileSync } from 'node:fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'gen-lang-client-0971671639';
const FIRESTORE_DATABASE_ID = 'ai-studio-a3fd2431-2a08-4b72-853b-bad27ade6996';
const CONFIRM_PHRASE = 'APAGAR-TUDO';
const COLLECTIONS = ['usuarios', 'reservas', 'produtos'];

// ── Lê argumentos (CLI ou variáveis de ambiente do workflow) ──────────────
function getArg(name, envName, fallback) {
  const flag = `--${name}`;
  const i = process.argv.indexOf(flag);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  if (envName && process.env[envName]) return process.env[envName];
  return fallback;
}

const confirm = getArg('confirm', 'CONFIRM', '');
const scope = getArg('scope', 'SCOPE', 'auth-and-data'); // auth-and-data | data-only | auth-only
const isLive = confirm === CONFIRM_PHRASE;

const doAuth = scope === 'auth-and-data' || scope === 'auth-only';
const doData = scope === 'auth-and-data' || scope === 'data-only';

// ── Carrega credenciais do service account ────────────────────────────────
function loadServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
  }
  throw new Error(
    'Credenciais não encontradas. Defina FIREBASE_SERVICE_ACCOUNT (JSON) ou GOOGLE_APPLICATION_CREDENTIALS (caminho).'
  );
}

async function deleteAllAuthUsers(auth, live) {
  let total = 0;
  let failures = 0;
  let pageToken;
  do {
    const res = await auth.listUsers(1000, pageToken);
    const uids = res.users.map((u) => u.uid);
    if (uids.length) {
      if (live) {
        const result = await auth.deleteUsers(uids);
        failures += result.failureCount;
        result.errors.forEach((e) => console.warn(`  ! falha ao apagar uid: ${e.error.message}`));
      }
      total += uids.length;
    }
    pageToken = res.pageToken;
  } while (pageToken);
  return { total, failures };
}

async function deleteCollection(db, name, live, batchSize = 300) {
  const col = db.collection(name);
  let deleted = 0;
  // Conta primeiro (para dry-run)
  const countSnap = await col.count().get();
  const totalDocs = countSnap.data().count;
  if (!live) return { name, deleted: 0, total: totalDocs };

  while (true) {
    const snap = await col.limit(batchSize).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    deleted += snap.size;
  }
  return { name, deleted, total: totalDocs };
}

async function main() {
  const serviceAccount = loadServiceAccount();
  const app = initializeApp({ credential: cert(serviceAccount), projectId: PROJECT_ID });
  const auth = getAuth(app);
  const db = getFirestore(app, FIRESTORE_DATABASE_ID);

  console.log('==============================================');
  console.log('  RESET DE PRODUÇÃO — ValidaMais');
  console.log(`  Projeto:  ${PROJECT_ID}`);
  console.log(`  Banco:    ${FIRESTORE_DATABASE_ID}`);
  console.log(`  Escopo:   ${scope}`);
  console.log(`  Modo:     ${isLive ? '🔴 LIVE (vai APAGAR)' : '🟢 DRY-RUN (nada será apagado)'}`);
  console.log('==============================================\n');

  if (doAuth) {
    console.log('› Contas do Firebase Authentication...');
    const r = await deleteAllAuthUsers(auth, isLive);
    console.log(
      isLive
        ? `  ${r.total} conta(s) apagada(s)${r.failures ? `, ${r.failures} falha(s)` : ''}.`
        : `  ${r.total} conta(s) seriam apagadas.`
    );
  }

  if (doData) {
    console.log('\n› Coleções do Firestore...');
    for (const name of COLLECTIONS) {
      const r = await deleteCollection(db, name, isLive);
      console.log(
        isLive
          ? `  ${name}: ${r.deleted} documento(s) apagado(s).`
          : `  ${name}: ${r.total} documento(s) seriam apagados.`
      );
    }
  }

  console.log('\n' + (isLive
    ? '✅ Limpeza concluída.'
    : `ℹ️  DRY-RUN. Para apagar de verdade, rode com --confirm ${CONFIRM_PHRASE} (ou input "confirm").`));
}

main().catch((err) => {
  console.error('\n❌ Erro ao executar o reset:', err.message || err);
  process.exit(1);
});
