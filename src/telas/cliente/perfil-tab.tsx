import type { PerfilUsuario } from '@/types/auth';
import { Mail, MapPin, Phone, User } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface PropsPerfilTab {
  perfil: PerfilUsuario;
}

export function ClientePerfilTab({ perfil }: PropsPerfilTab) {
  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <User size={32} color="#f3c21a" />
        </View>
        <Text style={styles.name}>{perfil.nome_exibicao || perfil.nomeExibicao || 'Cliente'}</Text>
        <Text style={styles.email}>{perfil.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados Pessoais</Text>

        <View style={styles.itemRow}>
          <Mail size={14} color="#6b7280" />
          <Text style={styles.itemVal}>{perfil.email}</Text>
        </View>

        <View style={styles.itemRow}>
          <Phone size={14} color="#6b7280" />
          <Text style={styles.itemVal}>{perfil.telefone || '(11) 99999-9999'}</Text>
        </View>

        <View style={styles.itemRow}>
          <MapPin size={14} color="#6b7280" />
          <Text style={styles.itemVal}>{perfil.cidade || 'São Paulo, SP'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preferências de Estilo</Text>
        <Text style={styles.descText}>Fine Line, Blackwork, Botânica, Geek</Text>
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
  email: {
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
  },
});
