/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Sacola — reserva multi-loja. Junta vários lotes numa só finalização,
 * agrupando por estabelecimento (a retirada é por loja).
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { descontoReservaFrac } from '../../lib/clube';
import { descontoDinamicoFrac, combinarDescontos } from '../../lib/precoDinamico';
import { descontoReativacaoFrac } from '../../lib/reativacao';
import { Produto } from '../../types';
import { ShoppingBag, Trash2, Plus, Minus, Store, MapPin, ArrowRight, ShoppingCart } from 'lucide-react';

export const SacolaValida: React.FC = () => {
  const {
    carrinho, produtos, user, reservas,
    setQuantidadeCarrinho, removerDoCarrinho, limparCarrinho, finalizarCarrinho,
    navigateTo,
  } = useApp();
  const [finalizando, setFinalizando] = useState(false);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Junta item do carrinho com o produto e calcula o preço efetivo cobrado.
  const fracUser = descontoReservaFrac(user);
  const fracReativacao = descontoReativacaoFrac(user, reservas);
  const linhas = carrinho
    .map((it) => {
      const prod = produtos.find((p) => p.id === it.produtoId);
      if (!prod) return null;
      const fracFinal = combinarDescontos(fracUser, descontoDinamicoFrac(prod.dataValidade), fracReativacao);
      const precoUnit = Math.round(prod.precoPromocional * (1 - fracFinal) * 100) / 100;
      return { it, prod, precoUnit, subtotal: precoUnit * it.quantidade };
    })
    .filter(Boolean) as { it: { produtoId: string; quantidade: number }; prod: Produto; precoUnit: number; subtotal: number }[];

  const total = linhas.reduce((s, l) => s + l.subtotal, 0);
  const totalItens = linhas.reduce((s, l) => s + l.it.quantidade, 0);

  // Agrupa por loja
  const porLoja = new Map<string, typeof linhas>();
  linhas.forEach((l) => {
    const key = l.prod.nomeLoja || 'Loja';
    if (!porLoja.has(key)) porLoja.set(key, []);
    porLoja.get(key)!.push(l);
  });

  if (linhas.length === 0) {
    return (
      <div className="max-w-lg mx-auto glass rounded-3xl border-white/50 py-16 text-center p-6 space-y-3">
        <div className="w-14 h-14 bg-white/40 rounded-2xl flex items-center justify-center text-gray-400 mx-auto border border-white/50">
          <ShoppingBag className="w-7 h-7 text-emerald-500" />
        </div>
        <h3 className="text-base font-extrabold text-gray-800 font-mono uppercase">Sua sacola está vazia</h3>
        <p className="text-xs text-gray-500 leading-relaxed font-medium max-w-xs mx-auto">
          Adicione lotes de diferentes lojas e reserve tudo de uma vez. A retirada é feita em cada estabelecimento.
        </p>
        <button
          onClick={() => navigateTo('produtos')}
          className="mt-3 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black cursor-pointer transition-all shadow-sm"
        >
          Explorar lotes <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-600" /> Minha Sacola
          </h1>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">
            {totalItens} {totalItens === 1 ? 'item' : 'itens'} · {porLoja.size} {porLoja.size === 1 ? 'loja' : 'lojas'}
          </p>
        </div>
        <button
          onClick={limparCarrinho}
          className="text-[11px] font-bold text-gray-400 hover:text-rose-600 font-mono uppercase tracking-wide cursor-pointer flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Esvaziar
        </button>
      </div>

      {Array.from(porLoja.entries()).map(([loja, itens]) => {
        const subtotalLoja = itens.reduce((s, l) => s + l.subtotal, 0);
        const endereco = itens[0].prod.endereco;
        return (
          <div key={loja} className="glass rounded-3xl border-white/50 p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
              <div className="min-w-0">
                <h3 className="font-extrabold text-gray-900 flex items-center gap-1.5 text-sm">
                  <Store className="w-4 h-4 text-emerald-600 shrink-0" /> {loja}
                </h3>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{endereco}</span>
                </div>
              </div>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 font-mono">
                Retirada nesta loja
              </span>
            </div>

            {itens.map(({ it, prod, precoUnit, subtotal }) => {
              const disponivel = prod.quantidadeDisponivel - prod.quantidadeReservada;
              const img = (prod.imagens && prod.imagens.length > 0) ? prod.imagens[0]
                : (prod.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=200');
              return (
                <div key={it.produtoId} className="flex items-center gap-3">
                  <img src={img} alt={prod.nomeProduto} referrerPolicy="no-referrer" className="w-14 h-14 rounded-2xl object-cover bg-gray-50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-gray-800 truncate">{prod.nomeProduto}</h4>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-black text-emerald-600">{fmt(precoUnit)}</span>
                      {precoUnit < prod.precoPromocional && (
                        <span className="text-[10px] text-gray-400 line-through font-mono">{fmt(prod.precoPromocional)}</span>
                      )}
                      <span className="text-[10px] text-gray-400 font-mono">/un.</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="inline-flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setQuantidadeCarrinho(it.produtoId, it.quantidade - 1)}
                          className="px-2 py-1 text-gray-500 hover:bg-gray-50 cursor-pointer disabled:opacity-40"
                          disabled={it.quantidade <= 1}
                          aria-label="Diminuir"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-black font-mono text-gray-800 min-w-[2rem] text-center">{it.quantidade}</span>
                        <button
                          onClick={() => setQuantidadeCarrinho(it.produtoId, it.quantidade + 1)}
                          className="px-2 py-1 text-gray-500 hover:bg-gray-50 cursor-pointer disabled:opacity-40"
                          disabled={it.quantidade >= disponivel}
                          aria-label="Aumentar"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removerDoCarrinho(it.produtoId)}
                        className="text-gray-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <span className="text-sm font-black text-gray-900 shrink-0">{fmt(subtotal)}</span>
                </div>
              );
            })}

            <div className="flex justify-between items-center text-xs font-bold text-gray-500 border-t border-gray-100 pt-3">
              <span>Subtotal {loja}</span>
              <span className="text-gray-800 font-black">{fmt(subtotalLoja)}</span>
            </div>
          </div>
        );
      })}

      {/* Resumo e finalização */}
      <div className="glass rounded-3xl border-white/50 p-5 shadow-xs sticky bottom-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-gray-600">Total ({totalItens} {totalItens === 1 ? 'item' : 'itens'})</span>
          <span className="text-xl font-black text-emerald-600">{fmt(total)}</span>
        </div>
        <button
          onClick={async () => { setFinalizando(true); try { await finalizarCarrinho(); } finally { setFinalizando(false); } }}
          disabled={finalizando}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <ShoppingCart className="w-4 h-4" />
          {finalizando ? 'Processando reservas...' : `Reservar tudo · ${fmt(total)}`}
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-2 font-medium leading-relaxed">
          Cada loja gera uma reserva com código de retirada próprio. Descontos de Clube, validade e cupons já aplicados.
        </p>
      </div>
    </div>
  );
};
