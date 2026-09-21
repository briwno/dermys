export type ModeloDispositivo = 'iphone_16_pro' | 'galaxy_s24' | 'iphone_se' | 'full';

export interface ConfiguracaoDispositivo {
  id: ModeloDispositivo;
  nome: string;
  largura: number;
  altura: number;
  raioBorda: number;
  larguraBorda: number;
  temDynamicIsland: boolean;
  tipoNotch: 'island' | 'notch' | 'punchhole' | 'none';
}

export const MODELOS_DISPOSITIVOS: Record<ModeloDispositivo, ConfiguracaoDispositivo> = {
  iphone_16_pro: {
    id: 'iphone_16_pro',
    nome: 'iPhone 16 Pro (393 × 852)',
    largura: 393,
    altura: 852,
    raioBorda: 52,
    larguraBorda: 10,
    temDynamicIsland: true,
    tipoNotch: 'island',
  },
  galaxy_s24: {
    id: 'galaxy_s24',
    nome: 'Samsung Galaxy S24 (360 × 780)',
    largura: 360,
    altura: 780,
    raioBorda: 40,
    larguraBorda: 8,
    temDynamicIsland: false,
    tipoNotch: 'punchhole',
  },
  iphone_se: {
    id: 'iphone_se',
    nome: 'Compacto / iPhone SE (375 × 667)',
    largura: 375,
    altura: 667,
    raioBorda: 28,
    larguraBorda: 8,
    temDynamicIsland: false,
    tipoNotch: 'none',
  },
  full: {
    id: 'full',
    nome: 'Tela Cheia (Sem Moldura)',
    largura: 0,
    altura: 0,
    raioBorda: 0,
    larguraBorda: 0,
    temDynamicIsland: false,
    tipoNotch: 'none',
  },
};

export interface PersonaTeste {
  id: string;
  nome: string;
  tipo: 'artista' | 'cliente';
  estudio?: string;
  estilo?: string;
  cidade?: string;
  email: string;
  avatarUrl?: string;
}

export const PERSONAS_TESTE: PersonaTeste[] = [
  {
    id: '99999999-9999-9999-9999-999999999999',
    nome: 'Mariana Costa',
    tipo: 'cliente',
    cidade: 'São Paulo, SP',
    email: 'cliente.dermys@dermys.app',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    nome: 'Camila Rossi',
    tipo: 'artista',
    estudio: 'Aura Tatuaria & Botânica',
    estilo: 'Fine Line / Botânica',
    cidade: 'São Paulo, SP (Vila Madalena)',
    email: 'camila.rossi@dermys.app',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nome: 'Leonardo Black',
    tipo: 'artista',
    estudio: 'Nômade Blackwork Studio',
    estilo: 'Blackwork & Dark Art',
    cidade: 'São Paulo, SP (Pinheiros)',
    email: 'leo.black@dermys.app',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nome: 'Maya Silveira',
    tipo: 'artista',
    estudio: 'Solaris Tattoo Lab',
    estilo: 'Aquarela & Cores',
    cidade: 'Rio de Janeiro, RJ (Ipanema)',
    email: 'maya.silveira@dermys.app',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    nome: 'Kaito Tanaka',
    tipo: 'artista',
    estudio: 'Irezumi Tradicional Kaito',
    estilo: 'Oriental Tradicional',
    cidade: 'Curitiba, PR (Batel)',
    email: 'kaito.tanaka@dermys.app',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    nome: 'Gabriel Fontes',
    tipo: 'artista',
    estudio: 'Old Anchor Tattoo Club',
    estilo: 'Old School',
    cidade: 'Florianópolis, SC (Lagoa)',
    email: 'gabriel.fontes@dermys.app',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    nome: 'Lucas Vasconcelos',
    tipo: 'artista',
    estudio: 'Pixel & Ink Cyber Studio',
    estilo: 'Geek & Anime',
    cidade: 'Belo Horizonte, MG (Savassi)',
    email: 'lucas.geek@dermys.app',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    nome: 'Valéria Mendes',
    tipo: 'artista',
    estudio: 'Mendes Micro Tattoo & Art',
    estilo: 'Microrealismo',
    cidade: 'Porto Alegre, RS (Moinhos)',
    email: 'valeria.mendes@dermys.app',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: '88888888-8888-8888-8888-888888888888',
    nome: 'Rodrigo Bahia',
    tipo: 'artista',
    estudio: 'Dendê Ink Art Studio',
    estilo: 'Ornamental / Blackwork',
    cidade: 'Salvador, BA (Rio Vermelho)',
    email: 'rodrigo.bahia@dermys.app',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  },
];
