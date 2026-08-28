/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Produto } from '../types';
import { getCurrentPosition } from '../lib/geo';
import {
  Check, ArrowLeft, Image as ImageIcon, Send, Trash2, Camera, Sparkles, MapPin, LocateFixed,
  Package, DollarSign, CalendarClock, Store, Eye, ListChecks, ImagePlus, Search
} from 'lucide-react';

interface AdminProdutoFormProps {
  produtoId?: string | null;
  initialProduto?: Produto | null;
  onSubmit: (formData: any) => Promise<void>;
  onCancel: () => void;
}

const CATEGORY_OPTIONS = ['Laticínios', 'Padaria', 'Hortifrúti', 'Carnes', 'Bebidas', 'Mercearia'];

interface PresetImage { name: string; category: string; url: string; }

const IMAGE_PRESETS: PresetImage[] = [
  { name: 'Leite Integral', category: 'Laticínios', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=60&w=400' },
  { name: 'Iogurte Natural', category: 'Laticínios', url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=60&w=400' },
  { name: 'Queijo Prato', category: 'Laticínios', url: 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&q=60&w=400' },
  { name: 'Pão Italiano', category: 'Padaria', url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=60&w=400' },
  { name: 'Bolo de Chocolate', category: 'Padaria', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=60&w=400' },
  { name: 'Frutas Mistas', category: 'Hortifrúti', url: 'https://images.unsplash.com/photo-1610450915206-337c76a540b1?auto=format&fit=crop&q=60&w=400' },
  { name: 'Alface Fresca', category: 'Hortifrúti', url: 'https://images.unsplash.com/photo-1622484211148-716598e04143?auto=format&fit=crop&q=60&w=400' },
  { name: 'Carne Moída Prime', category: 'Carnes', url: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=60&w=400' },
  { name: 'Frango Inteiro', category: 'Carnes', url: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=60&w=400' },
  { name: 'Cerveja Artesanal', category: 'Bebidas', url: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&q=60&w=400' },
  { name: 'Suco de Laranja 1L', category: 'Bebidas', url: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=60&w=400' },
  { name: 'Chocolate Barra', category: 'Mercearia', url: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=60&w=400' },
  { name: 'Macarrão Espaguete', category: 'Mercearia', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&q=60&w=400' }
];

const inputCls =
  'w-full text-sm px-3.5 py-2.5 border-2 border-gray-100 bg-gray-50/60 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium';
const labelCls = 'block text-xs font-bold text-gray-600 mb-1.5';

const SectionCard: React.FC<{ num: number; icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }> = ({ num, icon, title, subtitle, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5 sm:p-6">
    <div className="flex items-start gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
          <span className="text-emerald-500 font-mono">{num}.</span> {title}
        </h3>
        {subtitle && <p className="text-[11px] text-gray-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const brl = (v: number | '') =>
  v === '' || isNaN(Number(v)) ? 'R$ --' : Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const AdminProdutoForm: React.FC<AdminProdutoFormProps> = ({ produtoId, initialProduto, onSubmit, onCancel }) => {
  const { user, categorias, navigateTo, showAlert } = useApp();

  const handleUseLocation = async () => {
    setGeoStatus('loading');
    try {
      const c = await getCurrentPosition();
      setLat(c.lat);
      setLng(c.lng);
      setGeoStatus('ok');
      showAlert('Localização da loja definida com sucesso!', 'success');
    } catch {
      setGeoStatus('error');
      showAlert('Não foi possível obter a localização. Autorize o acesso à localização no navegador.', 'warning');
    }
  };

  const [nomeProduto, setNomeProduto] = useState('');
  const [categoria, setCategoria] = useState(() => (initialProduto?.categoria ? initialProduto.categoria : 'Laticínios'));
  const [descricao, setDescricao] = useState('');
  const [precoOriginal, setPrecoOriginal] = useState<number | ''>('');
  const [precoPromocional, setPrecoPromocional] = useState<number | ''>('');
  const [dataValidade, setDataValidade] = useState('');
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState<number | ''>('');
  const [endereco, setEndereco] = useState('');
  const [nomeLoja, setNomeLoja] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [imageUrl, setImageUrl] = useState('');
  const [imagens, setImagens] = useState<string[]>(['', '', '']);
  const [submitting, setSubmitting] = useState(false);

  // CEP Search State inside Admin form
  const [cepInput, setCepInput] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

  const handleCepChange = async (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 5) {
      formatted = `${cleaned.substring(0, 5)}-${cleaned.substring(5, 8)}`;
    }
    setCepInput(formatted);

    if (cleaned.length === 8) {
      try {
        const raw = sessionStorage.getItem('validamais_cep_cache');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed[cleaned] && parsed[cleaned].address) {
            setEndereco(parsed[cleaned].address);
            return;
          }
        }
      } catch (e) {}

      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await response.json();
        if (data.erro) {
          showAlert('CEP não encontrado. Digite o endereço manualmente.', 'warning');
        } else {
          const street = data.logradouro ? `${data.logradouro}` : '';
          const neighborhood = data.bairro ? ` - ${data.bairro}` : '';
          const cityState = `, ${data.localidade}/${data.uf}`;
          const fullAddress = `${street}${neighborhood}${cityState}`;
          setEndereco(fullAddress);
          try {
            const raw = sessionStorage.getItem('validamais_cep_cache') || '{}';
            const parsed = JSON.parse(raw);
            parsed[cleaned] = { region: data.bairro || data.localidade || '', address: fullAddress };
            sessionStorage.setItem('validamais_cep_cache', JSON.stringify(parsed));
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Erro ao conectar ao ViaCEP:', err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  // Hydrate fields on edit
  useEffect(() => {
    if (initialProduto && produtoId) {
      setNomeProduto(initialProduto.nomeProduto);
      setCategoria(initialProduto.categoria);
      setDescricao(initialProduto.descricao || '');
      setPrecoOriginal(initialProduto.precoOriginal);
      setPrecoPromocional(initialProduto.precoPromocional);
      setDataValidade(initialProduto.dataValidade);
      setQuantidadeDisponivel(initialProduto.quantidadeDisponivel);
      setEndereco(initialProduto.endereco);
      setNomeLoja(initialProduto.nomeLoja);
      if (typeof initialProduto.lat === 'number' && typeof initialProduto.lng === 'number') {
        setLat(initialProduto.lat);
        setLng(initialProduto.lng);
        setGeoStatus('ok');
      }
      setImageUrl(initialProduto.imageUrl || '');
      if (initialProduto.imagens && initialProduto.imagens.length > 0) {
        const loaded = [...initialProduto.imagens];
        while (loaded.length < 3) loaded.push('');
        setImagens(loaded.slice(0, 3));
      } else if (initialProduto.imageUrl) {
        setImagens([initialProduto.imageUrl, '', '']);
      } else {
        setImagens(['', '', '']);
      }
    } else {
      setNomeLoja(user?.nome || '');
      setEndereco('Av. Paulista, 1000 - Bela Vista, São Paulo/SP');
      const future = new Date();
      future.setDate(future.getDate() + 5);
      setDataValidade(future.toISOString().split('T')[0]);
    }
  }, [initialProduto, produtoId, user]);

  const handlePresetSelect = (url: string) => {
    setImageUrl(url);
    setImagens(prev => {
      const copy = [...prev];
      copy[0] = url;
      return copy;
    });
  };

  const handleFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const validExtensions = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validExtensions.includes(file.type)) {
        showAlert('Formato inválido! Envie PNG, JPG, JPEG ou WEBP.', 'warning');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showAlert('Imagem muito pesada! Máximo de 5MB.', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500;
          const MAX_HEIGHT = 500;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setImagens(prev => { const copy = [...prev]; copy[index] = event.target?.result as string; return copy; });
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
          setImagens(prev => { const copy = [...prev]; copy[index] = compressedBase64; return copy; });
        };
        img.onerror = () => showAlert('Erro ao processar a imagem.', 'error');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showAlert(err.message || 'Erro ao carregar a imagem.', 'error');
    }
  };

  const clearSlot = (index: number) => {
    setImagens(prev => { const copy = [...prev]; copy[index] = ''; return copy; });
  };

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeProduto || !categoria || !precoOriginal || !precoPromocional || !dataValidade || !quantidadeDisponivel || !endereco) {
      showAlert('Preencha todos os campos obrigatórios.', 'warning');
      return;
    }
    if (Number(precoPromocional) >= Number(precoOriginal)) {
      showAlert('O preço ValidaMais deve ser menor que o preço original.', 'warning');
      return;
    }
    if (Number(precoOriginal) <= 0 || Number(precoPromocional) < 0) {
      showAlert('Os valores de preço devem ser positivos.', 'warning');
      return;
    }
    if (Number(quantidadeDisponivel) <= 0) {
      showAlert('A quantidade disponível deve ser pelo menos 1 unidade.', 'warning');
      return;
    }
    const hasImage = imagens.some(img => img !== '') || imageUrl.trim() !== '';
    if (!hasImage) {
      showAlert('A imagem do produto é obrigatória.', 'warning');
      return;
    }

    const cleanImagens = imagens.filter(img => img !== '');
    const firstImage = cleanImagens[0] || imageUrl.trim() || undefined;

    setSubmitting(true);
    try {
      await onSubmit({
        nomeProduto,
        categoria,
        descricao,
        precoOriginal: Number(precoOriginal),
        precoPromocional: Number(precoPromocional),
        dataValidade,
        quantidadeDisponivel: Number(quantidadeDisponivel),
        endereco,
        nomeLoja: nomeLoja || user?.nome || 'Mercado Geral',
        ...(lat !== null && lng !== null ? { lat, lng } : {}),
        imageUrl: firstImage,
        imagens: cleanImagens.length > 0 ? cleanImagens : (imageUrl.trim() ? [imageUrl.trim()] : [])
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derivados p/ pré-visualização e checklist ──
  const discountVal = (precoOriginal && precoPromocional)
    ? Math.round(((Number(precoOriginal) - Number(precoPromocional)) / Number(precoOriginal)) * 100)
    : 0;
  const economia = (precoOriginal && precoPromocional && Number(precoOriginal) > Number(precoPromocional))
    ? Number(precoOriginal) - Number(precoPromocional) : 0;
  const imgPreview = imagens.find(Boolean) || imageUrl || '';

  let validadeLabel = 'Sem validade';
  if (dataValidade) {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const dv = new Date(dataValidade + 'T00:00:00');
    const dias = Math.round((dv.getTime() - hoje.getTime()) / 86400000);
    validadeLabel = dias < 0 ? 'Vencido' : dias === 0 ? 'Vence hoje' : dias === 1 ? 'Vence amanhã' : `Vence em ${dias} dias`;
  }

  const precosOk = !!precoOriginal && !!precoPromocional && Number(precoPromocional) < Number(precoOriginal);
  const checklist = [
    { label: 'Nome do produto', ok: !!nomeProduto.trim() },
    { label: 'Categoria', ok: !!categoria },
    { label: 'Preços válidos', ok: precosOk },
    { label: 'Validade', ok: !!dataValidade },
    { label: 'Quantidade', ok: Number(quantidadeDisponivel) > 0 },
    { label: 'Ao menos 1 foto', ok: imagens.some(Boolean) || !!imageUrl.trim() },
    { label: 'Endereço de retirada', ok: !!endereco.trim() },
  ];
  const completos = checklist.filter(c => c.ok).length;

  const catList = categorias.length > 0 ? categorias.map(c => c.nome) : CATEGORY_OPTIONS;

  return (
    <form id="admin_produto_form" onSubmit={handleLocalSubmit} className="space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {produtoId ? 'Editar produto' : 'Cadastrar novo lote'}
          </h2>
          <p className="text-xs text-gray-500 font-medium">Preencha as informações — veja a prévia ao lado enquanto edita.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* ─────────── Coluna do formulário ─────────── */}
        <div className="space-y-5">

          {/* 1. Informações */}
          <SectionCard num={1} icon={<Package className="w-4 h-4" />} title="Informações do produto" subtitle="O que você está oferecendo">
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nome do produto <span className="text-rose-500">*</span></label>
                <input
                  id="form_input_p_nome"
                  type="text"
                  required
                  value={nomeProduto}
                  onChange={(e) => setNomeProduto(e.target.value)}
                  placeholder="Ex: Leite Integral Longevita 1 Litro"
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Estabelecimento <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={nomeLoja}
                      onChange={(e) => setNomeLoja(e.target.value)}
                      placeholder="Ex: Mercadinho Vila das Flores"
                      className={inputCls + ' pl-9'}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-gray-600">Categoria <span className="text-rose-500">*</span></label>
                    <button type="button" onClick={() => navigateTo('admin-categorias')} className="text-[10px] text-emerald-600 hover:text-emerald-800 font-black uppercase cursor-pointer">+ Gerenciar</button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {catList.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoria(cat)}
                        className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border-2 transition-all cursor-pointer ${
                          categoria === cat
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
                        }`}
                      >
                        {categoria === cat && <Check className="w-3 h-3" />}
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Motivo do desconto & detalhes <span className="text-gray-300 font-normal">(opcional)</span></label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={3}
                  placeholder="Ex: Embalagem levemente amassada, lote perfeitamente íntegro. Ótima oportunidade."
                  className={inputCls}
                />
              </div>
            </div>
          </SectionCard>

          {/* 2. Preço */}
          <SectionCard num={2} icon={<DollarSign className="w-4 h-4" />} title="Preço e desconto" subtitle="Quanto mais desconto, mais rápido vende">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
              <div>
                <label className={labelCls}>Preço original <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">R$</span>
                  <input
                    type="number" step="0.01" required placeholder="6,90"
                    value={precoOriginal}
                    onChange={(e) => setPrecoOriginal(e.target.value ? parseFloat(e.target.value) : '')}
                    className={inputCls + ' pl-9 font-mono font-bold'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-700 mb-1.5">Preço ValidaMais <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-emerald-600 font-black">R$</span>
                  <input
                    type="number" step="0.01" required placeholder="3,50"
                    value={precoPromocional}
                    onChange={(e) => setPrecoPromocional(e.target.value ? parseFloat(e.target.value) : '')}
                    className="w-full text-sm pl-9 pr-3.5 py-2.5 border-2 border-emerald-200 bg-emerald-50/40 focus:bg-white rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>
              <div className={`rounded-2xl px-4 py-2.5 text-center border-2 ${discountVal > 0 ? 'bg-emerald-600 border-emerald-600' : 'bg-gray-50 border-gray-100'}`}>
                <div className={`text-[9px] font-black uppercase tracking-wide ${discountVal > 0 ? 'text-emerald-100' : 'text-gray-400'}`}>Desconto</div>
                <div className={`text-2xl font-black leading-none ${discountVal > 0 ? 'text-white' : 'text-gray-300'}`}>{discountVal > 0 ? `${discountVal}%` : '—'}</div>
              </div>
            </div>
            {economia > 0 && (
              <p className="text-[11px] font-bold text-emerald-600 mt-3 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Economia de {brl(economia)} por unidade para o cliente.
              </p>
            )}
          </SectionCard>

          {/* 3. Disponibilidade */}
          <SectionCard num={3} icon={<CalendarClock className="w-4 h-4" />} title="Disponibilidade" subtitle="Validade e estoque do lote">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Data de validade <span className="text-rose-500">*</span></label>
                <input
                  type="date" required
                  value={dataValidade}
                  onChange={(e) => setDataValidade(e.target.value)}
                  className={inputCls + ' font-mono font-semibold'}
                />
                {dataValidade && (
                  <span className="text-[11px] font-bold text-amber-600 mt-1 inline-block">⏰ {validadeLabel}</span>
                )}
              </div>
              <div>
                <label className={labelCls}>Quantidade (unidades) <span className="text-rose-500">*</span></label>
                <input
                  type="number" required min="1" placeholder="10"
                  value={quantidadeDisponivel}
                  onChange={(e) => setQuantidadeDisponivel(e.target.value ? parseInt(e.target.value, 10) : '')}
                  className={inputCls + ' font-mono font-semibold'}
                />
              </div>
            </div>
          </SectionCard>

          {/* 4. Fotos */}
          <SectionCard num={4} icon={<ImagePlus className="w-4 h-4" />} title="Fotos do lote" subtitle="Até 3 fotos — a 1ª é a capa (obrigatória)">
            <div className="grid grid-cols-3 gap-2.5">
              {[{ label: 'Capa (frente)' }, { label: 'Lado direito' }, { label: 'Lado esquerdo' }].map((slot, idx) => (
                <div key={idx} className="flex flex-col gap-1 text-center">
                  <div className="relative aspect-square rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-500 bg-gray-50/60 hover:bg-emerald-50/20 transition-all flex flex-col justify-center items-center overflow-hidden group">
                    {imagens[idx] ? (
                      <>
                        <img src={imagens[idx]} alt={slot.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center items-center gap-1.5">
                          <button type="button" onClick={() => clearSlot(idx)} className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer" title="Remover">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <label className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer">
                            <Camera className="w-3.5 h-3.5" />
                            <input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={(e) => handleFileChange(idx, e)} className="hidden" />
                          </label>
                        </div>
                        {idx === 0 && <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">Capa</span>}
                      </>
                    ) : (
                      <label className="w-full h-full flex flex-col justify-center items-center p-2 cursor-pointer">
                        <Camera className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                        <span className="text-[9px] font-bold text-gray-400 group-hover:text-emerald-600 transition-colors mt-1 leading-tight">{slot.label}</span>
                        <input type="file" accept=".png,.jpg,.jpeg,.webp" onChange={(e) => handleFileChange(idx, e)} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Presets + URL */}
            <details className="mt-4 group">
              <summary className="cursor-pointer text-xs font-bold text-gray-500 hover:text-emerald-700 flex items-center gap-1.5 select-none">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Usar imagem de exemplo ou link
              </summary>
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[140px] overflow-y-auto pr-1">
                  {IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handlePresetSelect(preset.url)}
                      title={preset.name}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                        imagens[0] === preset.url ? 'border-emerald-500' : 'border-transparent opacity-80 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      {imagens[0] === preset.url && (
                        <div className="absolute top-0.5 right-0.5 bg-emerald-500 text-white p-0.5 rounded-full"><Check className="w-2.5 h-2.5" /></div>
                      )}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ou cole a URL da foto de capa <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={imagens[0] || imageUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setImageUrl(val);
                        setImagens(prev => { const copy = [...prev]; copy[0] = val; return copy; });
                      }}
                      placeholder="https://..."
                      className="w-full text-xs pl-8 pr-3 py-2 bg-gray-50/60 border-2 border-gray-100 rounded-lg focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </details>
          </SectionCard>

          {/* 5. Local de retirada */}
          <SectionCard num={5} icon={<MapPin className="w-4 h-4" />} title="Local de retirada" subtitle="Onde o cliente retira o produto">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
                <div>
                  <label className={labelCls}>Buscar por CEP</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text" maxLength={9} placeholder="01000-000"
                      value={cepInput}
                      onChange={(e) => handleCepChange(e.target.value)}
                      className={inputCls + ' pl-8 font-mono font-bold'}
                    />
                    {loadingCep && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600 animate-pulse font-mono font-extrabold">...</span>}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Endereço <span className="text-rose-500">*</span></label>
                  <input
                    type="text" required
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Rua das Flores, 123 - Centro, São Paulo/SP"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-xl bg-emerald-50/40 border border-emerald-100 p-3">
                <button
                  type="button"
                  onClick={handleUseLocation}
                  disabled={geoStatus === 'loading'}
                  className={`inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition-all active:scale-95 disabled:opacity-60 shrink-0 ${
                    geoStatus === 'ok' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border-2 border-emerald-200 hover:border-emerald-300'
                  }`}
                >
                  <LocateFixed className={`w-4 h-4 ${geoStatus === 'loading' ? 'animate-spin' : ''}`} />
                  {geoStatus === 'loading' ? 'Localizando...' : geoStatus === 'ok' ? 'Atualizar localização' : 'Usar localização da loja'}
                </button>
                <span className="text-[11px] text-gray-500 font-medium">
                  {geoStatus === 'ok' && lat !== null && lng !== null
                    ? `📍 Definida (${lat.toFixed(4)}, ${lng.toFixed(4)}) — aparece em "perto de você".`
                    : 'Defina para os clientes verem a distância e o mapa.'}
                </span>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ─────────── Coluna de pré-visualização ─────────── */}
        <div className="lg:sticky lg:top-6 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black text-gray-700 uppercase tracking-wide">Como o cliente vê</span>
            </div>
            <div className="p-4">
              <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
                <div className="relative aspect-[4/3] bg-gray-100">
                  {imgPreview ? (
                    <img src={imgPreview} alt="Prévia" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-1">
                      <Package className="w-9 h-9" />
                      <span className="text-[10px] font-bold uppercase">Sua foto aqui</span>
                    </div>
                  )}
                  {discountVal > 0 && <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[11px] font-black px-2 py-1 rounded-full shadow-sm">-{discountVal}%</span>}
                  {categoria && <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-2 py-1 rounded-full">{categoria}</span>}
                </div>
                <div className="p-3 space-y-1">
                  <div className="text-[11px] text-gray-400 font-bold flex items-center gap-1 truncate">
                    <Store className="w-3 h-3 shrink-0" /> {nomeLoja || 'Seu estabelecimento'}
                  </div>
                  <h4 className="text-sm font-black text-gray-900 leading-tight line-clamp-2 min-h-[2.4em]">
                    {nomeProduto || 'Nome do produto'}
                  </h4>
                  <div className="flex items-baseline gap-2 pt-0.5">
                    <span className="text-lg font-black text-emerald-600 leading-none">{brl(precoPromocional)}</span>
                    {precoOriginal !== '' && <span className="text-xs text-gray-400 line-through font-semibold">{brl(precoOriginal)}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold pt-1">
                    <span className="inline-flex items-center gap-0.5"><CalendarClock className="w-3 h-3" /> {validadeLabel}</span>
                    <span>•</span>
                    <span>{quantidadeDisponivel || 0} un.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-black text-gray-700 uppercase tracking-wide">Checklist</span>
              </div>
              <span className={`text-[11px] font-black ${completos === checklist.length ? 'text-emerald-600' : 'text-gray-400'}`}>{completos}/{checklist.length}</span>
            </div>
            <div className="space-y-1.5">
              {checklist.map((c) => (
                <div key={c.label} className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${c.ok ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-300'}`}>
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  </span>
                  <span className={`text-xs font-semibold ${c.ok ? 'text-gray-700' : 'text-gray-400'}`}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ações (desktop) */}
          <div className="hidden lg:flex flex-col gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-full shadow-lg shadow-emerald-600/25 cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? 'Enviando...' : (<><Send className="w-4 h-4" />{produtoId ? 'Salvar alterações' : 'Publicar no catálogo'}</>)}
            </button>
            <button type="button" onClick={onCancel} disabled={submitting} className="w-full py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      </div>

      {/* Ações (mobile) */}
      <div className="lg:hidden flex items-center gap-3 border-t border-gray-100 pt-4">
        <button type="button" onClick={onCancel} disabled={submitting} className="flex-1 py-3 border-2 border-gray-200 text-sm font-bold rounded-full text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black rounded-full shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting ? 'Enviando...' : (<><Send className="w-4 h-4" />{produtoId ? 'Salvar' : 'Publicar'}</>)}
        </button>
      </div>
    </form>
  );
};
