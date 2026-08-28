/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Mail, Lock, ArrowRight, Eye, EyeOff, Leaf, ShieldCheck, MapPin, Clock, Sparkles } from 'lucide-react';

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path fill="#EA4335" d="M12.04 5.01c1.55 0 2.94.53 4.04 1.58l3.01-3c-1.83-1.7-4.22-2.73-7.05-2.73C7.22.86 3.19 3.56 1.15 7.5l3.87 3c.91-2.72 3.44-4.49 7.02-4.49z"/>
    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.46c-.29 1.48-1.12 2.73-2.38 3.58l3.71 2.88c2.16-1.99 3.7-4.91 3.7-8.62z"/>
    <path fill="#FBBC05" d="M5.02 14.5c-.24-.72-.37-1.48-.37-2.27s.13-1.55.37-2.27L1.15 7.5C.3 9.22 0 10.97 0 12.23s.3 3.01.85 4.73l4.17-2.46z"/>
    <path fill="#34A853" d="M12 23.14c3.24 0 5.96-1.07 7.95-2.91l-3.71-2.88c-1.04.7-2.36 1.12-4.24 1.12-3.58 0-6.11-1.77-7.02-4.49l-3.87 3c2.04 3.94 6.07 6.66 10.89 6.66z"/>
  </svg>
);

export const LoginValida: React.FC = () => {
  const { loginUser, loginWithGoogle, navigateTo } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
    } catch {
      // handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      // handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center py-4 sm:py-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.05fr_1fr] rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-900/10 border border-white/60 bg-white">

        {/* ─────────────── Brand hero ─────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 text-white px-8 py-10 sm:px-10 sm:py-12 flex flex-col justify-between gap-8 min-h-[240px]">
          {/* ambient glows */}
          <div className="absolute -right-16 -top-16 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 bottom-0 w-56 h-56 bg-lime-300/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none"
               style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />

          {/* top: brand + headline */}
          <div className="relative z-10 space-y-5">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-white/20">
              <Leaf className="w-3.5 h-3.5 text-lime-300" />
              ValidaMais
            </div>
            <h1 className="text-3xl sm:text-4xl font-black leading-[1.1] tracking-tight max-w-sm">
              Salve alimentos,<br />
              <span className="text-lime-300">pague muito menos.</span>
            </h1>
            <p className="text-sm text-emerald-50/85 leading-relaxed max-w-xs font-medium">
              Reserve lotes de mercados locais com até <strong className="text-white">70% de desconto</strong> e ajude a combater o desperdício.
            </p>
          </div>

          {/* floating "sacola surpresa" card */}
          <div className="relative z-10">
            <div className="bg-white rounded-3xl p-4 shadow-xl shadow-emerald-950/30 max-w-[19rem] rotate-[-1.5deg] hover:rotate-0 transition-transform duration-300">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-emerald-100 flex items-center justify-center text-2xl shrink-0">
                  🥐
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-black text-gray-900 truncate">Padaria Delícia</span>
                    <span className="text-[10px] font-black text-white bg-emerald-600 px-2 py-0.5 rounded-full shrink-0">-65%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-400 font-semibold">
                    <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" /> 1,2 km</span>
                    <span className="inline-flex items-center gap-0.5"><Clock className="w-3 h-3" /> até 19h</span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <span className="text-lg font-black text-emerald-600 leading-none">R$ 9,90</span>
                    <span className="text-[11px] text-gray-400 line-through font-semibold">R$ 28,00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* bottom: trust stat */}
          <div className="relative z-10 hidden sm:flex items-center gap-6 text-emerald-50/90">
            <div>
              <div className="text-2xl font-black text-white leading-none">+2 mil</div>
              <div className="text-[11px] font-semibold text-emerald-100/70 mt-1">lotes salvos</div>
            </div>
            <div className="w-px h-9 bg-white/15" />
            <div>
              <div className="text-2xl font-black text-white leading-none">70%</div>
              <div className="text-[11px] font-semibold text-emerald-100/70 mt-1">de desconto médio</div>
            </div>
          </div>
        </div>

        {/* ─────────────── Form panel ─────────────── */}
        <div className="px-7 py-9 sm:px-10 sm:py-12 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full space-y-6">

            {/* Header */}
            <div className="space-y-1">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight tracking-tight">
                Bem-vindo de volta 👋
              </h2>
              <p className="text-sm text-gray-500 font-medium">
                Entre para reservar suas sacolas surpresa.
              </p>
            </div>

            {/* Google Sign-In (pill) */}
            {typeof window !== 'undefined' && window.self === window.top && (
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="w-full py-3.5 bg-white border-2 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40 text-gray-700 text-sm font-bold rounded-full shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98]"
              >
                <GoogleIcon />
                Continuar com Google
              </button>
            )}

            {/* Separator */}
            <div className="relative flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest shrink-0">
                ou com e-mail
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 tracking-wide pl-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm pl-11 pr-4 py-3.5 border-2 border-gray-100 bg-gray-50/70 focus:bg-white rounded-2xl focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 tracking-wide pl-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm pl-11 pr-12 py-3.5 border-2 border-gray-100 bg-gray-50/70 focus:bg-white rounded-2xl focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-full shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] mt-1"
              >
                {loading ? (
                  <span>Entrando...</span>
                ) : (
                  <>
                    Entrar na plataforma
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Security note */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Conexão segura e dados criptografados
            </div>

            {/* Footer links */}
            <div className="pt-4 border-t border-gray-100 text-center space-y-3">
              <p className="text-sm text-gray-500 font-medium">
                Primeira vez por aqui?{' '}
                <button
                  onClick={() => navigateTo('cadastro')}
                  className="text-emerald-600 hover:text-emerald-700 font-black transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Criar conta grátis
                </button>
              </p>
              <button
                onClick={() => navigateTo('home')}
                className="text-xs text-gray-400 hover:text-gray-600 font-semibold transition-colors cursor-pointer"
              >
                Voltar para a vitrine pública
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
