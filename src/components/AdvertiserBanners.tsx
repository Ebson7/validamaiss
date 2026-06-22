import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Award, ShieldCheck, Sparkles, Star, ChevronRight, ChevronLeft, Gift, Percent, Store, Check, CreditCard } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Usuario } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const AdvertiserBanners: React.FC = () => {
  const { navigateTo, user, produtos, showAlert, updateUserProfile } = useApp();
  const [showClubModal, setShowClubModal] = useState(false);
  const [subscribingClub, setSubscribingClub] = useState(false);
  const [clubCheckoutStep, setClubCheckoutStep] = useState<'info' | 'payment' | 'success'>('info');

  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left/prev, 1 for right/next
  const [isHovered, setIsHovered] = useState(false);
  const [dbSponsors, setDbSponsors] = useState<Usuario[]>([]);
  const [loadingSponsors, setLoadingSponsors] = useState(true);

  // Fetch real advertisement sponsors from Firebase Firestore
  useEffect(() => {
    let active = true;
    const fetchSponsors = async () => {
      try {
        const q = query(
          collection(db, 'usuarios'),
          where('destaqueAtivo', '==', true)
        );
        const snapshot = await getDocs(q);
        const sponsors: Usuario[] = [];
        snapshot.forEach(docSnap => {
          sponsors.push({ uid: docSnap.id, ...docSnap.data() } as Usuario);
        });
        if (active) {
          setDbSponsors(sponsors);
        }
      } catch (err) {
        console.warn("Could not load dynamic sponsors:", err);
      } finally {
        if (active) setLoadingSponsors(false);
      }
    };

    fetchSponsors();
    return () => { active = false; };
  }, [user]);

  // Action / Filter definitions defined early to resolve reference issues
  const handleFilterStore = (storeName: string) => {
    showAlert(`Filtrando lotes de: ${storeName}`, 'info');
    navigateTo('produtos');
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

  // Construct dynamic slides based on DB and active subscriber state
  const isSubscriberOuro = user?.role === 'admin' && user?.destaquePlano === 'ouro' && user?.destaqueAtivo;
  const isSubscriberBronze = user?.role === 'admin' && user?.destaquePlano === 'bronze' && user?.destaqueAtivo;

  const slides: any[] = [];

  // Slide 1: Clube ValidaMais (Benefício de assinatura permanente do usuário final)
  slides.push({
    id: 'clube_valida_mais',
    type: 'clube',
    tag: 'Assinatura Consumidor 🛍️',
    title: 'Clube ValidaMais',
    badge: 'Desperdício Zero',
    highlightHtml: (
      <div className="space-y-1 sm:space-y-2">
        <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-white">Clube ValidaMais</h3>
        <p className="text-xs sm:text-sm text-indigo-100 font-medium leading-relaxed max-w-lg">
          Assine por apenas <strong>R$ 9,90/mês</strong> e poupe o meio ambiente garantindo <strong>5% de desconto EXTRA</strong> em todos os lotes, acesso prioritário com 1 hora de antecedência e selo de <strong>Herói Eco🌱</strong>!
        </p>
      </div>
    ),
    actionText: user?.destaquePlano === 'clube' ? 'Já é Membro Oficial!' : 'Quero Fazer Parte!',
    onAction: () => {
      if (user?.destaquePlano === 'clube') {
        showAlert('Você já é membro ativo do Clube ValidaMais!', 'info');
      } else {
        setClubCheckoutStep('info');
        setShowClubModal(true);
      }
    },
    theme: 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-900 border-indigo-500/20 text-white',
    badgeTheme: 'bg-indigo-950/45 text-amber-300 border-indigo-400/20',
    icon: <Gift className="w-5 h-5 text-amber-300 animate-bounce" />,
    btnTheme: user?.destaquePlano === 'clube' 
      ? 'bg-indigo-950/40 text-indigo-200 border border-indigo-400/20 cursor-default' 
      : 'bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold hover:shadow-lg hover:scale-[1.02]'
  });

  // Slide 2: Patrocinador Ouro (Real database users + fallback if empty)
  const realOuroSponsors = dbSponsors.filter(s => s.destaquePlano === 'ouro');
  
  if (isSubscriberOuro && !realOuroSponsors.some(s => s.uid === user?.uid)) {
    realOuroSponsors.push(user as Usuario);
  }

  if (realOuroSponsors.length > 0) {
    realOuroSponsors.forEach(sponsor => {
      slides.push({
        id: `sponsor_ouro_${sponsor.uid}`,
        type: 'patrocinio_ouro',
        tag: 'Destaque Ouro Premium 🌟',
        title: sponsor.nome,
        badge: 'Lojista Patrocinado',
        highlightHtml: (
          <div className="space-y-1 sm:space-y-2">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-amber-300 flex items-center gap-2">
              <Store className="w-5 h-5 shrink-0" />
              {sponsor.nome}
            </h3>
            <p className="text-xs sm:text-sm text-stone-200 italic font-semibold max-w-xl leading-relaxed">
              "{sponsor.destaqueMensagem || 'Produtos frescos por uma fração do preço original esperando por você!'}"
            </p>
          </div>
        ),
        actionText: 'Resgatar Oferta Agora',
        onAction: () => handleFilterStore(sponsor.nome),
        theme: 'bg-radial from-stone-900 to-stone-950 border-amber-500/30 text-white',
        badgeTheme: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
        icon: <Star className="w-5 h-5 text-amber-400 fill-amber-400" />,
        btnTheme: 'bg-stone-800 hover:bg-stone-700 hover:border-amber-500/40 text-amber-300 border border-stone-700 font-black'
      });
    });
  } else {
    slides.push({
      id: 'fallback_sponsor_ouro',
      type: 'patrocinio_ouro',
      tag: 'Destaque Ouro 🌟',
      title: 'Padaria Central Bella Vista 🥖',
      badge: 'Fornadas do Dia',
      highlightHtml: (
        <div className="space-y-1 sm:space-y-2">
          <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-amber-300 flex items-center gap-2">
            <Store className="w-5 h-5 shrink-0" />
            Padaria Central Bella Vista 🥖
          </h3>
          <p className="text-xs sm:text-sm text-stone-200 italic font-semibold max-w-xl leading-relaxed">
            "Bolos, croissants e baguetes com fermentação natural e até 60% de desconto hoje nas compras de gôndola!"
          </p>
        </div>
      ),
      actionText: 'Resgatar Fornada',
      onAction: () => handleFilterStore('Padaria Central Bella Vista 🥖'),
      theme: 'bg-radial from-stone-900 to-amber-955 border-amber-500/30 text-white',
      badgeTheme: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      icon: <Star className="w-5 h-5 text-amber-400 fill-amber-400" />,
      btnTheme: 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 font-black'
    });
  }

  // Slide 3: Patrocinador Bronze (Real database users + fallback if empty)
  const realBronzeSponsors = dbSponsors.filter(s => s.destaquePlano === 'bronze');
  
  if (isSubscriberBronze && !realBronzeSponsors.some(s => s.uid === user?.uid)) {
    realBronzeSponsors.push(user as Usuario);
  }

  if (realBronzeSponsors.length > 0) {
    realBronzeSponsors.forEach(sponsor => {
      slides.push({
        id: `sponsor_bronze_${sponsor.uid}`,
        type: 'patrocinio_bronze',
        tag: 'Destaque Eco 🌱',
        title: sponsor.nome,
        badge: 'Oferta Sustentável',
        highlightHtml: (
          <div className="space-y-1 sm:space-y-2">
            <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-emerald-300 flex items-center gap-2">
              <Store className="w-5 h-5 shrink-0" />
              {sponsor.nome}
            </h3>
            <p className="text-xs sm:text-sm text-teal-100 italic font-medium max-w-xl leading-relaxed">
              "{sponsor.destaqueMensagem || 'Salva do descarte produtos de ótima qualidade por sacolas verdes ecológicas!'}"
            </p>
          </div>
        ),
        actionText: 'Ver Sacolas Verdes',
        onAction: () => handleFilterStore(sponsor.nome),
        theme: 'bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900 border-teal-500/20 text-white',
        badgeTheme: 'bg-teal-900/40 text-teal-300 border border-teal-500/20',
        icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
        btnTheme: 'bg-teal-950/40 hover:bg-teal-900 border border-teal-500/30'
      });
    });
  } else {
    slides.push({
      id: 'fallback_sponsor_bronze',
      type: 'patrocinio_bronze',
      tag: 'Destaque Eco 🌱',
      title: 'Hortifrúti Pompéia Pomar 🍎',
      badge: 'Estoque Consumível',
      highlightHtml: (
        <div className="space-y-1 sm:space-y-2">
          <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-none text-emerald-300 flex items-center gap-2">
            <Store className="w-5 h-5 shrink-0" />
            Hortifrúti Pompéia Pomar 🍎
          </h3>
          <p className="text-xs sm:text-sm text-teal-100 italic font-semibold max-w-xl leading-relaxed">
            "Evite o descarte de frutas maduras super doces da feira! Perfeitas para doces, sucos e polpas naturais."
          </p>
        </div>
      ),
      actionText: 'Ver Sacolas Verdes',
      onAction: () => handleFilterStore('Hortifrúti Pompéia Pomar 🍎'),
      theme: 'bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900 border-teal-500/35 text-white',
      badgeTheme: 'bg-teal-900/40 text-teal-300 border border-teal-500/20',
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      btnTheme: 'bg-teal-950/40 hover:bg-teal-900 border border-teal-500/35 hover:scale-[1.01] text-emerald-300 font-extrabold'
    });
  }

  const slidesCount = slides.length;

  // Autoplay function
  useEffect(() => {
    if (isHovered || slidesCount <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentSlide(prev => (prev + 1) % slidesCount);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered, slidesCount]);

  const handlePrevSlide = () => {
    if (slidesCount <= 1) return;
    setDirection(-1);
    setCurrentSlide(prev => (prev - 1 + slidesCount) % slidesCount);
  };

  const handleNextSlide = () => {
    if (slidesCount <= 1) return;
    setDirection(1);
    setCurrentSlide(prev => (prev + 1) % slidesCount);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : dir < 0 ? '-100%' : 0,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir < 0 ? '100%' : dir > 0 ? '-100%' : 0,
      opacity: 0
    })
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-none">Benefícios & Destaques Premium ✨</h2>
          <p className="text-xs text-gray-500 font-semibold mt-1">Benefícios exclusivos para assinantes e marcas parceiras em destaque rotativo</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            type="button"
            onClick={() => navigateTo('admin-dashboard')}
            className="text-xs font-black text-emerald-600 hover:text-emerald-700 font-mono tracking-wide uppercase cursor-pointer flex items-center gap-1 hover:underline"
          >
            Quero Anunciar Aqui <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Banner Carousel Container with precise height boundaries */}
      <div 
        id="banners_carousel_view"
        className="relative overflow-hidden rounded-3xl group shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300 h-[255px] sm:h-[195px] bg-slate-950"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 260, damping: 28 },
              opacity: { duration: 0.25 }
            }}
            className="absolute inset-0 w-full h-full"
          >
            {slides[currentSlide] && (
              <div className={`w-full h-full p-5 sm:p-6 flex flex-col justify-between ${slides[currentSlide].theme} h-full`}>
                {/* Visual spotlight backdrop overlay */}
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute left-1/4 bottom-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

                {/* Banner Upper Section */}
                <div className="space-y-2 z-10 relative">
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono tracking-widest uppercase bg-black/25 px-2.5 py-1 rounded-full border border-white/10">
                      {slides[currentSlide].icon}
                      {slides[currentSlide].tag}
                    </span>
                    <span className={`text-[9px] font-black font-mono uppercase tracking-wider px-2 py-0.5 rounded-md border ${slides[currentSlide].badgeTheme}`}>
                      {slides[currentSlide].badge}
                    </span>
                  </div>

                  {/* Highlight text / HTML elements */}
                  {slides[currentSlide].highlightHtml}
                </div>

                {/* Banner Bottom Action Link */}
                <div className="pt-2 z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 relative border-t border-white/10">
                  <div className="text-[10px] text-white/60 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />
                    <span>Combatendo desperdício local na sua gôndola</span>
                  </div>
                  <button
                    onClick={slides[currentSlide].onAction}
                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase font-mono tracking-wide cursor-pointer transition-all flex items-center gap-1 shrink-0 ${slides[currentSlide].btnTheme}`}
                  >
                    {slides[currentSlide].actionText}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Previous and Next Navigation Arrows (Fades/scales in on container hover) */}
        {slidesCount > 1 && (
          <>
            <button
              onClick={handlePrevSlide}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/40 hover:bg-slate-900/70 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              onClick={handleNextSlide}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-slate-900/40 hover:bg-slate-900/70 border border-white/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              aria-label="Próximo slide"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </>
        )}

        {/* Slides Bullet Indicators/Dots at bottom center */}
        {slidesCount > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/25 px-2 py-0.5 rounded-full backdrop-blur-xs">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentSlide ? 1 : -1);
                  setCurrentSlide(index);
                }}
                className={`transition-all duration-300 rounded-full h-1 cursor-pointer ${
                  currentSlide === index ? 'w-3.5 bg-white' : 'w-1 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        )}
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
