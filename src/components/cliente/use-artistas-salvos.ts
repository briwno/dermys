import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

/** Preferências de descoberta por perfil, independentes da sessão de autenticação. */
export function useArtistasSalvos(perfilId: string) {
  const chave = `@dermys:explore:salvos:${perfilId}`;
  const [salvos, setSalvos] = useState<Record<string, boolean>>({});
  const [erro, setErro] = useState(false);
  const atual = useRef<Record<string, boolean>>({});
  const carregado = useRef(false);
  const pendentes = useRef<string[]>([]);
  const fila = useRef(Promise.resolve());
  const persistir = useCallback((valor: Record<string, boolean>) => {
    const texto = JSON.stringify(valor);
    fila.current = fila.current.catch(() => {}).then(() => AsyncStorage.setItem(chave, texto))
      .then(() => setErro(false)).catch(() => setErro(true));
  }, [chave]);
  useEffect(() => {
    let ativo = true;
    carregado.current = false; pendentes.current = []; atual.current = {}; setSalvos({}); setErro(false);
    AsyncStorage.getItem(chave).then(texto => {
      if (!ativo) return;
      let dados: Record<string, boolean> = {};
      try {
        const parsed = JSON.parse(texto || '{}');
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) dados = Object.fromEntries(Object.entries(parsed).filter(([, valor]) => valor === true).map(([id]) => [id, true]));
      } catch { /* Uma preferência inválida não bloqueia a descoberta. */ }
      pendentes.current.forEach(id => { dados[id] = !dados[id]; });
      atual.current = dados; carregado.current = true; setSalvos(dados);
      if (pendentes.current.length) persistir(dados);
      pendentes.current = [];
    }).catch(() => { if (ativo) { carregado.current = true; setErro(true); } });
    return () => { ativo = false; };
  }, [chave, persistir]);
  const alternar = useCallback((id: string) => {
    const proximo = { ...atual.current, [id]: !atual.current[id] };
    atual.current = proximo; setSalvos(proximo);
    if (carregado.current) persistir(proximo); else pendentes.current.push(id);
  }, [persistir]);
  return { salvos, alternar, erro };
}
