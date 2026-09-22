import React, { useEffect, useId, type ReactNode } from 'react';
import { Modal, type ModalProps } from 'react-native';
import { useModalHost } from './app-modal-context';

export interface AppModalProps extends Omit<ModalProps, 'visible'> {
  children: ReactNode;
  visible?: boolean;
  visivel?: boolean;
}

export function AppModal({
  children,
  visible,
  visivel,
  transparent = true,
  animationType = 'fade',
  onRequestClose,
  ...rest
}: AppModalProps) {
  const isVisible = visible ?? visivel ?? false;
  const modalHost = useModalHost();
  const id = useId();

  useEffect(() => {
    if (modalHost) {
      if (isVisible) {
        modalHost.showModal(id, children);
      } else {
        modalHost.hideModal(id);
      }
    }
  }, [modalHost, isVisible, children, id]);

  useEffect(() => {
    return () => {
      if (modalHost) {
        modalHost.hideModal(id);
      }
    };
  }, [modalHost, id]);

  // Se o ModalHostProvider estiver disponível, ele cuida da renderização no topo da tela
  if (modalHost) {
    return null;
  }

  // Fallback caso não esteja envolvido no provider
  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={transparent}
      animationType={animationType}
      onRequestClose={onRequestClose}
      {...rest}
    >
      {children}
    </Modal>
  );
}
