/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Cookie, X, ShieldCheck } from 'lucide-react';

const CONSENT_KEY = 'validamais_cookie_consent';

export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, at: new Date().toISOString() }));
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      id="cookie_consent_banner"
      className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 pointer-events-none"
    >
      <div className="pointer-events-auto max-w-3xl mx-auto glass border border-emerald-200/60 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
              Política de Cookies
            </h3>
            <p className="text-xs text-gray-600 font-medium leading-relaxed mt-1">
              Usamos cookies e armazenamento local para manter você conectado, lembrar suas preferências
              (favoritos, filtros e reservas) e melhorar sua experiência. Não vendemos seus dados.{' '}
              <button
                onClick={() => setShowPolicy((v) => !v)}
                className="text-emerald-700 font-bold hover:text-emerald-800 underline cursor-pointer"
              >
                {showPolicy ? 'Ocultar detalhes' : 'Saiba mais'}
              </button>
            </p>

            {showPolicy && (
              <div className="mt-3 text-[11px] text-gray-600 leading-relaxed space-y-2 bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 animate-fade-in">
                <p className="font-bold text-gray-800 uppercase font-mono tracking-wide text-[10px]">O que armazenamos</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><strong>Essenciais:</strong> sessão de login e autenticação (Firebase), necessários para o funcionamento.</li>
                  <li><strong>Preferências:</strong> favoritos, filtros de busca e reservas salvos no seu navegador.</li>
                  <li><strong>Notificações:</strong> tokens para avisos de novas ofertas (quando autorizado).</li>
                </ul>
                <p>
                  Não utilizamos cookies de publicidade de terceiros. Você pode limpar os dados a qualquer
                  momento nas configurações do seu navegador. Ao continuar navegando, você concorda com esta política.
                </p>
                <p className="flex items-center gap-1.5 text-emerald-700 font-semibold pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  Dados tratados conforme a LGPD (Lei nº 13.709/2018).
                </p>
              </div>
            )}
          </div>

          <button
            onClick={accept}
            aria-label="Fechar aviso de cookies"
            className="text-gray-300 hover:text-gray-500 transition-colors shrink-0 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-end mt-3">
          <button
            onClick={accept}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-all active:scale-95 order-1 sm:order-2"
          >
            Aceitar e continuar
          </button>
        </div>
      </div>
    </div>
  );
};
