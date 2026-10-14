import { AppModal } from '@/components/ui/app-modal';
import { selecionarImagemGaleria } from '@/services/image-picker-helper';
import { supabase } from '@/services/supabase';
import type { PerfilUsuario } from '@/types/auth';
import { BotaoAlternarTema, createThemedStyles, tc } from '@/theme';
import {
  Camera,
  Check,
  Edit3,
  Heart,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const ESTILOS_PREFERIDOS = [
  'Fine Line',
  'Blackwork',
  'Realismo',
  'Old School',
  'Aquarela',
  'Geek',
  'Oriental',
  'Botânica',
];

interface PropsPerfilTab {
  perfil: PerfilUsuario;
  onAtualizarPerfil?: (novoPerfil: PerfilUsuario) => void;
}

export function ClientePerfilTab({ perfil, onAtualizarPerfil }: PropsPerfilTab) {
  const clienteId = perfil.id || perfil.uid || '99999999-9999-9999-9999-999999999999';

  // Estados de alteração de foto
  const [modalFotoAberto, setModalFotoAberto] = useState(false);
  const [urlFotoTemporaria, setUrlFotoTemporaria] = useState('');
  const [salvandoFoto, setSalvandoFoto] = useState(false);

  // Estados de edição de dados pessoais
  const [modalDadosAberto, setModalDadosAberto] = useState(false);
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [formNome, setFormNome] = useState(perfil.nome_exibicao || perfil.nomeExibicao || '');
  const [formTelefone, setFormTelefone] = useState(perfil.telefone || '');
  const [formCidade, setFormCidade] = useState(perfil.cidade || '');
  const [formBio, setFormBio] = useState(perfil.biografia || perfil.bio || 'Fine Line, Blackwork, Botânica, Geek');

  // Feedback toast
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const exibirAlerta = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const fotoAtual = perfil.foto_url || perfil.fotoUrl || perfil.photoURL;

  // 1. AÇÃO: Escolher foto da galeria
  const handleSelecionarFotoGaleria = async () => {
    const uri = await selecionarImagemGaleria();
    if (uri) {
      setUrlFotoTemporaria(uri);
    }
  };

  // 2. AÇÃO: Salvar nova foto de perfil
  const handleSalvarFotoPerfil = async () => {
    if (!urlFotoTemporaria.trim()) {
      alert('Selecione ou informe a URL da foto.');
      return;
    }

    setSalvandoFoto(true);
    try {
      const fotoFinal = urlFotoTemporaria.trim();

      // Atualiza Supabase
      try {
        await supabase
          .from('profiles')
          .update({ foto_url: fotoFinal })
          .eq('id', clienteId);
      } catch {
        // silencioso
      }

      const atualizado: PerfilUsuario = {
        ...perfil,
        foto_url: fotoFinal,
        fotoUrl: fotoFinal,
      };

      if (onAtualizarPerfil) {
        onAtualizarPerfil(atualizado);
      }

      setModalFotoAberto(false);
      setUrlFotoTemporaria('');
      exibirAlerta('Foto de perfil atualizada!');
    } catch {
      alert('Erro ao atualizar foto.');
    } finally {
      setSalvandoFoto(false);
    }
  };

  // 3. AÇÃO: Salvar dados pessoais
  const handleSalvarDados = async () => {
    setSalvandoDados(true);
    try {
      const payloadDb = {
        nome_exibicao: formNome.trim(),
        telefone: formTelefone.trim(),
        cidade: formCidade.trim(),
        biografia: formBio.trim(),
      };

      try {
        await supabase
          .from('profiles')
          .update(payloadDb)
          .eq('id', clienteId);
      } catch {
        // silencioso
      }

      const atualizado: PerfilUsuario = {
        ...perfil,
        nome_exibicao: formNome.trim(),
        nomeExibicao: formNome.trim(),
        telefone: formTelefone.trim(),
        cidade: formCidade.trim(),
        biografia: formBio.trim(),
        bio: formBio.trim(),
      };

      if (onAtualizarPerfil) {
        onAtualizarPerfil(atualizado);
      }

      setModalDadosAberto(false);
      exibirAlerta('Dados pessoais atualizados com sucesso!');
    } catch {
      alert('Erro ao salvar dados.');
    } finally {
      setSalvandoDados(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Toast de feedback */}
      {feedbackMsg && (
        <View style={styles.feedbackToast}>
          <Sparkles size={14} color={tc('#000')} />
          <Text style={styles.feedbackToastText}>{feedbackMsg}</Text>
        </View>
      )}

      {/* Header Perfil */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarWrap}>
          {fotoAtual ? (
            <Image source={{ uri: fotoAtual }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <User size={32} color={tc('#f3c21a')} />
            </View>
          )}

          <Pressable
            style={styles.changePhotoBtn}
            onPress={() => {
              setUrlFotoTemporaria(fotoAtual || '');
              setModalFotoAberto(true);
            }}
          >
            <Camera size={14} color={tc('#000')} />
          </Pressable>
        </View>

        <Text style={styles.name}>{perfil.nome_exibicao || perfil.nomeExibicao || 'Cliente'}</Text>
        <Text style={styles.email}>{perfil.email}</Text>

        <Pressable
          style={styles.btnEditarPerfil}
          onPress={() => {
            setFormNome(perfil.nome_exibicao || perfil.nomeExibicao || '');
            setFormTelefone(perfil.telefone || '');
            setFormCidade(perfil.cidade || '');
            setFormBio(perfil.biografia || perfil.bio || 'Fine Line, Blackwork, Botânica, Geek');
            setModalDadosAberto(true);
          }}
        >
          <Edit3 size={13} color={tc('#f3c21a')} />
          <Text style={styles.btnEditarPerfilText}>Editar Meus Dados</Text>
        </Pressable>
      </View>

      {/* Aparência (modo claro / escuro) */}
      <BotaoAlternarTema />

      {/* Dados Pessoais */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados Pessoais</Text>

        <View style={styles.itemRow}>
          <Mail size={14} color={tc('#6b7280')} />
          <Text style={styles.itemVal}>{perfil.email}</Text>
        </View>

        <View style={styles.itemRow}>
          <Phone size={14} color={tc('#6b7280')} />
          <Text style={styles.itemVal}>{perfil.telefone || '(11) 99999-9999'}</Text>
        </View>

        <View style={styles.itemRow}>
          <MapPin size={14} color={tc('#6b7280')} />
          <Text style={styles.itemVal}>{perfil.cidade || 'São Paulo, SP'}</Text>
        </View>
      </View>

      {/* Preferências de Estilo */}
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Heart size={16} color={tc('#f3c21a')} />
          <Text style={styles.cardTitle}>Preferências & Gostos de Tatuagem</Text>
        </View>
        <Text style={styles.descText}>
          {perfil.biografia || perfil.bio || 'Fine Line, Blackwork, Botânica, Geek'}
        </Text>
      </View>

      {/* ============================================================ */}
      {/* MODAL 1: ALTERAR FOTO DE PERFIL */}
      {/* ============================================================ */}
      <AppModal
        visible={modalFotoAberto}
        transparent
        onRequestClose={() => setModalFotoAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Camera size={18} color={tc('#f3c21a')} />
                <Text style={styles.modalTitle}>Alterar Foto de Perfil</Text>
              </View>
              <Pressable onPress={() => setModalFotoAberto(false)}>
                <X size={20} color={tc('#fff')} />
              </Pressable>
            </View>

            <View style={{ gap: 14 }}>
              <View style={{ alignItems: 'center', marginVertical: 10 }}>
                {urlFotoTemporaria ? (
                  <Image source={{ uri: urlFotoTemporaria }} style={styles.avatarPreviewModal} />
                ) : (
                  <View style={styles.avatarPreviewModalEmpty}>
                    <User size={36} color={tc('#6b7280')} />
                  </View>
                )}
              </View>

              <Pressable
                style={styles.btnEscolherGaleria}
                onPress={handleSelecionarFotoGaleria}
              >
                <Upload size={16} color={tc('#000')} />
                <Text style={styles.btnEscolherGaleriaText}>Escolher Foto da Galeria</Text>
              </Pressable>

              <Text style={styles.orText}>ou insira a URL direta da imagem:</Text>

              <TextInput
                style={styles.input}
                placeholder="https://exemplo.com/sua-foto.jpg"
                placeholderTextColor={tc('#6b7280')}
                value={urlFotoTemporaria}
                onChangeText={setUrlFotoTemporaria}
              />

              <Pressable
                style={[styles.btnConfirmar, salvandoFoto && { opacity: 0.7 }]}
                onPress={handleSalvarFotoPerfil}
                disabled={salvandoFoto}
              >
                {salvandoFoto ? (
                  <ActivityIndicator color={tc('#000')} />
                ) : (
                  <>
                    <Check size={16} color={tc('#000')} />
                    <Text style={styles.btnConfirmarText}>Salvar Foto de Perfil</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>

      {/* ============================================================ */}
      {/* MODAL 2: EDITAR DADOS PESSOAIS */}
      {/* ============================================================ */}
      <AppModal
        visible={modalDadosAberto}
        transparent
        onRequestClose={() => setModalDadosAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color={tc('#f3c21a')} />
                <Text style={styles.modalTitle}>Editar Dados Pessoais</Text>
              </View>
              <Pressable onPress={() => setModalDadosAberto(false)}>
                <X size={20} color={tc('#fff')} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              <View>
                <Text style={styles.inputLabel}>Nome Completo *</Text>
                <TextInput
                  style={styles.input}
                  value={formNome}
                  onChangeText={setFormNome}
                  placeholder="Seu nome"
                  placeholderTextColor={tc('#6b7280')}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Telefone / WhatsApp</Text>
                <TextInput
                  style={styles.input}
                  value={formTelefone}
                  onChangeText={setFormTelefone}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor={tc('#6b7280')}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Cidade / Região *</Text>
                <TextInput
                  style={styles.input}
                  value={formCidade}
                  onChangeText={setFormCidade}
                  placeholder="São Paulo, SP"
                  placeholderTextColor={tc('#6b7280')}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Preferências de Estilos de Tattoo</Text>
                <TextInput
                  style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                  value={formBio}
                  onChangeText={setFormBio}
                  placeholder="Ex: Fine Line, Blackwork, Botânica..."
                  placeholderTextColor={tc('#6b7280')}
                  multiline
                />
              </View>

              <Pressable
                style={[styles.btnConfirmar, salvandoDados && { opacity: 0.7 }]}
                onPress={handleSalvarDados}
                disabled={salvandoDados}
              >
                {salvandoDados ? (
                  <ActivityIndicator color={tc('#000')} />
                ) : (
                  <>
                    <Check size={16} color={tc('#000')} />
                    <Text style={styles.btnConfirmarText}>Salvar Alterações</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </AppModal>
    </View>
  );
}

const styles = createThemedStyles({
  container: {
    gap: 14,
  },
  feedbackToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f3c21a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  feedbackToastText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  profileHeader: {
    backgroundColor: '#101010',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#f3c21a',
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#f3c21a',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#101010',
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  email: {
    color: '#9ca3af',
    fontSize: 12,
  },
  btnEditarPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1c1c1f',
    borderWidth: 1,
    borderColor: '#2e2e33',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  btnEditarPerfilText: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#101010',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  itemVal: {
    color: '#d1d5db',
    fontSize: 13,
  },
  descText: {
    color: '#9ca3af',
    fontSize: 12.5,
    lineHeight: 18,
  },

  // Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#121215',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#26262c',
    padding: 18,
    maxHeight: '85%',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#202026',
    paddingBottom: 12,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  inputLabel: {
    color: '#d1d5db',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1b1b20',
    borderWidth: 1,
    borderColor: '#2c2c34',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#fff',
    fontSize: 13,
  },
  btnEscolherGaleria: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f3c21a',
    paddingVertical: 11,
    borderRadius: 10,
  },
  btnEscolherGaleriaText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  orText: {
    color: '#8e8e93',
    fontSize: 10.5,
    textAlign: 'center',
    marginVertical: 2,
  },
  btnConfirmar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f3c21a',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  btnConfirmarText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  avatarPreviewModal: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#f3c21a',
  },
  avatarPreviewModalEmpty: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1b1b20',
    borderWidth: 1,
    borderColor: '#2d2d36',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
