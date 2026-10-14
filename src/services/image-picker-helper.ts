import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Utilitário cross-platform para seleção de imagens da galeria/arquivos.
 * No Web: usa input de arquivo nativo HTML e retorna Base64 Data URL.
 * No iOS/Android: usa ImagePicker com permissões e retorna URI/Base64.
 */
export async function selecionarImagemGaleria(): Promise<string | null> {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';

      fileInput.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          resolve(result || null);
        };
        reader.onerror = () => {
          resolve(null);
        };
        reader.readAsDataURL(file);
      };

      fileInput.oncancel = () => {
        resolve(null);
      };

      fileInput.click();
    });
  }

  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      alert('Precisamos de permissão para acessar a galeria de fotos.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.base64) {
        return `data:image/jpeg;base64,${asset.base64}`;
      }
      return asset.uri;
    }

    return null;
  } catch (err) {
    console.warn('Erro ao selecionar imagem:', err);
    return null;
  }
}
