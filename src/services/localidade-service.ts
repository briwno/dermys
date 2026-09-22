import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import type {
  CidadeBrasil,
  Coordenadas,
  LocalidadeUsuario,
  OpcaoOrdenacao,
  RaioFiltroKm,
} from '@/types/localidade';

const STORAGE_KEY_LOCALIDADE = '@dermys:localidade_cliente_v1';

export const CIDADES_BRASIL_POLOS: CidadeBrasil[] = [
  // SUDESTE
  { nome: 'São Paulo', estado: 'SP', latitude: -23.5505, longitude: -46.6333, regiao: 'Sudeste' },
  { nome: 'Campinas', estado: 'SP', latitude: -22.9099, longitude: -47.0626, regiao: 'Sudeste' },
  { nome: 'Santos', estado: 'SP', latitude: -23.9618, longitude: -46.3322, regiao: 'Sudeste' },
  { nome: 'Rio de Janeiro', estado: 'RJ', latitude: -22.9068, longitude: -43.1729, regiao: 'Sudeste' },
  { nome: 'Niterói', estado: 'RJ', latitude: -22.8859, longitude: -43.1153, regiao: 'Sudeste' },
  { nome: 'Belo Horizonte', estado: 'MG', latitude: -19.9167, longitude: -43.9345, regiao: 'Sudeste' },
  { nome: 'Vitória', estado: 'ES', latitude: -20.3155, longitude: -40.3128, regiao: 'Sudeste' },

  // SUL
  { nome: 'Curitiba', estado: 'PR', latitude: -25.4284, longitude: -49.2733, regiao: 'Sul' },
  { nome: 'Londrina', estado: 'PR', latitude: -23.3045, longitude: -51.1696, regiao: 'Sul' },
  { nome: 'Florianópolis', estado: 'SC', latitude: -27.5954, longitude: -48.5480, regiao: 'Sul' },
  { nome: 'Joinville', estado: 'SC', latitude: -26.3045, longitude: -48.8487, regiao: 'Sul' },
  { nome: 'Porto Alegre', estado: 'RS', latitude: -30.0346, longitude: -51.2177, regiao: 'Sul' },
  { nome: 'Caxias do Sul', estado: 'RS', latitude: -29.1678, longitude: -51.1794, regiao: 'Sul' },

  // NORDESTE
  { nome: 'Salvador', estado: 'BA', latitude: -12.9777, longitude: -38.5016, regiao: 'Nordeste' },
  { nome: 'Recife', estado: 'PE', latitude: -8.0476, longitude: -34.8770, regiao: 'Nordeste' },
  { nome: 'Fortaleza', estado: 'CE', latitude: -3.7319, longitude: -38.5267, regiao: 'Nordeste' },
  { nome: 'Natal', estado: 'RN', latitude: -5.7945, longitude: -35.2110, regiao: 'Nordeste' },
  { nome: 'João Pessoa', estado: 'PB', latitude: -7.1195, longitude: -34.8450, regiao: 'Nordeste' },
  { nome: 'Maceió', estado: 'AL', latitude: -9.6498, longitude: -35.7089, regiao: 'Nordeste' },

  // CENTRO-OESTE & NORTE
  { nome: 'Brasília', estado: 'DF', latitude: -15.7975, longitude: -47.8919, regiao: 'Centro-Oeste' },
  { nome: 'Goiânia', estado: 'GO', latitude: -16.6869, longitude: -49.2648, regiao: 'Centro-Oeste' },
  { nome: 'Cuiabá', estado: 'MT', latitude: -15.6014, longitude: -56.0979, regiao: 'Centro-Oeste' },
  { nome: 'Campo Grande', estado: 'MS', latitude: -20.4697, longitude: -54.6201, regiao: 'Centro-Oeste' },
  { nome: 'Manaus', estado: 'AM', latitude: -3.1190, longitude: -60.0217, regiao: 'Norte' },
  { nome: 'Belém', estado: 'PA', latitude: -1.4558, longitude: -48.4902, regiao: 'Norte' },
];

export const LOCALIDADE_PADRAO: LocalidadeUsuario = {
  cidade: 'São Paulo',
  estado: 'SP',
  bairro: 'Jardins / Pinheiros',
  latitude: -23.5505,
  longitude: -46.6333,
  raioKm: 50,
  modoGps: false,
  ordenacao: 'distancia',
};

export class LocalidadeService {
  /**
   * Retorna as preferências padrão de localidade
   */
  static obterLocalidadePadrao(): LocalidadeUsuario {
    return LOCALIDADE_PADRAO;
  }

