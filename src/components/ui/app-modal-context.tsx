import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';

interface ModalContextType {
  showModal: (id: string, content: ReactNode) => void;
  hideModal: (id: string) => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

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
            <View key={id} style={styles.modalHostItem} pointerEvents="auto">
              {content}
            </View>
          ))}
        </View>
      )}
    </ModalContext.Provider>
  );
}

export function useModalHost() {
  return useContext(ModalContext);
}

const styles = StyleSheet.create({
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
