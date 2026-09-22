import { LocalidadeService } from '@/services/localidade-service';
import type {
  DetalhesEstudio,
  ItemPortfolio,
  PerfilArtistaCompleto,
  ReviewArtista,
} from '@/types/artista-detalhado';

function formatarDataRelativa(isoString: string): string {
  try {
    const data = new Date(isoString);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias <= 1) return 'Ontem';
    if (diffDias < 7) return `Há ${diffDias} dias`;
    if (diffDias < 30) return `Há ${Math.floor(diffDias / 7)} semanas`;
    if (diffDias < 365) return `Há ${Math.floor(diffDias / 30)} meses`;
    return 'Há mais de 1 ano';
  } catch {
    return 'Recentemente';
  }
}

export class ArtistaDetalhadoService {
  /**
   * Converte um registro de artista do Supabase com seus flashes e avaliações reais de clientes
   */
  static montarPerfilCompleto(
    artistaDb: any,
    flashesDb: any[] = [],
    reviewsDb: any[] = [],
    origemCoords?: { latitude: number; longitude: number } | null
  ): PerfilArtistaCompleto {
    const nomeArtista = artistaDb.nome_exibicao || artistaDb.nomeArtista || 'Artista Dermys';
    const nomeEstudio = artistaDb.nome_estudio || artistaDb.nomeEstudio || 'Estúdio Particular Dermys';
    const estilo = artistaDb.estilo_principal || artistaDb.estilo || 'Fine Line';
    const precoInicial = Number(artistaDb.preco_inicial || artistaDb.precoInicial || 350);
    const precoHora = Math.round(precoInicial * 0.65);
    const sinalBase = Math.round(precoInicial * 0.3);

    // Converte flashes
    const flashes: ItemPortfolio[] = (flashesDb || []).map((f) => ({
      id: f.id,
      artistaId: artistaDb.id,
      titulo: f.titulo || 'Flash Autoral',
      imagemUrl: f.imagem_url || f.imagemUrl,
      estilo: f.estilo || estilo,
      preco: Number(f.preco || precoInicial),
      disponivel: f.disponivel ?? true,
      descricao: 'Arte autoral exclusiva disponível para tatuar. Inclui personalização de dimensões.',
      tempoSessao: '1h30 a 2h30',
    }));

    // Converte portfolio de trabalhos realizados
    const portfolio: ItemPortfolio[] = flashes.length > 0
      ? flashes
      : [
          {
            id: 'port-1',
            artistaId: artistaDb.id,
            titulo: `${estilo} Autoral`,
            imagemUrl:
              artistaDb.foto_url ||
              'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=600&auto=format&fit=crop&q=80',
            estilo: estilo,
            preco: precoInicial,
            disponivel: true,
          },
        ];

    // Reviews reais de clientes vindas do banco de dados
    const reviews: ReviewArtista[] = (reviewsDb && reviewsDb.length > 0)
      ? reviewsDb.map((r) => ({
          id: r.id,
          autorNome: r.cliente_nome || 'Cliente Dermys',
          autorAvatar: r.cliente_avatar,
          nota: Number(r.nota || 5),
          data: r.criado_em ? formatarDataRelativa(r.criado_em) : 'Recente',
          estiloTatuado: r.estilo_tatuado || estilo,
          comentario: r.comentario || 'Excelente atendimento e cicatrização impecável.',
          curtidas: Number(r.curtidas || 0),
          verificado: r.verificado ?? true,
        }))
      : [];

    const notaMedia =
      reviews.length > 0
        ? Number((reviews.reduce((acc, r) => acc + r.nota, 0) / reviews.length).toFixed(1))
        : 5.0;

    const totalAvaliacoes = reviews.length;

    let distanciaKm: number | undefined = undefined;
    let distanciaFormatada: string | undefined = undefined;

    const latArtista = artistaDb.latitude ? Number(artistaDb.latitude) : undefined;
    const lonArtista = artistaDb.longitude ? Number(artistaDb.longitude) : undefined;

    if (
      origemCoords &&
      latArtista !== undefined &&
      lonArtista !== undefined &&
      !isNaN(latArtista) &&
      !isNaN(lonArtista)
    ) {
      distanciaKm = LocalidadeService.calcularDistanciaKm(
        origemCoords.latitude,
        origemCoords.longitude,
        latArtista,
        lonArtista
      );
      distanciaFormatada = LocalidadeService.formatarDistancia(distanciaKm);
    }

    const estudioInfo: DetalhesEstudio = {
      nome: nomeEstudio,
      endereco: artistaDb.endereco_estudio || 'Rua Harmonia, 320 - Sala 4',
      bairroCidade: artistaDb.cidade || 'São Paulo, SP',
      bairro: artistaDb.bairro,
      cidade: artistaDb.cidade,
      estado: artistaDb.estado,
      latitude: latArtista,
      longitude: lonArtista,
      horarioFuncionamento: 'Terça a Sábado das 10h às 20h',
      comodidades: [
        'Ambiente 100% Climatizado',
        'Wi-Fi Ultra Rápido',
        'Café Espresso & Bebidas',
        'Estacionamento Próximo',
        'Música & Playlist Ambiente',
      ],
      protocolosBiosseguranca: [
        'Agulhas e materiais 100% descartáveis (Anvisa)',
        'Esterilização hospitalar por Autoclave',
        'Tintas e pigmentos regulamentados',
        'Uso de EPIs completos e barreira plástica',
      ],
    };

    return {
      id: artistaDb.id,
      nomeArtista,
      nomeEstudio,
      enderecoEstudio: artistaDb.endereco_estudio,
      bairro: artistaDb.bairro,
      cidade: artistaDb.cidade || 'São Paulo, SP',
      estado: artistaDb.estado,
      latitude: latArtista,
      longitude: lonArtista,
      distanciaKm,
      distanciaFormatada,
      estilo,
      estilosSecundarios: [estilo, 'Blackwork', 'Micro-traço', 'Minimalismo'],
      curtidas: Number(artistaDb.curtidas || 120),
      precoInicial,
      precoMedioHora: precoHora,
      valorSinalBase: sinalBase,
      fotoUrl: artistaDb.foto_url || artistaDb.fotoUrl,
      capaUrl: portfolio[0]?.imagemUrl || artistaDb.foto_url,
      biografia:
        artistaDb.biografia ||
        `Artista especializado em ${estilo} com foco em projetos autorais, anatomia corporal e técnicas avançadas de pigmentação e cicatrização suave.`,
      experienciaAnos: 7,
      notaMedia,
      totalAvaliacoes,
      portfolio,
      flashes,
      reviews,
      agendaAberta: artistaDb.agenda_aberta ?? true,
      mensagemAgendaFechada: artistaDb.mensagem_agenda_fechada || '',
      estudioInfo,
    };
  }
}
