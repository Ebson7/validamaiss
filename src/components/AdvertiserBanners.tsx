import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Award, ShieldCheck, Sparkles, Star, ChevronRight, Gift, Percent, Store, Check, CreditCard } from 'lucide-react';

export const AdvertiserBanners: React.FC = () => {
  const { navigateTo, user, produtos, showAlert, updateUserProfile } = useApp();
  const [showClubModal, setShowClubModal] = useState(false);
  const [subscribingClub, setSubscribingClub] = useState(false);
  const [clubCheckoutStep, setClubCheckoutStep] = useState<'info' | 'payment' | 'success'>('info');

  // Check if current user is an admin or user and verify highlight
  const isSubscriberOuro = user?.role === 'admin' && user?.destaquePlano === 'ouro' && user?.destaqueAtivo;
  const isSubscriberBronze = user?.role === 'admin' && user?.destaquePlano === 'bronze' && user?.destaqueAtivo;
  
  // Find any other admins or products in the system to simulate featured shops
  const uniqueShops = Array.from(new Set(produtos.map(p => p.nomeLoja)));

  // Banners contents:
  // Card 2: Main advertiser (Dynamic Ouro)
  const sponsorOuro = {
    nome: isSubscriberOuro ? (user?.nome || 'Minha Loja') : 'Padaria Central Bella Vista 🥖',
    slogan: isSubscriberOuro ? (user?.destaqueMensagem || 'Laticínios de qualidade premium a preço de custo na sua vizinhança!') : 'Bolos, croissants e baguetes com fermentação natural e até 60% de desconto hoje!',
    actionText: 'Resgatar Fornada',
    tag: 'Destaque Ouro 🌟',
    badge: 'Fornadas do Dia',
    theme: 'bg-radial from-stone-900 to-amber-950 text-white border-amber-500/30'
  };

  // Card 3: Secondary advertiser (Dynamic Bronze or fallback)
  const sponsorBronze = {
    nome: isSubscriberBronze ? (user?.nome || 'Minha Loja') : 'Hortifrúti Pompéia Pomar 🍎',
    slogan: isSubscriberBronze ? (user?.destaqueMensagem || 'Frutas e legumes para consumo no mesmo dia com preços imbatíveis!') : 'Evite o descarte de frutas maduras super doces! Perfeitas para doces e polpas naturais.',
    actionText: 'Ver Sacolas Verdes',
    tag: 'Destaque Eco 🌱',
    badge: 'Estoque Consumível',
    theme: 'bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900 text-white border-teal-500/30 font-medium'
  };

  const handleJoinClub = async () => {
    setSubscribingClub(true);
    setTimeout(async () => {
      try {
        await updateUserProfile({ destaquePlano: 'clube', destaqueAtivo: true });
        setClubCheckoutStep('success');
        showAlert('Parabéns! Você agora é membro oficial do Clube ValidaMais!', 'success');
      } catch (err) {
        console.error(err);
      } finally {
        setSubscribingClub(false);
      }
    }, 1500);
  };

  const handleFilterStore = (storeName: string) => {
    // Navigate to products and we can filter or search (in practice, it shows the catalog)
    showAlert(`Filtrando lotes de: ${storeName}`, 'info');
    navigateTo('produtos');
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-none">Benefícios & Destaques Premium ✨</h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Benefícios exclusivos para assinantes e marcas patrocinadoras em destaque</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => navigateTo('admin-dashboard')}
            className="text-xs font-black text-emerald-600 hover:text-emerald-700 font-mono tracking-wide uppercase cursor-pointer flex items-center gap-1 hover:underline"
          >
            Quero Anunciar Aqui <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid containing high-fidelity ML-style benefits cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Clube ValidaMais Shoppers */}
        <div 
          id="benefit_card_clube" 
          className="bg-gradient-to-br from-violet-600 via-indigo-700 to-indigo-900 rounded-2xl p-5 text-white flex flex-col justify-between shadow-xs border border-violet-500/25 relative overflow-hidden transition-all hover:shadow-md hover:scale-[1.01]"
        >
          {/* Subtle background visual flair */}
          <div className="absolute right-0 bottom-0 w-28 h-28 bg-violet-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="space-y-3 z-10">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono tracking-widest uppercase bg-indigo-950/55 px-2.5 py-1 rounded-full border border-indigo-400/20">
              <Gift className="w-3 h-3 text-amber-300" />
              Assinatura Consumidor
            </span>
            <div>
              <h3 className="text-lg font-black tracking-tight leading-tight">Clube ValidaMais</h3>
              <p className="text-[11px] text-indigo-150 text-indigo-200 mt-1 leading-relaxed">
                Apoie o combate ao desperdício! Assine por apenas <strong>R$ 9,90/mês</strong> e ganhe:
              </p>
            </div>
            
            {/* Quick list specs */}
            <ul className="space-y-1.5 pt-1 text-[11px] text-indigo-100 font-medium">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span><strong>5% de Desconto Extra</strong> em todos os lotes</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span><strong>Acesso Antecipado</strong> de 1 hora em novos lotes</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Badge exclusivo de <strong>Herói Eco 🌱</strong></span>
              </li>
            </ul>
          </div>

          <div className="pt-4 z-10">
            {user?.destaquePlano === 'clube' ? (
              <div className="w-full py-2 bg-indigo-950/40 rounded-xl text-center border border-indigo-400/20 text-xs font-black text-indigo-200 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Você é Membro do Clube!
              </div>
            ) : (
              <button 
                onClick={() => {
                  setClubCheckoutStep('info');
                  setShowClubModal(true);
                }}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs tracking-wider uppercase font-mono rounded-xl cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all flex items-center justify-center gap-1.5"
              >
                Quero Fazer Parte!
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Main advertiser spot (Ouro) */}
        <div 
          id="sponsor_card_ouro" 
          className={`${sponsorOuro.theme} rounded-2xl p-5 flex flex-col justify-between shadow-xs border relative overflow-hidden transition-all hover:shadow-md hover:scale-[1.01]`}
        >
          {/* Subtle gold spotlight glow */}
          <div className="absolute left-1/2 -top-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-3 z-10">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono tracking-widest uppercase bg-amber-500/10 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/20">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400 scale-102" />
              {sponsorOuro.tag}
            </span>
            <div>
              <h3 className="text-lg font-black tracking-tight leading-tight flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-300" />
                {sponsorOuro.nome}
              </h3>
              <p className="text-[11px] text-amber-200 text-stone-300 mt-2 italic leading-relaxed">
                "{sponsorOuro.slogan}"
              </p>
            </div>
            
            <div className="pt-2 flex items-center gap-2">
              <span className="bg-amber-500/15 text-amber-300 text-[9px] font-extrabold font-mono uppercase px-2 py-0.5 rounded-md border border-amber-500/20">
                {sponsorOuro.badge}
              </span>
              <span className="text-[10px] text-stone-400 font-semibold">Parceiro Certificado ValidaMais</span>
            </div>
          </div>

          <div className="pt-4 z-10">
            <button 
              onClick={() => handleFilterStore(sponsorOuro.nome)}
              className="w-full py-2.5 bg-stone-850 bg-stone-800 hover:bg-stone-750 border border-stone-700 hover:border-amber-500/40 text-amber-300 font-black text-xs tracking-wider uppercase font-mono rounded-xl cursor-pointer hover:shadow-xs transition-all flex items-center justify-center gap-1"
            >
              {sponsorOuro.actionText}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 3: Secondary advertiser spot (Bronze) */}
        <div 
          id="sponsor_card_bronze" 
          className={`${sponsorBronze.theme} rounded-2xl p-5 flex flex-col justify-between shadow-xs border relative overflow-hidden transition-all hover:shadow-md hover:scale-[1.01]`}
        >
          {/* Subtle teal spotlight glow */}
          <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-3 z-10">
            <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono tracking-widest uppercase bg-teal-900/40 text-teal-300 px-2.5 py-1 rounded-full border border-teal-500/20">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              {sponsorBronze.tag}
            </span>
            <div>
              <h3 className="text-lg font-black tracking-tight leading-tight flex items-center gap-1.5">
                <Store className="w-4 h-4 text-emerald-300" />
                {sponsorBronze.nome}
              </h3>
              <p className="text-[11px] text-teal-200 mt-2 italic leading-relaxed">
                "{sponsorBronze.slogan}"
              </p>
            </div>
            
            <div className="pt-2 flex items-center gap-2">
              <span className="bg-teal-500/25 text-emerald-300 text-[9px] font-extrabold font-mono uppercase px-2 py-0.5 rounded-md border border-teal-500/20">
                {sponsorBronze.badge}
              </span>
              <span className="text-[10px] text-teal-300/70 font-semibold">Desperdício Zero Garantido</span>
            </div>
          </div>

          <div className="pt-4 z-10">
            <button 
              onClick={() => handleFilterStore(sponsorBronze.nome)}
              className="w-full py-2.5 bg-teal-950/40 hover:bg-teal-900/60 border border-teal-500/20 hover:border-emerald-400 text-emerald-300 font-extrabold text-xs tracking-wider uppercase font-mono rounded-xl cursor-pointer hover:shadow-xs transition-all flex items-center justify-center gap-1"
            >
              {sponsorBronze.actionText}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Shopper Club subscription checkout Modal */}
      {showClubModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-indigo-100 text-slate-800 space-y-6 relative animate-scale-up">
            
            <button 
              type="button"
              onClick={() => setShowClubModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-slate-700 font-bold text-xs p-1 cursor-pointer font-mono"
            >
              ✖
            </button>

            {clubCheckoutStep === 'info' && (
              <div className="space-y-5">
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Gift className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-indigo-900">Seja Clube ValidaMais!</h3>
                  <p className="text-xs text-gray-500">Apoie os pequenos produtores locais e maximize suas economias domésticas de forma sustentável.</p>
                </div>

                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 space-y-3 text-xs leading-relaxed">
                  <p className="font-extrabold text-indigo-900">Por que entrar para o clube?</p>
                  <ul className="space-y-2 text-slate-700">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold font-mono">✓</span>
                      <span>Selo de <strong>Consumidor Herói Eco 🌱</strong> exibido ao lado do seu perfil em comentários e reservas.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold font-mono">✓</span>
                      <span><strong>Estatísticas Ambientais Avançadas</strong> personalizadas com kg de CO2 poupados do ar.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold font-mono">✓</span>
                      <span>Acesso a <strong>Cupons de Fornecedores Exclusivos</strong> e eventos de liquidação relâmpago.</span>
                    </li>
                  </ul>
                </div>

                <div className="flex items-center justify-between font-mono p-1 border-t border-dashed mt-4 pt-3">
                  <span className="text-xs font-bold text-slate-400">VALOR MENSAL</span>
                  <span className="text-lg font-black text-indigo-600">R$ 9,90</span>
                </div>

                <button
                  type="button"
                  onClick={() => setClubCheckoutStep('payment')}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-widest uppercase font-mono rounded-xl cursor-pointer shadow-md shadow-indigo-600/10 transition-all text-center"
                >
                  Ir Para o Pagamento
                </button>
              </div>
            )}

            {clubCheckoutStep === 'payment' && (
              <div className="space-y-5">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-indigo-950">Selecione a Forma de Pagamento</h3>
                  <p className="text-xs text-gray-400">Assinatura mensal recorrente, cancele quando desejar.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={handleJoinClub}
                    disabled={subscribingClub}
                    className="p-4 border border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-slate-50 text-center flex flex-col items-center gap-2 group cursor-pointer transition-all disabled:opacity-50"
                  >
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold font-mono text-xs group-hover:scale-105 transition-transform">
                      PIX
                    </div>
                    <span className="text-xs font-extrabold text-slate-700">Pague com PIX</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleJoinClub}
                    disabled={subscribingClub}
                    className="p-4 border border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-slate-50 text-center flex flex-col items-center gap-2 group cursor-pointer transition-all disabled:opacity-50"
                  >
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-700">Cartão de Crédito</span>
                  </button>
                </div>

                {subscribingClub && (
                  <div className="flex items-center justify-center gap-2 text-indigo-600 font-mono text-xs font-bold pt-4">
                    <span className="animate-spin text-lg">⏳</span> Realizando aprovação bancária simulada...
                  </div>
                )}
              </div>
            )}

            {clubCheckoutStep === 'success' && (
              <div className="text-center space-y-5 py-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs border border-emerald-100">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-black text-emerald-800">Bem-vindo ao Clube! 🎉</h3>
                  <p className="text-xs text-gray-500 leading-relaxed px-2">
                    Seu perfil foi atualizado com o selo de Membro Clube ValidaMais. O desconto extra de 5% já está habilitado na sua conta para futuras reservas!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClubModal(false)}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs tracking-wider uppercase font-mono rounded-xl cursor-pointer transition-all"
                >
                  Começar a Poupar!
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </section>
  );
};
