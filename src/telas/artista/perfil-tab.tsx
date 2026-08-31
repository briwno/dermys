import type { PerfilUsuario } from '@/types/auth';
import { Building, Mail, MapPin, Palette, Phone } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface PropsPerfilTab {
  perfil: PerfilUsuario;
}

export function ArtistaPerfilTab({ perfil }: PropsPerfilTab) {
  const nome = perfil.nome_exibicao || perfil.nomeExibicao || 'Tatuador';
  const estudio = perfil.nome_estudio || perfil.nomeEstudio || 'Estúdio';
  const endereco = perfil.endereco_estudio || perfil.enderecoEstudio || 'Endereço não informado';
  const telefone = perfil.telefone || '(11) 98888-8888';
  const bio = perfil.biografia || perfil.bio || 'Especialista em tatuagens autorais de alta qualidade.';

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Palette size={32} color="#f3c21a" />
        </View>
        <Text style={styles.name}>{nome}</Text>
        <Text style={styles.studio}>{estudio}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados do Estúdio</Text>

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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  studio: {
    color: '#9ca3af',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#101010',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 16,
    gap: 12,
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
    gap: 8,
  },
  itemVal: {
    color: '#d1d5db',
    fontSize: 13,
  },
  descText: {
    color: '#d1d5db',
    fontSize: 13,
    lineHeight: 18,
  },
});
