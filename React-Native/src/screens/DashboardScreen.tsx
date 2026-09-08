import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  BackHandler,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { INITIAL_OFFICER, INITIAL_SEIZURE_RECORDS } from '../data/mockData';
import type { ScreenType, SeizureRecord } from '../types';

interface DashboardScreenProps {
  onStartNewTest: () => void;
  onSelectRecord: (record: SeizureRecord) => void;
  onOpenCalibration: () => void;
  onOpenSop: () => void;
  onOpenExport: () => void;
  onNavigate: (screen: ScreenType) => void;
  offlineQueueCount: number;
  setOfflineQueueCount: React.Dispatch<React.SetStateAction<number>>;
  onShowToast: (title: string, desc: string, icon?: string, color?: string) => void;
  isDark?: boolean;
}

// Same responsive-scaling approach as LoginScreen: derive every size from
// the device's actual width against a 375pt baseline, clamped so phones
// stay legible and tablets/foldables don't get comically oversized text.
const BASE_WIDTH = 375;
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.25;
const MAX_CONTENT_WIDTH = 720; // dashboard can run a bit wider than the login card on tablets

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

// Shared tactile press wrapper — every interactive card in this screen
// compresses slightly on press. One consistent motion language instead of
// a different hover/press effect per card type.
const Pressable: React.FC<{
  onPress?: () => void;
  disabled?: boolean;
  style?: any;
  children: React.ReactNode;
}> = ({ onPress, disabled, style, children }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  const pressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      activeOpacity={0.9}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

// AppIcon — a bold, solid-filled squircle icon that reads clearly at every
// size. The tile is filled with the accent color at full opacity so icon
// silhouettes stay crisp. A soft top-half highlight adds subtle depth, and a
// large ambient glow ring behind the tile (semi-transparent) gives it "float"
// without relying on Android elevation (which ignores shadowColor).
const AppIcon: React.FC<{
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;       // accent / fill color
  size: number;        // outer tile size
  iconSize: number;
  radius: number;      // squircle corner radius
  variant?: 'solid' | 'tinted'; // solid = filled bg, tinted = faint bg
}> = ({ icon, color, size, iconSize, radius, variant = 'solid' }) => {
  const isSolid = variant === 'solid';
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Squircle tile — depth via colored shadow, no overflowing glow ring */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: isSolid ? color : color + '22',
          borderWidth: isSolid ? 0 : 1.5,
          borderColor: color + '55',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          shadowColor: color,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: isSolid ? 0.4 : 0.18,
          shadowRadius: isSolid ? 6 : 3,
          elevation: isSolid ? 4 : 2,
        }}
      >
        {/* Top-half gloss */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '45%',
            backgroundColor: 'rgba(255,255,255,0.18)',
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
          }}
        />
        <MaterialIcons
          name={icon}
          size={iconSize}
          color={isSolid ? '#ffffff' : color}
        />
      </View>
    </View>
  );
};

