/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { Package, ShoppingBag, Clock, CheckSquare, PlusCircle, ClipboardList, TrendingUp, Tag, Coins, Save, Trash2, Award } from 'lucide-react';

export const AdminDashboardValida: React.FC = () => {
  const { user, navigateTo, produtos, reservas: allReservas, produtosLoading, reservasLoadingPre, clearAllDatabaseUsers } = useApp();

  // 1. Get products registered by this specific merchant admin
  const myProducts = produtos.filter(p => p.adminId === user?.uid);

  // 2. Scan reservations and compute metrics
  let pending = 0;
  let withdrawn = 0;
  let savedCount = 0;
  let recoveredValue = 0;      // Value received from ValidaMais sales (status === 'retirado')
  let pendingValue = 0;        // Value reserved/pending in progress
  let avoidedLossValue = 0;    // Original shelf value of the items that were successfully retrieved (prevented total waste cost)

  allReservas.forEach((res) => {
    // Filter dynamically by products belonging to this admin
    const hasProduct = myProducts.some(p => p.id === res.produtoId || p.nomeProduto === res.nomeProduto);
    const belongsToLoja = res.nomeLoja === user?.nome || (user?.nome && res.nomeLoja?.toLowerCase().includes(user.nome.toLowerCase()));
    
    if (hasProduct || belongsToLoja) {
      const prod = produtos.find(p => p.id === res.produtoId);
      // If we can't find the product details, fall back to calculating original price relative to the discount
      const originalUnitPrice = prod ? prod.precoOriginal : (res.precoTotal / res.quantidade) * 2.22;

      if (res.status === 'pendente') {
        pending++;
        pendingValue += res.precoTotal;
      }
      if (res.status === 'retirado') {
        withdrawn++;
        savedCount += res.quantidade;
        recoveredValue += res.precoTotal;
        avoidedLossValue += (originalUnitPrice * res.quantidade);
      }
    }
  });

  const metrics = {
    totalProducts: myProducts.length,
    pendingReservations: pending,
    withdrawnReservations: withdrawn,
    itemsSaved: savedCount,
    recoveredValue,
    pendingValue,
    avoidedLossValue,
    totalLossAvoidedPercent: avoidedLossValue > 0 ? ((recoveredValue / avoidedLossValue) * 100) : 0
  };

  const loading = false;

  return (
    <div id="admin_dashboard" className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">Painel do Lojista</h1>
          <p className="text-sm text-gray-500 font-semibold mt-1">Gerencie seus produtos próximos do vencimento e acompanhe as coletas realizadas</p>
        </div>
        <button
          onClick={() => navigateTo('admin-produtos-novo')}
          className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 hover:shadow-md transition-all text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-amber-50" />
          Cadastrar Novo Lote
        </button>
      </div>

      {/* Economiómetro Financeiro do Lojista Card */}
      <div 
        id="merchant_savings_board" 
        className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border border-emerald-500/25 animate-fade-in"
      >
        {/* Background ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none" />
        
        <div className="space-y-2 z-10">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/20 font-extrabold">
            <Coins className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            Indicadores de Recuperação de Ativos
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
            Seu Balanço de Desperdício Evitado ♻️
          </h2>
          <p className="text-xs text-emerald-100/85 font-medium max-w-lg leading-relaxed">
            Aqui você acompanha em tempo real o faturamento de liquidação recuperado e o prejuízo de descarte evitado ao vender lotes antes do fim da data regulamentar.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-4 sm:gap-6 z-10 w-full lg:w-auto items-stretch justify-between">
          
          {/* Valor Recuperado com Vendas */}
          <div className="bg-emerald-900/20 border border-emerald-500/15 rounded-2xl p-4 flex-1 min-w-[145px] shadow-2xs">
            <div className="text-[9px] font-extrabold text-emerald-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Valor Recuperado
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 mt-1.5 leading-none">
              {metrics.recoveredValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-[9px] text-emerald-300/70 font-medium mt-1 uppercase font-mono">
              Entrou no caixa
            </div>
          </div>

          {/* Prejuízo de Prateleira Evitado */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex-1 min-w-[160px] shadow-2xs">
            <div className="text-[9px] font-extrabold text-slate-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Perda Integral Evitada
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1.5 leading-none">
              {metrics.avoidedLossValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-[9px] text-slate-400 font-medium mt-1 uppercase font-mono">
              Valor de gôndola salvo
            </div>
          </div>

          {/* Reserva Ativa / Potencial */}
          <div className="bg-amber-950/20 border border-amber-500/10 rounded-2xl p-4 flex-1 min-w-[140px] shadow-2xs">
            <div className="text-[9px] font-extrabold text-amber-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Faturamento Pendente
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-300 mt-1.5 leading-none">
              {metrics.pendingValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-[9px] text-amber-400/60 font-semibold mt-1 uppercase font-mono">
              Em reservas ativas
            </div>
          </div>

        </div>
      </div>

      {/* Metrics widgets */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1,2,3,4].map(n => (
            <div key={n} className="bg-gray-100 h-28 rounded-2xl border" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Active lots */}
          <div className="glass border-white/50 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-gray-500">Produtos Postados</span>
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-slate-800">{metrics.totalProducts}</span>
              <span className="block text-[10px] text-gray-400 font-medium mt-1">Lotes em oferta ativa</span>
            </div>
          </div>

          {/* Card 2: Pending Reservations */}
          <div className="glass border-orange-200/55 rounded-2xl p-5 flex flex-col justify-between shadow-xs ring-2 ring-amber-500/10">
            <div className="flex items-center justify-between text-amber-550">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-amber-700">Aguardando Coleta</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-amber-600">{metrics.pendingReservations}</span>
              <span className="block text-[10px] text-amber-500 font-medium mt-1">Reservas pendentes</span>
            </div>
          </div>

          {/* Card 3: Completed Collections */}
          <div className="glass border-white/50 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-emerald-600">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-emerald-800">Finalizadas</span>
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black text-emerald-600">{metrics.withdrawnReservations}</span>
              <span className="block text-[10px] text-emerald-500 font-medium mt-1">Retiradas realizadas</span>
            </div>
          </div>

          {/* Card 4: Food saved indicator */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between text-emerald-100">
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Salvos do Lixo</span>
              <TrendingUp className="w-5 h-5 text-emerald-250 text-white" />
            </div>
            <div className="mt-4">
              <span className="text-3xl font-black">{metrics.itemsSaved}</span>
              <span className="block text-[10px] text-emerald-150 text-emerald-100 font-medium mt-1">Unidades resgatadas</span>
            </div>
          </div>
        </div>
      )}

      {/* Admin Shortcuts Grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Box 1 */}
        <button
          onClick={() => navigateTo('admin-produtos-novo')}
          className="glass rounded-3xl border-white/50 p-6 text-left hover:border-amber-400 group cursor-pointer transition-all hover:shadow-md"
        >
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-sm text-gray-901 text-gray-900	">Novo Lote Promocional</h3>
          <p className="text-xs text-gray-500 mt-1 lines-clamp-2 leading-relaxed">
            Cadastre os itens perecíveis do seu estoque que estão aproximando-se do prazo regulamentar e determine preços reduzidos de liquidação.
          </p>
        </button>

        {/* Box 2 */}
        <button
          onClick={() => navigateTo('admin-produtos')}
          className="glass rounded-3xl border-white/50 p-6 text-left hover:border-amber-400 group cursor-pointer transition-all hover:shadow-md"
        >
          <div className="w-12 h-12 bg-amber-50 text-amber-650 text-amber-600 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-sm text-gray-900">Gerenciar Catalogados</h3>
          <p className="text-xs text-gray-500 mt-1 lines-clamp-2 leading-relaxed">
            Veja a relação de todos os lotes que você publicou, edite descrições de embalagem, atualize preços promocionais ou remova liquidações expiradas.
          </p>
        </button>

        {/* Box 3 */}
        <button
          onClick={() => navigateTo('admin-reservas')}
          className="glass rounded-3xl border-white/50 p-6 text-left hover:border-amber-400 group cursor-pointer transition-all hover:shadow-md"
        >
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-sm text-gray-900">Gerenciar Reservas</h3>
          <p className="text-xs text-gray-500 mt-1 lines-clamp-2 leading-relaxed">
            Consulte as solicitações de reserva feitas por usuários, identifique os clientes que virão retirar o mantimento e dê baixa para confirmar a retirada.
          </p>
        </button>

        {/* Box 4 */}
        <button
          onClick={() => navigateTo('admin-categorias')}
          className="glass rounded-3xl border-white/50 p-6 text-left hover:border-indigo-400 group cursor-pointer transition-all hover:shadow-md"
        >
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
            <Tag className="w-5 h-5 text-indigo-650" />
          </div>
          <h3 className="font-extrabold text-sm text-gray-900">Categorias de Produtos</h3>
          <p className="text-xs text-gray-500 mt-1 lines-clamp-2 leading-relaxed">
            Personalize as divisões e departamentos de mantimentos cadastrando categorias sob demanda ou excluindo seções redundantes.
          </p>
        </button>
      </div>

      {/* Database control panel */}
      <div className="glass rounded-3xl border-red-200/60 p-6 bg-red-50/10 mt-2 border">
        <h3 className="font-extrabold text-sm text-red-900 flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
          Manutenção do Sistema (Limpeza & Reinicialização)
        </h3>
        <p className="text-xs text-gray-500 mt-2 max-w-2xl leading-relaxed">
          Para realizar testes limpos a partir do zero, use a ferramenta de reinicialização abaixo. 
          Ela removerá todas as contas de usuário adicionais da base remota, cancelará e apagará todas as reservas experimentais, 
          e restabelecerá o catálogo promovido original com as contas de modelo padrão (<span className="font-semibold text-amber-700">admin@validamais.com</span> e <span className="font-semibold text-emerald-700">cliente@validamais.com</span>).
        </p>
        <div className="mt-4">
          <button
            onClick={() => {
              if (window.confirm("Deseja realmente limpar toda a base de dados de usuários personalizados, reservas antigas e produtos extras? Essa operação não pode ser desfeita.")) {
                clearAllDatabaseUsers();
              }
            }}
            className="px-4 py-2 bg-red-650 bg-red-600 hover:bg-red-750 transition-all text-white text-xs font-bold font-mono uppercase tracking-wider rounded-xl cursor-pointer"
          >
            Limpar Base e Começar do Zero
          </button>
        </div>
      </div>
    </div>
  );
};
