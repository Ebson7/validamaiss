/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Validador de retirada (lojista): escaneia o QR do cliente (câmera, via
 * BarcodeDetector nativo) ou aceita o código digitado, encontra a reserva
 * pendente correspondente e confirma a retirada. Sem dependência externa —
 * quando a câmera/BarcodeDetector não existe, o modo manual sempre funciona.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Reserva, Produto } from '../types';
import { getPickupCode, pickupCodesMatch } from '../lib/pickup';
import {
  QrCode, Camera, CameraOff, ShieldCheck, ShieldAlert, CheckCircle2,
  X, ShoppingBag, User, Loader2, ScanLine,
} from 'lucide-react';

// BarcodeDetector ainda não está no lib.dom de todas as versões do TS.
type BarcodeDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
};
declare global {
  interface Window {
    BarcodeDetector?: {
      new (opts?: { formats?: string[] }): BarcodeDetectorLike;
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

interface Props {
  reservas: Reserva[]; // reservas do lojista (todas; filtramos pendentes aqui)
  produtos: Produto[];
  onConfirm: (reservaId: string) => Promise<void>;
}

type Match = { kind: 'found'; reserva: Reserva } | { kind: 'notfound'; code: string } | null;

export const RetiradaScanner: React.FC<Props> = ({ reservas, produtos, onConfirm }) => {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [match, setMatch] = useState<Match>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmedName, setConfirmedName] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);

  const pendentes = reservas.filter((r) => r.status === 'pendente');
  const cameraSupported =
    typeof window !== 'undefined' && !!window.BarcodeDetector && !!navigator.mediaDevices?.getUserMedia;

  const resolveCode = (raw: string): Match => {
    const hit = pendentes.find((r) => pickupCodesMatch(raw, getPickupCode(r)));
    return hit ? { kind: 'found', reserva: hit } : { kind: 'notfound', code: raw.trim() };
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  const startCamera = async () => {
    setCameraError('');
    setMatch(null);
    if (!cameraSupported) {
      setCameraError('Câmera/leitor não disponível neste dispositivo. Use o código manual abaixo.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
      });
      streamRef.current = stream;
      if (!detectorRef.current && window.BarcodeDetector) {
        detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
      }
      setScanning(true);
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play().catch(() => {});
      }
      tick();
    } catch {
      setCameraError('Não foi possível acessar a câmera. Verifique a permissão ou use o código manual.');
      stopCamera();
    }
  };

  const tick = async () => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || !streamRef.current) return;
    try {
      if (video.readyState >= 2) {
        const codes = await detector.detect(video);
        if (codes && codes.length > 0 && codes[0].rawValue) {
          const found = resolveCode(codes[0].rawValue);
          stopCamera();
          setMatch(found);
          return;
        }
      }
    } catch {
      // frame sem leitura — continua tentando
    }
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    stopCamera();
    setMatch(resolveCode(manualCode));
  };

  const handleConfirm = async () => {
    if (!match || match.kind !== 'found') return;
    setConfirming(true);
    try {
      await onConfirm(match.reserva.id!);
      setConfirmedName(match.reserva.nomeProduto);
      setMatch(null);
      setManualCode('');
      setTimeout(() => setConfirmedName(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setConfirming(false);
    }
  };

  const reset = () => {
    setMatch(null);
    setManualCode('');
    setCameraError('');
  };

  const closePanel = () => {
    stopCamera();
    reset();
    setOpen(false);
  };

  // Limpa a câmera ao desmontar
  useEffect(() => () => stopCamera(), []);

  const produtoDe = (r: Reserva) => produtos.find((p) => p.id === r.produtoId);

  if (!open) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <ScanLine className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900">Validar retirada</h3>
            <p className="text-xs text-gray-500 font-medium">
              Escaneie o QR do cliente ou digite o código para dar baixa na reserva.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {confirmedName && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Retirada confirmada
            </span>
          )}
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-full cursor-pointer transition-all active:scale-95 shrink-0"
          >
            <QrCode className="w-4 h-4" /> Validar retirada
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-white p-4 sm:p-5 shadow-xs space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-[11px] font-extrabold text-slate-700 font-mono uppercase tracking-wider">
            Validar retirada
          </span>
        </div>
        <button onClick={closePanel} className="text-gray-400 hover:text-rose-600 transition-colors cursor-pointer p-1" aria-label="Fechar">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Resultado da busca */}
      {match?.kind === 'found' ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-wide font-mono">Reserva encontrada</span>
          </div>
          <div className="flex gap-3">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-emerald-100 shrink-0">
              {produtoDe(match.reserva)?.imageUrl ? (
                <img src={produtoDe(match.reserva)!.imageUrl} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag className="w-6 h-6" /></div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-black text-gray-900 leading-tight line-clamp-2">{match.reserva.nomeProduto}</h4>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500 font-semibold min-w-0">
                <User className="w-3.5 h-3.5 text-amber-500 shrink-0" /><span className="truncate">{match.reserva.usuarioEmail}</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500 font-medium">
                <span className="font-mono">Qtd {match.reserva.quantidade}</span>
                <span className="font-black text-emerald-600">
                  {match.reserva.precoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className="font-mono uppercase tracking-wide text-emerald-700/80">{getPickupCode(match.reserva)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black px-4 py-3 rounded-xl cursor-pointer shadow-xs active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {confirming ? 'Confirmando...' : 'Confirmar retirada'}
            </button>
            <button
              onClick={reset}
              className="px-4 py-3 border border-gray-200 hover:bg-gray-50 text-gray-500 text-sm font-bold rounded-xl cursor-pointer transition-all"
            >
              Outro
            </button>
          </div>
        </div>
      ) : match?.kind === 'notfound' ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-black uppercase tracking-wide font-mono">Código não encontrado</span>
          </div>
          <p className="text-xs text-rose-700/90 font-medium">
            Nenhuma reserva pendente com o código <strong className="font-mono">{match.code || '—'}</strong>.
            Confira o código apresentado pelo cliente e tente de novo.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 hover:text-rose-800 bg-white border border-rose-200 px-3 py-2 rounded-lg cursor-pointer transition-all active:scale-95"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {/* Câmera */}
          <div className="rounded-2xl overflow-hidden bg-slate-900 relative aspect-[4/3] max-w-sm mx-auto flex items-center justify-center">
            <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${scanning ? '' : 'hidden'}`} />
            {scanning ? (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-40 h-40 border-2 border-emerald-400/80 rounded-2xl relative">
                  <div className="absolute -top-px left-0 right-0 h-0.5 bg-emerald-400 animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-300 p-6 space-y-3">
                <Camera className="w-10 h-10 mx-auto text-slate-500" />
                <p className="text-xs font-medium max-w-[14rem] mx-auto">
                  {cameraSupported
                    ? 'Aponte a câmera para o QR Code que o cliente mostra na tela.'
                    : 'Este dispositivo não tem leitor de QR — use o código manual abaixo.'}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-2">
            {!scanning ? (
              <button
                onClick={startCamera}
                disabled={!cameraSupported}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-black rounded-full cursor-pointer transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" /> Escanear QR
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-bold rounded-full cursor-pointer transition-all active:scale-95"
              >
                <CameraOff className="w-4 h-4" /> Parar câmera
              </button>
            )}
          </div>

          {cameraError && (
            <p className="text-[11px] text-rose-600 font-semibold text-center flex items-center justify-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> {cameraError}
            </p>
          )}

          {/* Manual */}
          <div className="pt-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-gray-100" />
              <span className="text-[10px] font-bold text-gray-400 font-mono uppercase tracking-wider">ou digite o código</span>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <form onSubmit={handleManual} className="flex flex-col sm:flex-row gap-2">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="VM-XXXXXX"
                className="flex-1 text-sm font-mono font-bold tracking-widest uppercase p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-all"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="bg-slate-800 hover:bg-slate-900 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold px-4 py-3 rounded-xl cursor-pointer active:scale-95 transition-all inline-flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Buscar reserva
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};
