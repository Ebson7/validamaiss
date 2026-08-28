/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ReservaCard } from '../ReservaCard';
import { Loader2, ShoppingCart, HelpCircle, TrendingUp, Leaf, Globe } from 'lucide-react';

export const MinhasReservasValida: React.FC = () => {
  const {
    user,
    navigateTo,
    reservas: allReservas,
    reservasLoading: loading,
    cancelReservation,
    produtos
  } = useApp();

  const [tab, setTab] = useState<'ativas' | 'historico'>('ativas');

  const reservas = allReservas.filter(r => r.usuarioId === user?.uid);

  // ── Métricas de economia / impacto ──
  const naoCanceladas = reservas.filter(r => r.status !== 'cancelado');
  const totalPaid = naoCanceladas.reduce((sum, r) => sum + r.precoTotal, 0);
  const totalOriginal = naoCanceladas.reduce((sum, r) => {
    const prod = produtos.find(p => p.id === r.produtoId);
    const originalUnit = prod ? prod.precoOriginal : (r.precoTotal / r.quantidade) * 2.22;
    return sum + (originalUnit * r.quantidade);
  }, 0);
  const totalSaved = Math.max(0, totalOriginal - totalPaid);

  const totalWeightSaved = naoCanceladas.reduce((sum, r) => {
    const prod = produtos.find(p => p.id === r.produtoId);
    const category = prod ? prod.categoria : 'Mercearia';
    let multiplier = 0.5;
    if (category === 'Laticínios') multiplier = 0.6;
    else if (category === 'Padaria') multiplier = 0.4;
    else if (category === 'Hortifrúti') multiplier = 0.8;
    else if (category === 'Carnes') multiplier = 1.0;
    else if (category === 'Bebidas') multiplier = 1.2;
    return sum + (multiplier * r.quantidade);
  }, 0);
  const totalCO2Saved = totalWeightSaved * 2.5;

  const handleCancelReserva = async (reservaId: string, newStatus: 'retirado' | 'cancelado') => {
    if (newStatus !== 'cancelado') return;
    try {
      await cancelReservation(reservaId);
    } catch (err: any) {
      console.error(err);
    }
  };

  const getTime = (v: any) => {
    try { return (v?.toDate ? v.toDate() : new Date(v)).getTime() || 0; } catch { return 0; }
  };
  const ativas = reservas.filter(r => r.status === 'pendente');
  const historico = reservas.filter(r => r.status !== 'pendente');
  const lista = (tab === 'ativas' ? ativas : historico)
    .slice()
    .sort((a, b) => getTime(b.criadoEm) - getTime(a.criadoEm));

  const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div id="minhas_reservas_screen" className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Minhas Reservas</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Acompanhe suas reservas e apresente o código na loja para retirar.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-sm font-semibold text-gray-500 font-mono">Resgatando histórico...</span>
        </div>
      ) : reservas.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 py-16 text-center max-w-lg mx-auto p-6 space-y-3 shadow-xs">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto">
            <ShoppingCart className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-gray-800">Você ainda não tem reservas</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
            Navegue pela vitrine, encontre lotes com desconto perto de você e salve seus produtos preferidos.
          </p>
          <button
            onClick={() => navigateTo('produtos')}
            className="inline-flex items-center gap-1 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-full cursor-pointer transition-all active:scale-95 mt-2"
          >
            Quero economizar &rarr;
          </button>
        </div>
      ) : (
        <>
          {/* Faixa de impacto */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 sm:p-4">
              <div className="flex items-center gap-1 text-emerald-700"><TrendingUp className="w-3.5 h-3.5" /><span className="text-[9px] font-black uppercase tracking-wide">Você poupou</span></div>
              <div className="text-base sm:text-xl font-black text-emerald-600 mt-1 leading-none">{money(totalSaved)}</div>
            </div>
            <div className="rounded-2xl border border-lime-200 bg-lime-50/50 p-3 sm:p-4">
              <div className="flex items-center gap-1 text-lime-700"><Leaf className="w-3.5 h-3.5" /><span className="text-[9px] font-black uppercase tracking-wide">Alimentos</span></div>
              <div className="text-base sm:text-xl font-black text-lime-600 mt-1 leading-none">{totalWeightSaved.toFixed(1)} <span className="text-xs">kg</span></div>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3 sm:p-4">
              <div className="flex items-center gap-1 text-sky-700"><Globe className="w-3.5 h-3.5" /><span className="text-[9px] font-black uppercase tracking-wide">CO₂ evitado</span></div>
              <div className="text-base sm:text-xl font-black text-sky-600 mt-1 leading-none">{totalCO2Saved.toFixed(1)} <span className="text-xs">kg</span></div>
            </div>
          </div>

          {/* Abas */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full w-full sm:w-fit">
            <button
              onClick={() => setTab('ativas')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${tab === 'ativas' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Ativas ({ativas.length})
            </button>
            <button
              onClick={() => setTab('historico')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${tab === 'historico' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Histórico ({historico.length})
            </button>
          </div>

          {/* Lista */}
          {lista.length > 0 ? (
            <div className="space-y-4">
              {lista.map((res) => (
                <ReservaCard
                  key={res.id}
                  reserva={res}
                  isAdminView={false}
                  onStatusUpdate={handleCancelReserva}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm font-semibold">
                {tab === 'ativas' ? 'Nenhuma reserva ativa no momento.' : 'Seu histórico está vazio por enquanto.'}
              </p>
            </div>
          )}

          {/* Como funciona */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 flex gap-3 text-xs leading-relaxed text-gray-600 shadow-xs">
            <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-gray-800 mb-0.5">Como funciona a retirada?</p>
              <p>Vá até a loja no endereço indicado, apresente o <strong>código de retirada</strong> (ou o QR Code) e pague no balcão. Pronto — você salvou comida e dinheiro!</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