// Legacy alias kept so record-list code can still request 'tinted' chips
// without changing call-sites everywhere.
const IconChip: React.FC<{
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
  size: number;
  iconSize: number;
  radius: number;
}> = (props) => <AppIcon {...props} variant="tinted" />;

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onStartNewTest, onSelectRecord, onOpenCalibration, onOpenSop, onOpenExport,
  onNavigate, offlineQueueCount, setOfflineQueueCount, onShowToast, isDark = false,
}) => {
  const { width } = useWindowDimensions();
  const scale = useMemo(() => clamp(width / BASE_WIDTH, MIN_SCALE, MAX_SCALE), [width]);
  const s = (size: number) => Math.round(size * scale);
  const contentMaxWidth = Math.min(width, MAX_CONTENT_WIDTH);

  // Grid columns adapt to available width instead of a hardcoded '47%':
  // 2 columns on phones, 4 on wide tablets/foldables, so cards never
  // squeeze awkwardly or leave a lopsided single card on the last row.
  const gridColumns = contentMaxWidth >= 640 ? 4 : 2;
  const gridGap = s(12);
  const cardBasis = `${100 / gridColumns}%` as `${number}%`;

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const primary = isDark ? '#4edea3' : '#00288e';
  const secondary = isDark ? '#93ccff' : '#0054a0';
  const tertiary = isDark ? '#56d474' : '#003e17';
  const bg = isDark ? '#051424' : '#f7faf7';
  const surface = isDark ? '#0d2137' : '#ffffff';
  const surfaceContainerLow = isDark ? '#0a1c2e' : '#f0f4f0';
  const surfaceContainerHigh = isDark ? '#1c3d5e' : '#e1e5e1';
  const onSurface = isDark ? '#e6f0ff' : '#181c1b';
  const onSurfaceVariant = isDark ? '#94a9c9' : '#444653';
  const danger = isDark ? '#ff6b6b' : '#d92d20';
  const dangerContainer = isDark ? '#3a1414' : '#fdeceb';
  const scrim = isDark ? 'rgba(2,8,16,0.72)' : 'rgba(10,15,25,0.55)';
  const heroDeep = isDark ? '#081c30' : '#0a1a4d';
  const glow = isDark ? 'rgba(78,222,163,0.28)' : 'rgba(0,40,142,0.22)';
  // The hero card is always a deep navy panel in both themes, so its
  // foreground accent must stay a fixed bright teal — using the theme's
  // `primary` here would go navy-on-navy in light mode and disappear.
  const heroAccent = '#5eead4';

  // Live-secure-link pulse on the hero card — the one deliberate ambient
  // motion on this screen, signalling an active encrypted session rather
  // than decorating for its own sake.
  const livePulse = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 0.6, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Dashboard is a top-level tab — hardware back here means "leave the app",
  // so it gets the same themed confirm dialog as the login screen instead
  // of silently backing out or exiting immediately.
  useEffect(() => {
    const onBackPress = () => {
      setShowQuitConfirm(true);
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  const handleSyncNow = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncState('syncing');
    setTimeout(() => {
      setSyncState('synced');
      setOfflineQueueCount(0);
      onShowToast('Cloud Sync Successful', 'All 3 offline forensic records encrypted & committed.', 'cloud_done', 'text-tertiary');
      setTimeout(() => { setIsSyncing(false); setSyncState('idle'); }, 2500);
    }, 1800);
  };

  const quickActions = [
    { icon: 'science' as const, label: 'New Test', color: primary, onPress: onStartNewTest },
    { icon: 'tune' as const, label: 'Calibrate', color: secondary, onPress: onOpenCalibration },
    { icon: 'menu-book' as const, label: 'SOP Guide', color: tertiary, onPress: onOpenSop },
    { icon: 'picture-as-pdf' as const, label: 'Export PDF', color: isDark ? '#ff9070' : '#b52800', onPress: onOpenExport },
  ];

  const stats = [
    { label: 'Tests Today', value: '12', icon: 'analytics' as const, color: primary },
    { label: 'Positive', value: '4', icon: 'warning' as const, color: isDark ? '#ff6b6b' : '#c62828' },
    { label: 'Pending Sync', value: String(offlineQueueCount), icon: 'cloud-upload' as const, color: tertiary },
    { label: 'Accuracy', value: '99.2%', icon: 'verified' as const, color: secondary },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'bottom']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: s(6), paddingBottom: s(100) }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', paddingHorizontal: s(16) }}>

          {/* Officer Welcome Banner — deep tactical panel, the one bold
              surface on the screen. Everything below stays quieter. */}
          <View style={[st.heroCard, { backgroundColor: heroDeep, borderRadius: s(20), padding: s(18), marginBottom: s(18), shadowColor: glow }]}>
            {/* Decorative glow + hairline accents give it depth without extra content */}
            <View style={[st.heroGlow, { backgroundColor: glow, width: s(180), height: s(180), borderRadius: s(90), top: -s(90), right: -s(50) }]} pointerEvents="none" />
            <View style={[st.heroRing, { borderColor: isDark ? 'rgba(78,222,163,0.18)' : 'rgba(255,255,255,0.10)' }]} pointerEvents="none" />

            {/* Compact icon-only live badge, pinned top-right and out of
                flow, so it never competes with the officer name for width. */}
            <View style={[st.encryptedChip, { top: s(18), right: s(18), borderColor: heroAccent + '55', backgroundColor: 'rgba(255,255,255,0.08)', width: s(30), height: s(30), borderRadius: s(15) }]}>
              <Animated.View style={[st.liveDot, { backgroundColor: heroAccent, opacity: livePulse, width: s(6), height: s(6), borderRadius: s(3), position: 'absolute', top: s(3), right: s(3) }]} />
              <MaterialIcons name="lock" size={s(14)} color={heroAccent} />
            </View>
            <Text style={[st.encryptedLabel, { color: heroAccent, fontSize: s(8), top: s(50), right: s(18) }]}>
              SECURE
            </Text>

            <View style={[st.officerRow, { gap: s(12), marginBottom: s(14) }]}>
              <View style={[st.avatarRing, { width: s(56), height: s(56), borderRadius: s(28), borderColor: heroAccent + '55' }]}>
                <View style={[st.avatar, { backgroundColor: heroAccent, width: s(48), height: s(48), borderRadius: s(24) }]}>
                  <MaterialIcons name="person" size={s(24)} color="#00382c" />
                </View>
              </View>
              <View style={{ flex: 1, minWidth: 0, paddingRight: s(46) }}>
                <Text style={[st.officerName, { color: '#ffffff', fontSize: s(17) }]} numberOfLines={1} adjustsFontSizeToFit>
                  {INITIAL_OFFICER.name}
                </Text>
                <Text style={[st.officerBadge, { color: heroAccent, fontSize: s(12) }]} numberOfLines={1} adjustsFontSizeToFit>
                  #{INITIAL_OFFICER.badgeNumber}
                </Text>
                <Text style={[st.officerUnit, { color: 'rgba(255,255,255,0.65)', fontSize: s(11) }]} numberOfLines={1}>
                  {INITIAL_OFFICER.zone} • {INITIAL_OFFICER.unit}
                </Text>
              </View>
            </View>

            {/* Sync Row */}
            {offlineQueueCount > 0 && (
              <TouchableOpacity
                onPress={handleSyncNow}
                style={[
                  st.syncBanner,
                  {
                    backgroundColor: 'rgba(255,255,255,0.07)',
                    padding: s(10),
                    borderRadius: s(12),
                    gap: s(8),
                    flexWrap: 'wrap',
                    rowGap: s(6),
                  },
                ]}
                disabled={isSyncing}
                activeOpacity={0.8}
              >
                <View style={[st.syncIconChip, { backgroundColor: isSyncing ? 'rgba(255,255,255,0.14)' : heroAccent + '33', width: s(28), height: s(28), borderRadius: s(9) }]}>
                  {isSyncing
                    ? <ActivityIndicator size="small" color={heroAccent} />
                    : <MaterialIcons name="cloud-upload" size={s(16)} color={heroAccent} />}
                </View>
                <Text style={[st.syncText, { color: '#ffffff', fontSize: s(12) }]}>
                  {isSyncing ? 'Syncing to vault...' : `${offlineQueueCount} records pending vault sync`}
                </Text>
                {!isSyncing && (
                  <View style={[st.syncActionPill, { borderColor: heroAccent, backgroundColor: heroAccent + '1a' }]}>
                    <Text style={[st.syncAction, { color: heroAccent, fontSize: s(11) }]}>SYNC NOW</Text>
                    <MaterialIcons name="arrow-forward" size={s(12)} color={heroAccent} style={{ marginLeft: s(3) }} />
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

{/* Quick Actions */}
          <View style={[st.sectionHead, { marginTop: s(18), marginBottom: s(12) }]}>
            <View style={[st.sectionAccentBar, { backgroundColor: primary, height: s(16), width: s(3), borderRadius: s(2), marginRight: s(8) }]} />
            <MaterialIcons name="bolt" size={s(15)} color={primary} />
            <Text style={[st.sectionTitle, { color: onSurface, fontSize: s(12), marginLeft: s(5) }]}>
              Quick Actions
            </Text>
          </View>
          <View style={[st.grid, { marginBottom: s(6), marginHorizontal: -gridGap / 2 }]}>
            {quickActions.map((action) => (
              <View key={action.label} style={{ width: cardBasis, padding: gridGap / 2 }}>
                <Pressable
                  onPress={action.onPress}
                  style={[st.actionCard, { backgroundColor: surface, borderColor: surfaceContainerHigh, borderRadius: s(18), padding: s(20), gap: s(14) }]}
                >
                  <AppIcon icon={action.icon} color={action.color} size={s(54)} iconSize={s(26)} radius={s(16)} variant="solid" />
                  <Text style={[st.actionLabel, { color: onSurface, fontSize: s(12) }]} numberOfLines={1} adjustsFontSizeToFit>
                    {action.label}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

          {/* Stats Grid */}
          <View style={[st.sectionHead, { marginTop: s(18), marginBottom: s(12) }]}>
            <View style={[st.sectionAccentBar, { backgroundColor: primary, height: s(16), width: s(3), borderRadius: s(2), marginRight: s(8) }]} />
            <MaterialIcons name="analytics" size={s(15)} color={primary} />
            <Text style={[st.sectionTitle, { color: onSurface, fontSize: s(12), marginLeft: s(5) }]}>
              Stats
            </Text>
          </View>
          <View style={[st.grid, { marginBottom: s(4), marginHorizontal: -gridGap / 2 }]}>
            {stats.map((stat) => (
              <View key={stat.label} style={{ width: cardBasis, padding: gridGap / 2 }}>
                <Pressable style={[st.statCard, { backgroundColor: surface, borderColor: surfaceContainerHigh, borderRadius: s(16), padding: s(20), gap: s(14) }]}>
                  <AppIcon icon={stat.icon} color={stat.color} size={s(40)} iconSize={s(20)} radius={s(12)} variant="tinted" />
                  <Text style={[st.statValue, { color: stat.color, fontSize: s(22) }]}>{stat.value}</Text>
                  <Text style={[st.statLabel, { color: onSurfaceVariant, fontSize: s(10) }]} numberOfLines={1} adjustsFontSizeToFit>
                    {stat.label}
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>

      

          {/* Recent Records */}
          <View style={[st.sectionHead, { marginTop: s(18), marginBottom: s(12) }]}>
            <View style={[st.sectionAccentBar, { backgroundColor: secondary, height: s(16), width: s(3), borderRadius: s(2), marginRight: s(8) }]} />
            <MaterialIcons name="history" size={s(15)} color={secondary} />
            <Text style={[st.sectionTitle, { color: onSurface, fontSize: s(12), marginLeft: s(5) }]}>
              Recent Seizure Records
            </Text>
          </View>
          {INITIAL_SEIZURE_RECORDS.slice(0, 5).map((record) => {
            const isPositive = record.status === 'POSITIVE';
            const statusColor = isPositive ? (isDark ? '#ff6b6b' : '#c62828') : tertiary;
            return (
              <Pressable
                key={record.id}
                onPress={() => onSelectRecord(record)}
                style={[st.recordCard, { backgroundColor: surface, borderColor: surfaceContainerHigh, borderRadius: s(16), padding: s(14), marginBottom: s(10), gap: s(14) }]}
              >
                <IconChip icon={isPositive ? 'report' : 'check-circle'} color={statusColor} size={s(42)} iconSize={s(20)} radius={s(12)} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={[st.recordHeader, { marginBottom: s(3) }]}>
                    <Text style={[st.recordCase, { color: primary, fontSize: s(11) }]} numberOfLines={1}>
                      {record.caseNumber}
                    </Text>
                    <Text style={[st.recordDate, { color: onSurfaceVariant, fontSize: s(10) }]} numberOfLines={1}>
                      {record.date}
                    </Text>
                  </View>
                  <Text style={[st.recordCompound, { color: onSurface, fontSize: s(14) }]} numberOfLines={1}>
                    {record.compoundName}
                  </Text>
                  <Text style={[st.recordMeta, { color: onSurfaceVariant, fontSize: s(11) }]} numberOfLines={1}>
                    {record.reagentName} • {record.officer}
                  </Text>
                </View>
                <View style={[st.resultBadge, { backgroundColor: statusColor + '1c', paddingHorizontal: s(8), paddingVertical: s(4), borderRadius: s(8) }]}>
                  <Text style={[st.resultText, { color: statusColor, fontSize: s(10) }]}>
                    {record.status}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={s(18)} color={onSurfaceVariant} style={{ marginLeft: -s(2) }} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Quit Confirmation — same themed modal as LoginScreen */}
      <Modal
        visible={showQuitConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowQuitConfirm(false)}
      >
        <TouchableOpacity
          style={[st.modalScrim, { backgroundColor: scrim }]}
          activeOpacity={1}
          onPress={() => setShowQuitConfirm(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: '100%', maxWidth: 340 }}>
            <View
              style={[
                st.quitCard,
                {
                  backgroundColor: surface,
                  borderColor: surfaceContainerHigh,
                  padding: s(24),
                  borderRadius: s(20),
                },
              ]}
            >
              <View style={[st.quitIconRing, { backgroundColor: dangerContainer, width: s(56), height: s(56), borderRadius: s(28) }]}>
                <MaterialIcons name="logout" size={s(26)} color={danger} />
              </View>

              <Text style={[st.quitTitle, { color: onSurface, fontSize: s(19) }]}>Quit NCSpectra?</Text>
              <Text style={[st.quitMessage, { color: onSurfaceVariant, fontSize: s(13) }]}>
                {offlineQueueCount > 0
                  ? `You have ${offlineQueueCount} record${offlineQueueCount === 1 ? '' : 's'} pending vault sync. Quitting now may delay their upload.`
                  : "You'll need to re-authenticate on next launch."}
              </Text>

              <View style={[st.quitActions, { gap: s(10), marginTop: s(22) }]}>
                <TouchableOpacity
                  onPress={() => setShowQuitConfirm(false)}
                  activeOpacity={0.85}
                  style={[
                    st.quitBtn,
                    st.quitBtnGhost,
                    { backgroundColor: surfaceContainerLow, borderColor: surfaceContainerHigh, paddingVertical: s(13), borderRadius: s(12) },
                  ]}
                >
                  <Text style={[st.quitBtnGhostText, { color: onSurface, fontSize: s(13) }]}>STAY</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setShowQuitConfirm(false); BackHandler.exitApp(); }}
                  activeOpacity={0.85}
                  style={[
                    st.quitBtn,
                    { backgroundColor: danger, paddingVertical: s(13), borderRadius: s(12) },
                  ]}
                >
                  <MaterialIcons name="exit-to-app" size={s(16)} color="#ffffff" style={{ marginRight: s(6) }} />
                  <Text style={[st.quitBtnText, { fontSize: s(13) }]}>QUIT APP</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  heroCard: {
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
  heroGlow: { position: 'absolute', opacity: 0.5 },
  heroRing: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 1,
    borderRadius: 14,
  },
  officerRow: { flexDirection: 'row', alignItems: 'center' },
  avatarRing: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  officerName: { fontWeight: '800' },
  officerBadge: { fontWeight: '700', letterSpacing: 1, marginTop: 1 },
  officerUnit: { marginTop: 1 },
  encryptedChip: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  liveDot: {},
  encryptedLabel: { position: 'absolute', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  syncBanner: { flexDirection: 'row', alignItems: 'center' },
  syncIconChip: { alignItems: 'center', justifyContent: 'center' },
  syncText: { flex: 1, fontWeight: '600', minWidth: '40%' },
  syncActionPill: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  syncAction: { fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  sectionHead: { flexDirection: 'row', alignItems: 'center' },
  sectionAccentBar: {},
  iconChip: { alignItems: 'center', justifyContent: 'center' },
  statCard: {
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  statValue: { fontWeight: '800' },
  statLabel: { textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  sectionTitle: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  actionCard: {
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  actionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  actionLabel: { fontWeight: '600' },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  recordIconChip: { alignItems: 'center', justifyContent: 'center' },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  recordCase: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 1 },
  recordDate: {},
  recordCompound: { fontWeight: '600', marginBottom: 2 },
  recordMeta: {},
  resultBadge: {},
  resultText: { fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  modalScrim: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  quitCard: {
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  quitIconRing: { alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  quitTitle: { fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  quitMessage: { textAlign: 'center', lineHeight: 19 },
  quitActions: { flexDirection: 'row', width: '100%' },
  quitBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  quitBtnGhost: { borderWidth: 1 },
  quitBtnGhostText: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  quitBtnText: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: '#ffffff' },
});