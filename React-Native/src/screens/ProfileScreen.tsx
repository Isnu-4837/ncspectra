import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, BackHandler, Modal, Animated, Easing, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { INITIAL_OFFICER } from '../data/mockData';
import type { ScreenType } from '../types';

interface ProfileScreenProps {
  onLogout: () => void;
  onNavigate: (screen: ScreenType) => void;
  onOpenSop: () => void;
  onShowToast: (title: string, desc: string, icon?: string, color?: string) => void;
  isDark?: boolean;
  onBack?: () => void;
}

interface NotificationItem {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  color: string;
}

/** Fades + slides content up on mount, staggered by `delay`. */
const FadeInUp: React.FC<{ delay?: number; style?: any; children: React.ReactNode }> = ({
  delay = 0, style, children,
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 400, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [anim, delay]);
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
};

/** Scales down slightly on press for tactile feedback. */
const PressableScale: React.FC<{ onPress: () => void; style?: any; children: React.ReactNode }> = ({ onPress, style, children }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} activeOpacity={0.9}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onLogout, onNavigate, onOpenSop, onShowToast, isDark = false, onBack
}) => {
  const primary = isDark ? '#4edea3' : '#00288e';
  const secondary = isDark ? '#93ccff' : '#0054a0';
  const tertiary = isDark ? '#56d474' : '#003e17';
  const surface = isDark ? '#0d2137' : '#ffffff';
  const surfaceContainerLow = isDark ? '#0a1c2e' : '#f0f4f0';
  const surfaceContainerHigh = isDark ? '#1c3d5e' : '#e1e5e1';
  const onSurface = isDark ? '#e6f0ff' : '#181c1b';
  const onSurfaceVariant = isDark ? '#94a9c9' : '#444653';
  const bg = isDark ? '#051424' : '#f7faf7';
  const warnColor = isDark ? '#f5c451' : '#946800';
  const errorColor = isDark ? '#ff6b6b' : '#c62828';

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 'n1', icon: 'sync', title: 'Vault Sync Complete', desc: '42 records synced to central evidence server.', time: '2m ago', unread: true, color: tertiary },
    { id: 'n2', icon: 'warning', title: 'Reagent Calibration Due', desc: 'Marquis Reagent kit is due for recalibration.', time: '1h ago', unread: true, color: warnColor },
    { id: 'n3', icon: 'gps-fixed', title: 'GPS Lock Reacquired', desc: 'Location services restored after signal drop.', time: '3h ago', unread: true, color: secondary },
    { id: 'n4', icon: 'menu-book', title: 'SOP Updated', desc: 'Field Guide protocol manual updated to v4.2.', time: 'Yesterday', unread: false, color: secondary },
    { id: 'n5', icon: 'verified-user', title: 'Certification Renewed', desc: 'Your Field Analyst certification was renewed.', time: '3 days ago', unread: false, color: primary },
  ]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Notification modal open/close state + animation.
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const sheetAnim = useRef(new Animated.Value(0)).current;

  const openNotifications = () => {
    setNotificationsVisible(true);
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 220, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(sheetAnim, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  const closeNotifications = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 180, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(sheetAnim, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setNotificationsVisible(false);
    });
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const sheetTranslate = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [420, 0] });

  useEffect(() => {
    const backAction = () => {
      if (notificationsVisible) {
        closeNotifications();
        return true;
      }
      if (onBack) {
        onBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [onBack, notificationsVisible]);

  const profileDetails = [
    { icon: 'badge' as const, label: 'Badge Number', value: `#${INITIAL_OFFICER.badgeNumber}`, color: primary },
    { icon: 'location-on' as const, label: 'Zone Assignment', value: INITIAL_OFFICER.zone, color: secondary },
    { icon: 'business' as const, label: 'Unit', value: INITIAL_OFFICER.unit, color: tertiary },
    { icon: 'military-tech' as const, label: 'Rank', value: INITIAL_OFFICER.rank || 'Sub-Inspector', color: primary },
    { icon: 'calendar-today' as const, label: 'Active Since', value: '01 Jan 2022', color: secondary },
    { icon: 'key' as const, label: 'Session Token', value: '***-9842-***', color: onSurfaceVariant },
  ];

  const menuItems = [
    { icon: 'menu-book' as const, label: 'SOP & Field Guide', desc: 'NCB Protocol Manual', onPress: onOpenSop, color: secondary },
    { icon: 'sync' as const, label: 'Vault Sync', desc: 'Manage offline record queue', onPress: () => onNavigate('sync'), color: tertiary },
    {
      icon: 'notifications' as const,
      label: 'Notifications',
      desc: unreadCount > 0 ? `${unreadCount} unread alert${unreadCount === 1 ? '' : 's'}` : 'All caught up',
      onPress: openNotifications,
      color: primary,
    },
    { icon: 'settings' as const, label: 'App Settings', desc: 'Device & display preferences', onPress: () => onShowToast('Settings', 'Settings panel coming soon.'), color: onSurfaceVariant },
    { icon: 'help' as const, label: 'Help & Support', desc: 'Contact NCB Tech Support', onPress: () => onShowToast('Support', 'Email: tech@ncb.gov.in'), color: onSurfaceVariant },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingVertical: 16, paddingBottom: 100 }}>
      {/* Officer Profile Header */}
      <View style={[s.profileCard, { backgroundColor: surface }]}>
        <View style={[s.avatar, { backgroundColor: primary }]}>
          <MaterialIcons name="person" size={36} color={isDark ? '#003822' : '#fff'} />
        </View>
        <Text style={[s.officerName, { color: onSurface }]}>{INITIAL_OFFICER.name}</Text>
        <Text style={[s.officerTitle, { color: primary }]}>
          {INITIAL_OFFICER.rank || 'Sub-Inspector'} • NCB Field Agent
        </Text>
        <View style={[s.certBadge, { backgroundColor: primary + '22', borderColor: primary }]}>
          <MaterialIcons name="verified-user" size={14} color={primary} />
          <Text style={[s.certBadgeText, { color: primary }]}>CERTIFIED FIELD ANALYST</Text>
        </View>

        {/* Details Grid */}
        <View style={s.detailsGrid}>
          {profileDetails.map((d) => (
            <View key={d.label} style={[s.detailCard, { backgroundColor: surfaceContainerLow }]}>
              <MaterialIcons name={d.icon} size={16} color={d.color} />
              <Text style={[s.detailLabel, { color: onSurfaceVariant }]}>{d.label}</Text>
              <Text style={[s.detailValue, { color: onSurface }]}>{d.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Menu Items */}
      <View style={[s.menuCard, { backgroundColor: surface }]}>
        {menuItems.map((item, i) => (
          <React.Fragment key={item.label}>
            <TouchableOpacity onPress={item.onPress} style={s.menuItem} activeOpacity={0.8}>
              <View style={[s.menuIconWrap, { backgroundColor: item.color + '22' }]}>
                <MaterialIcons name={item.icon} size={20} color={item.color} />
                {item.label === 'Notifications' && unreadCount > 0 && (
                  <View style={[s.menuIconBadge, { backgroundColor: errorColor, borderColor: surface }]}>
                    <Text style={s.menuIconBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.menuLabel, { color: onSurface }]}>{item.label}</Text>
                <Text style={[s.menuDesc, { color: onSurfaceVariant }]}>{item.desc}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={onSurfaceVariant} />
            </TouchableOpacity>
            {i < menuItems.length - 1 && <View style={[s.divider, { backgroundColor: surfaceContainerHigh }]} />}
          </React.Fragment>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity onPress={onLogout} style={[s.logoutBtn, { borderColor: isDark ? '#c62828' : '#c62828', backgroundColor: isDark ? '#3d0000' : '#ffebee' }]} activeOpacity={0.85}>
        <MaterialIcons name="logout" size={20} color={isDark ? '#ff6b6b' : '#c62828'} />
        <Text style={[s.logoutText, { color: isDark ? '#ff6b6b' : '#c62828' }]}>SECURE LOGOUT</Text>
      </TouchableOpacity>

      <Text style={[s.version, { color: onSurfaceVariant }]}>NCSpectra • NCB Tactical Field</Text>

      {/* Notifications Modal */}
      <Modal visible={notificationsVisible} transparent animationType="none" onRequestClose={closeNotifications} statusBarTranslucent>
        <Pressable style={s.modalBackdropTouch} onPress={closeNotifications}>
          <Animated.View style={[s.modalBackdrop, { opacity: backdropAnim }]} />
        </Pressable>

        <Animated.View style={[s.sheet, { backgroundColor: surface, transform: [{ translateY: sheetTranslate }] }]}>
          <View style={[s.sheetGrabber, { backgroundColor: surfaceContainerHigh }]} />

          <View style={s.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[s.sheetTitle, { color: onSurface }]}>Notifications</Text>
              <Text style={[s.sheetSub, { color: onSurfaceVariant }]}>
                {unreadCount > 0 ? `${unreadCount} unread` : 'You\u2019re all caught up'}
              </Text>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllRead} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[s.markAllText, { color: primary }]}>MARK ALL READ</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={closeNotifications} style={[s.closeBtn, { backgroundColor: surfaceContainerLow }]} activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={18} color={onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {notifications.length === 0 ? (
            <View style={s.emptyState}>
              <MaterialIcons name="notifications-none" size={40} color={onSurfaceVariant} />
              <Text style={[s.emptyText, { color: onSurfaceVariant }]}>No notifications yet</Text>
            </View>
          ) : (
            <ScrollView style={s.sheetList} showsVerticalScrollIndicator={false}>
              {notifications.map((n, i) => (
                <FadeInUp key={n.id} delay={i * 50}>
                  <View style={[s.notifRow, { backgroundColor: n.unread ? n.color + '12' : 'transparent' }]}>
                    <View style={[s.notifIconWrap, { backgroundColor: n.color + '22' }]}>
                      <MaterialIcons name={n.icon} size={18} color={n.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={s.notifTitleRow}>
                        <Text style={[s.notifTitle, { color: onSurface }]}>{n.title}</Text>
                        {n.unread && <View style={[s.unreadDot, { backgroundColor: n.color }]} />}
                      </View>
                      <Text style={[s.notifDesc, { color: onSurfaceVariant }]}>{n.desc}</Text>
                      <Text style={[s.notifTime, { color: onSurfaceVariant }]}>{n.time}</Text>
                    </View>
                  </View>
                  {i < notifications.length - 1 && <View style={[s.notifDivider, { backgroundColor: surfaceContainerHigh }]} />}
                </FadeInUp>
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </Modal>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  profileCard: { borderRadius: 16, padding: 20, marginBottom: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  officerName: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  officerTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  certBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, marginBottom: 16 },
  certBadgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  detailCard: { width: '47%', borderRadius: 10, padding: 10, gap: 3 },
  detailLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 12, fontWeight: '600' },
  menuCard: { borderRadius: 16, padding: 4, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  menuIconBadge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  menuIconBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  menuLabel: { fontSize: 15, fontWeight: '600' },
  menuDesc: { fontSize: 11, marginTop: 1 },
  divider: { height: 1, marginHorizontal: 14 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 15, borderRadius: 14, borderWidth: 1.5, marginBottom: 16 },
  logoutText: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  version: { textAlign: 'center', fontSize: 10, marginBottom: 8 },

  // Notifications modal
  modalBackdropTouch: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '78%', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20, elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 16 },
  sheetGrabber: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  sheetTitle: { fontSize: 19, fontWeight: '800' },
  sheetSub: { fontSize: 12, marginTop: 2 },
  markAllText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginTop: 4 },
  closeBtn: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sheetList: { marginTop: 6 },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 12, borderRadius: 12 },
  notifIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notifTitle: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  unreadDot: { width: 6, height: 6, borderRadius: 3 },
  notifDesc: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  notifTime: { fontSize: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  notifDivider: { height: 1, marginHorizontal: 4 },
  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyText: { fontSize: 13 },
});