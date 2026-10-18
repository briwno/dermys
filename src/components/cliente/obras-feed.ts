import type { ItemPortfolio } from '@/types/artista-detalhado';
import type { ItemArtistaFeedData } from './cartao-artista-feed';

export interface PostObraFeed {
  id: string;
  artista: ItemArtistaFeedData;
  obra: ItemPortfolio;
}

/** Um post por obra, alternando artistas sem repetir fotos do mesmo portfólio. */
export function montarPostsObras(artistas: ItemArtistaFeedData[]): PostObraFeed[] {
  const portfolios = artistas.map((artista) => {
    const imagensVistas = new Set<string>();
    const obras = artista.obras.filter((obra) => {
      const imagem = obra.imagemUrl?.trim();
      if (!imagem || imagensVistas.has(imagem)) return false;
      imagensVistas.add(imagem);
      return true;
    });
    return { artista, obras };
  });
  const posts: PostObraFeed[] = [];
  const totalRodadas = portfolios.reduce((total, { obras }) => Math.max(total, obras.length), 0);
  for (let indice = 0; indice < totalRodadas; indice++) {
    for (const { artista, obras } of portfolios) {
      const obra = obras[indice];
      if (obra) posts.push({ id: `${artista.id}:${obra.id}`, artista, obra });
    }
  }
  return posts;
}
