import React, { useEffect, useState, type ReactNode } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Battery,
  ChevronDown,
  Maximize2,
  Minimize2,
  Smartphone,
  Sparkles,
  Wifi,
  ZoomIn,
  ZoomOut,
} from 'lucide-react-native';
import { useDebug } from './debug-context';
import { MODELOS_DISPOSITIVOS, type ModeloDispositivo } from './types';

interface DeviceFrameWrapperProps {
  children: ReactNode;
}

export function DeviceFrameWrapper({ children }: DeviceFrameWrapperProps) {
  const {
    modoMoldura,
    setModoMoldura,
    modelo,
    setModelo,
    escala,
    setEscala,
    alternarMenu,
  } = useDebug();

  const [larguraJanela, setLarguraJanela] = useState(Dimensions.get('window').width);
  const [alturaJanela, setAlturaJanela] = useState(Dimensions.get('window').height);
  const [horaAtual, setHoraAtual] = useState('09:41');

  // Atualiza relógio da barra de status simulada
  useEffect(() => {
    const atualizarHora = () => {
      const agora = new Date();
      const h = agora.getHours().toString().padStart(2, '0');
      const m = agora.getMinutes().toString().padStart(2, '0');
      setHoraAtual(`${h}:${m}`);
    };

    atualizarHora();
    const interval = setInterval(atualizarHora, 10000);
    return () => clearInterval(interval);
  }, []);

  // Monitora redimensionamento da janela do navegador
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setLarguraJanela(window.width);
      setAlturaJanela(window.height);
    });
    return () => sub?.remove();
  }, []);

  const config = MODELOS_DISPOSITIVOS[modelo] || MODELOS_DISPOSITIVOS.iphone_16_pro;

  // Se estiver em tela cheia, ou em dispositivo mobile real pequeno, renderiza direto
  const isMobileReal = Platform.OS !== 'web' || larguraJanela < 600;
  if (!modoMoldura || modelo === 'full' || isMobileReal) {
    return <View style={styles.fullscreenContainer}>{children}</View>;
  }

  const alturaChassis = config.altura + config.larguraBorda * 2;
  const larguraChassis = config.largura + config.larguraBorda * 2;

  const escalasDisponiveis = [
    { label: '75%', valor: 0.75 },
    { label: '85%', valor: 0.85 },
    { label: '92%', valor: 0.92 },
    { label: '100%', valor: 1.0 },
  ];

  return (
    <View style={styles.desktopCanvas}>
      {/* Barra de Ferramentas Superior do Simulador */}
      <View style={styles.topControlBar}>
        <View style={styles.brandBadge}>
          <Sparkles size={14} color="#f3c21a" />
          <Text style={styles.brandBadgeText}>DERMYS SIMULATOR</Text>
          <View style={styles.liveDot} />
        </View>

        {/* Seletor Rápido de Dispositivo */}
        <View style={styles.devicePillsWrap}>
          <TouchableOpacity
            style={[
              styles.devicePill,
              modelo === 'iphone_16_pro' && styles.devicePillActive,
            ]}
            onPress={() => setModelo('iphone_16_pro')}
          >
            <Smartphone size={13} color={modelo === 'iphone_16_pro' ? '#000' : '#aaa'} />
            <Text
              style={[
                styles.devicePillText,
                modelo === 'iphone_16_pro' && styles.devicePillTextActive,
              ]}
            >
              iPhone 16 Pro
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.devicePill,
              modelo === 'galaxy_s24' && styles.devicePillActive,
            ]}
            onPress={() => setModelo('galaxy_s24')}
          >
            <Smartphone size={13} color={modelo === 'galaxy_s24' ? '#000' : '#aaa'} />
            <Text
              style={[
                styles.devicePillText,
                modelo === 'galaxy_s24' && styles.devicePillTextActive,
              ]}
            >
              Galaxy S24
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.devicePill,
              modelo === 'iphone_se' && styles.devicePillActive,
            ]}
            onPress={() => setModelo('iphone_se')}
          >
            <Smartphone size={13} color={modelo === 'iphone_se' ? '#000' : '#aaa'} />
            <Text
              style={[
                styles.devicePillText,
                modelo === 'iphone_se' && styles.devicePillTextActive,
              ]}
            >
              iPhone SE
            </Text>
          </TouchableOpacity>
        </View>

        {/* Controle de Escala / Zoom */}
        <View style={styles.zoomControlWrap}>
          {escalasDisponiveis.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.zoomPill, escala === item.valor && styles.zoomPillActive]}
              onPress={() => setEscala(item.valor)}
            >
              <Text
                style={[
                  styles.zoomPillText,
                  escala === item.valor && styles.zoomPillTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Botão de Alternar para Tela Cheia */}
        <TouchableOpacity
          style={styles.fullscreenToggleBtn}
          onPress={() => setModoMoldura(false)}
          activeOpacity={0.8}
        >
          <Maximize2 size={13} color="#f3c21a" />
          <Text style={styles.fullscreenToggleText}>Tela Cheia</Text>
        </TouchableOpacity>
      </View>

      {/* Área Central com o Chassis do Smartphone */}
      <View style={styles.viewportStage}>
        {/* Container escalonado */}
        <View
          style={[
            styles.scaledContainer,
            {
              transform: [{ scale: escala }],
              width: larguraChassis,
              height: alturaChassis,
            },
          ]}
        >
          {/* Botões Laterais Físicos do Smartphone */}
          <View style={styles.buttonActionLeft} />
          <View style={styles.buttonVolumeUp} />
          <View style={styles.buttonVolumeDown} />
          <View style={styles.buttonPowerRight} />

          {/* Chassis Externo com Acabamento Titânio */}
          <View
            style={[
              styles.phoneChassis,
              {
                width: larguraChassis,
                height: alturaChassis,
                borderRadius: config.raioBorda + config.larguraBorda,
                padding: config.larguraBorda,
              },
            ]}
          >
            {/* Tela Interna do Dispositivo */}
            <View
              style={[
                styles.phoneScreen,
                {
                  width: config.largura,
                  height: config.altura,
                  borderRadius: config.raioBorda,
                },
              ]}
            >
              {/* Barra de Status do Celular (Hora, Bateria, Wi-Fi) */}
              <View style={styles.statusBar}>
                <Text style={styles.statusTimeText}>{horaAtual}</Text>

                {/* Dynamic Island ou Notch */}
                {config.temDynamicIsland ? (
                  <TouchableOpacity
                    style={styles.dynamicIsland}
                    activeOpacity={0.9}
                    onPress={alternarMenu}
                  >
                    <View style={styles.cameraLens} />
                    <View style={styles.privacyDot} />
                  </TouchableOpacity>
                ) : config.tipoNotch === 'punchhole' ? (
                  <View style={styles.punchholeCamera} />
                ) : null}

                <View style={styles.statusIconsWrap}>
                  <Wifi size={12} color="#ffffff" />
                  <Text style={styles.statusNetworkText}>5G</Text>
                  <Battery size={14} color="#ffffff" />
                </View>
              </View>

              {/* Conteúdo Real do Aplicativo Dermys */}
              <View style={styles.appViewport}>{children}</View>

              {/* Barra Indicadora de Home do iOS */}
              <View style={styles.homeIndicatorWrap} pointerEvents="none">
                <View style={styles.homeIndicatorBar} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#050505',
  },
  desktopCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#08080a',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  topControlBar: {
    width: '100%',
    height: 48,
    backgroundColor: '#0f0f13',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a24',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#18181f',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#262633',
  },
  brandBadgeText: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  devicePillsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#14141a',
    padding: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#22222c',
  },
  devicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  devicePillActive: {
    backgroundColor: '#f3c21a',
  },
  devicePillText: {
    color: '#888899',
    fontSize: 11,
    fontWeight: '600',
  },
  devicePillTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  zoomControlWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#14141a',
    padding: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22222c',
  },
  zoomPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  zoomPillActive: {
    backgroundColor: '#2b2b38',
  },
  zoomPillText: {
    color: '#777788',
    fontSize: 10,
    fontWeight: '700',
  },
  zoomPillTextActive: {
    color: '#f3c21a',
    fontWeight: '800',
  },
  fullscreenToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(243, 194, 26, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(243, 194, 26, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fullscreenToggleText: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '700',
  },
  viewportStage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  scaledContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneChassis: {
    backgroundColor: '#1b1b22',
    borderWidth: 2,
    borderColor: '#2e2e3a',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
    elevation: 24,
    position: 'relative',
  },
  phoneScreen: {
    backgroundColor: '#050505',
    overflow: 'hidden',
    position: 'relative',
  },
  statusBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    pointerEvents: 'box-none',
  },
  statusTimeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  dynamicIsland: {
    position: 'absolute',
    left: '50%',
    marginLeft: -60,
    top: 9,
    width: 120,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 12,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    zIndex: 60,
  },
  cameraLens: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0d131f',
    borderWidth: 1.5,
    borderColor: '#1c2838',
  },
  privacyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10b981',
    marginLeft: 6,
    opacity: 0.8,
  },
  punchholeCamera: {
    position: 'absolute',
    left: '50%',
    marginLeft: -6,
    top: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#222222',
    zIndex: 60,
  },
  statusIconsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusNetworkText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  appViewport: {
    flex: 1,
    width: '100%',
    height: '100%',
    paddingTop: 36,
  },
  homeIndicatorWrap: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    height: 16,
    zIndex: 50,
  },
  homeIndicatorBar: {
    width: 134,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  // Botões físicos externos
  buttonActionLeft: {
    position: 'absolute',
    left: -4,
    top: 110,
    width: 4,
    height: 28,
    borderRadius: 2,
    backgroundColor: '#2d2d38',
  },
  buttonVolumeUp: {
    position: 'absolute',
    left: -4,
    top: 155,
    width: 4,
    height: 48,
    borderRadius: 2,
    backgroundColor: '#2d2d38',
  },
  buttonVolumeDown: {
    position: 'absolute',
    left: -4,
    top: 215,
    width: 4,
    height: 48,
    borderRadius: 2,
    backgroundColor: '#2d2d38',
  },
  buttonPowerRight: {
    position: 'absolute',
    right: -4,
    top: 170,
    width: 4,
    height: 72,
    borderRadius: 2,
    backgroundColor: '#2d2d38',
  },
});
