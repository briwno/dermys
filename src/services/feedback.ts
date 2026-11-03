import { Alert, Platform } from 'react-native';

export function avisar(mensagem: string) {
  if (Platform.OS === 'web') globalThis.alert(mensagem);
  else Alert.alert('Dermys', mensagem);
}
export function confirmarAcao(mensagem: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(globalThis.confirm(mensagem));
  return new Promise(resolve => Alert.alert('Confirmar ação', mensagem,
    [{ text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) }, { text: 'Confirmar', style: 'destructive', onPress: () => resolve(true) }],
    { cancelable: true, onDismiss: () => resolve(false) }));
}
