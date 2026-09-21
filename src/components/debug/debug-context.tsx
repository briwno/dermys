import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/services/supabase';
import { normalizarPerfil, type PerfilUsuario } from '@/types/auth';
import { MODELOS_DISPOSITIVOS, PERSONAS_TESTE, type ModeloDispositivo, type PersonaTeste } from './types';

const STORAGE_KEY_MODO_MOLDURA = '@dermys:debug_modo_moldura';
const STORAGE_KEY_MODELO = '@dermys:debug_modelo';
const STORAGE_KEY_ESCALA = '@dermys:debug_escala';

interface DebugContextData {
  modoMoldura: boolean;
  setModoMoldura: (ativo: boolean) => void;
  modelo: ModeloDispositivo;
  setModelo: (modelo: ModeloDispositivo) => void;
  escala: number;
  setEscala: (escala: number) => void;
  menuAberto: boolean;
  setMenuAberto: (aberto: boolean) => void;
  alternarMenu: () => void;
  personaAtivaId: string | null;
  carregandoPersona: boolean;
  trocarPersona: (persona: PersonaTeste) => Promise<void>;
  deslogarParaAuth: () => void;
}

const DebugContext = createContext<DebugContextData | undefined>(undefined);

interface DebugProviderProps {
  children: ReactNode;
  onSetPerfil?: (perfil: PerfilUsuario | null) => void;
  onSetActiveTab?: (tab: any) => void;
  perfilAtual?: PerfilUsuario | null;
}

export function DebugProvider({
  children,
  onSetPerfil,
  onSetActiveTab,
  perfilAtual,
}: DebugProviderProps) {
  // No ambiente Web, inicia com a moldura de celular ativada por padrão para teste imediato
  const [modoMoldura, setModoMolduraState] = useState<boolean>(Platform.OS === 'web');
  const [modelo, setModeloState] = useState<ModeloDispositivo>('iphone_16_pro');
  const [escala, setEscalaState] = useState<number>(0.92);
  const [menuAberto, setMenuAberto] = useState<boolean>(false);
  const [carregandoPersona, setCarregandoPersona] = useState<boolean>(false);

  const personaAtivaId = perfilAtual?.id || null;

  // Carrega preferências salvas do storage local
  useEffect(() => {
    async function carregarPreferencias() {
      try {
        const [salvoMoldura, salvoModelo, salvoEscala] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_MODO_MOLDURA),
          AsyncStorage.getItem(STORAGE_KEY_MODELO),
          AsyncStorage.getItem(STORAGE_KEY_ESCALA),
        ]);

        if (salvoMoldura !== null) {
          setModoMolduraState(salvoMoldura === 'true');
        }
        if (salvoModelo && salvoModelo in MODELOS_DISPOSITIVOS) {
          setModeloState(salvoModelo as ModeloDispositivo);
        }
        if (salvoEscala) {
          const num = parseFloat(salvoEscala);
          if (!isNaN(num) && num >= 0.5 && num <= 1.2) {
            setEscalaState(num);
          }
        }
      } catch {
        // silencioso
      }
    }
    carregarPreferencias();
  }, []);

  const setModoMoldura = (ativo: boolean) => {
    setModoMolduraState(ativo);
    AsyncStorage.setItem(STORAGE_KEY_MODO_MOLDURA, ativo ? 'true' : 'false').catch(() => {});
  };

  const setModelo = (novoModelo: ModeloDispositivo) => {
    setModeloState(novoModelo);
    AsyncStorage.setItem(STORAGE_KEY_MODELO, novoModelo).catch(() => {});
  };

  const setEscala = (novaEscala: number) => {
    setEscalaState(novaEscala);
    AsyncStorage.setItem(STORAGE_KEY_ESCALA, novaEscala.toString()).catch(() => {});
  };

  const alternarMenu = () => {
    setMenuAberto((prev) => !prev);
  };

  // Troca instantânea de perfil para qualquer artista/estúdio ou cliente populado
  const trocarPersona = async (persona: PersonaTeste) => {
    setCarregandoPersona(true);
    try {
      // 1. Busca perfil completo no Supabase
      const { data: dbProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', persona.id)
        .maybeSingle();

      let perfilFinal: PerfilUsuario;

      if (dbProfile && !error) {
        perfilFinal = normalizarPerfil(dbProfile);
      } else {
        // Fallback robusto com os dados da persona
        perfilFinal = normalizarPerfil({
          id: persona.id,
          email: persona.email,
          nome_exibicao: persona.nome,
          tipo_perfil: persona.tipo === 'artista' ? 'artista' : 'cliente',
          foto_url: persona.avatarUrl,
          cidade: persona.cidade,
          nome_estudio: persona.estudio,
          estilo_principal: persona.estilo,
        });
      }

      if (onSetPerfil) {
        onSetPerfil(perfilFinal);
      }

      if (onSetActiveTab) {
        if (perfilFinal.role === 'artista' || perfilFinal.tipo_perfil === 'artista') {
          onSetActiveTab('dashboard');
        } else {
          onSetActiveTab('home');
        }
      }

      setMenuAberto(false);
    } catch {
      // silencioso
    } finally {
      setCarregandoPersona(false);
    }
  };

  const deslogarParaAuth = () => {
    if (onSetPerfil) {
      onSetPerfil(null);
    }
    setMenuAberto(false);
  };

  return (
    <DebugContext.Provider
      value={{
        modoMoldura,
        setModoMoldura,
        modelo,
        setModelo,
        escala,
        setEscala,
        menuAberto,
        setMenuAberto,
        alternarMenu,
        personaAtivaId,
        carregandoPersona,
        trocarPersona,
        deslogarParaAuth,
      }}
    >
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebug deve ser utilizado dentro de um DebugProvider');
  }
  return context;
}
