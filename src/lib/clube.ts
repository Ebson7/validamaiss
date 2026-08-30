/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Clube ValidaMais — assinatura do consumidor.
 * Benefícios: desconto extra em todos os lotes, acesso prioritário e selo.
 * A cobrança recorrente real entra com o Mercado Pago; até lá a ativação é
 * simulada (mesmo padrão do patrocínio do lojista) para o fluxo funcionar.
 */

import { Usuario } from '../types';

/** Preço mensal do Clube (R$). */
export const CLUBE_PRECO_MENSAL = 9.9;

/** Desconto EXTRA do Clube sobre o preço promocional (5%). */
export const CLUBE_EXTRA_DISCOUNT = 0.05;

/** true quando o usuário é membro ativo do Clube (respeita validade, se houver). */
export function isClubeAtivo(user?: Usuario | null): boolean {
  if (!user) return false;
  // Compatibilidade: membros antigos usavam destaquePlano='clube'.
  const legado = user.destaquePlano === 'clube' && user.destaqueAtivo === true;
  if (!user.clubeAtivo && !legado) return false;
  if (user.clubeValidoAte) {
    const ate = new Date(user.clubeValidoAte).getTime();
    if (Number.isFinite(ate) && ate < Date.now()) return false;
  }
  return true;
}

/** Preço final para o membro do Clube (aplica o desconto extra). */
export function precoClube(precoPromocional: number): number {
  return Math.round(precoPromocional * (1 - CLUBE_EXTRA_DISCOUNT) * 100) / 100;
}

/** Fração de desconto a aplicar na reserva conforme a assinatura do usuário. */
export function descontoReservaFrac(user?: Usuario | null): number {
  return isClubeAtivo(user) ? CLUBE_EXTRA_DISCOUNT : 0;
}

/** Benefícios do Clube, para exibição na landing. */
export const CLUBE_BENEFICIOS = [
  { titulo: '5% de desconto extra', desc: 'Em todos os lotes, sempre — acumula com a promoção da loja.' },
  { titulo: 'Acesso prioritário', desc: 'Veja e reserve os novos lotes com antecedência.' },
  { titulo: 'Selo Herói Eco', desc: 'Mostre que você combate o desperdício de comida.' },
];
