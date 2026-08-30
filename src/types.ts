/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'user' | 'lojista' | 'admin';

export interface Categoria {
  id?: string;
  nome: string;
  criadoEm?: any;
}

export interface Usuario {
  uid: string;
  email: string;
  nome: string;
  role: UserRole;
  cnpj?: string;
  telefone?: string;
  senha?: string;
  criadoEm: any; // Firestore Timestamp
  destaquePlano?: string;       // e.g. 'bronze' | 'ouro' | 'clube'
  destaqueAtivo?: boolean;
  destaqueMensagem?: string;
  destaqueBannerUrl?: string;
}

export interface Produto {
  id?: string;
  adminId: string;
  nomeLoja: string;
  nomeProduto: string;
  categoria: string;
  descricao?: string;
  precoOriginal: number;
  precoPromocional: number;
  dataValidade: string; // ISO date string YYYY-MM-DD
  quantidadeDisponivel: number;
  quantidadeReservada: number;
  imageUrl?: string;
  imagens?: string[];
  status: 'disponivel' | 'esgotado';
  endereco: string;
  lat?: number; // Store latitude (for "near you" discovery)
  lng?: number; // Store longitude
  criadoEm: any; // Firestore Timestamp
}

export interface Reserva {
  id?: string;
  usuarioId: string;
  usuarioEmail: string;
  usuarioTelefone?: string; // Customer phone captured at reservation time (store contact)
  produtoId: string;
  nomeProduto: string;
  nomeLoja: string;
  quantidade: number;
  precoTotal: number;
  status: 'pendente' | 'retirado' | 'cancelado';
  codigoRetirada?: string; // Unique pickup code presented by the customer at the store
  // Pagamento (Mercado Pago — Checkout Pro)
  pagamentoStatus?: 'pendente' | 'aprovado' | 'rejeitado' | 'reembolsado';
  mpPreferenceId?: string; // Preference criada no backend
  mpPaymentId?: string;    // Id do pagamento no Mercado Pago
  valorPago?: number;
  // Repasse (modelo agregador — Fase 1): calculados no backend na aprovação.
  comissaoValor?: number;  // Comissão retida pela plataforma
  repasseValor?: number;   // Líquido a repassar ao lojista (valor − comissão)
  repasseStatus?: 'pendente' | 'liberado' | 'pago'; // liberado após retirada; pago após PIX
  criadoEm: any; // Firestore Timestamp
  atualizadoEm: any; // Firestore Timestamp
}

export interface AvaliacaoLoja {
  id?: string;
  reservaId: string;
  nomeLoja: string;
  usuarioId: string;
  usuarioEmail: string;
  estrelas: number; // 1-5
  comentario: string;
  criadoEm: any; // ISO date string or Firestore Timestamp
}

export interface NotificacaoPreferencias {
  uid: string;
  cepsDesejados: string[]; // List of CEPs to monitor
  distanciaKm: number; // radius to monitor (or simply CEP prefix match)
  notificarNovosDescontos: boolean;
  fcmTokens: string[];
}

export interface NotificacaoFeedItem {
  id?: string;
  usuarioId: string; // The user this was sent to
  titulo: string;
  mensagem: string;
  produtoId: string;
  nomeLoja: string;
  precoOriginal: number;
  precoPromocional: number;
  lido: boolean;
  criadoEm: any;
}

export interface Favorito {
  id?: string;
  usuarioId: string;
  produtoId: string;
  criadoEm: any; // ISO Date string or Firestore Timestamp
}

export interface FavoritoLoja {
  id?: string;
  usuarioId: string;
  nomeLoja: string;
  criadoEm: any; // ISO Date string or Firestore Timestamp
}


