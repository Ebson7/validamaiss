/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { ReservaCard } from '../ReservaCard';
import { Loader2, Calendar, ShoppingCart, HelpCircle, TrendingUp, Award } from 'lucide-react';

export const MinhasReservasValida: React.FC = () => {
  const { 
    user, 
    navigateTo, 
    showAlert, 
    reservas: allReservas, 
    reservasLoading: loading, 
    cancelReservation,
    produtos 
  } = useApp();

  const reservas = allReservas.filter(r => r.usuarioId === user?.uid);

  // Calculate savings metrics
  const totalPaid = reservas
    .filter(r => r.status !== 'cancelado')
    .reduce((sum, r) => sum + r.precoTotal, 0);

  const totalOriginal = reservas
    .filter(r => r.status !== 'cancelado')
    .reduce((sum, r) => {
      const prod = produtos.find(p => p.id === r.produtoId);
      const originalUnit = prod ? prod.precoOriginal : (r.precoTotal / r.quantidade) * 2.22;
      return sum + (originalUnit * r.quantidade);
    }, 0);

  const totalSaved = Math.max(0, totalOriginal - totalPaid);

  // Handle cancellation atomically returning items directly to merchant's product catalog
  const handleCancelReserva = async (reservaId: string, newStatus: 'retirado' | 'cancelado') => {
    if (newStatus !== 'cancelado') return;

    try {
      await cancelReservation(reservaId);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div id="minhas_reservas_screen" className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 leading-tight">Suas Reservas</h1>
        <p className="text-xs text-gray-500 font-semibold mt-1">Acompanhe seus lotes, apresente seu e-mail no balcão e retire na loja física</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-sm font-semibold text-gray-500 font-mono">Resgatando histórico...</span>
        </div>
      ) : reservas.length > 0 ? (
        <div className="space-y-6 max-w-3xl">
          
          {/* Visual Savings / Economiómetro Board */}
          <div 
            id="savings_summary_card" 
            className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 text-white shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-fade-in border border-emerald-500/30"
          >
            {/* Background ambient pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />
            
            <div className="space-y-2 z-10">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-emerald-200 bg-emerald-900/40 px-3 py-1 rounded-full border border-emerald-500/20 font-black">
                <Award className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                Seu Impacto Recíproco ValidaMais
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                Sua Economia de Verdade! 💸
              </h2>
              <p className="text-xs text-emerald-150/90 font-medium max-w-sm sm:max-w-md leading-relaxed">
                Ao escolher lotes em data próxima ao vencimento, você economiza muito dinheiro no bolso e ajuda diretamente a frear o desperdício alimentar!
              </p>
            </div>

            <div className="flex flex-wrap gap-4 sm:gap-6 z-10 w-full md:w-auto self-stretch items-center justify-between md:justify-end">
              {/* Total Economizado */}
              <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-2xl p-4 flex-1 md:flex-initial text-center md:text-left min-w-[140px] shadow-xs">
                <div className="text-[9px] font-extrabold text-emerald-200 font-mono uppercase tracking-wider flex items-center justify-center md:justify-start gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  Você Poupou
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-amber-300 mt-1 leading-none">
                  {totalSaved.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-[9px] text-emerald-100 font-medium mt-1 font-mono uppercase">
                  De ir para o lixo
                </div>
              </div>

              {/* Total Pago */}
              <div className="bg-emerald-950/20 border border-emerald-500/10 rounded-2xl p-4 flex-1 md:flex-initial text-center md:text-left min-w-[124px]">
                <div className="text-[9px] font-extrabold text-emerald-250 font-mono uppercase tracking-wider">Total Pago</div>
                <div className="text-base font-black font-mono text-emerald-50 mt-1 leading-none">
                  {totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <div className="text-[9px] text-emerald-200/70 font-semibold mt-1">
                  {reservas.filter(r => r.status !== 'cancelado').length} lotes salvos
                </div>
              </div>
            </div>
          </div>

          {/* List of Reservation Cards */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-gray-400 font-mono uppercase tracking-widest pl-1">Detalhes do Seus Lotes Reservados</h2>
            <div className="grid grid-cols-1 gap-4">
              {reservas.map((res) => (
                <ReservaCard
                  key={res.id}
                  reserva={res}
                  isAdminView={false}
                  onStatusUpdate={handleCancelReserva}
                />
              ))}
            </div>
          </div>

          <div className="glass border-white/40 rounded-2xl p-5 bg-white/40 flex gap-3 text-xs leading-relaxed text-slate-700">
            <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase font-mono tracking-wide mb-0.5 text-slate-800">Como Funciona a Retirada?</p>
              <p>Compareça ao estabelecimento indicado trazendo o endereço, informe seu nome/e-mail no balcão de checkout. O pagamento do produto promocional com desconto ocorre diretamente na boca do caixa físico durante o processo de retirada ordinária.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass rounded-3xl border-white/50 py-16 text-center max-w-lg mx-auto p-6 space-y-3">
          <div className="w-12 h-12 bg-white/40 rounded-2xl flex items-center justify-center text-gray-400 mx-auto border border-white/50">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-gray-800">Você ainda não tem reservas</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Seu carrinho está livre do desperdício por enquanto. Navegue por nossa vitrine virtual para encontrar os menores preços e salvar os seus produtos preferidos.
          </p>
          <button
            onClick={() => navigateTo('produtos')}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 font-mono uppercase tracking-wider cursor-pointer mt-4"
          >
            Quero Economizar Agora &rarr;
          </button>
        </div>
      )}
    </div>
  );
};

