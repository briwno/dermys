import { createThemedStyles, tc } from '@/theme';
import { CalendarDays, Compass, LayoutGrid, MessageCircle, UserRound, WalletCards, type LucideIcon } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, View } from 'react-native';

export type BottomNavTab = 'dashboard' | 'schedule' | 'financial' | 'home' | 'bookings' | 'chat' | 'profile';

interface BottomNavProps {
  activeTab: BottomNavTab;
  setActiveTab: (tab: BottomNavTab) => void;
  role: 'cliente' | 'artista';
}

interface TabButtonProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onPress: () => void;
  reduzirMovimento: boolean;
}

function BottomNavTabButton({
  icon: IconComponent,
  label,
  isActive,
  onPress,
  reduzirMovimento,
}: TabButtonProps) {
  const [emFoco, setEmFoco] = useState(false);
  const pressScale = useRef(new Animated.Value(1)).current;
  const activeScale = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    if (reduzirMovimento) {
      activeScale.setValue(isActive ? 1 : 0);
      return;
    }
    const animacao = Animated.spring(activeScale, {
      toValue: isActive ? 1 : 0,
      tension: 180,
      friction: 16,
      useNativeDriver: Platform.OS !== 'web',
    });
    animacao.start();
    return () => animacao.stop();
  }, [isActive, activeScale, reduzirMovimento]);

  const handlePressIn = () => {
    if (reduzirMovimento) return;
    Animated.spring(pressScale, {
      toValue: 0.92,
      friction: 5,
      tension: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    if (reduzirMovimento) {
      pressScale.setValue(1);
      return;
    }
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 6,
      tension: 150,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const iconColor = tc(isActive ? '#f3c21a' : emFoco ? '#f4f4f5' : '#9898a4');

  return (
    <Pressable
      style={styles.tabButton}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
      onFocus={() => setEmFoco(true)}
      onBlur={() => setEmFoco(false)}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: 'transparent' }}
    >
      <Animated.View
        style={[
          styles.iconWrapper,
          {
            transform: [{ scale: pressScale }],
          },
        ]}
      >
        <View pointerEvents="none" style={styles.iconForeground}>
          <IconComponent size={23} strokeWidth={isActive ? 2.2 : 1.8} color={iconColor} />
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeIndicator,
            {
              opacity: activeScale,
              transform: [
                {
                  scaleX: activeScale.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 1],
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>

    </Pressable>
  );
}

export function BottomNav({ activeTab, setActiveTab, role }: BottomNavProps) {
  const [reduzirMovimento, setReduzirMovimento] = useState(false);
  useEffect(() => {
    let ativo = true;
    AccessibilityInfo.isReduceMotionEnabled().then((valor) => { if (ativo) setReduzirMovimento(valor); }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzirMovimento);
    return () => { ativo = false; subscription.remove(); };
  }, []);
  const tabs: { id: BottomNavTab; icon: LucideIcon; label: string }[] =
    role === 'artista'
      ? [
          { id: 'dashboard', icon: LayoutGrid, label: 'Início' },
          { id: 'schedule', icon: CalendarDays, label: 'Agenda' },
          { id: 'financial', icon: WalletCards, label: 'Financeiro e fiscal' },
          { id: 'chat', icon: MessageCircle, label: 'Mensagens' },
          { id: 'profile', icon: UserRound, label: 'Perfil' },
        ]
      : [
          { id: 'home', icon: Compass, label: 'Explorar' },
          { id: 'bookings', icon: CalendarDays, label: 'Agendamentos' },
          { id: 'chat', icon: MessageCircle, label: 'Mensagens' },
          { id: 'profile', icon: UserRound, label: 'Perfil' },
        ];

  return (
    <View style={styles.dock} pointerEvents="box-none">
    <View style={styles.navContainer} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <BottomNavTabButton
            key={tab.id}
            icon={tab.icon}
            label={tab.label}
            isActive={isActive}
            reduzirMovimento={reduzirMovimento}
            onPress={() => setActiveTab(tab.id)}
          />
        );
      })}
    </View>
    </View>
  );
}

const styles = createThemedStyles({
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  navContainer: {
    width: '100%',
    maxWidth: 440,
    height: 64,
    borderRadius: 24,
    backgroundColor: '#151518',
    borderWidth: 1,
    borderColor: '#303036',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    minWidth: 48,
    borderRadius: 18,
    position: 'relative',
  },
  iconForeground: { zIndex: 1 },
  iconWrapper: {
    width: 48,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 12,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#f3c21a',
  },
});
