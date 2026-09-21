export type TipoPerfil = 'cliente' | 'artista';
export type UserRole = TipoPerfil;

export interface CampoFaltante {
  campo: string;
  label: string;
  descricao: string;
  obrigatorioPara: 'todos' | 'artista' | 'cliente';
}

export interface StatusPerfil {
  completo: boolean;
  camposFaltantes: CampoFaltante[];
  tipoPerfil: TipoPerfil;
}

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
  cpf_cnpj?: string;
  regime_tributario?: string;
  chave_pix?: string;
  percentual_sinal?: number;
  mercado_pago_public_key?: string;
  criado_em?: string;
  criadoEm?: string;
  createdAt?: string;
}

export function verificarStatusPerfil(
  perfil: any,
  tipoSelecionado?: TipoPerfil
): StatusPerfil {
  const faltantes: CampoFaltante[] = [];

  if (!perfil) {
    return {
      completo: false,
      tipoPerfil: tipoSelecionado || 'cliente',
      camposFaltantes: [
        {
          campo: 'tipo_perfil',
          label: 'Tipo de Perfil',
          descricao: 'Defina se você é Cliente ou Tatuador',
          obrigatorioPara: 'todos',
        },
        {
          campo: 'nome_exibicao',
          label: 'Nome de Exibição',
          descricao: 'Informe seu nome para identificação',
          obrigatorioPara: 'todos',
        },
        {
          campo: 'telefone',
          label: 'Telefone / WhatsApp',
          descricao: 'Necessário para confirmações e contato',
          obrigatorioPara: 'todos',
        },
        {
          campo: 'cidade',
          label: 'Cidade / Região',
          descricao: 'Sua localização para o feed regional',
          obrigatorioPara: 'todos',
        },
      ],
    };
  }

  // 1. Identificar Role
  const rawRole = perfil.tipo_perfil || perfil.tipoPerfil || perfil.role || tipoSelecionado;
  const isArtista = rawRole === 'artista' || rawRole === 'tatuador';
  const tipoPerfil: TipoPerfil = isArtista ? 'artista' : (rawRole === 'cliente' ? 'cliente' : (tipoSelecionado || 'cliente'));

  if (!perfil.tipo_perfil && !perfil.tipoPerfil && !perfil.role && !tipoSelecionado) {
    faltantes.push({
      campo: 'tipo_perfil',
      label: 'Tipo de Perfil',
      descricao: 'Selecione se é Cliente ou Tatuador',
      obrigatorioPara: 'todos',
    });
  }

  // 2. Nome de exibição
  const nome = (perfil.nome_exibicao || perfil.nomeExibicao || perfil.displayName || perfil.nomeCompleto || '').trim();
  if (!nome || nome.toLowerCase() === 'usuário' || nome.toLowerCase() === 'usuario') {
    faltantes.push({
      campo: 'nome_exibicao',
      label: 'Nome de Exibição',
      descricao: 'Informe seu nome completo ou artístico',
      obrigatorioPara: 'todos',
    });
  }

  // 3. Telefone / WhatsApp
  const tel = (perfil.telefone || perfil.phoneNumber || '').trim();
  if (!tel) {
    faltantes.push({
      campo: 'telefone',
      label: 'Telefone / WhatsApp',
      descricao: 'Necessário para contato e confirmação',
      obrigatorioPara: 'todos',
    });
  }

  // 4. Cidade / Região
  const cidade = (perfil.cidade || '').trim();
  if (!cidade) {
    faltantes.push({
      campo: 'cidade',
      label: 'Cidade / Região',
      descricao: 'Sua cidade para busca regional',
      obrigatorioPara: 'todos',
    });
  }

  // 5. Campos de Tatuador
  if (tipoPerfil === 'artista') {
    const estudio = (perfil.nome_estudio || perfil.nomeEstudio || perfil.studioName || '').trim();
    if (!estudio) {
      faltantes.push({
        campo: 'nome_estudio',
        label: 'Nome do Estúdio',
        descricao: 'Informe seu estúdio ou "Particular"',
        obrigatorioPara: 'artista',
      });
    }

    const endEstudio = (perfil.endereco_estudio || perfil.enderecoEstudio || perfil.studioAddress || '').trim();
    if (!endEstudio) {
      faltantes.push({
        campo: 'endereco_estudio',
        label: 'Endereço do Estúdio',
        descricao: 'Endereço ou bairro onde atende',
        obrigatorioPara: 'artista',
      });
    }

    const bio = (perfil.biografia || perfil.bio || '').trim();
    if (!bio) {
      faltantes.push({
        campo: 'biografia',
        label: 'Biografia / Especialidade',
        descricao: 'Breve apresentação dos seus trabalhos',
        obrigatorioPara: 'artista',
      });
    }
  }

  return {
    completo: faltantes.length === 0,
    camposFaltantes: faltantes,
    tipoPerfil,
  };
}

export function normalizarPerfil(p: any): PerfilUsuario {
  if (!p) {
    return {
      email: '',
      nome_exibicao: '',
      nomeExibicao: '',
      displayName: '',
      tipo_perfil: 'cliente',
      tipoPerfil: 'cliente',
      role: 'cliente',
    };
  }

  const id = p.id || p.uid || '';
  const email = p.email || '';
  const nome = p.nome_exibicao || p.nomeExibicao || p.displayName || (email ? email.split('@')[0] : '');
  
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
  const cidade = p.cidade || '';
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
    cpf_cnpj: p.cpf_cnpj || '',
    regime_tributario: p.regime_tributario || 'MEI',
    chave_pix: p.chave_pix || '',
    percentual_sinal: Number(p.percentual_sinal || 30),
    mercado_pago_public_key: p.mercado_pago_public_key || '',
    criado_em: data,
    criadoEm: data,
    createdAt: data,
  };
}
