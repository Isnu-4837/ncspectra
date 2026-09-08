import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ScreenType } from '../types';

interface BottomNavProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  pendingSyncCount: number;
  isDark?: boolean;
}

const navItems = [
  { id: 'dashboard' as ScreenType, label: 'Home', icon: 'dashboard', activeOn: ['dashboard'] },
  { id: 'reagents' as ScreenType, label: 'Tests', icon: 'science', activeOn: ['reagents', 'capture', 'results'] },
  { id: 'sync' as ScreenType, label: 'Sync', icon: 'cloud-sync', activeOn: ['sync'] },
  { id: 'profile' as ScreenType, label: 'Profile', icon: 'shield', activeOn: ['profile'] },
];

// One small pressable nav item. Its own Animated.Value drives a spring
// pop on the icon + a fade/slide-up on the active pill behind it, so each
// tab transitions independently instead of one shared value fighting itself.
const NavItem: React.FC<{
  item: (typeof navItems)[number];
  isActive: boolean;
  primary: string;
  onSurfaceVariant: string;
  activeBg: string;
  isDark: boolean;
  badge?: number;
  onPress: () => void;
}> = ({ item, isActive, primary, onSurfaceVariant, activeBg, isDark, badge, onPress }) => {
  const anim = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isActive ? 1 : 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 9,
    }).start();
  }, [isActive]);

  useEffect(() => {
    if (!badge) return;
    // Gentle badge pulse to draw the eye to pending sync items without
    // being a distracting infinite loop — three beats, then it settles.
    const loop = Animated.sequence([
      Animated.timing(pulse, { toValue: 1.25, duration: 260, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, useNativeDriver: true, speed: 14, bounciness: 12 }),
    ]);
    Animated.sequence([loop, Animated.delay(1400), loop, Animated.delay(1400), loop]).start();
  }, [badge]);

  const color = isActive ? primary : onSurfaceVariant;
  const Icon =
    item.icon === 'cloud-sync' ? (
      <MaterialCommunityIcons name="cloud-sync" size={22} color={color} />
    ) : item.icon === 'science' ? (
      <MaterialIcons name="science" size={22} color={color} />
    ) : item.icon === 'shield' ? (
      <MaterialIcons name="shield" size={22} color={color} />
    ) : (
      <MaterialIcons name="dashboard" size={22} color={color} />
    );

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.navItem}>
      <Animated.View
        style={[
          styles.activePill,
          {
            backgroundColor: activeBg,
            opacity: anim,
            transform: [
              { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
            ],
          },
        ]}
      />
      <Animated.View
        style={{
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
        }}
      >
        <View style={styles.iconWrap}>
          {Icon}
          {!!badge && badge > 0 && (
            <Animated.View
              style={[
                styles.badge,
                {
                  backgroundColor: isDark ? '#56d474' : '#00a63e',
                  borderColor: isDark ? '#051424' : '#f7faf7',
                  transform: [{ scale: pulse }],
                },
              ]}
            >
              <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
            </Animated.View>
          )}
        </View>
      </Animated.View>
      <Text
        style={[
          styles.label,
          { color, fontWeight: isActive ? '800' : '500', opacity: isActive ? 1 : 0.85 },
        ]}
      >
        {item.label}
      </Text>
      {isActive && <View style={[styles.activeDot, { backgroundColor: primary }]} />}
    </TouchableOpacity>
  );
};

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onNavigate,
  pendingSyncCount,
  isDark = false,
}) => {
  const insets = useSafeAreaInsets();
  if (currentScreen === 'scan') return null;

  const bg = isDark ? 'rgba(8,22,38,0.96)' : 'rgba(255,255,255,0.96)';
  const primary = isDark ? '#4edea3' : '#00288e';
  const onSurfaceVariant = isDark ? '#7d93b8' : '#7a7d87';
  const borderColor = isDark ? 'rgba(78,222,163,0.16)' : 'rgba(0,40,142,0.10)';
  const activeBg = isDark ? 'rgba(78,222,163,0.14)' : 'rgba(0,40,142,0.08)';
  const shadowColor = isDark ? '#000' : '#0a1c40';

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]} pointerEvents="box-none">
      <View
        style={[
          styles.nav,
          {
            backgroundColor: bg,
            borderColor,
            shadowColor,
          },
        ]}
      >
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={item.activeOn.includes(currentScreen)}
            primary={primary}
            onSurfaceVariant={onSurfaceVariant}
            activeBg={activeBg}
            isDark={isDark}
            badge={item.id === 'sync' ? pendingSyncCount : undefined}
            onPress={() => onNavigate(item.id)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Outer wrap is transparent and only exists to hold the safe-area gap
  // below the floating pill, so the pill can have visible bg on all sides.
  wrap: {
    width: '100%',
    paddingHorizontal: 14,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 66,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 6,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
  navItem: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    borderRadius: 18,
  },
  activePill: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 6,
    right: 6,
    borderRadius: 16,
  },
  iconWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -12,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
  },
  badgeText: { color: '#ffffff', fontSize: 8.5, fontWeight: '800' },
  label: { fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 5 },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});