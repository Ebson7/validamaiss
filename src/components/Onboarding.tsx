/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Onboarding de primeiro uso: uma sobreposição leve, mostrada uma única vez,
 * que apresenta a proposta de valor e leva o usuário ao primeiro passo certo —
 * ativar localização + alertas (cliente) ou cadastrar o primeiro lote (lojista).
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getCurrentPosition } from '../lib/geo';
import {
  Search, ShoppingCart, Ticket, MapPin, BellRing, Store, X,
  ArrowRight, Check, Leaf, Sparkles, Loader2,
} from 'lucide-react';

const STORAGE_KEY = 'validamais_onboarding_v1';

function alreadySeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'done';
  } catch {
    return false;
  }
}
function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, 'done');
  } catch {
    /* ignore */
  }
}

export const Onboarding: React.FC = () => {
  const { user, navigateTo, currentScreen, updateNotificacaoPreferencias, notificacoesPreferencias } = useApp();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [geo, setGeo] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [alertsOn, setAlertsOn] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);

  const isLojista = user?.role === 'lojista';
  const isAdmin = user?.role === 'admin';
  // Não cobrir telas de autenticação, nem o ambiente do admin.
  const suppressedScreen =
    currentScreen === 'login' || currentScreen === 'cadastro' || currentScreen === 'dados-cadastrais';

  useEffect(() => {
    if (isAdmin || suppressedScreen) return;
    if (!alreadySeen()) {
      // pequeno atraso para não competir com a primeira pintura
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, [isAdmin, suppressedScreen]);

  useEffect(() => {
    setAlertsOn(notificacoesPreferencias?.notificarNovosDescontos ?? false);
  }, [notificacoesPreferencias]);

  if (!visible) return null;

  const close = () => {
    markSeen();
    setVisible(false);
  };

  const handleLocation = async () => {
    setGeo('loading');
    try {
      const pos = await getCurrentPosition();
      try {
        localStorage.setItem('validamais_user_loc', JSON.stringify(pos));
      } catch {
        /* ignore */
      }
      setGeo('ok');
    } catch {
      setGeo('error');
    }
  };

  const handleToggleAlerts = async () => {
    if (!user || user.role !== 'user') return;
    const next = !alertsOn;
    setAlertsOn(next);
    setSavingAlerts(true);
    try {
      await updateNotificacaoPreferencias(notificacoesPreferencias?.cepsDesejados ?? [], next);
    } catch {
      setAlertsOn(!next); // reverte em caso de erro
    } finally {
      setSavingAlerts(false);
    }
  };

  const goOffers = () => {
    close();
    navigateTo(isLojista ? 'admin-produtos-novo' : 'produtos');
  };

  // ─────────── Passos do cliente / visitante ───────────
  const consumerSteps = [
    {
      key: 'welcome',
      body: (
        <div className="space-y-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25">
            <Leaf className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Bem-vindo ao ValidaMais 🌱</h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-sm mx-auto">
              Salve alimentos de mercados perto de você com <strong className="text-emerald-700">até 70% de desconto</strong> antes do vencimento. Veja como funciona:
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { icon: <Search className="w-5 h-5" />, t: 'Encontre' },
              { icon: <ShoppingCart className="w-5 h-5" />, t: 'Reserve' },
              { icon: <Ticket className="w-5 h-5" />, t: 'Retire' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3 flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">{s.icon}</div>
                <span className="text-[11px] font-black text-gray-700">{s.t}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      body: (
        <div className="space-y-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25">
            <MapPin className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Ofertas perto de você</h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-sm mx-auto">
              Ative a localização para ordenarmos os lotes pelos mercados mais próximos. É opcional e você troca quando quiser.
            </p>
          </div>
          {geo === 'ok' ? (
            <div className="inline-flex items-center gap-2 text-sm font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-full">
              <Check className="w-4 h-4" /> Localização ativada
            </div>
          ) : (
            <button
              onClick={handleLocation}
              disabled={geo === 'loading'}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-full cursor-pointer transition-all active:scale-95 disabled:opacity-60"
            >
              {geo === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              {geo === 'loading' ? 'Ativando...' : 'Ativar localização'}
            </button>
          )}
          {geo === 'error' && (
            <p className="text-[11px] text-amber-600 font-semibold">Sem problema — você pode buscar por CEP na vitrine.</p>
          )}
        </div>
      ),
    },
    {
      key: 'alerts',
      body: (
        <div className="space-y-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25">
            <BellRing className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Não perca um lote</h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-sm mx-auto">
              Receba um aviso assim que um novo desconto aparecer perto de você.
            </p>
          </div>
          {user && user.role === 'user' ? (
            <button
              onClick={handleToggleAlerts}
              disabled={savingAlerts}
              className={`inline-flex items-center gap-2 px-5 py-3 text-sm font-black rounded-full cursor-pointer transition-all active:scale-95 border ${
                alertsOn
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {savingAlerts ? <Loader2 className="w-4 h-4 animate-spin" /> : alertsOn ? <Check className="w-4 h-4" /> : <BellRing className="w-4 h-4" />}
              {alertsOn ? 'Alertas ativados' : 'Ativar alertas'}
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-gray-500 font-semibold">Crie sua conta grátis para ativar alertas e favoritos.</p>
              <button
                onClick={() => { close(); navigateTo('cadastro'); }}
                className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-full cursor-pointer transition-all active:scale-95"
              >
                Criar conta grátis <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  // ─────────── Passo único do lojista ───────────
  const lojistaSteps = [
    {
      key: 'lojista',
      body: (
        <div className="space-y-5 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25">
            <Store className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Bem-vindo, lojista 👋</h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-sm mx-auto">
              Transforme lotes próximos do vencimento em vendas. Cadastre seu primeiro lote em menos de um minuto e ele já entra na vitrine.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 text-left">
            {[
              { t: 'Cadastre', d: 'Foto, preço e validade' },
              { t: 'Receba reservas', d: 'Clientes reservam no app' },
              { t: 'Dê baixa', d: 'Valide o código na retirada' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-3">
                <div className="text-[11px] font-black text-emerald-600 font-mono">{i + 1}</div>
                <div className="text-xs font-black text-gray-800 leading-tight">{s.t}</div>
                <div className="text-[10px] text-gray-500 font-medium leading-tight mt-0.5">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const steps = isLojista ? lojistaSteps : consumerSteps;
  const isLast = step >= steps.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={close} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-white/50 p-6 sm:p-7 animate-slide-up">
        {/* Fechar / pular */}
        <button
          onClick={close}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-600 transition-colors cursor-pointer p-1"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge topo */}
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-5">
          <Sparkles className="w-3 h-3" /> Primeiros passos
        </div>

        {/* Conteúdo do passo */}
        <div className="min-h-[16rem] flex items-center">{steps[step].body}</div>

        {/* Progresso (só cliente) */}
        {steps.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-emerald-600' : 'w-1.5 bg-gray-200'}`}
              />
            ))}
          </div>
        )}

        {/* Navegação */}
        <div className="flex items-center justify-between gap-3 mt-5">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer px-2"
            >
              Voltar
            </button>
          ) : (
            <button
              onClick={close}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer px-2"
            >
              Pular
            </button>
          )}

          {isLast ? (
            <button
              onClick={goOffers}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-full cursor-pointer transition-all active:scale-95"
            >
              {isLojista ? 'Cadastrar meu primeiro lote' : 'Ver ofertas'}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-full cursor-pointer transition-all active:scale-95"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
