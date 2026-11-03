import { useSyncExternalStore } from 'react';
import { assinarDemo, snapshotDemo } from '@/services/apresentacao-store';

export function useApresentacao() {
  return useSyncExternalStore(assinarDemo, snapshotDemo, snapshotDemo);
}
