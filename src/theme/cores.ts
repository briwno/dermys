/**
 * Conversão automática da paleta escura (padrão) para o modo claro.
 *
 * Regras:
 * - Tons neutros (preto/cinza/branco) têm a luminosidade invertida: preto vira branco e vice-versa.
 * - O amarelo de destaque (#f3c21a e variações) vira roxo (#6338EE), preservando a transparência.
 * - Cores semânticas (verde, vermelho, azul...) são mantidas; apenas tons muito escuros/claros
 *   delas têm a luminosidade invertida para continuarem legíveis sobre fundo claro.
 * - Overlays pretos semi-opacos (fundo de modal) são preservados.
 */

export const COR_DESTAQUE_ESCURO = '#f3c21a';
export const COR_DESTAQUE_CLARO = '#6338EE';

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

const HSL_DESTAQUE_CLARO = rgbParaHsl(hexParaRgba(COR_DESTAQUE_CLARO) as Rgba);

function hexParaRgba(hex: string): Rgba | null {
  let h = hex.replace('#', '');
  if (h.length === 3 || h.length === 4) {
    h = h
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  if (h.length !== 6 && h.length !== 8) return null;
  const num = parseInt(h, 16);
  if (Number.isNaN(num)) return null;
  if (h.length === 6) {
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255, a: 1 };
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
    a: parseInt(h.slice(6, 8), 16) / 255,
  };
}

function interpretarCor(cor: string): Rgba | null {
  const valor = cor.trim().toLowerCase();
  if (valor.startsWith('#')) return hexParaRgba(valor);
  const m = valor.match(/^rgba?\(([^)]+)\)$/);
  if (m) {
    const partes = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
    if (partes.length < 3 || partes.some((n) => Number.isNaN(n))) return null;
    return { r: partes[0], g: partes[1], b: partes[2], a: partes[3] ?? 1 };
  }
  if (valor === 'white') return { r: 255, g: 255, b: 255, a: 1 };
  if (valor === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  return null;
}

function rgbParaHsl({ r, g, b }: Rgba): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return { h, s, l };
}

function hslParaRgb({ h, s, l }: Hsl): { r: number; g: number; b: number } {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  };
}

function formatar({ r, g, b }: { r: number; g: number; b: number }, a: number): string {
  if (a >= 1) {
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  }
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})`;
}

function ehAmareloDestaque(hsl: Hsl): boolean {
  return hsl.h >= 40 && hsl.h <= 60 && hsl.s >= 0.45;
}

const cache = new Map<string, string>();

/** Converte uma cor da paleta escura para seu equivalente no modo claro. */
export function converterParaClaro(cor: string): string {
  const emCache = cache.get(cor);
  if (emCache !== undefined) return emCache;

  const resultado = calcularCorClara(cor);
  cache.set(cor, resultado);
  return resultado;
}

function calcularCorClara(cor: string): string {
  const rgba = interpretarCor(cor);
  if (!rgba) return cor; // 'transparent', nomes desconhecidos etc.

  const hsl = rgbParaHsl(rgba);

  // Amarelo de destaque -> roxo #6338EE
  if (ehAmareloDestaque(hsl)) {
    if (hsl.l >= 0.35 && hsl.l <= 0.7) {
      return formatar(hslParaRgb(HSL_DESTAQUE_CLARO), rgba.a);
    }
    // Tons muito escuros/claros do amarelo (fundos e textos derivados)
    return formatar(
      hslParaRgb({ h: HSL_DESTAQUE_CLARO.h, s: Math.min(hsl.s, HSL_DESTAQUE_CLARO.s), l: 1 - hsl.l }),
      rgba.a
    );
  }

  const neutro = hsl.s < 0.2 || hsl.l < 0.06 || hsl.l > 0.97;

  if (neutro) {
    // Overlay preto semi-opaco (fundo de modal): mantém escurecimento
    if (hsl.l < 0.08 && rgba.a >= 0.35 && rgba.a < 1) return cor;
    return formatar(hslParaRgb({ h: hsl.h, s: hsl.s, l: 1 - hsl.l }), rgba.a);
  }

  // Cores semânticas: inverte só os tons extremos (fundos muito escuros / textos muito claros)
  if (hsl.l < 0.25 || hsl.l > 0.8) {
    return formatar(hslParaRgb({ h: hsl.h, s: hsl.s, l: 1 - hsl.l }), rgba.a);
  }
  return cor;
}
