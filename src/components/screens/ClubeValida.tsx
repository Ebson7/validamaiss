/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Clube ValidaMais — landing + gestão da assinatura do consumidor.
 * A cobrança recorrente real entra com o Mercado Pago; por ora a ativação é
 * simulada (mesmo padrão do patrocínio do lojista) para o fluxo funcionar.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CLUBE_PRECO_MENSAL, CLUBE_BENEFICIOS, isClubeAtivo } from '../../lib/clube';
import {
  Sparkles, Check, Leaf, Zap, BadgeCheck, ShieldCheck, Crown,
  ArrowRight, Loader2, Info,
} from 'lucide-react';

const BENEFIT_ICONS = [<Zap className="w-4 h-4" />, <Sparkles className="w-4 h-4" />, <Leaf className="w-4 h-4" />];

export const ClubeValida: React.FC = () => {
  const { user, navigateTo, updateUserProfile, showAlert } = useApp();
  const [processing, setProcessing] = useState(false);
  const membro = isClubeAtivo(user);

  const handleJoin = async () => {
    if (!user) { navigateTo('cadastro'); return; }
    setProcessing(true);
    // Ativação simulada — trocar por assinatura recorrente quando o pagamento abrir.
    setTimeout(async () => {
      try {
        await updateUserProfile({ clubeAtivo: true, clubeDesde: new Date().toISOString() });
        showAlert('Bem-vindo ao Clube ValidaMais! 💚 Seu desconto extra já está ativo.', 'success');
      } catch {
        showAlert('Não foi possível ativar agora. Tente novamente.', 'error');
      } finally {
        setProcessing(false);
      }
    }, 1000);
  };

  const handleCancel = async () => {
    if (!window.confirm('Deseja cancelar sua assinatura do Clube ValidaMais?')) return;
    try {
      await updateUserProfile({ clubeAtivo: false });
      showAlert('Assinatura do Clube cancelada.', 'info');
    } catch {
      showAlert('Não foi possível cancelar agora.', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-700 to-indigo-900 text-white shadow-2xl shadow-indigo-900/20 p-8 sm:p-10">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-violet-400/25 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border border-white/20">
            <Crown className="w-3.5 h-3.5 text-amber-300" /> Clube ValidaMais
          </div>
          <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
            {membro ? <>Você é <span className="text-amber-300">membro Herói Eco.</span></> : <>Economize mais,<br /><span className="text-amber-300">desperdice menos.</span></>}
          </h1>
          <p className="text-sm sm:text-base text-indigo-50/85 font-medium max-w-md">
            {membro
              ? 'Seu desconto extra de 5% já é aplicado automaticamente em todos os lotes. Obrigado por combater o desperdício!'
              : <>Por apenas <strong className="text-white">R$ {CLUBE_PRECO_MENSAL.toFixed(2).replace('.', ',')}/mês</strong>, ganhe desconto extra em todos os lotes, acesso prioritário e o selo Herói Eco.</>}
          </p>

          {membro ? (
            <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 px-4 py-2.5 rounded-full text-sm font-black">
              <BadgeCheck className="w-4 h-4 text-amber-300" /> Assinatura ativa
            </div>
          ) : (
            <button
              onClick={handleJoin}
              disabled={processing}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-indigo-800 text-sm font-black rounded-full shadow-lg hover:shadow-xl cursor-pointer transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
              {processing ? 'Ativando...' : (user ? 'Assinar o Clube' : 'Criar conta e assinar')}
              {!processing && <ArrowRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </section>

      {/* Benefícios */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CLUBE_BENEFICIOS.map((b, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">{BENEFIT_ICONS[i]}</div>
            <h3 className="text-sm font-black text-gray-900">{b.titulo}</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">{b.desc}</p>
          </div>
        ))}
      </section>

      {/* Preço / gestão */}
      {membro ? (
        <section className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900">Sua assinatura</h3>
              <p className="text-xs text-gray-500 font-medium">
                Membro desde {user?.clubeDesde ? new Date(user.clubeDesde).toLocaleDateString('pt-BR') : 'hoje'}
                {user?.clubeValidoAte ? ` · válido até ${new Date(user.clubeValidoAte).toLocaleDateString('pt-BR')}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-xs font-bold text-gray-500 hover:text-rose-600 border border-gray-200 hover:border-rose-200 hover:bg-rose-50 px-4 py-2.5 rounded-full cursor-pointer transition-all"
          >
            Cancelar assinatura
          </button>
        </section>
      ) : (
        <section className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl p-6">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-700">R$ {CLUBE_PRECO_MENSAL.toFixed(2).replace('.', ',')}</span>
            <span className="text-sm text-gray-500 font-semibold">/mês · cancele quando quiser</span>
          </div>
          <ul className="mt-4 space-y-2">
            {CLUBE_BENEFICIOS.map((b, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {b.titulo}
              </li>
            ))}
          </ul>
          <button
            onClick={handleJoin}
            disabled={processing}
            className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-full cursor-pointer transition-all active:scale-95 disabled:opacity-60"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
            {processing ? 'Ativando...' : (user ? 'Assinar o Clube' : 'Criar conta e assinar')}
          </button>
        </section>
      )}

      <p className="text-[11px] text-gray-400 font-medium flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Estamos em fase inicial: a ativação é sem cobrança por enquanto. A assinatura recorrente entra assim que o pagamento estiver disponível — você será avisado antes de qualquer cobrança.
      </p>
    </div>
  );
};
