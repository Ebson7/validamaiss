/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProdutoCard } from '../ProdutoCard';
import { AdvertiserBanners } from '../AdvertiserBanners';
import {
  Leaf, Sparkles, AlertCircle, ShoppingBag, ChevronRight, ArrowRight,
  MapPin, Clock, Search, ShoppingCart, Store, Ticket
} from 'lucide-react';

export const HomeValida: React.FC = () => {
  const { navigateTo, user, produtos, produtosLoading: loading, seedProducts } = useApp();
  const [seeding, setSeeding] = useState(false);

  const highlights = [...produtos]
    .filter(p => p.status === 'disponivel')
    .sort((a, b) => new Date(a.dataValidade).getTime() - new Date(b.dataValidade).getTime())
    .slice(0, 3);

  const dbEmpty = produtos.length === 0;

  const handleCreateMockData = async () => {
    setSeeding(true);
    try {
      await seedProducts();
    } catch (err) {
      console.error(err);
    } finally {
      setSeeding(false);
    }
  };

  const steps = [
    { icon: <Search className="w-5 h-5" />, title: 'Encontre perto de você', desc: 'Descubra lotes com até 70% de desconto em mercados próximos.' },
    { icon: <ShoppingCart className="w-5 h-5" />, title: 'Reserve online', desc: 'Garanta seu item sem pagar antecipado — leva segundos.' },
    { icon: <Ticket className="w-5 h-5" />, title: 'Retire e pague na loja', desc: 'Apresente seu código de retirada no balcão e finalize por lá.' },
  ];

  return (
    <div id="home_screen" className="space-y-10">
      {/* ─────────── Hero ─────────── */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-white shadow-2xl shadow-emerald-900/15">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-16 w-72 h-72 bg-lime-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10 grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center p-8 sm:p-12">
          {/* Left */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border border-white/20">
              <Leaf className="w-3.5 h-3.5 text-lime-300" /> Combata o desperdício
            </div>
            <h1 className="text-3xl sm:text-5xl font-black leading-[1.05] tracking-tight">
              Salve alimentos,<br />
              <span className="text-lime-300">pague muito menos.</span>
            </h1>
            <p className="text-sm sm:text-base text-emerald-50/85 leading-relaxed max-w-md font-medium">
              Reserve lotes de mercados locais com <strong className="text-white">até 70% de desconto</strong> antes do vencimento. Retire na loja e pague no balcão.
            </p>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={() => navigateTo('produtos')}
                className="group inline-flex items-center gap-2 px-6 py-3.5 bg-white text-emerald-800 text-sm font-black rounded-full shadow-lg hover:shadow-xl cursor-pointer transition-all active:scale-[0.98]"
              >
                Ver ofertas
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              {!user ? (
                <button
                  onClick={() => navigateTo('cadastro')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 border-2 border-white/25 hover:border-white/50 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-full cursor-pointer transition-all"
                >
                  Criar conta grátis
                </button>
              ) : user.role === 'lojista' ? (
                <button
                  onClick={() => navigateTo('admin-produtos')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 border-2 border-white/25 hover:border-white/50 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-full cursor-pointer transition-all"
                >
                  Gerenciar meus lotes
                </button>
              ) : (
                <button
                  onClick={() => navigateTo('minhas-reservas')}
                  className="inline-flex items-center gap-2 px-6 py-3.5 border-2 border-white/25 hover:border-white/50 bg-white/5 hover:bg-white/10 text-white text-sm font-bold rounded-full cursor-pointer transition-all"
                >
                  Minhas reservas
                </button>
              )}
            </div>

            <div className="flex items-center gap-6 pt-3">
              <div>
                <div className="text-2xl font-black text-white leading-none">70%</div>
                <div className="text-[11px] font-semibold text-emerald-100/70 mt-1">de desconto médio</div>
              </div>
              <div className="w-px h-9 bg-white/15" />
              <div>
                <div className="text-2xl font-black text-white leading-none">R$ 0</div>
                <div className="text-[11px] font-semibold text-emerald-100/70 mt-1">para reservar</div>
              </div>
            </div>
          </div>

          {/* Right — floating "sacola surpresa" card */}
          <div className="hidden lg:flex justify-center">
            <div className="bg-white rounded-3xl p-4 shadow-2xl shadow-emerald-950/30 w-72 rotate-[-2deg] hover:rotate-0 transition-transform duration-300">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-amber-100 to-emerald-100 flex items-center justify-center text-5xl mb-3">🥐</div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black text-gray-900 truncate">Padaria Delícia</span>
                <span className="text-[10px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded-full shrink-0">-65%</span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-semibold">
                <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" /> 1,2 km</span>
                <span className="inline-flex items-center gap-0.5"><Clock className="w-3 h-3" /> retire até 19h</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1.5">
                <span className="text-xl font-black text-emerald-600 leading-none">R$ 9,90</span>
                <span className="text-xs text-gray-400 line-through font-semibold">R$ 28,00</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seed box (catálogo vazio) */}
      {dbEmpty && (
        <section id="empty_db_seed_section" className="bg-amber-50/50 border border-amber-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h3 className="text-base font-black text-amber-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Catálogo vazio
            </h3>
            <p className="text-xs text-amber-800 font-medium leading-relaxed max-w-xl">
              Gere uma <strong>massa de dados de teste</strong> com 6 produtos predefinidos para explorar a plataforma.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateMockData}
            disabled={seeding}
            className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs tracking-wide uppercase rounded-full shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all disabled:opacity-50"
          >
            {seeding ? 'Gerando...' : 'Carregar produtos de teste'}
          </button>
        </section>
      )}

      {/* Banners de patrocinadores */}
      <AdvertiserBanners />

      {/* Como funciona */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">{s.icon}</div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-emerald-500 font-mono">{i + 1}</span>
                <h3 className="text-sm font-black text-gray-900">{s.title}</h3>
              </div>
              <p className="text-xs text-gray-500 font-medium leading-relaxed mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Destaques — urgência */}
      <section className="space-y-5">
        <div className="flex justify-between items-end gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Vence primeiro 🔥</h2>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">Lotes com validade mais curta — aproveite antes que esgotem.</p>
          </div>
          <button
            onClick={() => navigateTo('produtos')}
            className="text-xs font-black text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1"
          >
            Ver tudo <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-gray-100 rounded-2xl h-80 border border-gray-100" />
            ))}
          </div>
        ) : highlights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((prod) => (
              <ProdutoCard key={prod.id} produto={prod} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-3xl bg-gray-50/50">
            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <h4 className="text-sm font-black text-gray-800">Vitrine vazia no momento</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1">Ainda não há lotes promocionais cadastrados.</p>
            <button onClick={() => navigateTo('produtos')} className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-emerald-700 cursor-pointer mt-3">
              Explorar o catálogo <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Faixa final — CTA lojista/consumidor */}
      <section className="rounded-3xl bg-emerald-50/60 border border-emerald-100 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900">Tem um mercado?</h3>
            <p className="text-xs text-gray-500 font-medium">Venda seus lotes próximos do vencimento e reduza perdas.</p>
          </div>
        </div>
        <button
          onClick={() => navigateTo(user?.role === 'lojista' ? 'admin-produtos' : 'cadastro')}
          className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-full cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <ShoppingBag className="w-4 h-4" /> Anunciar minha loja
        </button>
      </section>
    </div>
  );
};
