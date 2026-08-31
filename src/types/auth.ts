export type TipoPerfil = 'cliente' | 'artista';
export type UserRole = TipoPerfil;

export interface PerfilUsuario {
  id?: string;
  uid?: string;
  email: string;
  nome_exibicao?: string;
  nomeExibicao?: string;
  displayName?: string;
  tipo_perfil?: TipoPerfil;
  tipoPerfil?: TipoPerfil;
  role?: TipoPerfil;
  telefone?: string;
  phoneNumber?: string;
  foto_url?: string;
  fotoUrl?: string;
  photoURL?: string;
  nome_estudio?: string;
  nomeEstudio?: string;
  studioName?: string;
  endereco_estudio?: string;
  enderecoEstudio?: string;
  studioAddress?: string;
  biografia?: string;
  bio?: string;
  estilo_principal?: string;
  estiloPrincipal?: string;
  cidade?: string;
  preco_inicial?: number;
  precoInicial?: number;
  curtidas?: number;
  criado_em?: string;
  criadoEm?: string;
  createdAt?: string;
}

export function normalizarPerfil(p: any): PerfilUsuario {
  if (!p) {
    return {
      email: '',
      nome_exibicao: 'Usuário',
      nomeExibicao: 'Usuário',
      displayName: 'Usuário',
      tipo_perfil: 'cliente',
      tipoPerfil: 'cliente',
      role: 'cliente',
    };
  }

  const id = p.id || p.uid || '';
  const email = p.email || '';
  const nome = p.nome_exibicao || p.nomeExibicao || p.displayName || (email ? email.split('@')[0] : 'Usuário');
  
  let role: TipoPerfil = 'cliente';
  const roleRaw = p.tipo_perfil || p.tipoPerfil || p.role;
  if (roleRaw === 'artista' || roleRaw === 'tatuador') {
    role = 'artista';
  }

  const tel = p.telefone || p.phoneNumber || '';
  const foto = p.foto_url || p.fotoUrl || p.photoURL || '';
  const estudio = p.nome_estudio || p.nomeEstudio || p.studioName || '';
  const endEstudio = p.endereco_estudio || p.enderecoEstudio || p.studioAddress || '';
  const bio = p.biografia || p.bio || '';
  const estilo = p.estilo_principal || p.estiloPrincipal || 'Fine Line';
  const cidade = p.cidade || 'São Paulo, SP';
  const preco = Number(p.preco_inicial || p.precoInicial || 350);
  const curtidas = Number(p.curtidas || 0);
  const data = p.criado_em || p.criadoEm || p.createdAt || new Date().toISOString();

  return {
    id,
    uid: id,
    email,
    nome_exibicao: nome,
    nomeExibicao: nome,
    displayName: nome,
    tipo_perfil: role,
    tipoPerfil: role,
    role,
    telefone: tel,
    phoneNumber: tel,
    foto_url: foto,
    fotoUrl: foto,
    photoURL: foto,
    nome_estudio: estudio,
    nomeEstudio: estudio,
    studioName: estudio,
    endereco_estudio: endEstudio,
    enderecoEstudio: endEstudio,
    studioAddress: endEstudio,
    biografia: bio,
    bio,
    estilo_principal: estilo,
    estiloPrincipal: estilo,
    cidade,
    preco_inicial: preco,
    precoInicial: preco,
    curtidas,
    criado_em: data,
    criadoEm: data,
    createdAt: data,
  };
}
