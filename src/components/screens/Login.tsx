/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Mail, Lock, LogIn, Eye, EyeOff, Leaf, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl flex rounded-3xl overflow-hidden shadow-xl border border-white/60">

        {/* Left Panel — Brand (desktop only) */}
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white p-10 w-5/12 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-0 bottom-0 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border border-emerald-500/25">
              <Leaf className="w-3 h-3" />
              ValidaMais
            </div>
            <h1 className="text-3xl font-black leading-snug">
              Salve alimentos,<br />
              <span className="text-emerald-400">economize muito.</span>
            </h1>
            <p className="text-xs text-emerald-100/75 leading-relaxed font-sans max-w-xs">
              Conectamos você a mercados locais que vendem lotes excelentes com até <strong className="text-emerald-300">70% de desconto</strong> antes do vencimento.
            </p>
          </div>

          <div className="space-y-4 relative z-10">
            {[
              { icon: '🛒', title: 'Reserve Online', desc: 'Escolha e reserve sem pagamento antecipado' },
              { icon: '🏪', title: 'Retire na Loja', desc: 'Apresente o e-mail de confirmação no balcão' },
              { icon: '💳', title: 'Pague no Caixa', desc: 'Finalize com o método de sua escolha' },
            ].map((step) => (
              <div key={step.title} className="flex items-center gap-3.5">
                <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-base shrink-0">
                  {step.icon}
                </div>
                <div>
                  <span className="text-[11px] font-black text-white block leading-none">{step.title}</span>
                  <span className="text-[10px] text-emerald-200/60 font-medium mt-0.5 block">{step.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel — Form */}
        <div className="flex-1 bg-white/80 backdrop-blur-sm p-8 md:p-10 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full space-y-6">

            {/* Header */}
            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">Bem-vindo de volta</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Entre na sua conta para continuar</p>
            </div>

            {/* Google Sign-In */}
            {typeof window !== 'undefined' && window.self === window.top && (
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="w-full py-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 text-gray-700 text-sm font-semibold rounded-xl shadow-xs hover:shadow-sm cursor-pointer transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <GoogleIcon />
                Entrar com Google
              </button>
            )}

            {/* Separator */}
            <div className="relative flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider shrink-0">
                ou com e-mail
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 font-mono uppercase tracking-wide">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 font-mono uppercase tracking-wide">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm pl-10 pr-11 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 transition-all"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
              >
                {loading ? (
                  <span className="font-mono">Entrando...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Entrar na Plataforma
                  </>
                )}
              </button>
            </form>

            {/* Security note */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Conexão segura e dados criptografados
            </div>

            {/* Footer links */}
            <div className="pt-3 border-t border-gray-100 flex flex-col items-center gap-2.5 text-center">
              <button
                onClick={() => navigateTo('cadastro')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-colors cursor-pointer"
              >
                Primeira vez? Crie uma conta gratuita
              </button>
              <button
                onClick={() => navigateTo('home')}
                className="text-[10px] text-gray-400 hover:text-gray-600 font-medium transition-colors cursor-pointer"
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
