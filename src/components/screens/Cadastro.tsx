/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Mail, Lock, User, UserPlus, Eye, EyeOff,
  CheckCircle, RefreshCw, ArrowLeft, AlertCircle,
  ShieldCheck, Leaf, Store, ShoppingBag, Building2
} from 'lucide-react';

function maskCNPJ(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function validateCNPJ(cnpj: string): boolean {
  const s = cnpj.replace(/\D/g, '');
  if (s.length !== 14 || /^(\d)\1+$/.test(s)) return false;
  const calc = (len: number) => {
    let sum = 0;
    let w = len - 7;
    for (let i = 0; i < len; i++) {
      sum += parseInt(s[i]) * w--;
      if (w < 2) w = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === parseInt(s[12]) && calc(13) === parseInt(s[13]);
}

const GoogleIcon = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
    <path fill="#EA4335" d="M12.04 5.01c1.55 0 2.94.53 4.04 1.58l3.01-3c-1.83-1.7-4.22-2.73-7.05-2.73C7.22.86 3.19 3.56 1.15 7.5l3.87 3c.91-2.72 3.44-4.49 7.02-4.49z"/>
    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.46c-.29 1.48-1.12 2.73-2.38 3.58l3.71 2.88c2.16-1.99 3.7-4.91 3.7-8.62z"/>
    <path fill="#FBBC05" d="M5.02 14.5c-.24-.72-.37-1.48-.37-2.27s.13-1.55.37-2.27L1.15 7.5C.3 9.22 0 10.97 0 12.23s.3 3.01.85 4.73l4.17-2.46z"/>
    <path fill="#34A853" d="M12 23.14c3.24 0 5.96-1.07 7.95-2.91l-3.71-2.88c-1.04.7-2.36 1.12-4.24 1.12-3.58 0-6.11-1.77-7.02-4.49l-3.87 3c2.04 3.94 6.07 6.66 10.89 6.66z"/>
  </svg>
);

function getPasswordStrength(pw: string): { label: string; color: string; width: string; bars: number } {
  if (pw.length === 0) return { label: '', color: 'bg-gray-200', width: 'w-0', bars: 0 };
  if (pw.length < 6) return { label: 'Fraca', color: 'bg-rose-500', width: 'w-1/4', bars: 1 };
  if (pw.length < 8) return { label: 'Regular', color: 'bg-amber-500', width: 'w-2/4', bars: 2 };
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSymbol = /[^a-zA-Z0-9]/.test(pw);
  const score = (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSymbol ? 1 : 0);
  if (score >= 2) return { label: 'Forte', color: 'bg-emerald-500', width: 'w-full', bars: 4 };
  return { label: 'Boa', color: 'bg-emerald-400', width: 'w-3/4', bars: 3 };
}

export const CadastroValida: React.FC = () => {
  const { registerUser, loginWithGoogle, navigateTo, showAlert } = useApp();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole] = useState<UserRole>('user');
  const [cnpj, setCnpj] = useState('');
  const [cnpjError, setCnpjError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP step
  const [isVerifying, setIsVerifying] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [verificationError, setVerificationError] = useState('');
  const [isResending, setIsResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !password || !confirmPassword) return;

    if (password.length < 6) {
      showAlert('A senha precisa ter no mínimo 6 caracteres.', 'warning');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('As senhas não coincidem. Verifique e tente novamente.', 'warning');
      return;
    }

    if (role === 'lojista') {
      const stripped = cnpj.replace(/\D/g, '');
      if (stripped.length < 14) {
        setCnpjError('Informe o CNPJ completo (14 dígitos).');
        showAlert('CNPJ incompleto.', 'warning');
        return;
      }
      if (!validateCNPJ(cnpj)) {
        setCnpjError('CNPJ inválido. Verifique os dígitos e tente novamente.');
        showAlert('CNPJ inválido.', 'warning');
        return;
      }
      setCnpjError('');
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setCodeDigits(['', '', '', '', '', '']);
    setVerificationError('');
    setIsVerifying(true);
    showAlert(`Código de verificação enviado para ${email.trim()}!`, 'success');
  };

  const handleDigitChange = (val: string, idx: number) => {
    const clean = val.replace(/[^0-9]/g, '');
    if (clean === '') {
      const updated = [...codeDigits];
      updated[idx] = '';
      setCodeDigits(updated);
      return;
    }
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      const next = [...codeDigits];
      pasted.forEach((c, i) => { if (i < 6) next[i] = c; });
      setCodeDigits(next);
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
      return;
    }
    const updated = [...codeDigits];
    updated[idx] = clean;
    setCodeDigits(updated);
    setVerificationError('');
    if (idx < 5) setTimeout(() => inputRefs.current[idx + 1]?.focus(), 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      if (codeDigits[idx] === '' && idx > 0) {
        const updated = [...codeDigits];
        updated[idx - 1] = '';
        setCodeDigits(updated);
        inputRefs.current[idx - 1]?.focus();
      } else {
        const updated = [...codeDigits];
        updated[idx] = '';
        setCodeDigits(updated);
      }
      setVerificationError('');
    }
  };

  const handleResendCode = () => {
    setIsResending(true);
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      setCodeDigits(['', '', '', '', '', '']);
      setVerificationError('');
      setIsResending(false);
      showAlert('Novo código reenviado para o seu e-mail!', 'success');
    }, 800);
  };

  const handleVerifyAndRegister = async () => {
    const entered = codeDigits.join('');
    if (entered.length < 6) {
      setVerificationError('Preencha todos os 6 dígitos do código.');
      return;
    }
    if (entered !== generatedCode) {
      setVerificationError('Código incorreto. Confira o e-mail e tente novamente.');
      return;
    }
    setLoading(true);
    setVerificationError('');
    try {
      await registerUser(email.trim(), password, nome.trim(), role, role === 'lojista' ? cnpj : undefined);
    } catch (err: any) {
      setVerificationError(err.message || 'Erro ao finalizar o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await loginWithGoogle(role);
    } catch {
      // handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {isVerifying ? (
          /* ── OTP VERIFICATION SCREEN ── */
          <div className="glass rounded-3xl border-white/50 p-8 shadow-xl space-y-6">
            <button
              type="button"
              onClick={() => setIsVerifying(false)}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar e editar dados
            </button>

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-gray-900">Verifique seu e-mail</h2>
              <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                Enviamos um código de 6 dígitos para{' '}
                <strong className="text-gray-700 break-all">{email}</strong>.
                Verifique sua caixa de entrada e spam.
              </p>
            </div>

            {/* OTP digits */}
            <div className="space-y-4">
              <div className="flex justify-center gap-2.5" id="otp_container">
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
                    className="w-11 h-14 text-center text-xl font-black rounded-xl border-2 border-gray-200 bg-white focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:outline-none transition-all"
                  />
                ))}
              </div>

              {verificationError && (
                <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-semibold">{verificationError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleVerifyAndRegister}
                disabled={loading || codeDigits.join('').length < 6}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="font-mono">Validando...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Confirmar e Criar Conta
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gray-500">Não recebeu?</span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  {isResending ? 'Reenviando...' : 'Reenviar código'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              O código expira em 10 minutos
            </div>
          </div>

        ) : (
          /* ── REGISTRATION FORM ── */
          <div className="glass rounded-3xl border-white/50 p-8 shadow-xl space-y-6">

            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
                  <Leaf className="w-4 h-4" />
                </div>
                <span className="text-sm font-black text-emerald-700 tracking-tight">ValidaMais</span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 leading-tight">Crie sua conta</h1>
              <p className="text-sm text-gray-500 font-medium mt-1">Junte-se e comece a economizar hoje</p>
            </div>

            {/* Google Sign-Up */}
            {typeof window !== 'undefined' && window.self === window.top && (
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignUp}
                className="w-full py-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 text-gray-700 text-sm font-semibold rounded-xl shadow-xs hover:shadow-sm cursor-pointer transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <GoogleIcon />
                Cadastrar com Google
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 font-mono uppercase tracking-wide">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Maria Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full text-sm pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 font-mono uppercase tracking-wide">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="maria@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm pl-10 pr-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/15 transition-all"
                  />
                </div>
              </div>

              {/* CNPJ — lojistas only */}
              {role === 'lojista' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 font-mono uppercase tracking-wide">
                    CNPJ da Empresa <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) => {
                        setCnpj(maskCNPJ(e.target.value));
                        setCnpjError('');
                      }}
                      className={`w-full text-sm pl-10 pr-4 py-3 border bg-gray-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 transition-all font-mono tracking-wider ${
                        cnpjError
                          ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400/15'
                          : cnpj.replace(/\D/g,'').length === 14 && validateCNPJ(cnpj)
                          ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/15'
                          : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/15'
                      }`}
                    />
                    {cnpj.replace(/\D/g,'').length === 14 && validateCNPJ(cnpj) && (
                      <CheckCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                    )}
                  </div>
                  {cnpjError ? (
                    <p className="text-[10px] font-bold text-rose-500 font-mono flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {cnpjError}
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400 font-medium">
                      Necessário para ativar o perfil de lojista na plataforma
                    </p>
                  )}
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 font-mono uppercase tracking-wide">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
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
                {/* Password strength */}
                {password.length > 0 && (
                  <div className="space-y-1 pt-0.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            bar <= strength.bars ? strength.color : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p className={`text-[10px] font-bold font-mono ${
                        strength.bars <= 1 ? 'text-rose-500' :
                        strength.bars === 2 ? 'text-amber-500' : 'text-emerald-600'
                      }`}>
                        Senha {strength.label}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 font-mono uppercase tracking-wide">Confirmar senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Repita sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full text-sm pl-10 pr-11 py-3 border bg-gray-50 focus:bg-white rounded-xl focus:outline-none focus:ring-2 transition-all ${
                      passwordsMismatch
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400/15'
                        : passwordsMatch
                        ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/15'
                        : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/15'
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {passwordsMatch && (
                    <CheckCircle className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                  )}
                </div>
                {passwordsMismatch && (
                  <p className="text-[10px] font-bold text-rose-500 font-mono flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> As senhas não coincidem
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 font-mono uppercase tracking-wide">Tipo de conta</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('user')}
                    className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col gap-2 ${
                      role === 'user'
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/10'
                        : 'border-gray-200 bg-white/40 hover:border-gray-300'
                    }`}
                  >
                    <ShoppingBag className={`w-5 h-5 ${role === 'user' ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <div>
                      <span className={`text-xs font-black block ${role === 'user' ? 'text-emerald-800' : 'text-gray-700'}`}>
                        Consumidor
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium leading-tight">
                        Comprar com desconto
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('lojista')}
                    className={`p-4 rounded-2xl border-2 text-left cursor-pointer transition-all flex flex-col gap-2 ${
                      role === 'lojista'
                        ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/10'
                        : 'border-gray-200 bg-white/40 hover:border-gray-300'
                    }`}
                  >
                    <Store className={`w-5 h-5 ${role === 'lojista' ? 'text-amber-600' : 'text-gray-400'}`} />
                    <div>
                      <span className={`text-xs font-black block ${role === 'lojista' ? 'text-amber-800' : 'text-gray-700'}`}>
                        Lojista
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium leading-tight">
                        Cadastrar meu mercado
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || passwordsMismatch}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
              >
                {loading ? (
                  <span className="font-mono">Processando...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Criar Conta
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="pt-3 border-t border-gray-100 flex flex-col items-center gap-2.5 text-center">
              <button
                type="button"
                onClick={() => navigateTo('login')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-colors cursor-pointer"
              >
                Já tem conta? Faça login
              </button>
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="text-[10px] text-gray-400 hover:text-gray-600 font-medium transition-colors cursor-pointer"
              >
                Voltar para a vitrine
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
