/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Package, ShoppingBag, Clock, CheckSquare, PlusCircle, ClipboardList, TrendingUp, Tag, Coins, Save, Trash2, Award, Sparkles, Star, Trophy, ShieldCheck, Check, CreditCard, ChevronRight, X, AlertTriangle } from 'lucide-react';
import { Produto } from '../../types';

export const AdminDashboardValida: React.FC = () => {
  const { user, navigateTo, produtos, reservas: allReservas, produtosLoading, reservasLoadingPre, clearAllDatabaseUsers, updateUserProfile, showAlert, saveProduct } = useApp();

  // Advertiser space local state
  const [sloganInput, setSloganInput] = useState(user?.destaqueMensagem || '');
  const [editSlogan, setEditSlogan] = useState(false);
  
  // Checkout states
  const [checkoutPlan, setCheckoutPlan] = useState<'bronze' | 'ouro' | null>(null);
  const [checkoutMethod, setCheckoutMethod] = useState<'pix' | 'cartao' | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [paying, setPaying] = useState(false);
  
  // Card mock details
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');

  // 1. Get products registered by this specific merchant admin
  const myProducts = produtos.filter(p => p.adminId === user?.uid);

  // Expiration calculation helper
  const getExpiryStatus = (expiryDateStr: string) => {
    const now = new Date();
    const expiry = new Date(expiryDateStr + 'T23:59:59');
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const todayStr = now.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    return {
      isExpiringSoon: expiryDateStr === todayStr || expiryDateStr === tomorrowStr || (diffMs > 0 && diffHours <= 24),
      diffHours: Math.max(0, Math.round(diffHours)),
      isToday: expiryDateStr === todayStr,
      isTomorrow: expiryDateStr === tomorrowStr
    };
  };

  // Products expiring in less than 24 hours
  const expiringSoonProducts = myProducts.filter(p => {
    const totalLeft = p.quantidadeDisponivel - p.quantidadeReservada;
    if (totalLeft <= 0 || p.status === 'esgotado') return false;
    const { isExpiringSoon } = getExpiryStatus(p.dataValidade);
    return isExpiringSoon;
  });

  // Apply Quick Aggressive Discount
  const applyQuickDiscount = async (product: Produto, percent: number) => {
    const newPrice = Math.round((product.precoOriginal * (1 - percent / 100)) * 100) / 100;
    const updatedData = {
      nomeProduto: product.nomeProduto,
      categoria: product.categoria,
      descricao: product.descricao || '',
      precoOriginal: Number(product.precoOriginal),
      precoPromocional: Number(newPrice),
      dataValidade: product.dataValidade,
      quantidadeDisponivel: Number(product.quantidadeDisponivel),
      endereco: product.endereco,
      nomeLoja: product.nomeLoja,
      imageUrl: product.imageUrl || '',
      status: product.status || 'disponivel',
      adminId: product.adminId
    };

    try {
      await saveProduct(updatedData, product.id || null);
      showAlert(`Desconto agressivo de ${percent}% aplicado com sucesso ao lote ${product.nomeProduto}!`, 'success');
    } catch (err) {
      showAlert('Erro ao aplicar desconto rápido.', 'error');
    }
  };

  // Create Mock Test Product for Expiry Testing
  const handleCreateTestProduct = async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const testProductData = {
      nomeProduto: 'Iogurte Grego Frutas Vermelhas 500g 🍓',
      categoria: 'Laticínios',
      descricao: 'Lote de teste com vencimento curto para simulação de descontos agressivos na plataforma.',
      precoOriginal: 16.90,
      precoPromocional: 11.90,
      dataValidade: tomorrowStr,
      quantidadeDisponivel: 15,
      quantidadeReservada: 0,
      imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=60&w=400',
      status: 'disponivel',
      endereco: user?.endereco || 'Rua Pamplona, 450 - Jardim Paulista, São Paulo/SP',
      nomeLoja: user?.nome || 'Minha Loja Parceira'
    };

    try {
      await saveProduct(testProductData, null);
      showAlert('Lote crítico de teste simulado com sucesso na base de dados! Verifique o painel abaixo.', 'success');
    } catch (err) {
      showAlert('Erro ao carregar simulação de lote do produto.', 'error');
    }
  };

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

  const handleUpdateSlogan = async () => {
    try {
      await updateUserProfile({ destaqueMensagem: sloganInput });
      setEditSlogan(false);
      showAlert('Frase de destaque patrocinado atualizada com sucesso!', 'success');
    } catch (err) {
      showAlert('Operação falhou ao atualizar frase.', 'error');
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm('Tem certeza de que deseja cancelar seu destaque patrocinado e remover os banners da página principal?')) {
      try {
        await updateUserProfile({
          destaquePlano: undefined,
          destaqueAtivo: false,
          destaqueMensagem: undefined
        });
        setSloganInput('');
        showAlert('Destaque mensal cancelado e banners desvinculados.', 'info');
      } catch (err) {
        showAlert('Erro ao cancelar destaque.', 'error');
      }
    }
  };

  const handleProcessAdminPayment = async () => {
    if (!checkoutPlan) return;
    setPaying(true);

    setTimeout(async () => {
      try {
        await updateUserProfile({
          destaquePlano: checkoutPlan,
          destaqueAtivo: true,
          destaqueMensagem: sloganInput || (checkoutPlan === 'ouro' ? 'Laticínios fresquinhos e padaria com até 65% de desconto!' : 'Frutas e Hortaliças selecionadas do dia!')
        });
        showAlert(`Sucesso! Sua assinatura do Plano ${checkoutPlan === 'ouro' ? 'Ouro' : 'Bronze'} foi processada. Seus anúncios estão em exibição na Home!`, 'success');
        setCheckoutPlan(null);
        setCheckoutMethod(null);
        setPixCopied(false);
      } catch (err) {
        showAlert('Erro ao processar pagamento simulado.', 'error');
      } finally {
        setPaying(false);
      }
    }, 1800);
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

      {/* PAINEL DE ALERTAS AUTOMÁTICOS DE VENCIMENTO CURTO (< 24 HORAS) */}
      <div 
        id="expiry_alert_system_board" 
        className="glass rounded-3xl p-6 border-amber-300/40 shadow-xs space-y-4 relative overflow-hidden bg-gradient-to-br from-amber-500/5 via-transparent to-transparent font-sans"
      >
        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200/40 pb-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 flex items-center justify-center text-[9px] font-black text-white">!</span>
              </span>
              Alerta de Vencimento Iminente (Urgência &lt; 24h) ⚠️
            </h3>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Evite desperdícios e perdas financeiras! Itens com menos de 24 horas para o vencimento exigem descontos agressivos para escoamento acelerado de gôndola.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateTestProduct}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 border border-amber-500 text-white text-[10px] font-black uppercase font-mono tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
            title="Simular novos cenários curtos criando itens prestes a vencer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Simular Lote Crítico
          </button>
        </div>

        {expiringSoonProducts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {expiringSoonProducts.map((p) => {
              const totalLeft = p.quantidadeDisponivel - p.quantidadeReservada;
              const { isToday } = getExpiryStatus(p.dataValidade);
              
              const price30 = Math.round((p.precoOriginal * 0.70) * 100) / 100;
              const price50 = Math.round((p.precoOriginal * 0.50) * 100) / 100;
              const price75 = Math.round((p.precoOriginal * 0.25) * 100) / 100;

              return (
                <div 
                  key={p.id} 
                  className="bg-white/65 hover:bg-white/80 rounded-2xl p-4 border border-white hover:border-amber-400/50 shadow-2xs hover:shadow-xs transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden"
                >
                  {isToday && (
                    <div className="absolute inset-x-0 top-0 h-1 bg-rose-500 animate-pulse" />
                  )}

                  {/* Header info */}
                  <div className="flex gap-3">
                    <img
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=150'}
                      alt={p.nomeProduto}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0 shadow-3xs"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{p.nomeProduto}</h4>
                        <span className="text-[10px] bg-slate-100 font-bold px-1.5 py-0.5 rounded-md text-slate-600 font-mono">
                          {p.categoria}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[11px] text-slate-500 font-semibold font-mono">
                          Restam: <strong className="text-slate-800 font-black">{totalLeft} un.</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500 font-semibold font-mono">
                          Preço Promo: <strong className="text-emerald-700 font-extrabold">{p.precoPromocional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Warning Indicator */}
                  <div className={`flex items-center gap-2 px-3 py-2 border rounded-xl ${isToday ? 'bg-rose-50/70 border-rose-100 text-rose-900' : 'bg-amber-50/70 border-amber-100 text-amber-900'}`}>
                    <AlertTriangle className={`w-4 h-4 shrink-0 col-span-1 ${isToday ? 'text-rose-600 animate-bounce' : 'text-amber-600'}`} />
                    <div className="text-[11px] font-semibold leading-none">
                      {isToday ? (
                        <span className="text-rose-700 font-black flex items-center gap-1 leading-snug">
                          💀 VENCE HOJE! Risco máximo de descarte sanitário!
                        </span>
                      ) : (
                        <span className="text-amber-800 font-bold leading-snug">
                          ⏰ Vence amanhã! ({p.dataValidade}) - Ajuste recomendado.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick aggressive discount selector capsules */}
                  <div className="space-y-2 pt-2 border-t border-dashed border-slate-200">
                    <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase font-mono block">
                      Aplicar Super Desconto Rápido:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => applyQuickDiscount(p, 30)}
                        className="py-2 px-1 hover:scale-102 hover:shadow-xs hover:border-emerald-300 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-850 rounded-xl text-[10px] font-mono font-black uppercase text-center transition-all cursor-pointer"
                        title="Aplicar desconto moderado de 30% do original"
                      >
                        -30% R$ {price30.toFixed(2)}
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickDiscount(p, 50)}
                        className="py-2 px-1 hover:scale-102 hover:shadow-xs hover:border-amber-300 bg-amber-50 hover:bg-amber-100 border border-amber-100 text-amber-850 rounded-xl text-[10px] font-mono font-black uppercase text-center transition-all cursor-pointer shadow-2xs"
                        title="Aplicar desconto agressivo de 50% do original"
                      >
                        -50% R$ {price50.toFixed(2)}
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickDiscount(p, 75)}
                        className="py-2 px-1 hover:scale-102 hover:shadow-xs hover:border-rose-300 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-850 rounded-xl text-[10px] font-mono font-black uppercase text-center transition-all cursor-pointer"
                        title="Liquidação limite de 75% para zerar o estoque hoje"
                      >
                        -75% R$ {price75.toFixed(2)}
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/40 text-center space-y-2 max-w-xl mx-auto">
            <span className="text-xl">🌿</span>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide font-mono">Sem Lotes Críticos (<span className="text-amber-600 font-bold">&lt;24h</span>)</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              Perfeito! Nenhum lote cadastrado expira no prazo crítico de 24 horas. Para experimentar o fluxo de desconto agressivo, clique em <strong>"Simular Lote Crítico"</strong>.
            </p>
          </div>
        )}
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

      {/* Espaço do Lojista Anunciante & Patrocínios */}
      <div id="merchant_advertiser_section" className="glass rounded-3xl border-amber-300/40 p-6 shadow-xs relative overflow-hidden bg-gradient-to-tr from-amber-500/5 via-transparent to-transparent">
        <div className="absolute right-0 top-0 w-32 h-32 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono tracking-widest uppercase bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              Sua Vitrine em Destaque
            </span>
            <h3 className="text-lg font-black text-slate-800">Canais de Anúncio & Patrocínio</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-semibold max-w-2xl">
              Destaque sua loja na página inicial do ValidaMais! Exiba slogans de impacto e atraia novos compradores da vizinhança para liquidar suas gôndolas muito mais rápido.
            </p>
          </div>

          {user?.destaqueAtivo && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <div className="w-2.5 h-2.5 bg-emerald-550 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide font-mono">
                Destaque {user.destaquePlano === 'ouro' ? 'Ouro 🌟' : 'Bronze 🥉'} Ativo
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Display depending on active subscription */}
        {user?.destaqueAtivo ? (
          <div className="mt-5 space-y-4">
            <div className="bg-amber-500/5 rounded-2xl p-4 border border-amber-200/50 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span className="text-[10px] font-bold text-amber-800 font-mono uppercase tracking-wider flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-amber-500" /> Suas Configurações de Campanha Ativa
                </span>
                <span className="text-[10px] text-gray-400 font-medium">Assinatura mensal simulada renovando em 30 dias</span>
              </div>

              {!editSlogan ? (
                <div className="space-y-2">
                  <div className="text-slate-700 text-xs font-semibold">
                    Frase atual exibida nos banners da Home:
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-gray-100 text-slate-800 text-sm italic font-medium">
                    "{user.destaqueMensagem || 'Os melhores lotes da região!'}"
                  </div>
                  <div className="flex gap-2.5 pt-1">
                    <button
                      onClick={() => {
                        setSloganInput(user.destaqueMensagem || '');
                        setEditSlogan(true);
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-650 hover:shadow-2xs text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1"
                    >
                      Editar Frase
                    </button>
                    <button
                      onClick={handleCancelSubscription}
                      className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl cursor-pointer transition-all"
                    >
                      Cancelar Destaque
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 block">Nova Frase de Impacto:</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-400 focus:outline-hidden font-medium"
                      placeholder="Ex: Padaria Bella Vista: Laticínios finos pela metade do preço hoje!"
                      value={sloganInput}
                      onChange={(e) => setSloganInput(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleUpdateSlogan}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
                    >
                      Salvar Frase
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditSlogan(false)}
                      className="px-4 py-2 border border-gray-200 text-gray-550 text-gray-500 hover:bg-gray-50 text-xs font-bold rounded-xl cursor-pointer transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-6">
            <p className="text-xs text-gray-400 font-semibold uppercase font-mono tracking-wider">Planos de Exibição Mensais Disponíveis:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Gold Sponsor Card */}
              <div className="bg-gradient-to-br from-stone-900 to-amber-950 text-white rounded-2xl p-5 border border-amber-500/20 relative overflow-hidden flex flex-col justify-between shadow-xs">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono tracking-widest uppercase bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-md">
                    RECOMENDADO ★
                  </span>
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-amber-300 font-sans">Patrocinador Ouro ValidaMais</h4>
                    <p className="text-xs text-stone-300 leading-relaxed font-sans font-medium">
                      Espaço premium de destaque rotativo no topo do feed da Home principal. Edição de slogan comercial livre em tempo real para atrair cliques imediatos para seus lotes promocionais.
                    </p>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-stone-200 font-medium">
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> Banner gigante de cabeçalho na Home</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> Slogan personalizado livre</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-amber-400" /> Selo "Destaque" ao lado do nome da loja</li>
                  </ul>
                </div>
                
                <div className="pt-5 flex items-center justify-between border-t border-white/5 mt-4">
                  <div>
                    <span className="block text-[9px] text-stone-400 font-mono">ASSINATURA BRUTA</span>
                    <span className="text-lg font-black text-amber-400 font-mono">R$ 49,90<span className="text-[10px] text-stone-400 font-sans font-normal">/mês</span></span>
                  </div>
                  <button
                    onClick={() => {
                      setCheckoutPlan('ouro');
                      setSloganInput('');
                    }}
                    className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-900 font-black text-xs uppercase font-mono rounded-xl cursor-pointer hover:shadow-xs transition-all"
                  >
                    Assinar Ouro
                  </button>
                </div>
              </div>

              {/* Bronze Sponsor Card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 relative overflow-hidden flex flex-col justify-between shadow-xs">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono tracking-widest uppercase bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md">
                    DESTAQUE LATERAL
                  </span>
                  <div className="space-y-1 text-slate-800">
                    <h4 className="text-base font-black text-slate-800">Parceiro Verde Bronze</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-sans font-medium">
                      Exibição lateral secundária para impulsionar suas campanhas com um custo viável para pequenos comércios e cooperativas locais.
                    </p>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-slate-600 font-medium">
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> Banner médio de rodapé ou lateral</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> Link de encaminhamento rápido</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> Ideal para sacolas verdes de sobras</li>
                  </ul>
                </div>
                
                <div className="pt-5 flex items-center justify-between border-t border-gray-100 mt-4">
                  <div>
                    <span className="block text-[9px] text-gray-400 font-mono">ASSINATURA BRUTA</span>
                    <span className="text-lg font-black text-slate-800 font-mono">R$ 19,90<span className="text-[10px] text-gray-400 font-sans font-normal">/mês</span></span>
                  </div>
                  <button
                    onClick={() => {
                      setCheckoutPlan('bronze');
                      setSloganInput('');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs uppercase font-mono rounded-xl cursor-pointer hover:shadow-xs transition-all"
                  >
                    Assinar Bronze
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Simulated Advertiser Checkout Dialog */}
      {checkoutPlan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-amber-100 text-slate-800 space-y-6 relative animate-scale-up">
            
            <button
              type="button"
              onClick={() => {
                setCheckoutPlan(null);
                setCheckoutMethod(null);
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-slate-700 font-bold text-xs p-1 cursor-pointer font-mono"
            >
              ✖
            </button>

            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono tracking-widest uppercase bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
                Checkout de Patrocínio e Exibição de Ativo
              </span>
              <h3 className="text-xl font-black text-slate-800">
                Ativar Plano {checkoutPlan === 'ouro' ? 'Ouro 🌟' : 'Bronze 🥉'}
              </h3>
              <p className="text-xs text-gray-500">
                Defina sua frase de efeito promocional exibida aos usuários e realize o pagamento mensal simulado.
              </p>
            </div>

            {/* Custom campaign slogan entry */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">Escreva sua Frase Comercial:</label>
                <input
                  type="text"
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-amber-400 focus:outline-hidden font-medium"
                  placeholder={checkoutPlan === 'ouro' ? 'Ex: Bolos artesanais e croissaints fresquinhos a preço de custo hoje!' : 'Ex: Legumes selecionados para sopa com 50% de desconto!'}
                  value={sloganInput}
                  onChange={(e) => setSloganInput(e.target.value)}
                />
                <span className="text-[10px] text-gray-400 font-medium block">Essa frase será exibida no rodapé ou no banner da Home imediatamente.</span>
              </div>

              {/* Payment Methods */}
              {!checkoutMethod ? (
                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-slate-800 block text-center">Forma de Pagamento Simulada:</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setCheckoutMethod('pix')}
                      className="p-4 border border-slate-200 rounded-2xl hover:border-amber-400 hover:bg-slate-50 text-center flex flex-col items-center gap-2 group cursor-pointer transition-all"
                    >
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold font-mono text-xs group-hover:scale-105 transition-transform">
                        PIX
                      </div>
                      <span className="text-xs font-extrabold text-slate-700">Pague com PIX</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckoutMethod('cartao')}
                      className="p-4 border border-slate-200 rounded-2xl hover:border-amber-400 hover:bg-slate-50 text-center flex flex-col items-center gap-2 group cursor-pointer transition-all"
                    >
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-700">Cartão de Crédito</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-t border-dashed border-gray-150 pt-4 space-y-4">
                  {checkoutMethod === 'pix' ? (
                    <div className="space-y-3.5 text-center">
                      <div className="bg-slate-50 border p-3.5 rounded-2xl space-y-2 max-w-xs mx-auto">
                        {/* Fake QR code representation in text */}
                        <div className="w-24 h-24 bg-stone-850 bg-stone-900 flex items-center justify-center mx-auto text-[8px] font-mono p-2 rounded-lg text-emerald-300 leading-tight">
                          [ MOCK QR CODE VALIDA MAIS ]
                        </div>
                        <span className="text-[10px] text-gray-500 font-semibold block">Escaneie pelo App do seu Banco</span>
                      </div>
                      
                      <div className="space-y-1.5 max-w-xs mx-auto">
                        <input
                          type="text"
                          readOnly
                          className="w-full text-center px-3 py-1.5 bg-gray-100 border rounded-lg text-[9px] font-mono text-gray-600"
                          value="validamais_pix_recebivel_patrocinio_0028492048"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText("validamais_pix_recebivel_patrocinio_0028492048");
                            setPixCopied(true);
                            showAlert('Copiado para a área de transferência', 'success');
                          }}
                          className="text-[10px] text-amber-600 hover:text-amber-700 font-extrabold"
                        >
                          {pixCopied ? '✓ Copiado!' : 'Copiar Código PIX Copia e Cola'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-800 block">Dados do Cartão (Simulação Segura):</span>
                      <div className="space-y-2">
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-xl text-xs"
                          placeholder="Número do Cartão (4444 4444 4444 4444)"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                        />
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-xl text-xs"
                          placeholder="Nome do Titular"
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            className="px-3 py-2 border rounded-xl text-xs"
                            placeholder="Validade (MM/AA)"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                          />
                          <input
                            type="text"
                            className="px-3 py-2 border rounded-xl text-xs"
                            placeholder="CVV"
                            value={cardCVV}
                            onChange={(e) => setCardCVV(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between font-mono text-xs border-y border-dashed py-2">
                    <span className="font-bold text-slate-400">Total a Pagar</span>
                    <span className="font-black text-amber-600 text-sm">
                      {checkoutPlan === 'ouro' ? 'R$ 49,90' : 'R$ 19,90'}
                    </span>
                  </div>

                  {paying ? (
                    <div className="flex items-center justify-center gap-2 text-amber-600 font-mono text-xs font-bold py-2">
                      <span className="animate-spin text-lg">⏳</span> Validando transação instantânea...
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleProcessAdminPayment}
                        className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs tracking-wider uppercase font-mono rounded-xl cursor-pointer"
                      >
                        Confirmar Pagamento Simulado
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckoutMethod(null)}
                        className="py-3 px-4 border text-gray-550 hover:bg-slate-50 text-xs font-bold rounded-xl cursor-pointer font-mono"
                      >
                        Voltar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
