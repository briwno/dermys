import { Calendar, Home, LayoutGrid, MessageSquare, User } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type BottomNavTab = 'dashboard' | 'schedule' | 'home' | 'bookings' | 'chat' | 'profile';

interface BottomNavProps {
  activeTab: BottomNavTab;
  setActiveTab: (tab: BottomNavTab) => void;
  role: 'cliente' | 'artista';
}

export function BottomNav({ activeTab, setActiveTab, role }: BottomNavProps) {
  const tabs: { id: BottomNavTab; icon: React.ComponentType<{ size: number; color: string }>; label: string }[] =
    role === 'artista'
      ? [
          { id: 'dashboard', icon: LayoutGrid, label: 'Dashboard' },
          { id: 'schedule', icon: Calendar, label: 'Agenda' },
          { id: 'chat', icon: MessageSquare, label: 'Mensagens' },
          { id: 'profile', icon: User, label: 'Perfil' },
        ]
      : [
          { id: 'home', icon: Home, label: 'Início' },
          { id: 'bookings', icon: Calendar, label: 'Agendamentos' },
          { id: 'chat', icon: MessageSquare, label: 'Mensagens' },
          { id: 'profile', icon: User, label: 'Perfil' },
        ];

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComponent = tab.icon;
        const iconColor = isActive ? '#f3c21a' : '#6b7280';

        return (
          <Pressable
            key={tab.id}
            style={styles.tabButton}
            onPress={() => setActiveTab(tab.id)}
            android_ripple={{ color: '#2a2a2a' }}
          >
            <IconComponent size={20} color={iconColor} />
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 76,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    color: '#6b7280',
  },
  tabLabelActive: {
    color: '#f3c21a',
  },
});
