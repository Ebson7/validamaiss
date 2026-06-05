/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingBag, Mail, Lock, LogIn, Sparkles, HelpCircle } from 'lucide-react';

export const LoginValida: React.FC = () => {
  const { loginUser, loginWithGoogle, navigateTo } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfigTip, setShowConfigTip] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await loginUser(email.trim(), password);
    } catch {
      // Error handles inside context
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      // Error handles inside context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login_screen_container" className="min-h-[75vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md glass rounded-3xl border-white/45 p-8 shadow-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-emerald-600 text-white p-3.5 rounded-2xl shadow-md mb-3.5">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 leading-tight">Acesse o ValidaMais</h1>
          <p className="text-xs font-semibold text-gray-500 mt-1 font-mono tracking-wide uppercase">Economia e sustentabilidade combinadas</p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 font-mono uppercase mb-1.5">Endereço de E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                id="login_email_input"
                type="email"
                required
                placeholder="Ex: cliente@validamais.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm ps-10 pe-4 py-2.5 border border-gray-200 bg-white/40 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 font-mono uppercase mb-1.5 font-sans">Sua Senha</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                id="login_password_input"
                type="password"
                required
                placeholder="Abaixo de 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm ps-10 pe-4 py-2.5 border border-gray-200 bg-white/40 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            id="login_submit_btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="font-mono">Carregando...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Acessar Plataforma
              </>
            )}
          </button>
        </form>

        {/* Separator */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200/80" /></div>
          <span className="relative bg-[#f8fafc]/95 px-3.5 py-0.5 rounded-full text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider">Ou acesse com</span>
        </div>

        {/* Google Authentication Button */}
        {typeof window !== 'undefined' && window.self !== window.top && (
          <div className="mb-4.5 p-3.5 bg-amber-50/70 border border-amber-200 text-xs text-amber-805 text-amber-900 rounded-xl space-y-1 text-left leading-relaxed font-sans shadow-2xs">
            <span className="font-bold text-amber-950 block flex items-center gap-1">
              ⚠️ Restrição de Cookies do Iframe
            </span>
            <p className="text-[10.5px]">
              O login com o Google poderá falhar temporariamente no visualizador do editor por conta de restrições de cookies do navegador em iframes. 
              Caso veja um erro de login, <strong>abra esta aplicação em uma aba externa</strong> clicando no ícone no canto superior direito para entrar perfeitamente!
            </p>
          </div>
        )}

        <button
          id="login_google_btn"
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs hover:shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
        >
          <svg className="w-4 h-3.5 shrink-0" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12.04 5.01c1.55 0 2.94.53 4.04 1.58l3.01-3c-1.83-1.7-4.22-2.73-7.05-2.73C7.22.86 3.19 3.56 1.15 7.5l3.87 3c.91-2.72 3.44-4.49 7.02-4.49z"/>
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.46c-.29 1.48-1.12 2.73-2.38 3.58l3.71 2.88c2.16-1.99 3.7-4.91 3.7-8.62z"/>
            <path fill="#FBBC05" d="M5.02 14.5c-.24-.72-.37-1.48-.37-2.27s.13-1.55.37-2.27L1.15 7.5C.3 9.22 0 10.97 0 12.23s.3 3.01.85 4.73l4.17-2.46z" />
            <path fill="#34A853" d="M12 23.14c3.24 0 5.96-1.07 7.95-2.91l-3.71-2.88c-1.04.7-2.36 1.12-4.24 1.12-3.58 0-6.11-1.77-7.02-4.49l-3.87 3c2.04 3.94 6.07 6.66 10.89 6.66z"/>
          </svg>
          Entrar com conta Google
        </button>

        {/* Quick Access Buttons */}
        <div className="mt-5 p-4 rounded-2xl bg-white/40 border border-white/40 space-y-2">
          <p className="text-[10px] text-center font-bold text-gray-500 font-mono uppercase tracking-wider">Acesso Rápido de Teste (Sem digitação)</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setEmail('cliente@validamais.com');
                setPassword('123456');
                loginUser('cliente@validamais.com', '123456');
              }}
              className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-[10.5px] font-bold text-emerald-800 rounded-lg border border-emerald-200 transition-colors cursor-pointer text-center"
            >
              Consumidor
            </button>
            <button
              onClick={() => {
                setEmail('admin@validamais.com');
                setPassword('123456');
                loginUser('admin@validamais.com', '123456');
              }}
              className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-[10.5px] font-bold text-amber-805 text-amber-800 rounded-lg border border-amber-200 transition-colors cursor-pointer text-center"
            >
              Lojista (Admin)
            </button>
          </div>
        </div>

        {/* Navigation back and registration links */}
        <div className="mt-6 pt-5 border-t border-white/60 flex flex-col items-center gap-3">
          <button
            onClick={() => navigateTo('cadastro')}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-colors cursor-pointer"
          >
            Primeira vez por aqui? Crie uma conta grátis
          </button>
          
          <button
            onClick={() => navigateTo('home')}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors cursor-pointer font-sans"
          >
            Voltar para a vitrine pública
          </button>
        </div>

        {/* Configuration Advice Help Box */}
        <div className="mt-8 pt-4 border-t border-dashed border-white/60 text-center">
          <button
            type="button"
            onClick={() => setShowConfigTip(!showConfigTip)}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Problemas ao conectar no Firebase? Veja esta dica.
          </button>
          {showConfigTip && (
            <div className="mt-3 p-3 bg-white/50 border border-white/30 text-left rounded-xl text-[10px] text-slate-600 leading-relaxed space-y-2.5 backdrop-blur-sm shadow-xs">
              <span className="font-bold text-slate-800 block">Dica para o Desenvolvedor:</span>
              <p>Certifique-se de ativar os provedores de login com <strong>E-mail/Senha</strong> e <strong>Google</strong> no Firebase Console:</p>
              <div className="space-y-1">
                <span className="font-bold text-slate-705 text-[9px] uppercase tracking-wider block text-slate-700">Para E-mail e Senha:</span>
                <ol className="list-decimal pl-4 space-y-0.5 font-sans">
                  <li>Acesse o Firebase Console</li>
                  <li>Vá até <strong>Authentication &gt; Sign-in method</strong></li>
                  <li>Adicione <strong>E-mail/Senha</strong>, habilite e salve.</li>
                </ol>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-705 text-[9px] uppercase tracking-wider block text-slate-700">Para Google Sign-In:</span>
                <ol className="list-decimal pl-4 space-y-0.5 font-sans">
                  <li>Acesse o Firebase Console</li>
                  <li>Vá até <strong>Authentication &gt; Sign-in method</strong></li>
                  <li>Adicione <strong>Google</strong>, configure as credenciais, o e-mail de suporte e salve.</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
