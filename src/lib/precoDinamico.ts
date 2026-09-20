/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Precificação dinâmica — o desconto aumenta automaticamente conforme a
 * validade do lote se aproxima. Reduz o descarte (o lote sai antes de vencer)
 * e cria urgência real para o consumidor. O preço nunca sobe: é sempre um
 * desconto EXTRA aplicado sobre o preço promocional definido pelo lojista.
 */

import { Produto } from '../types';

/**
 * Regras de desconto extra por dias restantes até o vencimento.
 * Avaliadas de cima para baixo: usa a primeira faixa cujo limite o produto
 * atinge (ex.: 1 dia → 0.35). Acima da última faixa, sem desconto extra.
 */
export const REGRAS_PRECO_DINAMICO: { ateDias: number; extra: number }[] = [
  { ateDias: 0, extra: 0.50 }, // vence hoje  → -50%
  { ateDias: 1, extra: 0.35 }, // vence amanhã → -35%
  { ateDias: 2, extra: 0.20 }, // 2 dias      → -20%
  { ateDias: 3, extra: 0.10 }, // 3 dias      → -10%
];

/** Dias inteiros até o vencimento (0 = vence hoje, negativo = vencido). */
export function diasParaVencer(dataValidade: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(dataValidade + 'T00:00:00');
  venc.setHours(0, 0, 0, 0);
  return Math.ceil((venc.getTime() - hoje.getTime()) / 86400000);
}

/** Fração de desconto dinâmico (0..1) sobre o preço promocional. */
export function descontoDinamicoFrac(dataValidade: string): number {
  const dias = diasParaVencer(dataValidade);
  if (dias < 0) return 0; // vencido: fora de venda
  for (const regra of REGRAS_PRECO_DINAMICO) {
    if (dias <= regra.ateDias) return regra.extra;
  }
  return 0;
}

export interface PrecoDinamico {
  /** Preço final após o desconto dinâmico (arredondado a centavos). */
  preco: number;
  /** Fração de desconto dinâmico aplicada (0..1). */
  extraFrac: number;
  /** Percentual inteiro para exibição (ex.: 35). */
  extraPct: number;
  /** true quando há desconto dinâmico ativo. */
  aplicado: boolean;
  /** Dias restantes até o vencimento. */
  dias: number;
}

/** Calcula o preço dinâmico de um produto a partir da validade. */
export function precoDinamico(produto: Pick<Produto, 'precoPromocional' | 'dataValidade'>): PrecoDinamico {
  const extraFrac = descontoDinamicoFrac(produto.dataValidade);
  const preco = Math.round(produto.precoPromocional * (1 - extraFrac) * 100) / 100;
  return {
    preco,
    extraFrac,
    extraPct: Math.round(extraFrac * 100),
    aplicado: extraFrac > 0,
    dias: diasParaVencer(produto.dataValidade),
  };
}

/**
 * Combina descontos multiplicativos (nunca ultrapassa 100%). Usado para
 * empilhar preço dinâmico + Clube + cupom de reativação numa fração única.
 */
export function combinarDescontos(...fracoes: number[]): number {
  const restante = fracoes.reduce((acc, f) => acc * (1 - (f > 0 && f < 1 ? f : 0)), 1);
  return Math.round((1 - restante) * 10000) / 10000;
}
