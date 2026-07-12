/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Produto } from '../../types';
import { FiltrosProdutos } from '../FiltrosProdutos';
import { ProdutoCard } from '../ProdutoCard';
import { AlertCircle, SlidersHorizontal, Loader2, Heart, Search } from 'lucide-react';

export const ProdutosValida: React.FC = () => {
  const { produtos, categorias, produtosLoading: loading, user, isFavoritado } = useApp();

  // States of the filters
  const [searchQuery, setSearchQuery] = useState('');
  const [cepQuery, setCepQuery] = useState('');
  const [cepResolvedRegion, setCepResolvedRegion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedStore, setSelectedStore] = useState('');
  const [sortBy, setSortBy] = useState('URGENTE_PRIMEIRO');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const availableStores = Array.from(new Set(produtos.map(p => p.nomeLoja))).filter(Boolean);

  // Stable category list for the filter chips.
  //
  // The chips were "flickering" (appearing/disappearing) because they were fed
  // directly from `categorias`, whose Firestore-backed value can momentarily
  // shrink/change. We instead build an order-stable UNION of:
  //   1. the standard categories (always present, so the list never collapses),
  //   2. categories that the currently loaded products actually use,
  //   3. any admin-registered categories from Firestore.
  // Because the resulting set of names is stable and keyed by name in the UI,
  // React reconciles identical chips with no visual flicker even if `categorias`
  // churns underneath.
  const STANDARD_CATEGORIES = ['Laticínios', 'Padaria', 'Hortifrúti', 'Carnes', 'Bebidas', 'Mercearia'];
  const filterCategories = useMemo(() => {
    const names = new Set<string>();
    STANDARD_CATEGORIES.forEach((n) => names.add(n));
    produtos.forEach((p) => { if (p.categoria) names.add(p.categoria.trim()); });
    categorias.forEach((c) => { if (c.nome) names.add(c.nome.trim()); });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [produtos, categorias]);

  // Filter application pipeline
  const filteredProducts = produtos.filter((product) => {
    // 0. Only show available products
    if (product.status !== 'disponivel') return false;

    // 1. Search filter — matches product name, store name, description or category
    if (searchQuery) {
      const matchText = searchQuery.toLowerCase();
      const nameMatch = product.nomeProduto.toLowerCase().includes(matchText);
      const storeMatch = product.nomeLoja.toLowerCase().includes(matchText);
      const descMatch = product.descricao?.toLowerCase().includes(matchText) || false;
      const catMatch = product.categoria.toLowerCase().includes(matchText);
      if (!nameMatch && !storeMatch && !descMatch && !catMatch) return false;
    }

    // 2. Category filter
    if (selectedCategory !== 'Todos' && product.categoria !== selectedCategory) {
      return false;
    }

    // 3. Store filter
    if (selectedStore && product.nomeLoja !== selectedStore) {
      return false;
    }

    // 4. CEP filter (match resolved region in product address or store name)
    if (cepResolvedRegion) {
      const matchRegion = cepResolvedRegion.toLowerCase().trim();
      const addressMatch = product.endereco?.toLowerCase().includes(matchRegion);
      const storeNameMatch = product.nomeLoja?.toLowerCase().includes(matchRegion);
      if (!addressMatch && !storeNameMatch) return false;
    }

    // 5. Favorites filter
    if (showOnlyFavorites) {
      if (!product.id || !isFavoritado(product.id)) return false;
    }

    return true;
  });

  // Sort order application pipeline
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'URGENTE_PRIMEIRO') {
      return new Date(a.dataValidade).getTime() - new Date(b.dataValidade).getTime();
    }
    if (sortBy === 'MENOR_PRECO') {
      return a.precoPromocional - b.precoPromocional;
    }
    if (sortBy === 'MAIOR_PRECO') {
      return b.precoPromocional - a.precoPromocional;
    }
    if (sortBy === 'MAIOR_DESCONTO') {
      const discountA = a.precoOriginal > 0 ? (a.precoOriginal - a.precoPromocional) / a.precoOriginal : 0;
      const discountB = b.precoOriginal > 0 ? (b.precoOriginal - b.precoPromocional) / b.precoOriginal : 0;
      return discountB - discountA;
    }
    return 0;
  });

  return (
    <div id="produtos_catalog_screen" className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 leading-tight">Lotes Promocionais Próximos da Validade</h1>
          <p className="text-xs text-gray-500 font-semibold mt-1">Navegue, selecione as quantidades que precisa, reserve e retire pessoalmente</p>
        </div>
        {user && user.role === 'user' && (
          <button
            id="toggle_favorites_only_btn"
            onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
            className={`self-start md:self-center px-4.5 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
              showOnlyFavorites
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                : 'bg-white border-gray-200/65 text-gray-500 hover:bg-rose-50 hover:border-rose-150 hover:text-rose-605'
            }`}
          >
            <Heart className={`w-4 h-4 ${showOnlyFavorites ? 'fill-current' : ''}`} />
            {showOnlyFavorites ? 'Mostrar Todos os Lotes' : 'Ver Meus Favoritos'}
          </button>
        )}
      </div>

      {/* Prominent Discovery Search Bar */}
      <div className="bg-emerald-50/45 border border-emerald-100 rounded-3xl p-5 md:p-6 shadow-3xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:max-w-xl relative">
          <label htmlFor="catalog_discovery_search" className="sr-only">Buscar por lote ou seção</label>
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-emerald-600" />
          <input
            id="catalog_discovery_search"
            type="text"
            placeholder="O que você procura hoje? (Ex: Leite, Iogurte, Bolo, Carnes, Padaria...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm font-semibold ps-12 pr-12 py-3 border border-emerald-200 bg-white focus:bg-white rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-gray-400 text-gray-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-3.5 text-[10px] font-mono font-bold text-gray-400 hover:text-emerald-600 uppercase tracking-widest cursor-pointer transition-colors"
              title="Limpar busca"
            >
              Limpar
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap text-left w-full md:w-auto">
          <span className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider block shrink-0">Populares:</span>
          {['Leite', 'Iogurte', 'Bolo', 'Carnes', 'Padaria'].map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => setSearchQuery(sug)}
              className={`px-3.5 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                searchQuery.toLowerCase() === sug.toLowerCase()
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-3xs'
                  : 'bg-white hover:bg-emerald-50/60 border-gray-200/60 hover:border-emerald-200 text-gray-600 hover:text-emerald-700'
              }`}
            >
              {sug}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Filters Grid Utility */}
      <FiltrosProdutos
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        cepQuery={cepQuery}
        setCepQuery={setCepQuery}
        cepResolvedRegion={cepResolvedRegion}
        setCepResolvedRegion={setCepResolvedRegion}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedStore={selectedStore}
        setSelectedStore={setSelectedStore}
        sortBy={sortBy}
        setSortBy={setSortBy}
        categories={filterCategories}
        stores={availableStores}
      />

      {/* Catalog Render Panel */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-sm font-semibold text-gray-500 font-mono">Processando estoque...</span>
        </div>
      ) : sortedProducts.length > 0 ? (
        <div id="products_grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProducts.map((p) => (
            <ProdutoCard key={p.id} produto={p} />
          ))}
        </div>
      ) : (
        <div className="glass rounded-3xl border-white/50 py-16 text-center max-w-lg mx-auto p-6 space-y-3">
          <div className="w-12 h-12 bg-white/40 rounded-2xl flex items-center justify-center text-gray-400 mx-auto border border-white/50">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-gray-800">Nenhum lote corresponde aos filtros</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Experimente alterar as palavras de busca, escolher outra categoria ou desmarcar o filtro de estabelecimentos para encontrar novas oportunidades de economia.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Todos');
              setSelectedStore('');
              setSortBy('URGENTE_PRIMEIRO');
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 font-mono uppercase tracking-wider cursor-pointer mt-3"
          >
            Limpar Filtros de Busca
          </button>
        </div>
      )}
    </div>
  );
};