  /**
   * Fórmula de Haversine para cálculo da distância esférica entre duas coordenadas em km
   * Aceita objetos { latitude, longitude } ou 4 números separados (lat1, lon1, lat2, lon2).
   */
  static calcularDistanciaKm(
    origemOuLat: Coordenadas | number,
    destinoOuLon: Coordenadas | number,
    destLat?: number,
    destLon?: number
  ): number {
    let lat1: number;
    let lon1: number;
    let lat2: number;
    let lon2: number;

    if (typeof origemOuLat === 'object' && typeof destinoOuLon === 'object') {
      lat1 = origemOuLat.latitude;
      lon1 = origemOuLat.longitude;
      lat2 = destinoOuLon.latitude;
      lon2 = destinoOuLon.longitude;
    } else if (
      typeof origemOuLat === 'number' &&
      typeof destinoOuLon === 'number' &&
      destLat !== undefined &&
      destLon !== undefined
    ) {
      lat1 = origemOuLat;
      lon1 = destinoOuLon;
      lat2 = destLat;
      lon2 = destLon;
    } else {
      return 0;
    }

    if (!lat1 || !lon1 || !lat2 || !lon2 || isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
      return 0;
    }

    const R = 6371; // Raio da Terra em km
    const dLat = this.grausParaRadianos(lat2 - lat1);
    const dLon = this.grausParaRadianos(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.grausParaRadianos(lat1)) *
        Math.cos(this.grausParaRadianos(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(1));
  }

  private static grausParaRadianos(graus: number): number {
    return graus * (Math.PI / 180);
  }

  /**
   * Formata a distância para exibição amigável ao usuário (ex: '800 m', '2.4 km', '45 km')
   */
  static formatarDistancia(distanciaKm: number): string {
    if (distanciaKm <= 0) return 'No local';
    if (distanciaKm < 1) {
      return `${Math.round(distanciaKm * 1000)} m`;
    }
    return `${distanciaKm.toFixed(1).replace('.', ',')} km`;
  }

  /**
   * Obtém a localização salva localmente do usuário ou a padrão
   */
  static async carregarLocalidadeSalva(): Promise<LocalidadeUsuario> {
    try {
      const salvo = await AsyncStorage.getItem(STORAGE_KEY_LOCALIDADE);
      if (salvo) {
        return JSON.parse(salvo);
      }
    } catch {
      // silencioso
    }
    return LOCALIDADE_PADRAO;
  }

  /**
   * Salva a preferência de localidade do cliente
   */
  static async salvarLocalidade(loc: LocalidadeUsuario): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_LOCALIDADE, JSON.stringify(loc));
    } catch {
      // silencioso
    }
  }

  /**
   * Tenta detectar localização via GPS real do navegador ou dispositivo
   */
  static async detectarLocalizacaoGps(): Promise<Coordenadas | null> {
    return new Promise((resolve) => {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          },
          (err) => {
            console.warn('Erro ao obter GPS:', err);
            resolve(null);
          },
          { timeout: 8000, enableHighAccuracy: true }
        );
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Encontra a cidade polo mais próxima para uma coordenada GPS
   */
  static encontrarCidadeMaisProxima(coords: Coordenadas): CidadeBrasil {
    let maisProxima = CIDADES_BRASIL_POLOS[0];
    let menorDistancia = Infinity;

    for (const c of CIDADES_BRASIL_POLOS) {
      const dist = this.calcularDistanciaKm(coords, {
        latitude: c.latitude,
        longitude: c.longitude,
      });
      if (dist < menorDistancia) {
        menorDistancia = dist;
        maisProxima = c;
      }
    }

    return maisProxima;
  }

  /**
   * Abre rota no mapa nativo (Google Maps / Apple Maps)
   */
  static abrirRotaNoMapa(latitude?: number, longitude?: number, nomeEstudio?: string) {
    const query =
      latitude !== undefined && longitude !== undefined && !isNaN(latitude) && !isNaN(longitude)
        ? `${latitude},${longitude}`
        : encodeURIComponent(nomeEstudio || 'Estúdio de Tatuagem Brasil');

    const label = encodeURIComponent(nomeEstudio || 'Estúdio de Tatuagem');
    const url =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${label}@${query}`
        : `https://www.google.com/maps/search/?api=1&query=${query}`;

    Linking.canOpenURL(url).then((suportado) => {
      if (suportado) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://www.google.com/maps?q=${query}`);
      }
    });
  }
}
