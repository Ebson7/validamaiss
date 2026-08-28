/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Produto } from '../types';
import { Coords, haversineKm, formatDistance } from '../lib/geo';

interface MapaLojasProps {
  produtos: Produto[];
  userLoc: Coords | null;
  onSelect: (produtoId: string) => void;
}

const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333]; // São Paulo

function esc(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

function storeIcon() {
  return L.divIcon({
    className: '',
    html:
      '<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#059669;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;">' +
      '<span style="transform:rotate(45deg);font-size:15px;line-height:1;">🏪</span></div>',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32],
  });
}

function userIcon() {
  return L.divIcon({
    className: '',
    html:
      '<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,.25);"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const MapaLojas: React.FC<MapaLojasProps> = ({ produtos, userLoc, onSelect }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: true, attributionControl: true }).setView(
      DEFAULT_CENTER,
      12
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    // Delegated click for "Ver detalhes" buttons inside popups
    const el = containerRef.current;
    const handler = (e: Event) => {
      const target = (e.target as HTMLElement)?.closest('[data-vm-prod]') as HTMLElement | null;
      if (target) {
        const id = target.getAttribute('data-vm-prod');
        if (id) onSelectRef.current(id);
      }
    };
    el.addEventListener('click', handler);

    return () => {
      el.removeEventListener('click', handler);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  // Render markers when data changes
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const withCoords = produtos.filter(
      (p) => typeof p.lat === 'number' && typeof p.lng === 'number'
    );

    const bounds: [number, number][] = [];

    withCoords.forEach((p) => {
      const marker = L.marker([p.lat as number, p.lng as number], { icon: storeIcon() });
      const dist =
        userLoc ? haversineKm(userLoc, { lat: p.lat as number, lng: p.lng as number }) : undefined;
      const distHtml = dist !== undefined
        ? `<div style="font-size:11px;color:#059669;font-weight:700;margin-top:1px;">📍 ${formatDistance(dist)}</div>`
        : '';
      marker.bindPopup(
        `<div style="min-width:160px;font-family:system-ui,sans-serif;">
          <div style="font-weight:800;font-size:13px;color:#111;">${esc(p.nomeProduto)}</div>
          <div style="font-size:11px;color:#666;">${esc(p.nomeLoja)}</div>
          ${distHtml}
          <div style="font-weight:800;color:#059669;margin-top:3px;font-size:15px;">R$ ${p.precoPromocional.toFixed(2).replace('.', ',')}</div>
          <button data-vm-prod="${esc(p.id || '')}" style="margin-top:7px;width:100%;background:#059669;color:#fff;border:none;padding:6px 10px;border-radius:9px;font-size:12px;font-weight:800;cursor:pointer;">Ver detalhes</button>
        </div>`
      );
      marker.addTo(layer);
      bounds.push([p.lat as number, p.lng as number]);
    });

    if (userLoc) {
      L.marker([userLoc.lat, userLoc.lng], { icon: userIcon(), zIndexOffset: 1000 })
        .bindPopup('<div style="font-weight:700;font-size:12px;">Você está aqui</div>')
        .addTo(layer);
      bounds.push([userLoc.lat, userLoc.lng]);
    }

    if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
    // Corrige tiles quando o container acabou de ficar visível
    setTimeout(() => map.invalidateSize(), 100);
  }, [produtos, userLoc]);

  const semCoords = produtos.filter((p) => typeof p.lat !== 'number' || typeof p.lng !== 'number').length;

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="w-full h-[65vh] min-h-[400px] rounded-3xl overflow-hidden border border-emerald-200 shadow-sm z-0"
      />
      {semCoords > 0 && (
        <p className="text-[11px] text-gray-400 font-medium text-center">
          {semCoords} lote(s) sem localização definida não aparecem no mapa.
        </p>
      )}
    </div>
  );
};

export default MapaLojas;
