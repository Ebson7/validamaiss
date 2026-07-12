/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { ReservaCard } from '../ReservaCard';
import { Loader2, Calendar, ShoppingCart, HelpCircle, TrendingUp, Award, Leaf, Sparkles, Globe, ShieldCheck } from 'lucide-react';

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

  // Calculate weight of food saved (kg) based on category
  const totalWeightSaved = reservas
    .filter(r => r.status !== 'cancelado')
    .reduce((sum, r) => {
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

  // Carbon coefficient: roughly 2.5 kg of CO2 avoided per kg of food saved
  const totalCO2Saved = totalWeightSaved * 2.5;

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

          {/* PAINEL DE IMPACTO ECOLÓGICO E PEGADA VERDE (MEDALHAS ECO) */}
          <div 
            id="ecological_impact_and_eco_badges_board" 
            className="glass rounded-3xl p-6 border-emerald-300/40 shadow-xs space-y-6 relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent font-sans"
          >
            <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200/40 pb-4">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-600 animate-pulse" />
                  Sua Pegada Ecológica ValidaMais 🌿
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Confira o volume total de alimentos que você evitou de ir para o lixo e a sua contribuição direta na redução de gases poluentes!
                </p>
              </div>
            </div>

            {/* Eco stats cards row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/65 border border-white rounded-2xl p-4 flex items-center gap-4 shadow-3xs">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">Alimentos Resgatados</span>
                  <div className="text-xl font-black font-mono text-slate-800 leading-none mt-1">
                    {totalWeightSaved.toFixed(1)} <span className="text-xs font-bold text-slate-500 font-sans">kg</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold font-mono mt-1 block">Peso líquido aproximado</span>
                </div>
              </div>

              <div className="bg-white/65 border border-white rounded-2xl p-4 flex items-center gap-4 shadow-3xs">
                <div className="w-12 h-12 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0">
                  <Globe className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">CO₂e Evitado</span>
                  <div className="text-xl font-black font-mono text-slate-800 leading-none mt-1">
                    {totalCO2Saved.toFixed(1)} <span className="text-xs font-bold text-slate-500 font-sans">kg CO₂e</span>
                  </div>
                  <span className="text-[10px] text-sky-600 font-semibold font-mono mt-1 block">Emissão evitada em aterros</span>
                </div>
              </div>
            </div>

            {/* Achievements row */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase font-mono">Suas Conquistas de Defesa Ambiental:</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono font-bold">
                  {
                    [
                      totalWeightSaved >= 0.1,
                      totalWeightSaved >= 2.0,
                      totalWeightSaved >= 8.0,
                      totalWeightSaved >= 20.0
                    ].filter(Boolean).length
                  } / 4 Desbloqueadas
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Badge 1 */}
                <div 
                  className={`border rounded-2xl p-3 flex flex-col items-center text-center gap-2 transition-all ${
                    totalWeightSaved >= 0.1 
                      ? 'bg-emerald-50/70 border-emerald-200/50 text-emerald-950 shadow-3xs' 
                      : 'bg-slate-50/40 border-slate-150 text-slate-400 opacity-60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${totalWeightSaved >= 0.1 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                    🌱
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold truncate w-full">Semente Verde</h4>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Salvou seu 1º lote</p>
                  </div>
                </div>

                {/* Badge 2 */}
                <div 
                  className={`border rounded-2xl p-3 flex flex-col items-center text-center gap-2 transition-all ${
                    totalWeightSaved >= 2.0 
                      ? 'bg-emerald-50/70 border-emerald-200/50 text-emerald-950 shadow-3xs' 
                      : 'bg-slate-50/40 border-slate-150 text-slate-400 opacity-60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${totalWeightSaved >= 2.0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                    🛡️
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold truncate w-full">Defensor Ecológico</h4>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Salvou &gt; 2kg</p>
                  </div>
                </div>

                {/* Badge 3 */}
                <div 
                  className={`border rounded-2xl p-3 flex flex-col items-center text-center gap-2 transition-all ${
                    totalWeightSaved >= 8.0 
                      ? 'bg-emerald-50/70 border-emerald-200/50 text-emerald-950 shadow-3xs' 
                      : 'bg-slate-50/40 border-slate-150 text-slate-400 opacity-60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${totalWeightSaved >= 8.0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                    ⛅
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold truncate w-full">Herói do Clima</h4>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Salvou &gt; 8kg</p>
                  </div>
                </div>

                {/* Badge 4 */}
                <div 
                  className={`border rounded-2xl p-3 flex flex-col items-center text-center gap-2 transition-all ${
                    totalWeightSaved >= 20.0 
                      ? 'bg-emerald-50/70 border-emerald-200/50 text-emerald-950 shadow-3xs' 
                      : 'bg-slate-50/40 border-slate-150 text-slate-400 opacity-60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${totalWeightSaved >= 20.0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                    🏆
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold truncate w-full">Desperdício Zero</h4>
                    <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">Salvou &gt; 20kg!</p>
                  </div>
                </div>
              </div>

              {/* Progress bar to next achievement */}
              {totalWeightSaved < 20.0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold font-mono">
                    <span>Progresso para próxima conquista</span>
                    <span>
                      {totalWeightSaved.toFixed(1)} / {totalWeightSaved < 0.1 ? '0.1' : totalWeightSaved < 2.0 ? '2.0' : totalWeightSaved < 8.0 ? '8.0' : '20.0'} kg
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                      style={{ 
                        width: `${Math.min(100, (totalWeightSaved / (totalWeightSaved < 0.1 ? 0.1 : totalWeightSaved < 2.0 ? 2.0 : totalWeightSaved < 8.0 ? 8.0 : 20.0)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
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

