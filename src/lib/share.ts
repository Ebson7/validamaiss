/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Compartilhamento de lotes — link com deep-link (?prodId=) e atribuição de
 * indicação (?ref=), além do compartilhamento nativo do sistema (navigator.share),
 * que abre a bandeja do SO (WhatsApp, Instagram, SMS…). Quando o nativo não
 * existe (desktop), as telas caem no menu manual (WhatsApp/Telegram/copiar).
 */

/** Monta o link absoluto do lote, com deep-link e ref opcional do indicador. */
export function buildShareUrl(produtoId: string, ref?: string | null): string {
  const base =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://validamais.com/';
  const params = new URLSearchParams({ prodId: produtoId });
  if (ref) params.set('ref', ref);
  return `${base}?${params.toString()}`;
}

export type ShareResult = 'shared' | 'unsupported' | 'cancelled' | 'error';

/** true quando o navegador oferece a bandeja de compartilhamento nativa. */
export function hasNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function';
}

/** Abre a bandeja nativa. Retorna 'unsupported' para a tela cair no fallback. */
export async function nativeShare(data: { title?: string; text?: string; url?: string }): Promise<ShareResult> {
  if (!hasNativeShare()) return 'unsupported';
  try {
    await (navigator as any).share(data);
    return 'shared';
  } catch (err: any) {
    if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError')) return 'cancelled';
    return 'error';
  }
}
