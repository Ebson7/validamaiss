/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  ShoppingBag,
  Mail,
  Lock,
  User,
  Phone,
  UserPlus,
  HelpCircle,
  CheckCircle,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  MailCheck
} from 'lucide-react';

export const CadastroValida: React.FC = () => {
  const { registerUser, loginWithGoogle, navigateTo, showAlert, emailVerificationPending, resendVerificationEmail, confirmEmailVerified } = useApp();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  // Transition to verification view when the context signals email pending
  const [isVerifying, setIsVerifying] = useState(false);
  useEffect(() => {
    if (emailVerificationPending) {
      setIsVerifying(true);
    }
  }, [emailVerificationPending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !password) return;

    if (password.length < 6) {
      showAlert('A sua senha precisa ter no mínimo 6 caracteres.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await registerUser(email.trim(), password, nome.trim(), role, telefone.trim() || undefined);
    } catch {
      // Errors handled inside context
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
    } finally {
      setIsResending(false);
    }
  };

  const handleConfirmVerified = async () => {
    setIsCheckingVerification(true);
    try {
      await confirmEmailVerified();
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await loginWithGoogle(role);
    } catch {
      // Handled inside AppContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="signup_screen_container" className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md glass rounded-3xl border-white/45 p-8 shadow-sm transition-all duration-300">

        {isVerifying ? (
          /* EMAIL VERIFICATION PENDING VIEW */
          <div className="space-y-6">
            {/* Back button */}
            <button
              type="button"
              onClick={() => setIsVerifying(false)}
              className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-850 font-bold cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar e editar dados</span>
            </button>

            {/* Header */}
            <div className="text-center">
              <div className="inline-flex bg-emerald-50 text-emerald-600 p-4 rounded-2xl border border-emerald-100 shadow-sm mb-4">
                <MailCheck className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-black text-gray-900 leading-snug">Verifique o seu E-mail</h1>
              <p className="text-xs text-gray-500 mt-2.5 leading-relaxed">
                Enviamos um link de ativação para
                <strong className="text-gray-700 font-bold block mt-1 text-sm">{email}</strong>
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                <p className="text-gray-700 text-xs leading-relaxed">Abra a caixa de entrada do e-mail <strong>{email}</strong></p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                <p className="text-gray-700 text-xs leading-relaxed">Clique no link <strong>"Verificar endereço de e-mail"</strong> no e-mail enviado pelo ValidaMais</p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                <p className="text-gray-700 text-xs leading-relaxed">Volte aqui e clique em <strong>"Já verifiquei meu e-mail"</strong> para acessar a plataforma</p>
              </div>
            </div>

            {/* Tip: check spam */}
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50/70 border border-amber-100 rounded-xl px-3.5 py-2.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Não encontrou o e-mail? Verifique a pasta de <strong>spam</strong> ou <strong>promoções</strong>.</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                id="confirm_verified_btn"
                type="button"
                onClick={handleConfirmVerified}
                disabled={isCheckingVerification}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCheckingVerification ? (
                  <span className="font-mono">Verificando...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Já verifiquei meu e-mail
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResendEmail}
                disabled={isResending}
                className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                {isResending ? 'Reenviando...' : 'Reenviar e-mail de verificação'}
              </button>
            </div>
          </div>
        ) : (
          /* STANDARD SIGNUP FORM VIEW */
          <>
            {/* Brand Header */}
            <div className="text-center mb-6">
              <div className="inline-flex bg-emerald-600 text-white p-3.5 rounded-2xl shadow-md mb-3">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 leading-none">Crie sua Conta</h1>
              <p className="text-xs text-gray-500 mt-2 font-mono uppercase tracking-wider">Cadastre-se no ValidaMais</p>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User Full Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="cadastro_name_input"
                    type="text"
                    required
                    placeholder="Ex: Maria Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 ps-10 border border-gray-200 bg-white/40 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* User Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Endereço de E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="cadastro_email_input"
                    type="email"
                    required
                    placeholder="Ex: maria.silva@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 ps-10 border border-gray-200 bg-white/40 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">
                  Telefone <span className="normal-case font-normal text-gray-400">(opcional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="cadastro_phone_input"
                    type="tel"
                    placeholder="Ex: (11) 9 9999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    maxLength={20}
                    className="w-full text-sm px-4 py-2.5 ps-10 border border-gray-200 bg-white/40 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* User Password */}
              <div>
                <label className="block text-xs font-bold text-gray-500 font-mono uppercase mb-1">Definir Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="cadastro_password_input"
                    type="password"
                    required
                    placeholder="Mínimo de 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-sm px-4 py-2.5 ps-10 border border-gray-200 bg-white/40 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* User Role Selection */}
              <div className="grid grid-cols-2 gap-3.5 pt-1.5">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between h-24 ${
                    role === 'user'
                      ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/10'
                      : 'border-white/50 bg-white/30 hover:border-gray-300'
                  }`}
                >
                  <span className={`text-[10px] font-bold font-mono uppercase ${role === 'user' ? 'text-emerald-700' : 'text-gray-405'}`}>Consumidor</span>
                  <p className="text-[10.5px] text-gray-600 font-medium leading-tight">Quero comprar produtos com desconto de validade</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('lojista')}
                  className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between h-24 ${
                    role === 'lojista'
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/10'
                      : 'border-white/50 bg-white/30 hover:border-gray-300'
                  }`}
                >
                  <span className={`text-[10px] font-bold font-mono uppercase ${role === 'lojista' ? 'text-amber-700' : 'text-gray-405'}`}>Lojista</span>
                  <p className="text-[10.5px] text-gray-600 font-medium leading-tight">Represento um mercado próximo</p>
                </button>
              </div>

              {/* Register Button */}
              <button
                id="cadastro_submit_btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span className="font-mono">Processando...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Criar Conta e Verificar E-mail
                  </>
                )}
              </button>
            </form>

            {/* Separator */}
            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200/80" /></div>
              <span className="relative bg-[#f8fafc]/95 px-3.5 py-0.5 rounded-full text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider">Ou registre-se com</span>
            </div>

            {/* Google Authentication Button */}
            {typeof window !== 'undefined' && window.self !== window.top && (
              <div className="mb-4 p-3.5 bg-amber-50/70 border border-amber-200 text-xs text-amber-900 rounded-xl space-y-1 text-left leading-relaxed shadow-2xs">
                <span className="font-bold text-amber-950 block">⚠️ Restrição de Cookies do Iframe</span>
                <p className="text-[10.5px]">
                  O cadastro com o Google poderá falhar no visualizador do editor por restrições de cookies em iframes.
                  Ao ver um erro, <strong>abra esta aplicação em uma aba externa</strong> para cadastrar-se perfeitamente.
                </p>
              </div>
            )}

            <button
              id="cadastro_google_btn"
              type="button"
              disabled={loading}
              onClick={handleGoogleSignUp}
              className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs hover:shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <svg className="w-4 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.04 5.01c1.55 0 2.94.53 4.04 1.58l3.01-3c-1.83-1.7-4.22-2.73-7.05-2.73C7.22.86 3.19 3.56 1.15 7.5l3.87 3c.91-2.72 3.44-4.49 7.02-4.49z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.46c-.29 1.48-1.12 2.73-2.38 3.58l3.71 2.88c2.16-1.99 3.7-4.91 3.7-8.62z"/>
                <path fill="#FBBC05" d="M5.02 14.5c-.24-.72-.37-1.48-.37-2.27s.13-1.55.37-2.27L1.15 7.5C.3 9.22 0 10.97 0 12.23s.3 3.01.85 4.73l4.17-2.46z" />
                <path fill="#34A853" d="M12 23.14c3.24 0 5.96-1.07 7.95-2.91l-3.71-2.88c-1.04.7-2.36 1.12-4.24 1.12-3.58 0-6.11-1.77-7.02-4.49l-3.87 3c2.04 3.94 6.07 6.66 10.89 6.66z"/>
              </svg>
              Cadastrar com conta Google
            </button>

            {/* Back navigation options */}
            <div className="mt-5 pt-4 border-t border-white/60 flex flex-col items-center gap-2 text-center">
              <button
                type="button"
                onClick={() => navigateTo('login')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-colors cursor-pointer"
              >
                Já possui uma conta ativa? Faça o login por aqui
              </button>
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="text-xs text-gray-400 hover:text-gray-650 font-medium transition-colors cursor-pointer text-[10px]"
              >
                Sair e voltar para a página inicial
              </button>
            </div>

            {/* Developer help */}
            <div className="mt-5 pt-4 border-t border-dashed border-white/60 text-center">
              <details className="text-left">
                <summary className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Problemas ao cadastrar? Veja dicas de configuração.
                </summary>
                <div className="mt-3 p-3 bg-white/50 border border-white/30 text-left rounded-xl text-[10px] text-slate-600 leading-relaxed space-y-2 backdrop-blur-sm shadow-xs">
                  <span className="font-bold text-slate-800 block">Configuração do Firebase:</span>
                  <ol className="list-decimal pl-4 space-y-1 font-sans">
                    <li>Firebase Console → Authentication → Sign-in method</li>
                    <li>Ative <strong>E-mail/Senha</strong> e <strong>Google</strong></li>
                    <li>Para Google: configure o e-mail de suporte e salve</li>
                  </ol>
                </div>
              </details>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
