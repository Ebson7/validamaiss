/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Fonte única da política de comissão do ValidaMais.
 *
 * Modelo (Fase 1 — agregador): a plataforma cobra o valor cheio do cliente e
 * repassa ao lojista o líquido (valor − comissão) APÓS a retirada confirmada.
 * A taxa do Mercado Pago é absorvida pela plataforma (sai da comissão), então
 * o lojista sempre vê o valor cheio e um repasse previsível.
 *
 * O percentual pode ser sobrescrito no build via VITE_TAKE_RATE (0–1) sem
 * alterar o código — e o mesmo número vive como env TAKE_RATE no Worker.
 */

/** Take rate padrão da plataforma sobre o valor do lote (18%). */
export const DEFAULT_TAKE_RATE = 0.18;

/** Take rate efetivo: lê VITE_TAKE_RATE quando definido, senão o padrão. */
export function getTakeRate(): number {
  const raw = (import.meta as any).env?.VITE_TAKE_RATE;
  const n = raw != null ? Number(raw) : NaN;
  if (Number.isFinite(n) && n >= 0 && n < 1) return n;
  return DEFAULT_TAKE_RATE;
}

/** Comissão da plataforma sobre um valor de venda. */
export function comissaoDe(valorTotal: number, taxa: number = getTakeRate()): number {
  return Math.round(valorTotal * taxa * 100) / 100;
}

/** Repasse líquido ao lojista (valor − comissão). */
export function repasseDe(valorTotal: number, taxa: number = getTakeRate()): number {
  return Math.round((valorTotal - comissaoDe(valorTotal, taxa)) * 100) / 100;
}

/** Take rate como porcentagem inteira para exibição (ex.: 18). */
export function takeRatePct(taxa: number = getTakeRate()): number {
  return Math.round(taxa * 100);
}
