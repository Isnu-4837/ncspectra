import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { IMAGES } from '../data/mockData';
import type { ScreenType } from '../types';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  isDark: boolean;
  onToggleTheme: (dark: boolean) => void;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

// Same scaling approach used across the app's screens: derive sizes from
// the device's actual width against a 375pt baseline, clamped so the
// header never gets cramped on small phones or oversized on tablets.
const BASE_WIDTH = 375;
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.15;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  isDark,
  onToggleTheme,
  onBack,
  title,
  subtitle,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scale = useMemo(() => clamp(width / BASE_WIDTH, MIN_SCALE, MAX_SCALE), [width]);
  const s = (size: number) => Math.round(size * scale);

  // Below this width there isn't room for icon + label on the theme toggle
  // and the subtitle line, so we compact both instead of letting them clip
  // or overlap (as they did before at narrow widths).
  const isCompact = width < 360;

  const isSubScreen = currentScreen === 'scan' || currentScreen === 'capture' || currentScreen === 'results';
  const bg = isDark ? '#051424' : '#f7faf7';
  const primaryColor = isDark ? '#4edea3' : '#00288e';
  const onSurface = isDark ? '#e6f0ff' : '#181c1b';
  const onSurfaceVariant = isDark ? '#94a9c9' : '#444653';
  const surfaceContainerHigh = isDark ? '#1c3d5e' : '#e6e9e6';
  const surfaceContainerLow = isDark ? '#0a1c2e' : '#f0f4f0';
  const borderColor = isDark ? 'rgba(38,74,112,0.6)' : 'rgba(224,227,224,0.6)';
  const glow = isDark ? 'rgba(78,222,163,0.35)' : 'rgba(0,40,142,0.18)';

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: bg,
          borderBottomColor: borderColor,
          // paddingTop absorbs the status bar / notch so the logo, clock,
          // and battery icons never sit on the same line again.
          paddingTop: insets.top,
        },
      ]}
    >
      <View style={[styles.row, { height: s(50), paddingHorizontal: s(12), gap: s(8) }]}>
        {/* Left side */}
        <View style={[styles.leftSide, { gap: s(4), flexShrink: 1 }]}>
          {isSubScreen && (
            <TouchableOpacity
              onPress={onBack || (() => onNavigate('dashboard'))}
              style={[styles.backBtn, { width: s(38), height: s(38), borderRadius: s(10), marginLeft: -s(4) }]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="arrow-back" size={s(22)} color={onSurface} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => onNavigate('dashboard')}
            style={[styles.logoBtn, { gap: s(8), flexShrink: 1 }]}
            activeOpacity={0.8}
          >
            <View style={[styles.emblemRing, { width: s(40), height: s(40), borderRadius: s(10), backgroundColor: surfaceContainerLow, shadowColor: glow }]}>
              <Image source={{ uri: IMAGES.emblem }} style={{ width: s(28), height: s(28), borderRadius: s(4) }} resizeMode="contain" />
            </View>
            <View style={{ flexShrink: 1 }}>
              <View style={styles.titleRow}>
                <Text
                  style={[styles.title, { color: primaryColor, fontSize: s(15), letterSpacing: isCompact ? 0.5 : 1.5 }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {title || 'NCSPECTRA'}
                </Text>
                <View style={[styles.pulseDot, { backgroundColor: primaryColor, width: s(6), height: s(6), borderRadius: s(3) }]} />
              </View>
              {!isCompact && (
                <Text
                  style={[styles.subtitle, { color: onSurfaceVariant, fontSize: s(9) }]}
                  numberOfLines={1}
                >
                  {subtitle || 'NCB TACTICAL FIELD v2.4'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Right side */}
        <View style={[styles.rightSide, { gap: s(8) }]}>
          {/* Theme Toggle — icon-only on narrow screens, icon+label otherwise */}
          <View style={[styles.themeToggle, { backgroundColor: surfaceContainerHigh, borderRadius: s(10), padding: s(2) }]}>
            <TouchableOpacity
              onPress={() => onToggleTheme(false)}
              style={[
                styles.themeBtn,
                { paddingHorizontal: s(isCompact ? 7 : 9), paddingVertical: s(6), borderRadius: s(8), gap: s(4) },
                !isDark && { backgroundColor: bg },
              ]}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <MaterialIcons name="light-mode" size={s(14)} color={!isDark ? primaryColor : onSurfaceVariant} />
              {!isCompact && (
                <Text style={[styles.themeBtnText, { color: !isDark ? primaryColor : onSurfaceVariant, fontSize: s(9) }]}>
                  Day
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onToggleTheme(true)}
              style={[
                styles.themeBtn,
                { paddingHorizontal: s(isCompact ? 7 : 9), paddingVertical: s(6), borderRadius: s(8), gap: s(4) },
                isDark && { backgroundColor: bg },
              ]}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <MaterialIcons name="dark-mode" size={s(14)} color={isDark ? primaryColor : onSurfaceVariant} />
              {!isCompact && (
                <Text style={[styles.themeBtnText, { color: isDark ? primaryColor : onSurfaceVariant, fontSize: s(9) }]}>
                  Night
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Profile Avatar */}
          <TouchableOpacity
            onPress={() => onNavigate('profile')}
            style={[
              styles.avatar,
              { backgroundColor: primaryColor, width: s(34), height: s(34), borderRadius: s(17), shadowColor: glow },
            ]}
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialIcons name="person" size={s(18)} color={isDark ? '#003822' : '#ffffff'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    width: '100%',
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSide: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { alignItems: 'center', justifyContent: 'center' },
  logoBtn: { flexDirection: 'row', alignItems: 'center' },
  emblemRing: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  title: { fontWeight: '800', textTransform: 'uppercase', flexShrink: 1 },
  pulseDot: {},
  subtitle: { fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  rightSide: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },
  themeToggle: { flexDirection: 'row', alignItems: 'center' },
  themeBtn: { flexDirection: 'row', alignItems: 'center' },
  themeBtnText: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 2,
  },
});