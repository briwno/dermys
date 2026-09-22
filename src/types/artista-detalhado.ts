export interface ItemPortfolio {
  id: string;
  artistaId: string;
  titulo: string;
  imagemUrl: string;
  estilo: string;
  preco?: number;
  disponivel?: boolean;
  descricao?: string;
  tempoSessao?: string;
}

export interface ReviewArtista {
  id: string;
  autorNome: string;
  autorAvatar?: string;
  nota: number; // 1 a 5
  data: string;
  estiloTatuado: string;
  comentario: string;
  curtidas?: number;
  verificado: boolean;
}

export interface DetalhesEstudio {
  nome: string;
  endereco: string;
  bairroCidade: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  latitude?: number;
  longitude?: number;
  horarioFuncionamento: string;
  comodidades: string[];
  protocolosBiosseguranca: string[];
}

export interface PerfilArtistaCompleto {
  id: string;
  nomeArtista: string;
  nomeEstudio: string;
  enderecoEstudio?: string;
  bairro?: string;
  cidade: string;
  estado?: string;
  latitude?: number;
  longitude?: number;
  distanciaKm?: number;
  distanciaFormatada?: string;
  estilo: string;
  estilosSecundarios?: string[];
  curtidas: number;
  precoInicial: number;
  precoMedioHora?: number;
  valorSinalBase?: number;
  fotoUrl?: string;
  capaUrl?: string;
  biografia?: string;
  experienciaAnos?: number;
  notaMedia: number;
  totalAvaliacoes: number;
  portfolio: ItemPortfolio[];
  flashes: ItemPortfolio[];
  reviews: ReviewArtista[];
  agendaAberta?: boolean;
  mensagemAgendaFechada?: string;
  estudioInfo: DetalhesEstudio;
}
