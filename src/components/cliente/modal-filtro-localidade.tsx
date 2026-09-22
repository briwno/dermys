import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Check,
  Crosshair,
  MapPin,
  Search,
  X,
} from 'lucide-react-native';
import { AppModal } from '@/components/ui/app-modal';
import {
  CIDADES_BRASIL_POLOS,
  LocalidadeService,
} from '@/services/localidade-service';
import type {
  CidadeBrasil,
  LocalidadeUsuario,
  RaioFiltroKm,
} from '@/types/localidade';

interface ModalFiltroLocalidadeProps {
  visivel: boolean;
  localidadeAtual: LocalidadeUsuario;
  onSalvar?: (novaLocalidade: LocalidadeUsuario) => void;
  onAplicar?: (novaLocalidade: LocalidadeUsuario) => void;
  onClose: () => void;
}

const OPCOES_RAIO: { valor: RaioFiltroKm; rotulo: string }[] = [
  { valor: 15, rotulo: '15 km' },
  { valor: 30, rotulo: '30 km' },
  { valor: 50, rotulo: '50 km' },
  { valor: null, rotulo: 'Todo o Brasil' },
];

const CIDADES_DESTAQUE = [
  'São Paulo',
  'Rio de Janeiro',
  'Curitiba',
  'Belo Horizonte',
  'Florianópolis',
  'Salvador',
];

