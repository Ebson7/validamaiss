/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cupom de reativação — desconto extra para reconquistar clientes inativos.
 * Ativa automaticamente quando o consumidor já reservou antes, mas ficou
 * parado por mais de N dias. É reconquista (não aquisição): quem nunca
 * reservou não recebe o cupom. O desconto some sozinho na próxima reserva.
 */

import { Usuario, Reserva } from '../types';

/** Desconto extra do cupom de reativação (10%). */
export const REATIVACAO_DESCONTO = 0.10;

/** Dias de inatividade para o cupom ativar. */
export const REATIVACAO_DIAS_INATIVO = 30;

/** Converte criadoEm (Timestamp do Firestore ou string ISO) em epoch ms. */
function tempoDe(v: any): number {
  try {
    if (!v) return 0;
    if (typeof v?.toDate === 'function') return v.toDate().getTime() || 0;
    return new Date(v).getTime() || 0;
  } catch {
    return 0;
  }
}

/** Reservas do usuário (mais recente primeiro). */
function reservasDoUsuario(user: Usuario, reservas: Reserva[]): Reserva[] {
  return reservas
    .filter((r) => r.usuarioId === user.uid)
    .sort((a, b) => tempoDe(b.criadoEm) - tempoDe(a.criadoEm));
}

/** Dias desde a última reserva do usuário (null se nunca reservou). */
export function diasDesdeUltimaReserva(user: Usuario | null | undefined, reservas: Reserva[]): number | null {
  if (!user) return null;
  const minhas = reservasDoUsuario(user, reservas);
  if (minhas.length === 0) return null;
  const ultima = tempoDe(minhas[0].criadoEm);
  if (!ultima) return null;
  return Math.floor((Date.now() - ultima) / 86400000);
}

/** true quando o cupom de reativação deve ser oferecido/aplicado. */
export function cupomReativacaoAtivo(user: Usuario | null | undefined, reservas: Reserva[]): boolean {
  if (!user || user.role !== 'user') return false;
  const dias = diasDesdeUltimaReserva(user, reservas);
  return dias !== null && dias >= REATIVACAO_DIAS_INATIVO;
}

/** Fração de desconto do cupom de reativação (0 ou REATIVACAO_DESCONTO). */
export function descontoReativacaoFrac(user: Usuario | null | undefined, reservas: Reserva[]): number {
  return cupomReativacaoAtivo(user, reservas) ? REATIVACAO_DESCONTO : 0;
}
