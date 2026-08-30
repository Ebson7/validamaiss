/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Programa de indicação — o usuário pega seu link pessoal (?ref=uid),
 * compartilha, e acompanha quantos amigos entraram por ele + recompensas.
 */

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { buildInviteUrl, nativeShare, hasNativeShare } from '../../lib/share';
import { countReferrals } from '../../lib/db-wrapper';
import { isClubeAtivo } from '../../lib/clube';
import {
  Gift, Users, Copy, Check, Share2, Leaf, Trophy, Sparkles,
  ArrowRight, Search, UserPlus, Ticket, Loader2,
} from 'lucide-react';

const TIERS = [
  { n: 1, icon: <Leaf className="w-4 h-4" />, titulo: 'Selo "Amigo do Planeta"', desc: '1 amigo indicado' },
  { n: 3, icon: <Ticket className="w-4 h-4" />, titulo: 'Clube grátis pra sempre', desc: '3 amigos — fundador vitalício' },
  { n: 5, icon: <Trophy className="w-4 h-4" />, titulo: 'Selo "Herói Eco" + destaque', desc: '5 amigos indicados' },
];

export const ConviteAmigos: React.FC = () => {
  const { user, navigateTo, showAlert, updateUserProfile } = useApp();
  const [count, setCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const handleClaimClube = async () => {
    setClaiming(true);
    try {
      // Fundador vitalício: Clube grátis sem validade, mantido mesmo se um dia houver mensalidade.
      await updateUserProfile({ clubeAtivo: true, clubeDesde: user?.clubeDesde || new Date().toISOString() });
      showAlert('Recompensa garantida! Você é Membro Fundador vitalício do Clube. 💚', 'success');
    } catch {
      showAlert('Não foi possível resgatar agora. Tente novamente.', 'error');
    } finally {
      setClaiming(false);
    }
  };

  const inviteUrl = user ? buildInviteUrl(user.uid) : '';
  const inviteText = `Descobri o ValidaMais: dá pra salvar comida de mercados perto de você com até 70% de desconto antes de vencer. 🌱 Entra pelo meu convite:`;

  useEffect(() => {
    let alive = true;
    if (user) {
      countReferrals(user.uid).then((n) => { if (alive) setCount(n); });
    }
    return () => { alive = false; };
  }, [user]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      showAlert('Link de convite copiado!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showAlert('Não foi possível copiar automaticamente.', 'error');
    }
  };

  const handleShare = async () => {
    const res = await nativeShare({ title: 'ValidaMais', text: inviteText, url: inviteUrl });
    if (res === 'shared') showAlert('Obrigado por divulgar! 💚', 'success');
    else if (res === 'unsupported') handleCopy();
  };

  // Visitante deslogado — precisa de conta para ter um link pessoal
  if (!user) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/25">
          <Gift className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-gray-900">Convide amigos e ganhe</h1>
        <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto">
          Crie sua conta grátis para receber seu link pessoal de convite e acompanhar suas recompensas.
        </p>
        <button
          onClick={() => navigateTo('cadastro')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-full cursor-pointer transition-all active:scale-95"
        >
          Criar conta grátis <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const referrals = count ?? 0;
  const nextTier = TIERS.find((t) => referrals < t.n);
  const progressBase = nextTier ? nextTier.n : TIERS[TIERS.length - 1].n;
  const progressPct = Math.min(100, Math.round((referrals / progressBase) * 100));

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-white shadow-2xl shadow-emerald-900/15 p-8 sm:p-10">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border border-white/20">
            <Gift className="w-3.5 h-3.5 text-lime-300" /> Programa de indicação
          </div>
          <h1 className="text-2xl sm:text-4xl font-black leading-tight tracking-tight">
            Convide amigos,<br /><span className="text-lime-300">salve mais comida.</span>
          </h1>
          <p className="text-sm sm:text-base text-emerald-50/85 font-medium max-w-md">
            Compartilhe seu link. A cada amigo que entrar por você, você desbloqueia recompensas — e menos comida vai pro lixo.
          </p>

          {/* Invite link */}
          <div className="bg-white rounded-2xl p-2 flex items-center gap-2 max-w-lg shadow-lg">
            <div className="flex-1 min-w-0 px-3">
              <div className="text-[9px] font-black text-emerald-600 font-mono uppercase tracking-wider">Seu link de convite</div>
              <div className="text-xs sm:text-sm font-bold text-gray-800 truncate font-mono">{inviteUrl}</div>
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-black rounded-xl cursor-pointer transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-emerald-800 text-sm font-black rounded-full shadow-lg hover:shadow-xl cursor-pointer transition-all active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4" /> {hasNativeShare() ? 'Compartilhar convite' : 'Enviar convite'}
          </button>
        </div>
      </section>

      {/* Progress + count */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-gray-900 leading-none flex items-center gap-2">
                {count === null ? <Loader2 className="w-5 h-5 animate-spin text-gray-300" /> : referrals}
                <span className="text-sm font-bold text-gray-500">amig{referrals === 1 ? 'o' : 'os'} indicad{referrals === 1 ? 'o' : 'os'}</span>
              </div>
              <p className="text-xs text-gray-500 font-semibold mt-0.5">
                {nextTier
                  ? `Faltam ${nextTier.n - referrals} para: ${nextTier.titulo}`
                  : 'Você desbloqueou todas as recompensas — obrigado! 💚'}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </section>

      {/* Reward tiers */}
      <section className="space-y-3">
        <h2 className="text-lg font-black text-gray-900">Recompensas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TIERS.map((t) => {
            const unlocked = referrals >= t.n;
            return (
              <div
                key={t.n}
                className={`rounded-2xl border p-4 transition-all ${
                  unlocked ? 'border-emerald-300 bg-emerald-50/60' : 'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${unlocked ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {t.icon}
                  </div>
                  {unlocked ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Liberado
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-gray-400 font-mono">{t.n} amigos</span>
                  )}
                </div>
                <h3 className="text-sm font-black text-gray-900 mt-3 leading-tight">{t.titulo}</h3>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">{t.desc}</p>
                {t.n === 3 && unlocked && !isClubeAtivo(user) && (
                  <button
                    onClick={handleClaimClube}
                    disabled={claiming}
                    className="mt-2.5 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black rounded-lg cursor-pointer transition-all active:scale-95 disabled:opacity-60"
                  >
                    {claiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Ticket className="w-3.5 h-3.5" />}
                    Garantir Clube grátis pra sempre
                  </button>
                )}
                {t.n === 3 && unlocked && isClubeAtivo(user) && (
                  <span className="mt-2.5 inline-flex items-center gap-1 text-[10px] font-black text-indigo-700"><Check className="w-3 h-3" /> Clube ativo</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-gray-400 font-medium">
          As recompensas de Clube são resgatadas quando a assinatura estiver disponível. Os selos valem desde já.
        </p>
      </section>

      {/* Como funciona */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: <Share2 className="w-5 h-5" />, t: 'Compartilhe', d: 'Envie seu link para amigos por WhatsApp, Instagram ou onde quiser.' },
          { icon: <UserPlus className="w-5 h-5" />, t: 'Eles entram', d: 'Ao criar a conta pelo seu link, a indicação conta automaticamente.' },
          { icon: <Sparkles className="w-5 h-5" />, t: 'Você ganha', d: 'A cada meta, uma recompensa desbloqueia no seu perfil.' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">{s.icon}</div>
            <div>
              <h3 className="text-sm font-black text-gray-900">{s.t}</h3>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-0.5">{s.d}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="text-center pt-2">
        <button
          onClick={() => navigateTo('produtos')}
          className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 hover:text-emerald-700 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" /> Explorar ofertas
        </button>
      </div>
    </div>
  );
};