export function ModalFiltroLocalidade({
  visivel,
  localidadeAtual,
  onSalvar,
  onAplicar,
  onClose,
}: ModalFiltroLocalidadeProps) {
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>(localidadeAtual.cidade);
  const [estadoSelecionado, setEstadoSelecionado] = useState<string>(localidadeAtual.estado);
  const [lat, setLat] = useState<number>(localidadeAtual.latitude);
  const [lon, setLon] = useState<number>(localidadeAtual.longitude);
  const [raio, setRaio] = useState<RaioFiltroKm>(localidadeAtual.raioKm);
  const [detectandoGps, setDetectandoGps] = useState(false);
  const [buscaCidade, setBuscaCidade] = useState('');

  const handleSelecionarCidade = (cidade: CidadeBrasil) => {
    setCidadeSelecionada(cidade.nome);
    setEstadoSelecionado(cidade.estado);
    setLat(cidade.latitude);
    setLon(cidade.longitude);
    setBuscaCidade('');
  };

  const handleUsarGps = async () => {
    setDetectandoGps(true);
    try {
      const coords = await LocalidadeService.detectarLocalizacaoGps();
      if (coords) {
        setLat(coords.latitude);
        setLon(coords.longitude);
        const cidadeProxima = LocalidadeService.encontrarCidadeMaisProxima(coords);
        setCidadeSelecionada(cidadeProxima.nome);
        setEstadoSelecionado(cidadeProxima.estado);
      }
    } finally {
      setDetectandoGps(false);
    }
  };

  const handleConfirmar = () => {
    const atualizado: LocalidadeUsuario = {
      cidade: cidadeSelecionada,
      estado: estadoSelecionado,
      latitude: lat,
      longitude: lon,
      raioKm: raio,
      modoGps: false,
      ordenacao: localidadeAtual.ordenacao || 'distancia',
    };
    LocalidadeService.salvarLocalidade(atualizado);
    if (onAplicar) {
      onAplicar(atualizado);
    }
    if (onSalvar) {
      onSalvar(atualizado);
    }
    onClose();
  };

  const cidadesFiltradas = buscaCidade.trim()
    ? CIDADES_BRASIL_POLOS.filter((c) => {
        const termo = buscaCidade.toLowerCase();
        return (
          c.nome.toLowerCase().includes(termo) ||
          c.estado.toLowerCase().includes(termo)
        );
      })
    : CIDADES_BRASIL_POLOS.filter((c) => CIDADES_DESTAQUE.includes(c.nome));

  return (
    <AppModal visible={visivel} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header Minimalista */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Onde você quer tatuar?</Text>
              <Text style={styles.subtitle}>
                Selecionado: <Text style={styles.selectedCityHighlight}>{cidadeSelecionada}, {estadoSelecionado}</Text>
              </Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <X size={18} color="#9ca3af" />
            </Pressable>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Linha de Busca & Botão GPS */}
            <View style={styles.searchRow}>
              <View style={styles.searchWrap}>
                <Search size={15} color="#71717a" style={styles.searchIcon} />
                <TextInput
                  value={buscaCidade}
                  onChangeText={setBuscaCidade}
                  placeholder="Buscar cidade..."
                  placeholderTextColor="#71717a"
                  style={styles.searchInput}
                />
              </View>

              <Pressable
                style={[styles.gpsQuickBtn, detectandoGps && styles.gpsQuickBtnLoading]}
                onPress={handleUsarGps}
                disabled={detectandoGps}
              >
                {detectandoGps ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Crosshair size={14} color="#000000" />
                    <Text style={styles.gpsQuickBtnText}>GPS</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Chips de Cidades */}
            <View style={styles.chipsRow}>
              {cidadesFiltradas.slice(0, 8).map((c, i) => {
                const sel = cidadeSelecionada === c.nome && estadoSelecionado === c.estado;
                return (
                  <Pressable
                    key={i}
                    style={[styles.cityChip, sel && styles.cityChipActive]}
                    onPress={() => handleSelecionarCidade(c)}
                  >
                    <Text style={[styles.cityChipText, sel && styles.cityChipTextActive]}>
                      {c.nome} ({c.estado})
                    </Text>
                    {sel && <Check size={12} color="#000000" />}
                  </Pressable>
                );
              })}
            </View>

            {/* Raio de Distância */}
            <View style={styles.radiusBlock}>
              <Text style={styles.sectionLabel}>Distância Máxima</Text>
              <View style={styles.radiusRow}>
                {OPCOES_RAIO.map((op, idx) => {
                  const sel = raio === op.valor;
                  return (
                    <Pressable
                      key={idx}
                      style={[styles.radiusPill, sel && styles.radiusPillActive]}
                      onPress={() => setRaio(op.valor)}
                    >
                      <Text style={[styles.radiusPillText, sel && styles.radiusPillTextActive]}>
                        {op.rotulo}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Botão de Ação */}
          <View style={styles.footer}>
            <Pressable style={styles.applyBtn} onPress={handleConfirmar}>
              <Text style={styles.applyBtnText}>Explorar Tatuadores</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0e0e12',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#1e1e24',
    paddingTop: 16,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#181820',
  },
  title: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
  },
  selectedCityHighlight: {
    color: '#f3c21a',
    fontWeight: '700',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#181820',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentScroll: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchWrap: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 2,
  },
  searchInput: {
    backgroundColor: '#14141a',
    borderWidth: 1,
    borderColor: '#22222a',
    borderRadius: 10,
    color: '#ffffff',
    fontSize: 13,
    paddingLeft: 34,
    paddingRight: 10,
    height: 38,
  },
  gpsQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f3c21a',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 38,
  },
  gpsQuickBtnLoading: {
    opacity: 0.6,
  },
  gpsQuickBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  cityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#14141a',
    borderWidth: 1,
    borderColor: '#22222a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cityChipActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  cityChipText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
  },
  cityChipTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  radiusBlock: {
    gap: 8,
    marginBottom: 8,
  },
  sectionLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 6,
  },
  radiusPill: {
    flex: 1,
    backgroundColor: '#14141a',
    borderWidth: 1,
    borderColor: '#22222a',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusPillActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  radiusPillText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '700',
  },
  radiusPillTextActive: {
    color: '#000000',
    fontWeight: '900',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  applyBtn: {
    backgroundColor: '#f3c21a',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '800',
  },
});
