/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { 
  ShoppingBag, 
  Mail, 
  Lock, 
  User, 
  UserPlus, 
  HelpCircle, 
  CheckCircle, 
  RefreshCw, 
  ArrowLeft, 
  Inbox, 
  AlertCircle 
} from 'lucide-react';

export const CadastroValida: React.FC = () => {
  const { registerUser, loginWithGoogle, navigateTo, showAlert } = useApp();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(false);

  // Email Validation flow states
  const [isVerifying, setIsVerifying] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [verificationError, setVerificationError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [showSimulator, setShowSimulator] = useState(true);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Form submission: steps into validation flow
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !password) return;

    if (password.length < 6) {
      showAlert('A sua senha precisa ter no mínimo 6 caracteres.', 'warning');
      return;
    }

    // Generate random 6-digit validation code
    const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(randomCode);
    setCodeDigits(['', '', '', '', '', '']);
    setVerificationError('');
    setIsVerifying(true);
    
    showAlert(`Código de ativação gerado e enviado com sucesso para ${email.trim()}!`, 'success');
  };

  const handleDigitChange = (val: string, idx: number) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (cleanVal === '') {
      const updated = [...codeDigits];
      updated[idx] = '';
      setCodeDigits(updated);
      return;
    }

    const updated = [...codeDigits];
    
    // If user pastes code
    if (cleanVal.length > 1) {
      const pastedCode = cleanVal.slice(0, 6).split('');
      const newDigits = [...codeDigits];
      pastedCode.forEach((char, pIdx) => {
        if (pIdx < 6) newDigits[pIdx] = char;
      });
      setCodeDigits(newDigits);
      const focusIdx = Math.min(pastedCode.length, 5);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    updated[idx] = cleanVal;
    setCodeDigits(updated);
    setVerificationError('');

    // Focus next input automatically
    if (idx < 5) {
      setTimeout(() => {
        inputRefs.current[idx + 1]?.focus();
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      if (codeDigits[idx] === '') {
        if (idx > 0) {
          const updated = [...codeDigits];
          updated[idx - 1] = '';
          setCodeDigits(updated);
          inputRefs.current[idx - 1]?.focus();
        }
      } else {
        const updated = [...codeDigits];
        updated[idx] = '';
        setCodeDigits(updated);
      }
      setVerificationError('');
    }
  };

  // Resend code simulated handler
  const handleResendCode = () => {
    setIsResending(true);
    setTimeout(() => {
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(newCode);
      setCodeDigits(['', '', '', '', '', '']);
      setVerificationError('');
      setIsResending(false);
      showAlert('Novo código de verificação reenviado para o seu e-mail!', 'success');
    }, 800);
  };

  // Submit code to finish register
  const handleVerifyAndRegister = async () => {
    const enteredCode = codeDigits.join('');
    if (enteredCode.length < 6) {
      setVerificationError('Por favor, informe todos os 6 dígitos.');
      return;
    }

    if (enteredCode !== generatedCode) {
      setVerificationError('Código inválido ou incorreto. Confira e tente novamente.');
      showAlert('Código de verificação incorreto.', 'error');
      return;
    }

    setLoading(true);
    setVerificationError('');
    try {
      await registerUser(email.trim(), password, nome.trim(), role);
    } catch (err: any) {
      setVerificationError(err.message || 'Ocorreu um erro ao finalizar o seu cadastro.');
    } finally {
      setLoading(false);
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
          /* EMAIL CODE VERIFICATION VIEW */
          <div className="space-y-5">
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
            <div className="text-center mb-4">
              <div className="inline-flex bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100 shadow-sm mb-3">
                <Mail className="w-6 h-6 animate-pulse" />
              </div>
              <h1 className="text-xl font-black text-gray-900 leading-none">Verifique o seu E-mail</h1>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Insira o código de 6 dígitos enviado para <strong className="text-gray-700 font-bold block mt-0.5">{email}</strong>
              </p>
            </div>

            {/* 6-Digit PIN Fields */}
            <div className="space-y-4">
              <div className="flex justify-between gap-2.5 max-w-sm mx-auto" id="otp_container">
                {codeDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(e.target.value, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-gray-200 bg-white/50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all"
                  />
                ))}
              </div>

              {/* Verification Error */}
              {verificationError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold leading-snug">{verificationError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <button
                id="verify_code_submit_btn"
                type="button"
                onClick={handleVerifyAndRegister}
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="font-mono">Validando...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirmar e Ativar Conta
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/60">
                <span className="text-gray-500">Não recebeu o código?</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                  Reenviar código
                </button>
              </div>
            </div>

            {/* LIVE EMAIL SIMULATOR DECK */}
            <div className="mt-5 border border-emerald-100 bg-emerald-50/40 rounded-2xl p-4 shadow-3xs space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-wider uppercase text-emerald-800 font-mono flex items-center gap-1.5">
                  <Inbox className="w-3.5 h-3.5" />
                  Servidor de E-mail (Developer Sandbox)
                </span>
                <button
                  type="button"
                  onClick={() => setShowSimulator(!showSimulator)}
                  className="text-[10px] text-emerald-700 hover:underline font-bold font-mono transition-all cursor-pointer"
                >
                  {showSimulator ? '[Ocultar]' : '[Visualizar]'}
                </button>
              </div>
              
              {showSimulator && (
                <div className="bg-slate-900 text-slate-100 rounded-xl p-3.5 text-xs font-mono border border-slate-800 space-y-2 mt-1 relative overflow-hidden select-all">
                  <div className="absolute right-2 top-2 bg-emerald-500/20 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded border border-emerald-500/30 font-bold uppercase tracking-wide">
                    E-mail Enviado
                  </div>
                  <div className="space-y-1 text-slate-400 border-b border-slate-800/80 pb-2 mb-2">
                    <div><strong className="text-white">De:</strong> nao-responder@validamais.com.br</div>
                    <div><strong className="text-white">Para:</strong> {email}</div>
                    <div><strong className="text-white">Componente:</strong> CodigoVerificacao</div>
                  </div>
                  <div className="space-y-2 pt-1 text-[11px] leading-relaxed">
                    <p className="text-emerald-400">Olá, <strong className="text-white">{nome}</strong>!</p>
                    <p className="text-slate-300">Use o seguinte código de validação para concluir o cadastro da sua conta no <strong>ValidaMais ({role === 'admin' ? 'Lojista' : 'Consumidor'})</strong>:</p>
                    <div className="bg-slate-950/80 py-2 rounded-lg text-center border border-slate-800/50 my-2 select-all">
                      <span className="text-xl font-black tracking-[0.25em] text-emerald-400">{generatedCode}</span>
                    </div>
                    <p className="text-[9.5px] text-slate-500">Este código expira em 10 minutos. Se não foi você quem solicitou, ignore.</p>
                  </div>
                  <div className="border-t border-slate-800/70 pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        const chars = generatedCode.split('');
                        setCodeDigits(chars);
                        showAlert('Código copiado do simulador!', 'success');
                      }}
                      className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-bold cursor-pointer text-[9px] uppercase tracking-wider transition-colors"
                    >
                      Preencher Código
                    </button>
                  </div>
                </div>
              )}
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
                  onClick={() => setRole('admin')}
                  className={`p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col justify-between h-24 ${
                    role === 'admin'
                      ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/10'
                      : 'border-white/50 bg-white/30 hover:border-gray-300'
                  }`}
                >
                  <span className={`text-[10px] font-bold font-mono uppercase ${role === 'admin' ? 'text-amber-700' : 'text-gray-405'}`}>Lojista</span>
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
                    Registrar Conta
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
              <div className="mb-4.5 p-3.5 bg-amber-50/70 border border-amber-200 text-xs text-amber-805 text-amber-900 rounded-xl space-y-1 text-left leading-relaxed font-sans shadow-2xs">
                <span className="font-bold text-amber-950 block flex items-center gap-1">
                  ⚠️ Restrição de Cookies do Iframe
                </span>
                <p className="text-[10.5px]">
                  O cadastro com o Google poderá falhar temporariamente no visualizador do editor por conta de restrições de cookies do navegador em iframes. 
                  Ao ver um erro, <strong>abra esta aplicação em uma aba externa</strong> clicando no ícone no canto superior direito para cadastrar-se perfeitamente!
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
                <path fill="#34A853" d="M12 23.14c3.24 0 5.96-1.07 7.95-2.91l-3.71-2.88c-1.04.7-2.36 1.12-4.24 1.12-3.58 0-6.11-1.77-7.02-4.49l-3.87 3c2.04 3.94 6.07 6.66 12 23.14c3.24 0 5.96-1.07 7.95-2.91l-3.71-2.88c-1.04.7-2.36 1.12-4.24 1.12-3.58 0-6.11-1.77-7.02-4.49l-3.87 3c2.04 3.94 6.07 6.66 10.89 6.66z"/>
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
          </>
        )}

      </div>
    </div>
  );
};
