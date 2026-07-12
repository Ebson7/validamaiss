/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Produto } from '../types';
import { Calendar, Store, MapPin, AlertCircle, ShoppingCart, Share2, Copy, Check, Heart } from 'lucide-react';

interface ProdutoCardProps {
  produto: Produto;
}

export const ProdutoCard: React.FC<ProdutoCardProps> = ({ produto }) => {
  const { 
    navigateTo, 
    user, 
    avaliacoes, 
    showAlert, 
    isFavoritado, 
    toggleFavorito,
    isLojaFavoritada,
    toggleFavoritoLoja
  } = useApp();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const original = produto.precoOriginal;
  const promo = produto.precoPromocional;
  const discountPercent = original > 0 ? Math.round(((original - promo) / original) * 100) : 0;

  // Construct absolute sharing links using clean URLSearchParams
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?prodId=${produto.id}`
    : `https://validamais.com/produtos?prodId=${produto.id}`;

  const discountFormatted = discountPercent > 0 ? `(${discountPercent}% OFF!)` : '';

  const shareText = `🚨 *Oferta Imperdível no ValidaMais!* 🚨
  
*${produto.nomeProduto}* com preço super reduzido!
💵 De: R$ ${produto.precoOriginal.toFixed(2).replace('.', ',')}
🔥 *Por apenas: R$ ${produto.precoPromocional.toFixed(2).replace('.', ',')}* ${discountFormatted}
🏢 Local de Retirada: *${produto.nomeLoja}*
📍 Endereço: ${produto.endereco}

Não perca essa oportunidade de economizar e evitar o desperdício alimentar! Veja mais detalhes e reserve aqui:
👇👇👇
${shareUrl}`;

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showAlert('Direcionando para o WhatsApp...', 'success');
  };

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showAlert('Direcionando para o Telegram...', 'success');
  };

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback option for sandboxed context environments
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      showAlert('Link de compartilhamento copiado!', 'success');
      setTimeout(() => {
        setIsCopied(false);
        setShowShareMenu(false);
      }, 2000);
    } catch (err) {
      console.error('Falha ao copiar link:', err);
      showAlert('Não foi possível copiar o link automaticamente.', 'error');
    }
  };

  const avaliacoesLoja = (avaliacoes || []).filter(
    a => a.nomeLoja.toLowerCase().trim() === (produto?.nomeLoja || '').toLowerCase().trim()
  );

  const mediaAvaliacao = avaliacoesLoja.length > 0
    ? (avaliacoesLoja.reduce((sum, a) => sum + a.estrelas, 0) / avaliacoesLoja.length).toFixed(1)
    : null;

  // Calculo de validade
  const checkExpiryStatus = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr + 'T00:00:00'); // secure parse relative to local clock timezone
    expiry.setHours(0, 0, 0, 0);

    const timeDiff = expiry.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysLeft < 0) {
      return { label: 'VENCIDO', color: 'bg-rose-100 text-rose-800 border-rose-200', isExpired: true, days: daysLeft };
    } else if (daysLeft === 0) {
      return { label: 'VENCE HOJE', color: 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse', isExpired: false, days: 0 };
    } else if (daysLeft === 1) {
      return { label: 'VENCE AMANHÃ', color: 'bg-amber-100 text-amber-800 border-amber-200', isExpired: false, days: 1 };
    } else if (daysLeft <= 4) {
      return { label: `VENCE EM ${daysLeft} DIAS`, color: 'bg-amber-50 text-amber-700 border-amber-200', isExpired: false, days: daysLeft };
    } else {
      return { label: `${daysLeft} dias de validade`, color: 'bg-emerald-50 text-emerald-800 border-emerald-100', isExpired: false, days: daysLeft };
    }
  };

  const expiry = checkExpiryStatus(produto.dataValidade);
  const totalAvailable = produto.quantidadeDisponivel - produto.quantidadeReservada;
  const isEsgotado = totalAvailable <= 0 || produto.status === 'esgotado';

  // Format price
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Human category translation
  const getCategoryBadgeColor = (cat: string) => {
    const map: Record<string, string> = {
      'Laticínios': 'bg-blue-50 text-blue-800 border-blue-100',
      'Padaria': 'bg-amber-50 text-amber-800 border-amber-100',
      'Hortifrúti': 'bg-emerald-50 text-emerald-800 border-emerald-200',
      'Carnes': 'bg-red-50 text-red-800 border-red-100',
      'Bebidas': 'bg-purple-50 text-purple-800 border-purple-100',
      'Mercearia': 'bg-stone-50 text-stone-800 border-stone-100'
    };
    return map[cat] || 'bg-gray-50 text-gray-800 border-gray-100';
  };

  // Safe image display
  const finalImageUrl = (produto.imagens && produto.imagens.length > 0) 
    ? produto.imagens[0] 
    : (produto.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=400');

  return (
    <div
      id={`produto_card_${produto.id}`}
      className={`glass rounded-3xl border-white/45 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col group ${
        isEsgotado || expiry.isExpired ? 'opacity-85' : ''
      } ${
        !isEsgotado && !expiry.isExpired && expiry.days === 0 ? 'ring-2 ring-rose-500/80 hover:ring-rose-600 bg-rose-50/5/10 bg-red-50/10' : ''
      }`}
    >
      {/* Product Image & Badge */}
      <div className="relative aspect-video w-full bg-gray-50 overflow-hidden">
        <img
          src={finalImageUrl}
          alt={produto.nomeProduto}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Discount Badge */}
        {discountPercent > 0 && !isEsgotado && !expiry.isExpired && (
          <div className="absolute top-3 left-3 bg-rose-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-lg shadow-sm font-mono flex items-center gap-0.5">
            -{discountPercent}%
          </div>
        )}

        {/* Dynamic Expiry Status Badge */}
        <div className={`absolute top-3 right-3 border px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider shadow-xs uppercase font-mono ${expiry.color}`}>
          {expiry.label}
        </div>

        {/* Same-day expiration high urgency banner */}
        {!isEsgotado && !expiry.isExpired && expiry.days === 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase font-mono py-1.5 px-3 flex items-center justify-between shadow-inner animate-pulse">
            <span className="flex items-center gap-1">🚨 Retirada Urgente</span>
            <span>Consumir Hoje!</span>
          </div>
        )}

        {/* Esgotado Overlay */}
        {isEsgotado && (
          <div className="absolute inset-0 bg-black/55 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-rose-600 text-white font-black text-sm tracking-widest px-4 py-2 rounded-xl shadow-md border border-rose-500 uppercase font-mono">
              Esgotado
            </span>
          </div>
        )}

        {/* Expirado Overlay */}
        {!isEsgotado && expiry.isExpired && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-gray-800 text-white font-black text-sm tracking-widest px-4 py-2 rounded-xl shadow-md border border-gray-700 uppercase font-mono">
              Vencido
            </span>
          </div>
        )}
      </div>

      {/* Urgency Counter Banner — between image and card body */}
      {!isEsgotado && !expiry.isExpired && expiry.days <= 3 && (
        <div
          className={`px-4 py-2 text-xs font-black flex items-center justify-center gap-1.5 tracking-wide ${
            expiry.days === 0
              ? 'bg-rose-600 text-white animate-pulse'
              : 'bg-amber-100 text-amber-900'
          }`}
        >
          {expiry.days === 0 && '⚠️ Vence Hoje!'}
          {expiry.days === 1 && '⏰ Vence Amanhã'}
          {expiry.days >= 2 && `🔥 ${expiry.days} dias restantes`}
        </div>
      )}

      {/* Card Contents */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Shop and Category Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2 gap-2">
            <div className="flex flex-col min-w-0">
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavoritoLoja(produto.nomeLoja);
                }}
                className="flex items-center gap-1 font-semibold text-gray-700 truncate cursor-pointer hover:text-rose-600 transition-colors group/store-btn"
                title={isLojaFavoritada(produto.nomeLoja) ? "Remover estabelecimento dos favoritos" : "Favoritar este estabelecimento"}
              >
                <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0 group-hover/store-btn:text-rose-500 transition-colors" />
                <span className="truncate">{produto.nomeLoja}</span>
                <Heart 
                  className={`w-3.5 h-3.5 shrink-0 ml-0.5 transition-all ${
                    isLojaFavoritada(produto.nomeLoja) 
                      ? 'text-rose-500 fill-rose-500 scale-110' 
                      : 'text-gray-300 group-hover/store-btn:text-rose-200'
                  }`} 
                />
              </div>
              {mediaAvaliacao && (
                <div className="flex items-center gap-0.5 text-[10px] text-amber-600 font-bold font-mono mt-0.5">
                  <span>★ {mediaAvaliacao}</span>
                  <span className="text-gray-400 font-normal font-sans">({avaliacoesLoja.length})</span>
                </div>
              )}
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 self-start ${getCategoryBadgeColor(produto.categoria)}`}>
              {produto.categoria}
            </span>
          </div>

          {/* Product Name and Share Popover Trigger Button */}
          <div className="flex items-start justify-between gap-1.5 mt-1 relative">
            <h3 className="font-extrabold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1 text-base leading-tight flex-1">
              {produto.nomeProduto}
            </h3>
            <div className="relative shrink-0 flex items-center gap-1">
              {/* Botão de Favoritos */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (produto.id) {
                    toggleFavorito(produto.id);
                  }
                }}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  produto.id && isFavoritado(produto.id)
                    ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-xs scale-105 hover:bg-rose-100'
                    : 'bg-white/50 border-gray-200/60 text-gray-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-150'
                }`}
                title={produto.id && isFavoritado(produto.id) ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
              >
                <Heart 
                  className={`w-3.5 h-3.5 transition-all ${
                    produto.id && isFavoritado(produto.id) 
                      ? 'text-rose-600 fill-rose-600 scale-110' 
                      : 'text-gray-400'
                  }`} 
                />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShareMenu(!showShareMenu);
                }}
                className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                  showShareMenu
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-white/50 border-gray-200/60 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
                }`}
                title="Compartilhar oferta"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              {showShareMenu && (
                <>
                  <div className="fixed inset-0 z-20 cursor-default" onClick={(e) => { e.stopPropagation(); setShowShareMenu(false); }} />
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-150/70 p-2 z-30 flex flex-col gap-1 text-left">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareWhatsApp();
                        setShowShareMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-emerald-600 shrink-0" viewBox="0 0 24 24">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-1.991-.001-3.952-.493-5.717-1.428L0 24zm6.59-4.846l.385.228a9.92 9.92 0 0 0 5.033 1.378c5.495.003 9.965-4.464 9.969-9.962a9.882 9.882 0 0 0-2.88-7.051C17.27 1.871 14.743.857 12.005.857 6.513.857 2.046 5.328 2.043 10.825c-.001 2.012.523 3.978 1.517 5.714l.244.427-1.02 3.729 3.863-.987z"/>
                      </svg>
                      Enviar no WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareTelegram();
                        setShowShareMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-sky-50 hover:text-sky-700 transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-sky-500 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.52 3.64-.52.36-.97.54-1.34.53-.41-.01-1.21-.23-1.8-.42-.72-.24-1.3-.37-1.25-.79.03-.22.33-.44.9-.68 3.51-1.53 5.85-2.54 7.02-3 .3-.12.58-.18.83-.17.29.01.52.12.63.36.12.25.13.56.08.84zm1.5-1.5c.1.2 0 .4 0 .5s-.1.2-.2.2h-.1l-.1-.1-.1-.1.1-.1s.3-.4-.1-.4h-.1l.1-.1c-.1.1-.1.1-.1.1z"/>
                      </svg>
                      Enviar no Telegram
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-emerald-700">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-gray-500 shrink-0" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Product Description */}
          {produto.descricao && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed min-h-[2rem]">
              {produto.descricao}
            </p>
          )}

          {/* Location Address */}
          <div className="flex items-center gap-1.5 text-gray-400 mt-2.5">
            <MapPin className="w-3 h-3 text-gray-300 shrink-0" />
            <span className="text-[10px] truncate max-w-full font-medium" title={produto.endereco}>
              {produto.endereco}
            </span>
          </div>
        </div>

        {/* Pricing & Reservation Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-mono line-through font-medium">
              {formatCurrency(produto.precoOriginal)}
            </span>
            <span className="text-lg font-black text-emerald-600 leading-tight">
              {formatCurrency(produto.precoPromocional)}
            </span>
          </div>

          <div className="flex flex-col items-end text-right">
            {!isEsgotado && !expiry.isExpired ? (
              <>
                <span
                  className={`text-xs font-bold ${
                    totalAvailable <= 5 ? 'text-rose-600' : 'text-gray-600'
                  }`}
                >
                  {totalAvailable <= 5 && '⚡ '}
                  {totalAvailable} unidades restantes
                </span>
                <button
                  id={`btn_reserva_link_${produto.id}`}
                  onClick={() => navigateTo('produto-detalhe', produto.id)}
                  className="mt-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 font-mono hover:ps-5 transition-all duration-300 ps-4 pe-4 py-1.5 rounded-xl cursor-pointer shadow-xs hover:shadow-md flex items-center gap-1"
                >
                  Reservar
                </button>
              </>
            ) : (
              <>
                <span className="text-[10px] font-semibold font-mono text-gray-400 uppercase">
                  Código de Estoque
                </span>
                <span className="text-[10px] text-gray-400 font-mono mt-2">
                  {ExpiryDaysText(expiry.days, isEsgotado)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function ExpiryDaysText(days: number, isEsgotado: boolean) {
  if (isEsgotado) return "Sem estoque";
  if (days < 0) return "Removido de venda";
  return "Indisponível";
}
