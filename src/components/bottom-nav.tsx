import { Calendar, DollarSign, Home, LayoutGrid, MessageSquare, User } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { createThemedStyles, tc } from '@/theme';

export type BottomNavTab = 'dashboard' | 'schedule' | 'financial' | 'home' | 'bookings' | 'chat' | 'profile';

interface BottomNavProps {
  activeTab: BottomNavTab;
  setActiveTab: (tab: BottomNavTab) => void;
  role: 'cliente' | 'artista';
}

interface TabButtonProps {
  id: BottomNavTab;
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function BottomNavTabButton({
  id: _id,
  icon: IconComponent,
  label,
  isActive,
  onPress,
}: TabButtonProps) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const activeScale = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(activeScale, {
      toValue: isActive ? 1 : 0,
      tension: 130,
      friction: 8,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isActive, activeScale]);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.9,
      friction: 5,
      tension: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 6,
      tension: 150,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const iconColor = isActive ? tc('#f3c21a') : tc('#6b7280');

  return (
    <Pressable
      style={styles.tabButton}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: 'transparent' }}
    >
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [
              { scale: pressScale },
              {
                scale: activeScale.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.08],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.activeHalo,
            {
              opacity: activeScale,
              transform: [
                {
                  scale: activeScale.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.65, 1],
                  }),
                },
              ],
            },
          ]}
        />
        <IconComponent size={20} color={iconColor} />
      </Animated.View>

      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>

      <Animated.View
        style={[
          styles.activeIndicator,
          {
            opacity: activeScale,
            transform: [
              {
                scaleX: activeScale.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ],
          },
        ]}
      />
    </Pressable>
  );
}

export function BottomNav({ activeTab, setActiveTab, role }: BottomNavProps) {
  const tabs: { id: BottomNavTab; icon: React.ComponentType<{ size: number; color: string }>; label: string }[] =
    role === 'artista'
      ? [
          { id: 'dashboard', icon: LayoutGrid, label: 'Início' },
          { id: 'schedule', icon: Calendar, label: 'Agenda' },
          { id: 'financial', icon: DollarSign, label: 'Fiscal/Fin.' },
          { id: 'chat', icon: MessageSquare, label: 'Chat' },
          { id: 'profile', icon: User, label: 'Perfil' },
        ]
      : [
          { id: 'home', icon: Home, label: 'Início' },
          { id: 'bookings', icon: Calendar, label: 'Agendamentos' },
          { id: 'chat', icon: MessageSquare, label: 'Chat' },
          { id: 'profile', icon: User, label: 'Perfil' },
        ];

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <BottomNavTabButton
            key={tab.id}
            id={tab.id}
            icon={tab.icon}
            label={tab.label}
            isActive={isActive}
            onPress={() => setActiveTab(tab.id)}
          />
        );
      })}
    </View>
  );
}

const styles = createThemedStyles({
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
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    position: 'relative',
  },
  iconWrapper: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeHalo: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    bottom: 0,
    borderRadius: 14,
    backgroundColor: 'rgba(243, 194, 26, 0.14)',
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
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 14,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#f3c21a',
  },
});
