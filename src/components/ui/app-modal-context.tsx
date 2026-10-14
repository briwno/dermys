import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { createThemedStyles } from '@/theme';

interface ModalContextType {
  showModal: (id: string, content: ReactNode) => void;
  hideModal: (id: string) => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

function AnimatedModalHostItem({ children }: { children: ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 130,
      friction: 9,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        styles.modalHostItem,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [24, 0],
              }),
            },
            {
              scale: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.985, 1],
              }),
            },
          ],
        },
      ]}
      pointerEvents="auto"
    >
      {children}
    </Animated.View>
  );
}

export function ModalHostProvider({ children }: { children: ReactNode }) {
  const [modalsMap, setModalsMap] = useState<Record<string, ReactNode>>({});

  const showModal = useCallback((id: string, content: ReactNode) => {
    setModalsMap((prev) => {
      if (prev[id] === content) return prev;
      return { ...prev, [id]: content };
    });
  }, []);

  const hideModal = useCallback((id: string) => {
    setModalsMap((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const modalEntries = Object.entries(modalsMap);

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {modalEntries.length > 0 && (
        <View style={styles.modalHostRoot} pointerEvents="box-none">
          {modalEntries.map(([id, content]) => (
            <AnimatedModalHostItem key={id}>
              {content}
            </AnimatedModalHostItem>
          ))}
        </View>
      )}
    </ModalContext.Provider>
  );
}

export function useModalHost() {
  return useContext(ModalContext);
}

const styles = createThemedStyles({
  modalHostRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 99999,
    pointerEvents: 'box-none',
  },
  modalHostItem: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
});
