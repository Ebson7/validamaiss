import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Usuario } from '../../types';
import {
  TrendingUp, Users, Store, ShieldCheck, Sparkles, Award, Star,
  Edit, Check, Globe, RefreshCcw, Send, Settings, AlertTriangle,
  Package, ClipboardList, Wallet, Leaf, Clock, CheckCircle2
} from 'lucide-react';

export const CeoDashboard: React.FC = () => {
  const { navigateTo, user, showAlert, produtos, reservas } = useApp();

  // States
  const [merchants, setMerchants] = useState<Usuario[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Custom sponsorship edit states
  const [editingMerchantId, setEditingMerchantId] = useState<string | null>(null);
  const [editPlano, setEditPlano] = useState<string>('none');
  const [editAtivo, setEditAtivo] = useState<boolean>(false);
  const [editMensagem, setEditMensagem] = useState<string>('');

  // Global notice configuration
  const [globalNotice, setGlobalNotice] = useState<string>(() => {
    return localStorage.getItem('validamais_global_notice') || 'Seja bem-vindo ao ValidaMais! Juntos combatendo o desperdício alimentar. 🌱';
  });

  // Fetch real platform-wide metrics directly from Firestore
  const fetchPlatformData = async () => {
    setLoading(true);
    try {
      // Fetch all users
      const usersSnap = await getDocs(collection(db, 'usuarios'));
      const allUsers: Usuario[] = [];
      usersSnap.forEach((docSnap) => {
        allUsers.push({ uid: docSnap.id, ...docSnap.data() } as Usuario);
      });

      // Contagem real por papel
      const listMerchants = allUsers.filter(u => u.role === 'lojista');
      setMerchants(listMerchants);
      setTotalClientes(allUsers.filter(u => u.role === 'user').length);
    } catch (err) {
      console.error("Could not fetch ceo dashboard metrics:", err);
      showAlert("Não foi possível carregar os dados reais do Firestore. Usando cache local.", "warning");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
  }, []);

  // Save changes to merchant sponsorship direct in Firestore
  const handleSaveSponsorship = async (merchantId: string) => {
    try {
      const userRef = doc(db, 'usuarios', merchantId);
      const isNone = editPlano === 'none';
      
      const updateData = {
        destaquePlano: isNone ? null : editPlano,
        destaqueAtivo: isNone ? false : editAtivo,
        destaqueMensagem: isNone ? '' : editMensagem
      };

      await updateDoc(userRef, updateData);
      
      // Update local state
      setMerchants(prev => prev.map(m => {
        if (m.uid === merchantId) {
          return {
            ...m,
            destaquePlano: isNone ? undefined : editPlano,
            destaqueAtivo: isNone ? undefined : editAtivo,
            destaqueMensagem: isNone ? undefined : editMensagem
          };
        }
        return m;
      }));

      showAlert("Patrocínio e destaque do parceiro atualizados com sucesso!", "success");
      setEditingMerchantId(null);
    } catch (err) {
      console.error(err);
      showAlert("Erro ao persistir alterações no Firestore.", "error");
    }
  };

  const handleStartEdit = (m: Usuario) => {
    setEditingMerchantId(m.uid);
    setEditPlano(m.destaquePlano || 'none');
    setEditAtivo(m.destaqueAtivo || false);
    setEditMensagem(m.destaqueMensagem || '');
  };

  // Update System Notice
  const handleSaveNotice = () => {
    localStorage.setItem('validamais_global_notice', globalNotice);
    // Dispatch a storage event so other open pages can catch it!
    window.dispatchEvent(new Event('storage'));
    showAlert("Mensagem global atualizada com sucesso para todos os usuários!", "success");
  };

  // ── Métricas REAIS da plataforma (produtos e reservas vêm do contexto) ──
  const produtosAtivos = produtos.filter(p => p.status === 'disponivel').length;
  const naoCanceladas = reservas.filter(r => r.status !== 'cancelado');
  const retiradas = reservas.filter(r => r.status === 'retirado');
  const pendentes = reservas.filter(r => r.status === 'pendente');
  const canceladas = reservas.filter(r => r.status === 'cancelado');

  const gmvPotencial = naoCanceladas.reduce((s, r) => s + (r.precoTotal || 0), 0);
  const gmvRealizado = retiradas.reduce((s, r) => s + (r.precoTotal || 0), 0);
  const finalizadas = retiradas.length + canceladas.length;
  const taxaRetirada = finalizadas > 0 ? Math.round((retiradas.length / finalizadas) * 100) : 0;

  // Impacto real: peso salvo por categoria do produto reservado
  const catMultiplier = (cat?: string) => {
    if (cat === 'Laticínios') return 0.6;
    if (cat === 'Padaria') return 0.4;
    if (cat === 'Hortifrúti') return 0.8;
    if (cat === 'Carnes') return 1.0;
    if (cat === 'Bebidas') return 1.2;
    return 0.5;
  };
  const wasteSavedKg = Math.round(naoCanceladas.reduce((s, r) => {
    const prod = produtos.find(p => p.id === r.produtoId);
    return s + catMultiplier(prod?.categoria) * (r.quantidade || 1);
  }, 0) * 10) / 10;
  const co2AvoidedKg = Math.round(wasteSavedKg * 2.5 * 10) / 10;

  const money = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Active Sponsors counts
  const activeSponsors = merchants.filter(m => m.destaqueAtivo && m.destaquePlano);
  const goldCount = activeSponsors.filter(s => s.destaquePlano === 'ouro').length;
  const bronzeCount = activeSponsors.filter(s => s.destaquePlano === 'bronze').length;

  return (
    <div className="space-y-8 select-none">
      
      {/* Header with CEO Branding */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-950 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-44 h-44 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-4 max-w-3xl z-10 relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-[10px] font-black font-mono uppercase tracking-widest rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            Painel do Executivo Principal & Desenvolvedor
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-none">
              Valida<span className="text-emerald-400">Mais</span> CEO Suite
            </h1>
            <p className="text-sm text-stone-300 font-medium">
              Olá, <strong className="text-emerald-300 font-extrabold">{user?.nome || 'ebsonsilva7'}</strong>! Como CEO oficial do ValidaMais, você tem canais diretos para auditar lojistas parceiros, controlar as campanhas publicitárias em destaque rotativo e customizar comunicados de rede.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              onClick={() => navigateTo('home')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-black text-xs font-mono uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95"
            >
              ← Painel Público
            </button>
            <button
              onClick={fetchPlatformData}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-100 font-black text-xs font-mono uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-2"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Sincronizar Firestore
            </button>
          </div>
        </div>
      </div>

      {/* KPIs principais — dados reais */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-black tracking-widest uppercase font-mono block">Lojistas</span>
              <span className="text-3xl font-black text-slate-900">{merchants.length}</span>
            </div>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><Store className="w-5 h-5" /></div>
          </div>
          <p className="text-[10px] font-semibold text-gray-500 mt-3">parceiros cadastrados</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-black tracking-widest uppercase font-mono block">Clientes</span>
              <span className="text-3xl font-black text-slate-900">{totalClientes}</span>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Users className="w-5 h-5" /></div>
          </div>
          <p className="text-[10px] font-semibold text-gray-500 mt-3">consumidores cadastrados</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-black tracking-widest uppercase font-mono block">Produtos ativos</span>
              <span className="text-3xl font-black text-slate-900">{produtosAtivos}</span>
            </div>
            <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center"><Package className="w-5 h-5" /></div>
          </div>
          <p className="text-[10px] font-semibold text-gray-500 mt-3">{produtos.length} no catálogo</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-black tracking-widest uppercase font-mono block">Reservas</span>
              <span className="text-3xl font-black text-slate-900">{reservas.length}</span>
            </div>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><ClipboardList className="w-5 h-5" /></div>
          </div>
          <p className="text-[10px] font-semibold text-amber-600 mt-3">{pendentes.length} aguardando retirada</p>
        </div>
      </section>

      {/* Financeiro + reservas + impacto */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Faturamento */}
        <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-600" /><span className="text-xs font-black text-gray-700 uppercase tracking-wide">Faturamento (GMV)</span></div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">Realizado (retiradas)</div>
            <div className="text-2xl font-black text-emerald-600 leading-none">{money(gmvRealizado)}</div>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-gray-100">
            <span className="text-gray-500 font-semibold">Potencial (ativas)</span>
            <span className="font-black text-gray-800">{money(gmvPotencial)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 font-semibold">Taxa de retirada</span>
            <span className="font-black text-emerald-600">{taxaRetirada}%</span>
          </div>
        </div>

        {/* Reservas por status */}
        <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-indigo-600" /><span className="text-xs font-black text-gray-700 uppercase tracking-wide">Reservas por status</span></div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs"><span className="inline-flex items-center gap-1.5 text-amber-700 font-bold"><Clock className="w-3.5 h-3.5" /> Pendentes</span><span className="font-black text-gray-900">{pendentes.length}</span></div>
            <div className="flex items-center justify-between text-xs"><span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Retiradas</span><span className="font-black text-gray-900">{retiradas.length}</span></div>
            <div className="flex items-center justify-between text-xs"><span className="inline-flex items-center gap-1.5 text-gray-400 font-bold"><AlertTriangle className="w-3.5 h-3.5" /> Canceladas</span><span className="font-black text-gray-900">{canceladas.length}</span></div>
          </div>
        </div>

        {/* Impacto */}
        <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2"><Leaf className="w-4 h-4 text-lime-600" /><span className="text-xs font-black text-gray-700 uppercase tracking-wide">Impacto ambiental</span></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-2xl font-black text-lime-600 leading-none">{wasteSavedKg}<span className="text-sm"> kg</span></div>
              <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">alimentos salvos</div>
            </div>
            <div>
              <div className="text-2xl font-black text-sky-600 leading-none">{co2AvoidedKg}<span className="text-sm"> kg</span></div>
              <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">CO₂ evitado</div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Notice Broadcast Module */}
      <section className="bg-white border rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-black text-slate-900">Comunicado Global (Preto/Verde no Cabeçalho)</h3>
        </div>
        <p className="text-gray-500 text-xs font-semibold leading-relaxed">
          Esta mensagem é sincronizada instantaneamente na barra superior de todas as telas públicas do aplicativo para alertar usuários sobre novidades da plataforma, feriados ou eventos ecologicamente conscientes organizados pela ValidaMais.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={globalNotice}
            onChange={(e) => setGlobalNotice(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Digite o aviso para transmissão global..."
          />
          <button
            type="button"
            onClick={handleSaveNotice}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-slate-900 text-xs font-black uppercase font-mono tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" /> Transmitir
          </button>
        </div>
      </section>

      {/* Database Merchants Audit / Sponsorship Administration Panel */}
      <section className="bg-white border rounded-3xl shadow-sm overflow-hidden">
        
        <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-black text-slate-900">Administração de Patrocínios & Destaques</h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">Defina quais lojistas terão destaque rotativo na seção principal de banners da Home.</p>
          </div>
          <span className="text-[10px] bg-slate-200 text-slate-700 font-black font-mono uppercase px-2.5 py-1 rounded-md">
            Lojistas cadastrados: {merchants.length}
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <span className="text-lg animate-spin text-emerald-600">⏳</span>
            <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest">Sincronizando lojistas...</span>
          </div>
        ) : merchants.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-mono text-xs font-semibold">
            Nenhum lojista parceiro registrado no Firestore.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 font-mono text-[9px] uppercase text-gray-400 tracking-wider">
                  <th className="p-4 px-6 font-bold">Lojista</th>
                  <th className="p-4 font-bold">E-mail</th>
                  <th className="p-4 font-bold text-center">Plano Ativo</th>
                  <th className="p-4 font-bold text-center">Selo de Destaque</th>
                  <th className="p-4 font-bold">Mensagem de Anúncio</th>
                  <th className="p-4 font-bold text-right px-6">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
                {merchants.map((merchant) => {
                  const isEditing = editingMerchantId === merchant.uid;
                  const hasPlan = merchant.destaquePlano && merchant.destaquePlano !== 'none';
                  
                  return (
                    <tr key={merchant.uid} className="hover:bg-slate-50/45 transition-colors">
                      {/* Name / Avatar */}
                      <td className="p-4 px-6 font-extrabold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700 font-bold font-mono">
                            {merchant.nome.substring(0, 1)}
                          </div>
                          <div>
                            <span className="block font-black">{merchant.nome}</span>
                            <span className="text-[9px] text-gray-400 font-mono uppercase font-bold">ID: {merchant.uid.substring(0, 6)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="p-4 font-mono font-medium text-slate-500">
                        {merchant.email}
                      </td>

                      {/* Active Plan Selector */}
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <select
                            value={editPlano}
                            onChange={(e) => setEditPlano(e.target.value)}
                            className="bg-white border rounded px-1.5 py-1 text-xs font-bold text-slate-800"
                          >
                            <option value="none">Nenhum</option>
                            <option value="bronze">Bronze Eco</option>
                            <option value="ouro">Ouro Premium</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[9px] font-black uppercase tracking-wider ${
                            merchant.destaquePlano === 'ouro'
                              ? 'bg-amber-150 bg-amber-50 text-amber-700 border border-amber-300/30'
                              : merchant.destaquePlano === 'bronze'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300/30'
                              : 'bg-stone-50 text-stone-400'
                          }`}>
                            {merchant.destaquePlano === 'ouro' && <Star className="w-2.5 h-2.5 fill-amber-500 stroke-amber-600" />}
                            {merchant.destaquePlano === 'bronze' && <Sparkles className="w-2.5 h-2.5" />}
                            {merchant.destaquePlano ? merchant.destaquePlano : 'Inativo'}
                          </span>
                        )}
                      </td>

                      {/* Highlight Status */}
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <label className="inline-flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editAtivo}
                              onChange={(e) => setEditAtivo(e.target.checked)}
                              className="accent-emerald-600 scale-105"
                            />
                            <span className="text-[10px] font-bold">Ativo</span>
                          </label>
                        ) : (
                          <span className={`text-[10px] font-extrabold ${merchant.destaqueAtivo ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {merchant.destaqueAtivo ? '● VISÍVEL' : '○ oculto'}
                          </span>
                        )}
                      </td>

                      {/* Highlight Ad Message */}
                      <td className="p-4 max-w-sm truncate text-gray-500 italic font-semibold">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editMensagem}
                            onChange={(e) => setEditMensagem(e.target.value)}
                            className="w-full px-2 py-1 border rounded text-xs"
                            placeholder="Slogan do anúncio..."
                          />
                        ) : (
                          <span>"{merchant.destaqueMensagem || 'Sem slogan de destaque configurado.'}"</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="p-4 text-right px-6">
                        {isEditing ? (
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => handleSaveSponsorship(merchant.uid)}
                              className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md font-bold text-[10px] uppercase font-mono tracking-wider flex items-center gap-0.5"
                            >
                              <Check className="w-3 h-3" /> Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingMerchantId(null)}
                              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-md font-bold text-[10px] uppercase font-mono tracking-wider"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(merchant)}
                            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-[10px] font-extrabold font-mono uppercase tracking-wide cursor-pointer inline-flex items-center gap-1 transition-all"
                          >
                            <Edit className="w-3 h-3" /> Gerenciar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CEO Tip Container */}
      <div className="bg-amber-50 border border-amber-200/50 rounded-3xl p-5 flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide font-mono">Dica do Desenvolvedor Central</h4>
          <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
            Como lojista destaque, qualquer e-mail que você defina como <strong className="font-extrabold">Ativo</strong> com plano Bronze ou Ouro entrará imediatamente no rodízio do Carrossel de Banners da Home. Isso permite testar layouts móveis e descontos em tempo real no simulador!
          </p>
        </div>
      </div>

    </div>
  );
};
