/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Produto } from '../../types';
import { FiltrosProdutos } from '../FiltrosProdutos';
import { ProdutoCard } from '../ProdutoCard';
import { AlertCircle, SlidersHorizontal, Loader2, Heart, Search, MapPin, Radio, Bell, BellRing, Trash2, Zap } from 'lucide-react';

export const ProdutosValida: React.FC = () => {
  const { 
    produtos, 
    categorias, 
    produtosLoading: loading, 
    user, 
    isFavoritado, 
    favoritosLojas, 
    toggleFavoritoLoja, 
    avaliacoes 
  } = useApp();

  // States of the filters
  const [searchQuery, setSearchQuery] = useState('');
  const [cepQuery, setCepQuery] = useState('');
  const [cepResolvedRegion, setCepResolvedRegion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedStore, setSelectedStore] = useState('');
  const [sortBy, setSortBy] = useState('URGENTE_PRIMEIRO');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [favoritesActiveTab, setFavoritesActiveTab] = useState<'ITEMS' | 'STORES'>('ITEMS');

  // Radar CEP states
  const [activeRadars, setActiveRadars] = useState<{cep: string; region: string}[]>(() => {
    try {
      const saved = localStorage.getItem('validamais_cep_radars');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const toggleRadar = (cep: string, region: string) => {
    let updated;
    const exists = activeRadars.some(r => r.cep === cep);
    if (exists) {
      updated = activeRadars.filter(r => r.cep !== cep);
    } else {
      updated = [...activeRadars, { cep, region }];
    }
    setActiveRadars(updated);
    try {
      localStorage.setItem('validamais_cep_radars', JSON.stringify(updated));
    } catch (e) {}
  };

  // Derive unique categories and stores for filter dropdowns
  const availableCategories = Array.from(new Set(produtos.map(p => p.categoria))).filter(Boolean);
  const availableStores = Array.from(new Set(produtos.map(p => p.nomeLoja))).filter(Boolean);

  // Filter application pipeline
  const filteredProducts = produtos.filter((product) => {
    // 1. Search filter (text search)
    if (searchQuery) {
      const matchText = searchQuery.toLowerCase();
      const nameMatch = product.nomeProduto.toLowerCase().includes(matchText);
      const descMatch = product.descricao?.toLowerCase().includes(matchText) || false;
      const catMatch = product.categoria.toLowerCase().includes(matchText);
      if (!nameMatch && !descMatch && !catMatch) return false;
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

  const getProductsForStore = (storeName: string) => {
    return produtos.filter(p => p.nomeLoja.toLowerCase() === storeName.toLowerCase());
  };

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
            onClick={() => {
              const newVal = !showOnlyFavorites;
              setShowOnlyFavorites(newVal);
              if (!newVal) {
                setFavoritesActiveTab('ITEMS');
              }
            }}
            className={`self-start md:self-center px-4.5 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
              showOnlyFavorites
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                : 'bg-white border-gray-200/65 text-gray-500 hover:bg-rose-50 hover:border-rose-150 hover:text-rose-605'
            }`}
          >
            <Heart className={`w-4 h-4 transition-transform ${showOnlyFavorites ? 'text-rose-600 fill-rose-600 scale-110' : 'text-gray-400'}`} />
            {showOnlyFavorites ? 'Mostrar Todos os Lotes' : 'Ver Meus Favoritos'}
          </button>
        )}
      </div>

      {/* Sub-tab selection bar when showOnlyFavorites is true */}
      {showOnlyFavorites && (
        <div id="favorites_tabs_row" className="flex border-b border-gray-200 gap-6 mt-2">
          <button
            type="button"
            onClick={() => setFavoritesActiveTab('ITEMS')}
            className={`pb-3.5 text-xs font-black transition-all relative uppercase font-mono cursor-pointer flex items-center gap-1.5 ${
              favoritesActiveTab === 'ITEMS' ? 'text-rose-600 font-extrabold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Itens Favoritos ({sortedProducts.length})
            {favoritesActiveTab === 'ITEMS' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setFavoritesActiveTab('STORES')}
            className={`pb-3.5 text-xs font-black transition-all relative uppercase font-mono cursor-pointer flex items-center gap-1.5 ${
              favoritesActiveTab === 'STORES' ? 'text-rose-600 font-extrabold' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Lojas Favoritas ({favoritosLojas.length})
            {favoritesActiveTab === 'STORES' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500 rounded-full" />
            )}
          </button>
        </div>
      )}

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
        categories={categorias.length > 0 ? categorias.map(c => c.nome) : ['Laticínios', 'Padaria', 'Hortifrúti', 'Carnes', 'Bebidas', 'Mercearia']}
        stores={availableStores}
      />

      {/* Radar de Lotes por CEP Inteligente */}
      <div id="cep_radar_control_panel" className="space-y-4">
        {/* Quick activate radar if CEP is query-resolved but not yet registered */}
        {cepResolvedRegion && !activeRadars.some(r => r.cep === cepQuery) && (
          <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-300/40 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in shadow-3xs">
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 mt-0.5">
                <BellRing className="w-5 h-5 text-emerald-600 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Quer receber alertas para esta região?</h4>
                <p className="text-[11px] text-slate-500 font-semibold leading-normal mt-0.5">
                  Ative o radar automático de novos lotes para o CEP <strong>{cepQuery}</strong> ({cepResolvedRegion}).
                </p>
              </div>
            </div>
            <button
              onClick={() => toggleRadar(cepQuery, cepResolvedRegion)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Ativar Alerta Radar 📡
            </button>
          </div>
        )}

        {/* List of registered radars */}
        {activeRadars.length > 0 && (
          <div className="glass rounded-3xl border-emerald-100/60 p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-xs font-black text-slate-900 uppercase font-mono tracking-widest flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                Seus Radares de CEP Ativos ({activeRadars.length})
              </h3>
              <span className="flex items-center gap-1 text-[9px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-black uppercase">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                Radar Operando
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {activeRadars.map((radar) => {
                // Count products matching this region
                const matchCount = produtos.filter(p => {
                  const matchRegion = radar.region.toLowerCase().trim();
                  const addressMatch = p.endereco?.toLowerCase().includes(matchRegion);
                  const storeNameMatch = p.nomeLoja?.toLowerCase().includes(matchRegion);
                  return addressMatch || storeNameMatch;
                }).length;

                return (
                  <div key={radar.cep} className="bg-emerald-50/20 hover:bg-emerald-50/45 border border-emerald-100/50 rounded-2xl p-3.5 flex items-center justify-between gap-4 transition-all group">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-800 font-mono">{radar.cep}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-mono font-bold px-1.5 py-0.5 rounded-md truncate max-w-[120px]">{radar.region}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {matchCount > 0 ? (
                          <span className="text-emerald-700 font-semibold cursor-pointer hover:underline" onClick={() => {
                            setCepQuery(radar.cep);
                            setCepResolvedRegion(radar.region);
                          }}>
                            🎯 {matchCount} lotes disponíveis hoje!
                          </span>
                        ) : (
                          'Buscando lotes no CEP...'
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleRadar(radar.cep, radar.region)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Remover alerta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold italic flex items-center gap-1 pt-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Simulando atualizações em tempo real. Novos lotes postados nesses CEPs acionarão notificações automáticas na sua barra de navegação!
            </p>
          </div>
        )}
      </div>

      {/* Catalog Render Panel */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
          <span className="text-sm font-semibold text-gray-500 font-mono">Processando estoque...</span>
        </div>
      ) : showOnlyFavorites && favoritesActiveTab === 'STORES' ? (
        // RENDER LOJAS FAVORITAS
        favoritosLojas.length > 0 ? (
          <div id="favorites_stores_grid" className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {favoritosLojas.map((favStore) => {
              const activeLots = getProductsForStore(favStore.nomeLoja);
              const storeAddress = activeLots[0]?.endereco || 'Endereço indisponível';
              
              // Get store review ratings
              const avaliacoesLoja = (avaliacoes || []).filter(
                a => a.nomeLoja.toLowerCase().trim() === favStore.nomeLoja.toLowerCase().trim()
              );
              const mediaAvaliacao = avaliacoesLoja.length > 0
                ? (avaliacoesLoja.reduce((sum, a) => sum + a.estrelas, 0) / avaliacoesLoja.length).toFixed(1)
                : null;

              return (
                <div
                  key={favStore.id || favStore.nomeLoja}
                  className="glass rounded-3xl border-white/50 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-mono text-base font-black uppercase text-center shadow-3xs">
                          {favStore.nomeLoja.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-gray-900 group-hover:text-emerald-700 transition-colors text-base">
                            {favStore.nomeLoja}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                            {mediaAvaliacao ? (
                              <span className="text-amber-600 font-bold font-mono">★ {mediaAvaliacao} ({avaliacoesLoja.length} avaliações)</span>
                            ) : (
                              <span className="text-gray-400 font-mono">Novo parceiro</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => toggleFavoritoLoja(favStore.nomeLoja)}
                        className="p-2 rounded-2xl border bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer shadow-3xs"
                        title="Remover das Lojas Favoritas"
                      >
                        <Heart className="w-4 h-4 fill-current animate-pulse-once" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-300" />
                      <span className="truncate max-w-xs">{storeAddress}</span>
                    </div>

                    <div className="text-xs text-gray-500 font-semibold font-mono bg-emerald-50/50 rounded-xl px-3 py-2 border border-emerald-100/30">
                      {activeLots.length > 0 ? (
                        <span className="text-emerald-700">{activeLots.length} lotes promocionais ativos de alimentos</span>
                      ) : (
                        <span className="text-gray-400">Sem lotes promocionais cadastrados no momento</span>
                      )}
                    </div>
                  </div>

                  {activeLots.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStore(favStore.nomeLoja);
                        setShowOnlyFavorites(false);
                      }}
                      className="w-full mt-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 font-mono uppercase tracking-wider text-center cursor-pointer shadow-2xs hover:shadow-md transition-all"
                    >
                      Ver Lotes Deste Estabelecimento
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass rounded-3xl border-white/50 py-16 text-center max-w-lg mx-auto p-6 space-y-3">
            <div className="w-12 h-12 bg-white/40 rounded-2xl flex items-center justify-center text-gray-400 mx-auto border border-white/50">
              <Heart className="w-6 h-6 text-rose-450 text-rose-400" />
            </div>
            <h3 className="text-base font-extrabold text-gray-800 font-mono uppercase">Nenhum estabelecimento favoritado ainda</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              Favorite estabelecimentos/lojas parceiras clicando no ícone de coração ao lado de seu identificador em qualquer produto catalogado das lojas.
            </p>
            <button
              onClick={() => setShowOnlyFavorites(false)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 font-mono uppercase tracking-wider cursor-pointer mt-3"
            >
              Navegar no Catálogo de Lotes
            </button>
          </div>
        )
      ) : showOnlyFavorites && favoritesActiveTab === 'ITEMS' && sortedProducts.length === 0 ? (
        <div className="glass rounded-3xl border-white/50 py-16 text-center max-w-lg mx-auto p-6 space-y-3">
          <div className="w-12 h-12 bg-white/40 rounded-2xl flex items-center justify-center text-gray-400 mx-auto border border-white/50">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500 animate-pulse" />
          </div>
          <h3 className="text-base font-extrabold text-gray-800 font-mono uppercase">Nenhum lote favoritado ainda</h3>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Você não salvou nenhum lote de alimento promocional ainda. Clique no ícone de coração nos produtos catalogados para guardá-los nesta seção para acompanhamento rápido.
          </p>
          <button
            onClick={() => setShowOnlyFavorites(false)}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 font-mono uppercase tracking-wider cursor-pointer mt-3"
          >
            Navegar no Catálogo
          </button>
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
