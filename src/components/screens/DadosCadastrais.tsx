/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User, Mail, Phone, Building2, Store, ShoppingBag, Calendar,
  Pencil, Check, X, LogOut, ShieldCheck, IdCard, AlertCircle, CheckCircle
} from 'lucide-react';

// ── Máscaras / validação ──────────────────────────────────────────────────
function maskPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.replace(/^(\d{0,2})/, '($1');
  if (d.length <= 6) return d.replace(/^(\d{2})(\d{0,4})/, '($1) $2');
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

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

function formatDate(value: any): string {
  if (!value) return '—';
  try {
    const date = value?.toDate ? value.toDate() : new Date(value);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return '—';
  }
}

export const DadosCadastraisValida: React.FC = () => {
  const { user, updateUserProfile, logoutUser, showAlert } = useApp();

  const isLojista = user?.role === 'lojista';

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState(user?.nome || '');
  const [telefone, setTelefone] = useState(user?.telefone || '');
  const [cnpj, setCnpj] = useState(user?.cnpj || '');
  const [cnpjError, setCnpjError] = useState('');

  if (!user) return null;

  const resetForm = () => {
    setNome(user.nome || '');
    setTelefone(user.telefone || '');
    setCnpj(user.cnpj || '');
    setCnpjError('');
    setEditing(false);
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      showAlert('Informe seu nome.', 'warning');
      return;
    }
    if (telefone.replace(/\D/g, '').length < 10) {
      showAlert('Informe um telefone válido com DDD.', 'warning');
      return;
    }
    if (isLojista) {
      if (cnpj.replace(/\D/g, '').length !== 14 || !validateCNPJ(cnpj)) {
        setCnpjError('CNPJ inválido. Verifique os dígitos.');
        showAlert('CNPJ inválido.', 'warning');
        return;
      }
    }

    setSaving(true);
    try {
      const dados: any = { nome: nome.trim(), telefone };
      if (isLojista) dados.cnpj = cnpj;
      await updateUserProfile(dados);
      showAlert('Dados atualizados com sucesso!', 'success');
      setEditing(false);
    } catch {
      showAlert('Não foi possível salvar. Tente novamente.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const cnpjValid = cnpj.replace(/\D/g, '').length === 14 && validateCNPJ(cnpj);

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Título */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Dados Cadastrais</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Gerencie suas informações de conta.</p>
      </div>

      {/* Cartão de identidade */}
      <div className="rounded-3xl overflow-hidden border border-white/60 shadow-sm">
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center text-2xl font-black text-white shrink-0">
            {user.nome?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-white truncate">{user.nome}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                isLojista ? 'bg-amber-300 text-amber-900' : 'bg-lime-300 text-emerald-900'
              }`}>
                {isLojista ? <Store className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
                {isLojista ? 'Lojista' : 'Consumidor'}
              </span>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="bg-white p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Informações</h3>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full cursor-pointer transition-all active:scale-95"
              >
                <Pencil className="w-3.5 h-3.5" />
                Editar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={resetForm}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full cursor-pointer transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-full cursor-pointer transition-all active:scale-95 disabled:opacity-60"
                >
                  <Check className="w-3.5 h-3.5" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )}
          </div>

          {/* Nome */}
          <Field icon={<User className="w-4 h-4" />} label="Nome completo">
            {editing ? (
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 border-2 border-gray-100 bg-gray-50/70 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
              />
            ) : (
              <span className="text-sm font-bold text-gray-900">{user.nome || '—'}</span>
            )}
          </Field>

          {/* E-mail (somente leitura) */}
          <Field icon={<Mail className="w-4 h-4" />} label="E-mail" note="não editável">
            <span className="text-sm font-semibold text-gray-700 break-all">{user.email}</span>
          </Field>

          {/* Telefone */}
          <Field icon={<Phone className="w-4 h-4" />} label="Telefone / WhatsApp">
            {editing ? (
              <input
                inputMode="numeric"
                value={telefone}
                onChange={(e) => setTelefone(maskPhone(e.target.value))}
                placeholder="(11) 90000-0000"
                className="w-full text-sm px-3.5 py-2.5 border-2 border-gray-100 bg-gray-50/70 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
              />
            ) : (
              <span className="text-sm font-bold text-gray-900">{user.telefone || '—'}</span>
            )}
          </Field>

          {/* CNPJ (lojista) */}
          {isLojista && (
            <Field icon={<Building2 className="w-4 h-4" />} label="CNPJ da empresa">
              {editing ? (
                <div>
                  <div className="relative">
                    <input
                      inputMode="numeric"
                      value={cnpj}
                      onChange={(e) => { setCnpj(maskCNPJ(e.target.value)); setCnpjError(''); }}
                      placeholder="00.000.000/0000-00"
                      className={`w-full text-sm px-3.5 pr-9 py-2.5 border-2 bg-gray-50/70 focus:bg-white rounded-xl focus:outline-none focus:ring-4 transition-all font-medium font-mono tracking-wide ${
                        cnpjError ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400/10'
                        : cnpjValid ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/10'
                        : 'border-gray-100 focus:border-emerald-500 focus:ring-emerald-500/10'
                      }`}
                    />
                    {cnpjValid && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
                  </div>
                  {cnpjError && (
                    <p className="text-[10px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> {cnpjError}
                    </p>
                  )}
                </div>
              ) : (
                <span className="text-sm font-bold text-gray-900 font-mono tracking-wide">{user.cnpj || '—'}</span>
              )}
            </Field>
          )}

          {/* Membro desde */}
          <Field icon={<Calendar className="w-4 h-4" />} label="Membro desde">
            <span className="text-sm font-semibold text-gray-700">{formatDate(user.criadoEm)}</span>
          </Field>

          {/* ID da conta */}
          <Field icon={<IdCard className="w-4 h-4" />} label="ID da conta" note="interno">
            <span className="text-[11px] font-mono text-gray-400 break-all">{user.uid}</span>
          </Field>
        </div>
      </div>

      {/* Segurança / logout */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4">
        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          Seus dados são tratados conforme a LGPD.
        </div>
        <button
          onClick={logoutUser}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold text-rose-600 hover:text-white hover:bg-rose-600 border-2 border-rose-200 hover:border-rose-600 px-5 py-2.5 rounded-full cursor-pointer transition-all active:scale-95"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </div>
  );
};

// ── Linha de campo reutilizável ───────────────────────────────────────────
const Field: React.FC<{ icon: React.ReactNode; label: string; note?: string; children: React.ReactNode }> = ({ icon, label, note, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 py-2 border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-2 text-gray-400 sm:w-52 shrink-0">
      <span className="text-emerald-500">{icon}</span>
      <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      {note && <span className="text-[9px] text-gray-300 font-semibold normal-case">({note})</span>}
    </div>
    <div className="flex-1 min-w-0">{children}</div>
  </div>
);
