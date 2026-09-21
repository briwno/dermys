import type { PerfilUsuario } from '@/types/auth';
import {
  Building,
  CreditCard,
  FileCheck2,
  Mail,
  MapPin,
  Palette,
  Phone,
  QrCode,
  ShieldCheck,
} from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

interface PropsPerfilTab {
  perfil: PerfilUsuario;
}

export function ArtistaPerfilTab({ perfil }: PropsPerfilTab) {
  const nome = perfil.nome_exibicao || perfil.nomeExibicao || 'Tatuador';
  const estudio = perfil.nome_estudio || perfil.nomeEstudio || 'Estúdio Particular';
  const endereco = perfil.endereco_estudio || perfil.enderecoEstudio || 'Endereço não informado';
  const telefone = perfil.telefone || '(11) 98888-8888';
  const bio = perfil.biografia || perfil.bio || 'Especialista em tatuagens autorais de alta qualidade.';
  const foto = perfil.foto_url || perfil.fotoUrl || perfil.photoURL;
  const cpfCnpj = perfil.cpf_cnpj || '54.321.987/0001-23 (MEI)';
  const chavePix = perfil.chave_pix || 'pix@tatuador.com.br';
  const regime = perfil.regime_tributario || 'MEI';

  return (
    <View style={styles.container}>
      {/* Header Perfil */}
      <View style={styles.profileHeader}>
        {foto ? (
          <Image source={{ uri: foto }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatar}>
            <Palette size={32} color="#f3c21a" />
          </View>
        )}
        <Text style={styles.name}>{nome}</Text>
        <Text style={styles.studio}>{estudio}</Text>
        <View style={styles.badgePro}>
          <ShieldCheck size={12} color="#10b981" />
          <Text style={styles.badgeProText}>Tatuador Verificado Dermys</Text>
        </View>
      </View>

      {/* Dados Fiscais & Recebimento */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <FileCheck2 size={16} color="#f3c21a" />
          <Text style={styles.cardTitle}>Dados Fiscais & Pagamento</Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Regime Tributário:</Text>
          <Text style={styles.itemValBold}>{regime}</Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Documento (CNPJ/CPF):</Text>
          <Text style={styles.itemVal}>{cpfCnpj}</Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Chave PIX Mercado Pago:</Text>
          <Text style={styles.itemValHighlight}>{chavePix}</Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Sinal de Reserva Padrão:</Text>
          <Text style={styles.itemValBold}>{perfil.percentual_sinal || 30}%</Text>
        </View>
      </View>

      {/* Dados do Estúdio */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Localização & Contato</Text>

        <View style={styles.itemRow}>
          <Building size={14} color="#6b7280" />
          <Text style={styles.itemVal}>{estudio}</Text>
        </View>

        <View style={styles.itemRow}>
          <MapPin size={14} color="#6b7280" />
          <Text style={styles.itemVal}>{endereco}</Text>
        </View>

        <View style={styles.itemRow}>
          <Phone size={14} color="#6b7280" />
          <Text style={styles.itemVal}>{telefone}</Text>
        </View>

        <View style={styles.itemRow}>
          <Mail size={14} color="#6b7280" />
          <Text style={styles.itemVal}>{perfil.email}</Text>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Especialidades & Biografia</Text>
        <Text style={styles.descText}>{bio}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
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
  avatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#f3c21a',
    marginBottom: 4,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  studio: {
    color: '#9ca3af',
    fontSize: 12,
  },
  badgePro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginTop: 4,
  },
  badgeProText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#101010',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 16,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: {
    color: '#f3c21a',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemLabel: {
    color: '#6b7280',
    fontSize: 12,
  },
  itemVal: {
    color: '#d1d5db',
    fontSize: 12,
  },
  itemValBold: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  itemValHighlight: {
    color: '#f3c21a',
    fontSize: 12,
    fontWeight: '800',
  },
  descText: {
    color: '#d1d5db',
    fontSize: 13,
    lineHeight: 18,
  },
});
