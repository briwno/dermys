import React, { useEffect, useState, type ReactNode } from 'react';
import {
  Dimensions,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Battery,
  Wifi,
} from 'lucide-react-native';
import { useDebug } from './debug-context';
import { DevTopBar } from './dev-top-bar';
import { MODELOS_DISPOSITIVOS } from './types';
import { ModalHostProvider } from '@/components/ui/app-modal-context';

interface DeviceFrameWrapperProps {
  children: ReactNode;
}

export function DeviceFrameWrapper({ children }: DeviceFrameWrapperProps) {
  const {
    modoMoldura,
    modelo,
    escala,
    alternarMenu,
  } = useDebug();

  const [larguraJanela, setLarguraJanela] = useState(Dimensions.get('window').width);
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
    });
    return () => sub?.remove();
  }, []);

  const config = MODELOS_DISPOSITIVOS[modelo] || MODELOS_DISPOSITIVOS.iphone_16_pro;
  const isMobileReal = Platform.OS !== 'web' || larguraJanela < 600;

  // VISUALIZAÇÃO NÃO-MOBILE (TELA CHEIA / DESKTOP NORMAL) COM BARRA SUPERIOR
  if (!modoMoldura || modelo === 'full' || isMobileReal) {
    return (
      <View style={styles.fullscreenContainer}>
        {Platform.OS === 'web' && <DevTopBar />}
        <View style={styles.fullscreenBody}>
          <ModalHostProvider>{children}</ModalHostProvider>
        </View>
      </View>
    );
  }

  const alturaChassis = config.altura + config.larguraBorda * 2;
  const larguraChassis = config.largura + config.larguraBorda * 2;

  // VISUALIZAÇÃO COM MOLDURA DE CELULAR REALISTA + BARRA SUPERIOR
  return (
    <View style={styles.desktopCanvas}>
      {/* Barra de Ferramentas Superior Fixa */}
      <DevTopBar />

      {/* Área Central com o Chassis do Smartphone */}
      <View style={styles.viewportStage}>
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

          {/* Chassis Externo */}
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
            {/* Tela Interna */}
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
              <ModalHostProvider>
                {/* Barra de Status */}
                <View style={styles.statusBar}>
                  <Text style={styles.statusTimeText}>{horaAtual}</Text>

                  {/* Dynamic Island ou Punchhole */}
                  {config.temDynamicIsland ? (
                    <TouchableOpacity
                      style={styles.dynamicIsland}
                      activeOpacity={0.9}
                      onPress={alternarMenu}
                    >
                      <View style={styles.cameraLens} />
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

                {/* Barra de Home Indicator */}
                <View style={styles.homeIndicatorWrap} pointerEvents="none">
                  <View style={styles.homeIndicatorBar} />
                </View>
              </ModalHostProvider>
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
  fullscreenBody: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  desktopCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0a0a0c',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  viewportStage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
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
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
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
    marginLeft: -55,
    top: 9,
    width: 110,
    height: 28,
    borderRadius: 14,
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
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#0d131f',
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
