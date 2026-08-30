/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Código de retirada — utilidades compartilhadas entre o card da reserva
 * (mostra o código/QR ao cliente) e o validador do lojista (confere no balcão).
 */

import { Reserva } from '../types';

// Alfabeto sem caracteres ambíguos (0/O, 1/I/L) — fácil de ler em voz alta.
const PICKUP_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Código de retirada determinístico para reservas criadas antes do campo
 * `codigoRetirada` existir. O card do cliente e o validador do lojista derivam
 * exatamente o MESMO código a partir do id da reserva, então a validação
 * continua funcionando mesmo para reservas antigas.
 */
export function derivePickupCode(seed: string): string {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += PICKUP_ALPHABET[h % PICKUP_ALPHABET.length];
    h = Math.floor(h / PICKUP_ALPHABET.length) + (seed.charCodeAt(i % seed.length) || 7) * (i + 13);
    h = h >>> 0;
  }
  return `VM-${code}`;
}

/** Código efetivo de uma reserva: o armazenado, ou o fallback determinístico. */
export function getPickupCode(reserva: Reserva): string {
  return reserva.codigoRetirada || derivePickupCode(reserva.id || 'RES');
}

/** Normaliza para comparar ignorando caixa, espaços e o prefixo opcional "VM-". */
export function normalizePickupCode(value: string): string {
  return value.toUpperCase().replace(/\s+/g, '').replace(/^VM-?/, '');
}

/** true quando dois códigos são equivalentes após normalização. */
export function pickupCodesMatch(a: string, b: string): boolean {
  const na = normalizePickupCode(a);
  return na.length > 0 && na === normalizePickupCode(b);
}
