import { Pressable, StyleSheet, Text, View } from 'react-native';

export type BottomNavTab = 'dashboard' | 'schedule' | 'home' | 'bookings' | 'chat' | 'profile';

interface BottomNavProps {
  activeTab: BottomNavTab;
  setActiveTab: (tab: BottomNavTab) => void;
  role: 'cliente' | 'artista';
}

export function BottomNav({ activeTab, setActiveTab, role }: BottomNavProps) {
  const tabs =
    role === 'artista'
      ? [
          { id: 'dashboard', icon: '◫', label: 'Dashboard' },
          { id: 'schedule', icon: '🗓', label: 'Agenda' },
          { id: 'chat', icon: '✉', label: 'Mensagens' },
          { id: 'profile', icon: '◉', label: 'Perfil' },
        ]
      : [
          { id: 'home', icon: '⌂', label: 'Início' },
          { id: 'bookings', icon: '🗓', label: 'Agendamentos' },
          { id: 'chat', icon: '✉', label: 'Mensagens' },
          { id: 'profile', icon: '◉', label: 'Perfil' },
        ];

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <Pressable
            key={tab.id}
            style={styles.tabButton}
            onPress={() => setActiveTab(tab.id)}
            android_ripple={{ color: '#2a2a2a' }}
          >
            <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
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
  tabIcon: {
    fontSize: 22,
    color: '#6b7280',
  },
  tabIconActive: {
    color: '#f3c21a',
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
