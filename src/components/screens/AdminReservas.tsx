/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../../context/AppContext';
import { ReservaCard } from '../ReservaCard';
import { RetiradaScanner } from '../RetiradaScanner';
import { Loader2, ClipboardList, Info } from 'lucide-react';

export const AdminReservasValida: React.FC = () => {
  const { showAlert, reservas, reservasLoading: loading, updateReservationStatus, cancelReservation, user, produtos } = useApp();

  const isPlatformAdmin = user?.email === 'ebsonsilva7@gmail.com';
  const myProductIds = new Set(produtos.filter(p => p.adminId === user?.uid).map(p => p.id));
  const myReservas = isPlatformAdmin ? reservas : reservas.filter(r => myProductIds.has(r.produtoId));

  // Resumo + ordenação: pendentes primeiro (precisam de ação)
  const nPendentes = myReservas.filter(r => r.status === 'pendente').length;
  const nRetiradas = myReservas.filter(r => r.status === 'retirado').length;
  const nCanceladas = myReservas.filter(r => r.status === 'cancelado').length;
  const rank = (s: string) => (s === 'pendente' ? 0 : s === 'retirado' ? 1 : 2);
  const getTime = (v: any) => {
    try { return (v?.toDate ? v.toDate() : new Date(v)).getTime() || 0; } catch { return 0; }
  };
  const sortedReservas = [...myReservas].sort((a, b) => rank(a.status) - rank(b.status) || getTime(b.criadoEm) - getTime(a.criadoEm));

  // Admin changing status: either confirming physical collection (withdraw) or canceling a voided booking
  const handleAdminStatusUpdate = async (reservaId: string, newStatus: 'retirado' | 'cancelado') => {
    try {
      if (newStatus === 'cancelado') {
        await cancelReservation(reservaId);
      } else {
        await updateReservationStatus(reservaId, newStatus);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div id="admin_reservas_panel" className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 leading-tight">Reservas Solicitadas</h1>
        <p className="text-sm text-gray-500 font-semibold mt-1">Valide a retirada pelo QR ou código de retirada do cliente e dê baixa nas reservas retiradas</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <span className="text-sm font-semibold text-gray-500 font-mono">Buscando chamados...</span>
        </div>
      ) : myReservas.length > 0 ? (
        <div className="space-y-4 max-w-4xl">
          {/* Validador de retirada (QR / código) */}
          <RetiradaScanner
            reservas={myReservas}
            produtos={produtos}
            onConfirm={(reservaId) => handleAdminStatusUpdate(reservaId, 'retirado')}
          />

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
              <div className="text-2xl font-black text-amber-600 leading-none">{nPendentes}</div>
              <div className="text-[11px] font-bold text-amber-700 mt-1 uppercase tracking-wide">Aguardando retirada</div>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="text-2xl font-black text-emerald-600 leading-none">{nRetiradas}</div>
              <div className="text-[11px] font-bold text-emerald-700 mt-1 uppercase tracking-wide">Retiradas</div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-2xl font-black text-gray-500 leading-none">{nCanceladas}</div>
              <div className="text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-wide">Canceladas</div>
            </div>
          </div>

          <div className="glass border-white/40 rounded-2xl p-4 bg-white/40 flex gap-3 text-xs leading-relaxed text-slate-700">
            <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase font-mono tracking-wide mb-0.5 text-slate-800">Como validar a retirada:</p>
              <p>Peça o <strong>código de retirada</strong> (ou o QR Code) que o cliente tem no app. Use <strong>"Validar retirada"</strong> acima para escanear o QR ou digitar o código — a reserva certa é encontrada e você confirma com um toque. Também é possível dar baixa direto no card usando <strong>"Confirmar Retirada"</strong>.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {sortedReservas.map((res) => (
              <ReservaCard
                key={res.id}
                reserva={res}
                isAdminView={true}
                onStatusUpdate={handleAdminStatusUpdate}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="glass rounded-3xl border-white/50 py-16 text-center max-w-lg mx-auto p-6 space-y-3">
          <div className="w-12 h-12 bg-white/40 rounded-2xl flex items-center justify-center text-gray-400 mx-auto border border-white/50">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-gray-800">Nenhuma reserva recebida</h3>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
            Assim que os consumidores começarem a reservar seus lotes promocionais de produtos perecíveis no catálogo público, as solicitações aparecerão consolidadas nesta fila.
          </p>
        </div>
      )}
    </div>
  );
};
