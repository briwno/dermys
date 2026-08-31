import { Send, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export function ArtistaMensagensTab() {
  const [mensagens, setMensagens] = useState([
    { id: '1', texto: 'Olá Camila! O sinal de reserva já foi aprovado?', autor: 'cliente', horario: '10:20' },
    { id: '2', texto: 'Sim, confirmado em custódia! Te vejo na próxima semana.', autor: 'eu', horario: '10:22' },
  ]);
  const [texto, setTexto] = useState('');

  const enviar = () => {
    if (!texto.trim()) return;
    setMensagens((prev) => [
      ...prev,
      { id: String(Date.now()), texto: texto.trim(), autor: 'eu', horario: 'Agora' },
    ]);
    setTexto('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.chatHeader}>
        <View style={styles.avatar}>
          <User size={16} color="#f3c21a" />
        </View>
        <View>
          <Text style={styles.chatName}>Marina C. (Fine Line Floral)</Text>
          <Text style={styles.chatStatus}>Online</Text>
        </View>
      </View>

      <View style={styles.messageList}>
        {mensagens.map((msg) => {
          const souEu = msg.autor === 'eu';
          return (
            <View key={msg.id} style={[styles.bubble, souEu ? styles.bubbleMe : styles.bubbleOther]}>
              <Text style={[styles.bubbleText, souEu ? styles.bubbleTextMe : styles.bubbleTextOther]}>
                {msg.texto}
              </Text>
              <Text style={styles.timeText}>{msg.horario}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          value={texto}
          onChangeText={setTexto}
          placeholder="Responder cliente..."
          placeholderTextColor="#6f6f6f"
          style={styles.input}
        />
        <Pressable style={styles.sendButton} onPress={enviar}>
          <Send size={16} color="#111" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#101010',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1d1d1d',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  chatStatus: {
    color: '#10b981',
    fontSize: 10,
  },
  messageList: {
    gap: 10,
    minHeight: 200,
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 14,
    gap: 4,
  },
  bubbleMe: {
    alignSelf: 'flex-end',
    backgroundColor: '#f3c21a',
    borderBottomRightRadius: 2,
  },
  bubbleOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#171717',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#222',
  },
  bubbleText: {
    fontSize: 13,
  },
  bubbleTextMe: {
    color: '#111',
    fontWeight: '600',
  },
  bubbleTextOther: {
    color: '#fff',
  },
  timeText: {
    fontSize: 9,
    color: 'rgba(0,0,0,0.5)',
    alignSelf: 'flex-end',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 48,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    paddingHorizontal: 14,
    color: '#fff',
    fontSize: 13,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3c21a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
