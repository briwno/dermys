import { DanfseDocumentoModal } from '@/components/fiscal/danfse-documento-modal';
import type { ReciboFiscal } from '@/types/financeiro';
import React from 'react';

interface ReciboFiscalModalProps {
  visivel: boolean;
  recibo: ReciboFiscal | null;
  onClose: () => void;
}

export function ReciboFiscalModal({ visivel, recibo, onClose }: ReciboFiscalModalProps) {
  return (
    <DanfseDocumentoModal
      visivel={visivel}
      dadosNotaOuRecibo={recibo}
      onClose={onClose}
    />
  );
}
