/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Store, Calendar, MapPin, DollarSign, Plus, Minus, CreditCard, ShieldCheck, ShoppingCart, Loader2, Info, Star, Copy, Check, Share2, Heart, Utensils, Flame, ChefHat, Clock, Sparkles } from 'lucide-react';

interface Receita {
  titulo: string;
  tempo: string;
  dificuldade: string;
  ingredientes: string[];
  passos: string[];
  dicaEco: string;
}

const receitasPorCategoria: Record<string, Receita[]> = {
  'Laticínios': [
    {
      titulo: 'Panqueca fofinha de Iogurte 🥞',
      tempo: '15 min',
      dificuldade: 'Fácil',
      ingredientes: ['200g de Iogurte (próximo do vencimento)', '1 ovo inteiro', '1 xícara de farinha de trigo', '1 colher de chá de fermento em pó', 'Mel ou geleia para servir'],
      passos: [
        'Em uma tigela, bata levemente o ovo e adicione todo o iogurte.',
        'Peneire a farinha e o fermento por cima e misture até formar uma massa homogênea.',
        'Aqueça uma frigideira antiaderente untada com um pouco de manteiga.',
        'Coloque pequenas conchas de massa e cozinhe em fogo baixo até dourar os dois lados.'
      ],
      dicaEco: 'O iogurte ligeiramente azedinho confere uma acidez perfeita que faz a massa crescer super macia e aerada!'
    },
    {
      titulo: 'Molho de Queijo Cremoso Express 🧀',
      tempo: '10 min',
      dificuldade: 'Fácil',
      ingredientes: ['150g de requijão, queijo prato ou mussarela ralada', '1/2 xícara de leite', '1 dente de alho amassado', 'Sal e noz-moscada a gosto'],
      passos: [
        'Em fogo baixo, doure o alho amassado com um pingo de azeite.',
        'Adicione o leite e os queijos picados ou ralados.',
        'Mexa constantemente até dissolver por completo e encorpar.',
        'Tempere com uma pitada de noz-moscada fresca.'
      ],
      dicaEco: 'Ralar sobras de queijos que endureceram na geladeira é a melhor forma de reidratá-los e criar um molho super aveludado.'
    }
  ],
  'Padaria': [
    {
      titulo: 'Pudim de Pão Cremoso de Padaria 🍮',
      tempo: '45 min',
      dificuldade: 'Médio',
      ingredientes: ['3 pães amanhecidos (duros)', '3 ovos inteiros', '2 xícaras de leite', '1 xícara de açúcar', '1 colher de canela em pó'],
      passos: [
        'Corte os pães amanhecidos em pedaços pequenos e cubra com o leite para amolecer por 10 min.',
        'No liquidificador, bata o açúcar, os ovos, a canela e os pães embebidos.',
        'Faça uma calda caramelizada em uma forma de pudim.',
        'Despeje a massa e asse em banho-maria em forno médio por cerca de 35 a 40 minutos.'
      ],
      dicaEco: 'Evite jogar pão amanhecido no lixo! O amido concentrado do pão velho cria uma textura ultra cremosa sem precisar de amido de milho.'
    },
    {
      titulo: 'Croutons Crocantes com Ervas Finas 🍞',
      tempo: '12 min',
      dificuldade: 'Fácil',
      ingredientes: ['Pão francês ou de forma cortado em cubos', '2 colheres de azeite de oliva', 'Orégano, alecrim e alho em pó', 'Sal marinho a gosto'],
      passos: [
        'Corte o pão em cubos uniformes.',
        'Em uma assadeira, misture os cubos com azeite e todos os temperos selecionados.',
        'Leve ao forno preaquecido a 180°C ou airfryer por 8 a 10 minutos, mexendo na metade do tempo.',
        'Deixe esfriar e guarde em pote hermético para saladas e sopas!'
      ],
      dicaEco: 'Dura até 15 dias em pote bem fechado, estendendo a vida útil daquele pão esquecido!'
    }
  ],
  'Hortifrúti': [
    {
      titulo: 'Geleia Brilhante de Frutas Maduras 🍓',
      tempo: '20 min',
      dificuldade: 'Fácil',
      ingredientes: ['400g de frutas maduras picadas (morangos, bananas, maçãs)', '1/2 xícara de açúcar', 'Suco de 1/2 limão espremido'],
      passos: [
        'Coloque as frutas picadas em uma panela com o açúcar e o suco do limão.',
        'Cozinhe em fogo baixo, mexendo de vez em quando para não queimar o fundo.',
        'Deixe ferver até que as frutas se desfaçam e atinjam o ponto de calda grossa.',
        'Transfira quente para um pote esterilizado e feche bem.'
      ],
      dicaEco: 'O limão ativa a pectina natural das frutas maduras ajudando a geleia a gelatinizar sem conservantes artificiais.'
    }
  ],
  'Carnes': [
    {
      titulo: 'Arroz de Carreteiro de Panela Única 🥩',
      tempo: '25 min',
      dificuldade: 'Médio',
      ingredientes: ['200g de sobras ou carnes próximas da validade picadas', '1 xícara de arroz cru', '1 cebola e 2 dentes de alho picadinhos', 'Salsinha e cebolinha frescas'],
      passos: [
        'Em uma panela funda, doure muito bem as carnes cortadas em cubos pequenos.',
        'Adicione a cebola e o alho picados e refogue até murcharem.',
        'Junte o arroz e refogue por 1 minuto.',
        'Cubra com 2 xícaras de água quente, acerte o sal e cozinhe em fogo baixo até secar a água.'
      ],
      dicaEco: 'Cozinhar tudo na mesma panela economiza gás, água de lavagem de louça e retém todos os sucos saborosos da carne!'
    }
  ],
  'Bebidas': [
    {
      titulo: 'Smoothie Cremoso de Salvação Alimentar 🥤',
      tempo: '5 min',
      dificuldade: 'Super Fácil',
      ingredientes: ['1 copo de leite ou iogurte', '1 banana bem madura (pode estar congelada)', 'Pedras de gelo', 'Mel ou calda opcional'],
      passos: [
        'Bata todos os ingredientes no liquidificador até obter uma consistência aveludada.',
        'Adicione uma pitada de canela ou cacau para dar um toque especial.'
      ],
      dicaEco: 'Bananas que começaram a ficar com a casca preta estão no ápice de sua doçura, ideais para bater sem precisar adoçar artificialmente!'
    }
  ],
  'Mercearia': [
    {
      titulo: 'Bolinho Dourado de Arroz Sobrado 🍘',
      tempo: '15 min',
      dificuldade: 'Fácil',
      ingredientes: ['2 xícaras de arroz cozido amanhecido', '1 ovo batido', '2 colheres de cheiro-verde', '3 colheres de farinha de trigo', 'Queijo ralado a gosto'],
      passos: [
        'Misture o arroz cozido com o ovo batido, o cheiro-verde e o queijo ralado.',
        'Vá adicionando a farinha aos poucos até conseguir dar liga na massa.',
        'Modele os bolinhos com duas colheres ou com as mãos untadas.',
        'Frite em óleo quente ou asse na Airfryer a 200°C por 12 minutos até dourar.'
      ],
      dicaEco: 'A farinha de trigo serve para dar liga, mas se a massa estiver muito seca, você pode adicionar uma colherada de requijão ou leite para hidratar!'
    }
  ]
};

