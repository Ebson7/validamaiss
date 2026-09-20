/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Banner de instalação do PWA — aparece SOMENTE em smartphones (não no PC),
 * sugerindo instalar o app na tela inicial. No Android/Chrome usa o prompt
 * nativo (beforeinstallprompt); no iOS mostra as instruções de "Adicionar à
 * Tela de Início". Some quando já instalado ou após dispensar.
 */

import React, { useEffect, useState } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';

const DISMISS_KEY = 'validamais_install_dismissed';

// Detecta smartphone: user agent móvel OU ponteiro grosso em tela estreita.
function isSmartphone(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const uaMobile = /Android|iPhone|iPod|Opera Mini|IEMobile|BlackBerry|webOS/i.test(ua);
  const isTabletUA = /iPad|Tablet/i.test(ua);
  const coarseNarrow = typeof window !== 'undefined'
    && window.matchMedia?.('(pointer: coarse)').matches
    && window.innerWidth <= 820;
  return (uaMobile || coarseNarrow) && !isTabletUA;
}

function isIOS(): boolean {
  const ua = navigator.userAgent || '';
  // iPadOS moderno se disfarça de Mac; checa toque.
  return /iPhone|iPod/i.test(ua) || (/Macintosh/i.test(ua) && 'ontouchend' in document);
}

function isStandalone(): boolean {
  return (
    (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches) ||
    (navigator as any).standalone === true
  );
}

export const InstallPrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<any>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try { dismissed = localStorage.getItem(DISMISS_KEY) === '1'; } catch { /* ignore */ }
    if (dismissed || !isSmartphone() || isStandalone()) return;

    // Android/Chrome: guarda o evento para disparar o prompt nativo (quando
    // o navegador o emitir — nem sempre acontece de imediato).
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBIP);

    // Mostra o banner em QUALQUER smartphone após um instante, sem depender do
    // beforeinstallprompt (que no Android muitas vezes não dispara). O botão
    // "Instalar" usa o prompt nativo se disponível, ou mostra as instruções.
    const t = setTimeout(() => setVisible(true), 1200);

    // Some quando o app é instalado.
    const onInstalled = () => setVisible(false);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
      clearTimeout(t);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  };

  const handleInstall = async () => {
    if (deferred) {
      deferred.prompt();
      try {
        const choice = await deferred.userChoice;
        if (choice?.outcome === 'accepted') setVisible(false);
      } catch { /* ignore */ }
      setDeferred(null);
    } else {
      // Sem prompt nativo (iOS, ou Android que ainda não emitiu o evento):
      // mostra as instruções manuais de instalação.
      setShowIosHelp((v) => !v);
    }
  };

  if (!visible) return null;

  return (
    <div className="md:hidden fixed left-3 right-3 bottom-[calc(72px+env(safe-area-inset-bottom))] z-50 animate-slide-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden">
        <div className="flex items-center gap-3 p-3">
          <img src="/icons/icon-192.png" alt="ValidaMais" className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-gray-900 leading-tight">Instale o ValidaMais</h4>
            <p className="text-[11px] text-gray-500 font-semibold leading-snug">
              Acesso rápido na tela inicial, com alertas de ofertas.
            </p>
          </div>
          <button
            onClick={handleInstall}
            className="shrink-0 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95"
          >
            <Download className="w-4 h-4" /> Instalar
          </button>
          <button
            onClick={dismiss}
            className="shrink-0 text-gray-300 hover:text-gray-600 p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showIosHelp && (
          <div className="border-t border-gray-100 bg-emerald-50/60 px-4 py-3 text-[11px] text-gray-700 font-semibold leading-relaxed">
            {isIOS() ? (
              <>
                No iPhone: toque em <Share className="inline w-3.5 h-3.5 text-emerald-600 align-text-bottom" /> <strong>Compartilhar</strong> e depois em{' '}
                <span className="inline-flex items-center gap-0.5"><Plus className="w-3.5 h-3.5 text-emerald-600" /><strong>Adicionar à Tela de Início</strong></span>.
              </>
            ) : (
              <>
                No Android: abra o menu <strong>⋮</strong> do navegador e toque em{' '}
                <span className="inline-flex items-center gap-0.5"><Plus className="w-3.5 h-3.5 text-emerald-600" /><strong>Instalar app</strong></span>{' '}
                (ou <strong>Adicionar à tela inicial</strong>).
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
