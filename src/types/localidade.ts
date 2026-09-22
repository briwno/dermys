export interface Coordenadas {
  latitude: number;
  longitude: number;
}

export type RaioFiltroKm = 5 | 15 | 30 | 50 | 100 | null; // null = Todo o Brasil

export type OpcaoOrdenacao = 'distancia' | 'populares' | 'preco' | 'avaliacoes';

export interface LocalidadeUsuario {
  cidade: string;
  estado: string; // UF (ex: 'SP')
  bairro?: string;
  latitude: number;
  longitude: number;
  raioKm: RaioFiltroKm;
  modoGps: boolean;
  ordenacao: OpcaoOrdenacao;
}

export interface CidadeBrasil {
  nome: string;
  estado: string;
  latitude: number;
  longitude: number;
  regiao: 'Sudeste' | 'Sul' | 'Nordeste' | 'Centro-Oeste' | 'Norte';
}
