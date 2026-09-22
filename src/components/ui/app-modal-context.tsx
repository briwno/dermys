import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';

export interface ModalItem {
  id: string;
  content: ReactNode;
}

interface ModalContextType {
  showModal: (id: string, content: ReactNode) => void;
  hideModal: (id: string) => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export function ModalHostProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<ModalItem[]>([]);

  const showModal = useCallback((id: string, content: ReactNode) => {
    setModals((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx >= 0) {
        if (prev[idx].content === content) return prev;
        const next = [...prev];
        next[idx] = { id, content };
        return next;
      }
      return [...prev, { id, content }];
    });
  }, []);

  const hideModal = useCallback((id: string) => {
    setModals((prev) => {
      if (!prev.some((m) => m.id === id)) return prev;
      return prev.filter((m) => m.id !== id);
    });
  }, []);

  return (
    <ModalContext.Provider value={{ showModal, hideModal }}>
      {children}
      {modals.length > 0 && (
        <View style={styles.modalHostRoot} pointerEvents="box-none">
          {modals.map((m) => (
            <View key={m.id} style={styles.modalHostItem} pointerEvents="auto">
              {m.content}
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