const receitasFallback: Receita[] = [
  {
    titulo: 'Farofa Rica do Chefe Contra o Desperdício 🥘',
    tempo: '15 min',
    dificuldade: 'Fácil',
    ingredientes: ['1 xícara de farinha de mandioca ou milho', '1/2 cebola picada', 'Sobras picadinhas (talos de folhas, tomate, frios ou carnes)', '1 colher de manteiga ou azeite'],
    passos: [
      'Aqueça a manteiga em uma frigideira grande e doure a cebola.',
      'Refogue todas as sobras picadinhas que você tiver na geladeira por 3 minutos.',
      'Adicione a farinha aos poucos, mexendo sem parar até torrar e ficar crocante.',
      'Finalize com sal, pimenta e cheiro-verde picadinho.'
    ],
    dicaEco: 'Folhas e talos de brócolis, beterraba ou couve-flor picados bem finos ficam deliciosos e adicionam fibras, vitaminas e ferro à sua farofa!'
  }
];

export const ProdutoDetalheValida: React.FC = () => {
  const { 
    selectedProductId, 
    navigateTo, 
    user, 
    showAlert, 
    produtos, 
    produtosLoading: loading, 
    createReservation, 
    avaliacoes, 
    isFavoritado, 
    toggleFavorito,
    isLojaFavoritada,
    toggleFavoritoLoja
  } = useApp();
  const [quantidade, setQuantidade] = useState(1);
  const [reserving, setReserving] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  const produto = produtos.find(p => p.id === selectedProductId) || null;

  const avaliacoesLoja = avaliacoes.filter(
    a => a.nomeLoja.toLowerCase().trim() === (produto?.nomeLoja || '').toLowerCase().trim()
  );

  const mediaAvaliacao = avaliacoesLoja.length > 0
    ? (avaliacoesLoja.reduce((sum, a) => sum + a.estrelas, 0) / avaliacoesLoja.length).toFixed(1)
    : null;

  useEffect(() => {
    if (!selectedProductId) {
      navigateTo('home');
      return;
    }
    if (!loading && !produto) {
      showAlert('Produto não localizado.', 'error');
      navigateTo('home');
    }
  }, [selectedProductId, loading, produto]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <span className="text-sm font-semibold text-gray-500 font-mono">Carregando lote...</span>
      </div>
    );
  }

  if (!produto) return null;

  const original = produto.precoOriginal;
  const promo = produto.precoPromocional;
  const discountPercent = original > 0 ? Math.round(((original - promo) / original) * 100) : 0;

  // Calculo de Validade
  const checkExpiryStatus = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateStr + 'T00:00:00');
    expiry.setHours(0, 0, 0, 0);

    const timeDiff = expiry.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysLeft < 0) {
      return { label: 'VENCIDO', color: 'text-rose-600 bg-rose-50 border-rose-100', isExpired: true, days: daysLeft };
    } else if (daysLeft === 0) {
      return { label: 'VENCE HOJE', color: 'text-amber-700 bg-amber-50 border-amber-200 animate-pulse', isExpired: false, days: 0 };
    } else if (daysLeft === 1) {
      return { label: 'VENCE AMANHÃ', color: 'text-amber-700 bg-amber-50 border-amber-200', isExpired: false, days: 1 };
    } else {
      return { label: `Validade: ${daysLeft} dias restantes (${produto.dataValidade})`, color: 'text-emerald-800 bg-emerald-50 border-emerald-100', isExpired: false, days: daysLeft };
    }
  };

  const expiry = checkExpiryStatus(produto.dataValidade);
  const totalAvailable = produto.quantidadeDisponivel - produto.quantidadeReservada;
  const isEsgotado = totalAvailable <= 0 || produto.status === 'esgotado';

  // Construct sharing details
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?prodId=${produto?.id}`
    : `https://validamais.com/produtos?prodId=${produto?.id}`;

  const discountFormatted = discountPercent > 0 ? `(${discountPercent}% OFF!)` : '';

  const shareText = produto
    ? `🚨 *Oferta Imperdível no ValidaMais!* 🚨
  
*${produto.nomeProduto}* com preço super reduzido!
💵 De: R$ ${produto.precoOriginal.toFixed(2).replace('.', ',')}
🔥 *Por apenas: R$ ${produto.precoPromocional.toFixed(2).replace('.', ',')}* ${discountFormatted}
🏢 Local de Retirada: *${produto.nomeLoja}*
📍 Endereço: ${produto.endereco}

Não perca essa oportunidade de economizar e evitar o desperdício alimentar! Veja mais detalhes e reserve aqui:
👇👇👇
${shareUrl}`
    : '';

  const handleShareWhatsAppDetail = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showAlert('Direcionando para o WhatsApp...', 'success');
  };

  const handleShareTelegramDetail = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    showAlert('Direcionando para o Telegram...', 'success');
  };

  const handleCopyLinkDetail = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback option for sandboxed contexts
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
      }, 2000);
    } catch (err) {
      console.error('Falha ao copiar link:', err);
      showAlert('Não foi possível copiar o link automaticamente.', 'error');
    }
  };

  const handleIncrement = () => {
    if (quantidade < totalAvailable) {
      setQuantidade(prev => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantidade > 1) {
      setQuantidade(prev => prev - 1);
    }
  };

  // Atomic database transaction to prevent double reservation or over-booking
  const handleReserve = async () => {
    if (!user) {
      showAlert('Você precisa fazer login para reservar produtos.', 'warning');
      navigateTo('login');
      return;
    }

    if (user.role === 'lojista') {
      showAlert('Lojistas não podem reservar produtos para permitir rotatividade honesta.', 'warning');
      return;
    }

    if (isEsgotado || expiry.isExpired) return;

    setReserving(true);
    try {
      await createReservation(produto.id!, quantidade);
      navigateTo('minhas-reservas');
    } catch (err: any) {
      console.error(err);
    } finally {
      setReserving(false);
    }
  };

  return (
    <div id="product_details_screen" className="max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigateTo('produtos')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-emerald-700 transition-colors uppercase font-mono cursor-pointer"
      >
        &larr; Voltar para o Catálogo
      </button>

      <div className="glass rounded-3xl border-white/50 overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
        {/* Photo Container */}
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white/40 border border-white/30">
            <img
              src={(produto.imagens && produto.imagens[activeImageIndex]) || produto.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=60&w=600'}
              alt={produto.nomeProduto}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {discountPercent > 0 && (
              <div className="absolute top-4 left-4 bg-rose-600 text-white font-extrabold text-sm px-3.5 py-1.5 rounded-xl shadow-md font-mono">
                {discountPercent}% DESCONTO
              </div>
            )}
          </div>

          {/* Interactive Multi-angle Thumbnails Row */}
          {produto.imagens && produto.imagens.length > 1 && (
            <div className="grid grid-cols-3 gap-2">
              {produto.imagens.map((imgUrl, idx) => {
                const viewpointLabels = ["Frente", "Lado Dir.", "Lado Esq."];
                const label = viewpointLabels[idx] || `Ângulo ${idx + 1}`;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`flex flex-col items-center gap-1.5 p-1 rounded-xl border transition-all cursor-pointer bg-white/40 hover:bg-white/70 ${
                      activeImageIndex === idx ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-gray-200'
                    }`}
                  >
                    <div className="aspect-square w-full rounded-lg overflow-hidden bg-gray-50">
                      <img src={imgUrl} alt={`Ângulo ${label}`} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] font-bold font-sans text-gray-500 tracking-tight leading-none truncate w-full uppercase">{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="glass border-white/40 rounded-2xl p-4 space-y-2 bg-white/40">
            <h4 className="text-xs font-bold text-gray-500 font-mono uppercase">Local de Retirada Física</h4>
            <div className="flex items-start gap-2 text-xs text-gray-700 font-semibold leading-relaxed">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{produto.endereco}</span>
            </div>
            <div className="text-[10px] text-gray-400 mt-2 leading-tight">
              * Nota: não oferecemos serviço de entrega. Toda a logística de compra e transporte do produto é feita pessoalmente por você na loja parceira.
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div className="flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={() => toggleFavoritoLoja(produto.nomeLoja)}
                className="flex items-center gap-1.5 text-xs text-gray-500 font-bold hover:text-rose-600 transition-colors cursor-pointer group/store-btn"
                title={isLojaFavoritada(produto.nomeLoja) ? "Remover estabelecimento dos favoritos" : "Favoritar este estabelecimento"}
              >
                <Store className="w-4 h-4 text-emerald-600 shrink-0 group-hover/store-btn:text-rose-500 transition-colors" />
                <span>{produto.nomeLoja}</span>
                <Heart 
                  className={`w-3.5 h-3.5 shrink-0 transition-all ${
                    isLojaFavoritada(produto.nomeLoja) 
                      ? 'text-rose-500 fill-rose-500 scale-110' 
                      : 'text-gray-300 group-hover/store-btn:text-rose-200'
                  }`} 
                />
              </button>
              {mediaAvaliacao ? (
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-lg text-amber-750 text-amber-700 font-mono text-[10px] font-black">
                  <span>★ {mediaAvaliacao}</span>
                  <span className="text-gray-400 font-normal">({avaliacoesLoja.length})</span>
                </div>
              ) : (
                <span className="text-[10px] font-bold text-gray-405 text-gray-400 font-mono uppercase bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg">Novo parceiro</span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
              {produto.nomeProduto}
            </h1>

            <div className="inline-flex items-center gap-1 text-xs font-bold border px-3 py-1 rounded-full uppercase font-mono leading-none tracking-wide text-center">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span className={`px-1 rounded-sm ${expiry.color}`}>{expiry.label}</span>
            </div>

            {/* Custom Category Tag */}
            <div className="text-xs font-medium text-gray-600">
              Categoria:{' '}
              <span className="font-bold text-gray-900 underline decoration-slate-300">
                {produto.categoria}
              </span>
            </div>

            <div className="h-px bg-gray-100" />

            <div className="space-y-1">
              <div className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider">Descrição do Lote</div>
              <p className="text-sm text-gray-650 text-gray-600 leading-relaxed font-medium">
                {produto.descricao || 'O vendedor não adicionou notas adicionais sobre este exemplar promocional.'}
              </p>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Pricing visualization */}
            <div className="bg-emerald-50/50 hover:bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase block">Preço Original</span>
                <span className="text-sm font-semibold text-slate-400 line-through">
                  {produto.precoOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="space-y-0.5 text-right flex-1">
                <span className="text-[10px] font-extrabold text-emerald-700 font-mono uppercase block">Preço Líquido Promo</span>
                <span className="text-2xl font-black text-emerald-600 leading-none">
                  {produto.precoPromocional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            {/* Quick Share section */}
            <div className="bg-white/40 backdrop-blur-xs border border-white/50 p-4 rounded-2xl space-y-2.5">
              <span className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider block">Gostou desse lote? Compartilhe essa oferta!</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareWhatsAppDetail}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-1.991-.001-3.952-.493-5.717-1.428L0 24zm6.59-4.846l.385.228a9.92 9.92 0 0 0 5.033 1.378c5.495.003 9.965-4.464 9.969-9.962a9.882 9.882 0 0 0-2.88-7.051C17.27 1.871 14.743.857 12.005.857 6.513.857 2.046 5.328 2.043 10.825c-.001 2.012.523 3.978 1.517 5.714l.244.427-1.02 3.729 3.863-.987z"/>
                  </svg>
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleShareTelegramDetail}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-505 bg-sky-500 hover:bg-sky-600 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4 text-white fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.24-5.52 3.64-.52.36-.97.54-1.34.53-.41-.01-1.21-.23-1.8-.42-.72-.24-1.3-.37-1.25-.79.03-.22.33-.44.9-.68 3.51-1.53 5.85-2.54 7.02-3 .3-.12.58-.18.83-.17.29.01.52.12.63.36.12.25.13.56.08.84zm1.5-1.5c.1.2 0 .4 0 .5s-.1.2-.2.2h-.1l-.1-.1-.1-.1.1-.1s.3-.4-.1-.4h-.1l.1-.1c-.1.1-.1.1-.1.1z"/>
                  </svg>
                  Telegram
                </button>
                <button
                  type="button"
                  onClick={handleCopyLinkDetail}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-gray-500 shrink-0" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorito(produto.id!)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs border ${
                    isFavoritado(produto.id!)
                      ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-rose-50 hover:border-rose-150 hover:text-rose-605'
                  }`}
                  title="Favoritar este lote de alimento"
                >
                  <Heart 
                    className={`w-4 h-4 transition-all ${
                      isFavoritado(produto.id!) 
                        ? 'text-rose-600 fill-rose-600 scale-110 font-bold' 
                        : 'text-gray-500'
                    }`} 
                  />
                  <span>{isFavoritado(produto.id!) ? 'Lote Favoritado' : 'Favoritar Lote'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleFavoritoLoja(produto.nomeLoja)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs border ${
                    isLojaFavoritada(produto.nomeLoja)
                      ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-rose-50 hover:border-red-150 hover:text-rose-600'
                  }`}
                  title="Favoritar esta loja parceira"
                >
                  <Store 
                    className={`w-4 h-4 transition-all ${
                      isLojaFavoritada(produto.nomeLoja) 
                        ? 'text-rose-600 fill-rose-600 scale-110 font-bold' 
                        : 'text-gray-500'
                    }`} 
                  />
                  <span>{isLojaFavoritada(produto.nomeLoja) ? 'Loja Favoritada' : 'Favoritar Loja'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive reservations control bucket */}
          <div className="mt-8 space-y-4">
            {isEsgotado ? (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-center">
                <span className="text-rose-700 text-sm font-bold uppercase font-mono tracking-wider">Lote Esgotado / Retirado</span>
                <p className="text-xs text-rose-600 mt-1">Este produto já foi totalmente reservado por outros consumidores.</p>
              </div>
            ) : expiry.isExpired ? (
              <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl text-center">
                <span className="text-rose-700 text-sm font-bold uppercase font-mono tracking-wider">Lote Expirado (Vencido)</span>
                <p className="text-xs text-rose-600 mt-1">Por regras de vigilância sanitária, produtos vencidos não podem ser reservados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Quantity selector */}
                <div className="flex items-center justify-between bg-gray-50 p-3.5 rounded-2xl border border-gray-150">
                  <span className="text-xs font-bold text-gray-700 shrink-0">Quantidade à reservar:</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      disabled={quantidade <= 1}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold hover:bg-gray-100 transition-colors disabled:opacity-40"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-mono font-bold text-lg text-gray-900 w-6 text-center">{quantidade}</span>
                    <button
                      type="button"
                      onClick={handleIncrement}
                      disabled={quantidade >= totalAvailable}
                      className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-700 flex items-center justify-center font-bold hover:bg-gray-100 transition-colors disabled:opacity-40"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtotal calculator */}
                <div className="flex justify-between items-center text-sm font-mono font-semibold px-2">
                  <span className="text-gray-500">Subtotal Líquido:</span>
                  <span className="text-emerald-700 font-extrabold text-base">
                    {(promo * quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                {/* Submit action */}
                {user ? (
                  user.role === 'lojista' ? (
                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-800 leading-relaxed space-y-1">
                      <p className="font-bold flex items-center gap-1 uppercase font-mono"><Info className="w-3.5 h-3.5" /> Atenção Lojista:</p>
                      <p>Sua conta está cadastrada como Lojista. Contas de lojistas não estão autorizadas a efetuar reservas no catálogo público.</p>
                    </div>
                  ) : (
                    <button
                      onClick={handleReserve}
                      disabled={reserving}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 hover:scale-101 text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {reserving ? (
                        <span className="font-mono">Processando...</span>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 text-emerald-100" />
                          Confirmar Reserva Grátis
                        </>
                      )}
                    </button>
                  )
                ) : (
                  <div className="space-y-2.5">
                    <button
                      onClick={() => navigateTo('login')}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Conectar e Reservar
                    </button>
                    <p className="text-[10px] text-gray-500 leading-tight text-center">
                      * Reservar e reter itens exige login por razões de auditoria e limitação individual de desperdício. Cadastro leva 30 segundos!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mural de Receitas Inteligente Contra o Desperdício */}
      <div id="smart_recipe_mural_board" className="glass rounded-3xl border-emerald-200/55 p-6 md:p-8 space-y-6 bg-gradient-to-br from-emerald-500/5 to-transparent relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-emerald-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-emerald-600 animate-pulse" />
              Mural Inteligente de Receitas de Aproveitamento 🍳
            </h2>
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Dicas culinárias criativas baseadas em <strong>{produto.categoria}</strong> para zerar o desperdício pós-compra!
            </p>
          </div>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-200/50">
            Dica ValidaMais
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(receitasPorCategoria[produto.categoria] || receitasFallback).map((rec, rIdx) => (
            <div key={rIdx} className="bg-white/70 hover:bg-white border border-white hover:border-emerald-300/40 rounded-2xl p-5 shadow-3xs hover:shadow-xs transition-all duration-300 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    {rec.titulo}
                  </h3>
                  <div className="flex gap-2 shrink-0 font-mono text-[9px] font-bold">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> {rec.tempo}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                      {rec.dificuldade}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase font-mono block">Ingredientes sugeridos:</span>
                  <ul className="grid grid-cols-1 gap-1 pl-1">
                    {rec.ingredientes.map((ing, iIdx) => (
                      <li key={iIdx} className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase font-mono block">Modo de preparo rápido:</span>
                  <ol className="list-decimal pl-4.5 space-y-1.5 text-xs text-slate-600 font-medium leading-relaxed">
                    {rec.passos.map((passo, pIdx) => (
                      <li key={pIdx}>
                        {passo}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 flex gap-2 text-[11px] leading-relaxed text-emerald-850 font-medium mt-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-black text-emerald-900 block">Dica Desperdício Zero:</strong>
                  {rec.dicaEco}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Consumer Reviews Board */}
      <div className="glass rounded-3xl border-white/50 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-gray-900 leading-tight">Avaliações do Estabelecimento</h2>
            <p className="text-xs text-gray-500 font-medium">Veja o que outros consumidores relataram sobre suas experiências com {produto.nomeLoja}</p>
          </div>
          {mediaAvaliacao && (
            <div className="text-right">
              <div className="text-2xl font-black text-amber-500 leading-none">★ {mediaAvaliacao}</div>
              <span className="text-[10px] font-bold text-gray-400 font-mono uppercase">{avaliacoesLoja.length} feedbacks</span>
            </div>
          )}
        </div>

        {avaliacoesLoja.length > 0 ? (
          <div className="divide-y divide-gray-100 space-y-4">
            {avaliacoesLoja.map((av, index) => (
              <div key={av.id || index} className={`pt-4 ${index === 0 ? 'pt-0' : ''} space-y-2`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {/* Tiny avatar representation */}
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-xs uppercase font-mono">
                      {av.usuarioEmail.substring(0, 2)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-800 block leading-tight">{av.usuarioEmail}</span>
                      <span className="text-[9px] font-semibold text-gray-400 font-mono">{new Date(av.criadoEm).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  {/* Stars display */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${
                          star <= av.estrelas ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {av.comentario && (
                  <p className="text-xs text-gray-600 font-medium leading-relaxed bg-gray-55/60 bg-slate-50/50 p-3 rounded-xl border border-gray-100">
                    "{av.comentario}"
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-400 space-y-2">
            <p className="text-xs font-semibold font-mono uppercase tracking-wider">Ainda Sem Avaliações</p>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto leading-relaxed">
              Este mercado ainda não recebeu avaliações de retirada. Reserve um lote perecível, conclua e seja o primeiro a deixar um feedback honesto de resgate!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
