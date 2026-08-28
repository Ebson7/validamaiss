/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cliente de pagamento (Mercado Pago — Checkout Pro).
 * O backend só é chamado quando VITE_PAYMENT_API_BASE está configurada.
 */

const API_BASE: string = ((import.meta as any).env?.VITE_PAYMENT_API_BASE as string) || '';

/** true quando o backend de pagamento está configurado (URL definida no build). */
export function isPagamentoConfigurado(): boolean {
  return API_BASE.trim().length > 0;
}

/**
 * Cria a preferência no backend e redireciona o cliente para o Checkout do
 * Mercado Pago. Lança erro se o backend não estiver configurado ou falhar.
 */
export async function iniciarPagamentoMP(reservaId: string): Promise<void> {
  if (!isPagamentoConfigurado()) {
    throw new Error('Pagamento ainda não configurado nesta instância.');
  }
  const resp = await fetch(`${API_BASE.replace(/\/$/, '')}/criarPreferencia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reservaId }),
  });
  if (!resp.ok) {
    const msg = await resp.json().catch(() => ({}));
    throw new Error((msg as any).error || 'Falha ao iniciar o pagamento.');
  }
  const data = await resp.json();
  if (!data.init_point) throw new Error('Resposta de pagamento inválida.');
  // Checkout Pro: redireciona para o ambiente seguro do Mercado Pago.
  window.location.href = data.init_point;
}

/**
 * Lê o retorno do Checkout (?payment=success|pending|failure&reservaId=...).
 * Retorna null quando não há retorno de pagamento na URL.
 */
export function lerRetornoPagamento():
  | { status: 'success' | 'pending' | 'failure'; reservaId: string | null }
  | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const status = params.get('payment');
  if (status !== 'success' && status !== 'pending' && status !== 'failure') return null;
  return { status, reservaId: params.get('reservaId') };
}

/** Remove os parâmetros de pagamento da URL (após tratar o retorno). */
export function limparRetornoPagamento(): void {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  url.searchParams.delete('payment');
  url.searchParams.delete('reservaId');
  url.searchParams.delete('collection_status');
  url.searchParams.delete('payment_id');
  window.history.replaceState({}, '', url.pathname + url.search);
}
