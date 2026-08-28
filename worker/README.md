# Backend de Pagamento — Mercado Pago (Cloudflare Worker)

Worker gratuito que o app chama para cobrar via **Mercado Pago (Checkout Pro)**.
Dois endpoints:

- **`POST /criarPreferencia`** `{ reservaId }` → lê o preço da reserva no
  Firestore (nunca confia no cliente), cria a cobrança e devolve `init_point`
  (link do checkout).
- **`POST /mpWebhook`** → o Mercado Pago avisa aqui quando o pagamento muda de
  status; o Worker marca a reserva (`pagamentoStatus: 'aprovado'`, etc.).

> Nenhum segredo fica no código. O Access Token e a chave da service account
> entram como **secrets** do Worker.

---

## Passo a passo (ambiente de TESTE / sandbox)

### 1. Credenciais do Mercado Pago (TESTE)
1. Acesse <https://www.mercadopago.com.br/developers> → **Suas integrações** →
   crie uma aplicação (tipo *Pagamentos online* / Checkout Pro).
2. Em **Credenciais de teste**, copie o **Access Token** (começa com
   `TEST-...`). É esse que vamos usar primeiro.

### 2. Service Account do Firebase (para o Worker acessar o Firestore)
1. Firebase Console → ⚙️ **Configurações do projeto** → aba **Contas de serviço**.
2. **Gerar nova chave privada** → baixa um arquivo `.json`.
3. Guarde esse arquivo — o conteúdo inteiro vira o secret `FIREBASE_SERVICE_ACCOUNT`.

### 3. Instalar o Wrangler e logar na Cloudflare
```bash
cd worker
npm install
npx wrangler login        # abre o navegador (conta Cloudflare grátis, sem cartão)
```

### 4. Definir os secrets
```bash
# Access Token de TESTE do Mercado Pago:
npx wrangler secret put MP_ACCESS_TOKEN
# (cole o TEST-... quando pedir)

# Service account do Firebase (cole o JSON inteiro, em uma linha):
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT
# dica p/ colar de um arquivo:
#   cat caminho/da/chave.json | npx wrangler secret put FIREBASE_SERVICE_ACCOUNT
```

As variáveis públicas (`FIRESTORE_DATABASE_ID`, `APP_URL`) já estão no
`wrangler.toml`. Ajuste `APP_URL` se o domínio do app for outro.

### 5. Publicar o Worker
```bash
npx wrangler deploy
```
Ao final, o Wrangler mostra a URL pública, algo como:
`https://validamais-pagamento.SEU-SUBDOMINIO.workers.dev`

### 6. Ligar o pagamento no app
No **GitHub → repositório → Settings → Secrets and variables → Actions**, crie
uma variável (ou secret) chamada **`VITE_PAYMENT_API_BASE`** com a URL do Worker
(sem barra no final). O workflow de deploy do app já injeta essa variável no
build. Faça um novo deploy (push) e o botão passa a **"Pagar e reservar"**.

> Enquanto `VITE_PAYMENT_API_BASE` não existir, o app segue no modo
> "reserve grátis / pague na loja" — nada quebra.

### 7. Testar (sandbox)
- Use os **cartões de teste** do Mercado Pago
  (<https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/test/cards>).
- Faça uma reserva no app → deve redirecionar ao checkout → pague com cartão de
  teste → volta para o app e a reserva aparece como **paga** em *Minhas Reservas*
  (o webhook atualiza o status).

---

## Ir para PRODUÇÃO (depois de validar)
1. Troque o secret pelo Access Token de **produção**:
   `npx wrangler secret put MP_ACCESS_TOKEN` (cole o `APP_USR-...`).
2. `npx wrangler deploy` de novo. Pronto — mesma URL, agora cobrando de verdade.

## Observações
- O **webhook** é a fonte da verdade do pagamento: mesmo que o cliente feche a
  aba após pagar, o status chega pelo `/mpWebhook`.
- O preço é sempre lido da reserva no servidor — o cliente não consegue forjar
  valor.
- Custo: o plano gratuito da Cloudflare cobre com folga o volume de um MVP.
