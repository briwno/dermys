import manifest from '../../assets/demo/tattoos/manifest.json';
import { imagensTatuagensDemo } from './imagens-demonstracao';
import type { ItemPortfolio } from '@/types/artista-detalhado';

export const PORTFOLIOS_DEMONSTRACAO = manifest.reduce<Record<string, ItemPortfolio[]>>((portfolios, item) => {
  const obras = portfolios[item.artistId] || (portfolios[item.artistId] = []);
  obras.push({
    id: `demo-${item.file}`,
    artistaId: item.artistId,
    titulo: item.title,
    estilo: item.style,
    imagemUrl: imagensTatuagensDemo[item.file],
    disponivel: false,
  });
  return portfolios;
}, {});

/** Os antigos exemplos usavam fotos genéricas do Unsplash como se fossem tatuagens. */
export function filtrarObrasDemonstracao(artistaId: string, obras: ItemPortfolio[]): ItemPortfolio[] {
  if (!PORTFOLIOS_DEMONSTRACAO[artistaId]) return obras;
  return obras.filter(obra => obra.imagemUrl && !/^https:\/\/images\.unsplash\.com\//i.test(obra.imagemUrl));
}
