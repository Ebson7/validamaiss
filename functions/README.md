# Backend de Pagamento — Mercado Pago (Checkout Pro)

Duas funções HTTPS que o app chama:

- **`criarPreferencia`** — cria a cobrança no Mercado Pago (com o Access Token
  secreto) e devolve o link do checkout. O valor é lido da reserva no Firestore,
  nunca do cliente.
- **`mpWebhook`** — recebe a confirmação do Mercado Pago e marca a reserva como
  paga (`pagamentoStatus: 'aprovado'`).

> Nada aqui contém segredos — o Access Token entra como *secret* no deploy.

## O que você precisa

1. **Conta no Mercado Pago Developers** e uma aplicação. Pegue as credenciais de
   **TESTE** (sandbox): `Public Key` (vai no app) e `Access Token` (fica só aqui).
2. Escolher onde hospedar (veja abaixo).

## Opção A — Firebase Functions (requer plano Blaze)

```bash
cd functions && npm install && cd ..

# Segredo (cole o Access Token de TESTE quando pedir):
firebase functions:secrets:set MP_ACCESS_TOKEN

# (Opcional) URL pública do app, se diferente do padrão:
# defina APP_URL no ambiente da função

firebase deploy --only functions --project gen-lang-client-0971671639
```

Adicione ao `firebase.json` (na raiz) o bloco de functions **quando for
publicar** (mantido fora por enquanto para não afetar o deploy do hosting):

```json
"functions": { "source": "functions", "runtime": "nodejs20" }
```

Após o deploy, o Firebase mostra as URLs (ex.:
`https://criarpreferencia-xxxx.a.run.app`). Configure no app a variável
`VITE_PAYMENT_API_BASE` com a base dessas URLs e faça um novo deploy do hosting.

No painel do Mercado Pago, cadastre a **notification_url** apontando para a
função `mpWebhook` (a função já a envia na preferência, mas confirme no painel).

## Opção B — Cloudflare Workers (grátis, sem cartão)

A lógica é a mesma (dois endpoints POST). Porte o conteúdo de `index.js` para um
Worker, guardando `MP_ACCESS_TOKEN` em *Secrets* do Worker e usando o Firestore
REST API (ou Admin via service account) para ler/gravar a reserva. Peça ajuda que
eu gero a versão para Workers.

## Teste (sandbox)

Use os cartões de teste do Mercado Pago e o app em ambiente de TESTE. Só troque
para as credenciais de PRODUÇÃO quando o fluxo estiver validado.
