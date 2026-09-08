import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  BackHandler,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { IMAGES } from '../data/mockData';
import { apiClient } from '../services/api';
import type { OfficerProfile } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (session: { token: string; officer: OfficerProfile }) => void;
  onOfflineMode: () => void;
  isDark: boolean;
  onToggleTheme: (dark: boolean) => void;
}

// Base width the design was made for (a standard 375pt-wide phone).
// Every size below is derived from the *actual* device width against
// this baseline, then clamped so it never balloons on tablets/desktop
// web or shrinks unreadably on tiny phones.
const BASE_WIDTH = 375;
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.25;
const MAX_CONTENT_WIDTH = 480; // keeps the form from stretching edge-to-edge on tablets

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess, onOfflineMode, isDark, onToggleTheme,
}) => {
  const { width, height } = useWindowDimensions();
  const isSmallDevice = width < 340;
  const isCompactHeight = height < 700;

  const scale = useMemo(
    () => clamp(width / BASE_WIDTH, MIN_SCALE, MAX_SCALE),
    [width],
  );
  const s = (size: number) => Math.round(size * scale);
  const contentMaxWidth = Math.min(width, MAX_CONTENT_WIDTH);

  const [officerId, setOfficerId] = useState('NCB-DEL-9842');
  const [passcode, setPasscode] = useState('tactical-auth-2024');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isScanningBio, setIsScanningBio] = useState(false);
  const [bioSuccess, setBioSuccess] = useState(false);

  const primary = isDark ? '#4edea3' : '#00288e';
  const secondary = isDark ? '#93ccff' : '#0054a0';
  const tertiary = isDark ? '#56d474' : '#003e17';
  const bg = isDark ? '#051424' : '#f7faf7';
  const surface = isDark ? '#0d2137' : '#ffffff';
  const surfaceContainerLow = isDark ? '#0a1c2e' : '#f0f4f0';
  const surfaceContainerHigh = isDark ? '#1c3d5e' : '#e1e5e1';
  const onSurface = isDark ? '#e6f0ff' : '#181c1b';
  const onSurfaceVariant = isDark ? '#94a9c9' : '#444653';
  const onPrimaryContainer = isDark ? '#003822' : '#ffffff';
  const primaryContainer = isDark ? '#4edea3' : '#1a4ec8';
  const danger = isDark ? '#ff6b6b' : '#d92d20';
  const dangerContainer = isDark ? '#3a1414' : '#fdeceb';
  const scrim = isDark ? 'rgba(2,8,16,0.72)' : 'rgba(10,15,25,0.55)';

  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Login is the app's entry screen — there's nowhere "back" to go, so the
  // hardware back button asks the user to confirm before exiting the app.
  useEffect(() => {
    const onBackPress = () => {
      setShowQuitConfirm(true);
      // Returning true tells Android we've handled the back press ourselves,
      // so it won't fall through to the default (immediate exit / go back).
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  const handleLogin = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      const login = await apiClient.post('/auth/login', {
        badge_number: officerId.trim().toUpperCase(),
        passcode,
      });

      const officer = await apiClient.get('/officers/me', login.access_token) as OfficerProfile;
      onLoginSuccess({ token: login.access_token, officer });
    } catch (error) {
      console.error('Authentication failed:', error);
      onOfflineMode();
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleBiometric = () => {
    if (isScanningBio) return;
    setIsScanningBio(true);
    setTimeout(async () => {
      setBioSuccess(true);
      await handleLogin();
      setTimeout(() => {
        setIsScanningBio(false);
        setBioSuccess(false);
      }, 700);
    }, 1100);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'bottom']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: s(16),
            paddingTop: s(12),
            paddingBottom: s(32),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' }}>

          {/* HUD Bar — wraps onto a second line on narrow screens instead of overlapping/clipping */}
          <View style={styles.hudBar}>
            <View style={[styles.hudLeft, { backgroundColor: surfaceContainerLow }]}>
              <View style={[styles.pulseDot, { backgroundColor: primary, width: s(8), height: s(8), borderRadius: s(4) }]} />
              <Text style={[styles.hudText, { color: primary, fontSize: s(10) }]} numberOfLines={1}>
                {/* ZONE 01  */}
                LIVE
              </Text>
            </View>
            <View style={styles.hudRight}>
              {/* <MaterialCommunityIcons name="satellite-variant" size={s(14)} color={secondary} />
              {!isSmallDevice && (
                <Text style={[styles.hudText, { color: onSurfaceVariant, fontSize: s(10) }]} numberOfLines={1}>
                  NODE: DEL-NORTH-HQ
                </Text>
              )}
              <Text style={[styles.hudText, { color: secondary, fontWeight: '700', fontSize: s(10) }]} numberOfLines={1}>
                AES-256
              </Text> */}
              <TouchableOpacity
                onPress={() => onToggleTheme(!isDark)}
                style={[styles.themeQuickBtn, { backgroundColor: surfaceContainerHigh, width: s(28), height: s(28), borderRadius: s(8) }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name={isDark ? 'light-mode' : 'dark-mode'} size={s(16)} color={onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Header */}
          <View style={[styles.logoSection, { marginBottom: s(isCompactHeight ? 10 : 16) }]}>
            <View style={[styles.emblemWrap, { width: s(72), height: s(72), marginBottom: s(8) }]}>
              <Image source={{ uri: IMAGES.emblem }} style={{ width: s(58), height: s(58) }} resizeMode="contain" />
            </View>
            <View style={[styles.badgePill, { backgroundColor: surfaceContainerHigh, paddingHorizontal: s(10), maxWidth: '100%' }]}>
              <MaterialIcons name="shield" size={s(12)} color={secondary} />
              <Text
                style={[styles.badgePillText, { color: secondary, fontSize: s(9) }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                NARCOTICS CONTROL BUREAU • GOVT OF INDIA
              </Text>
            </View>
            <Text style={[styles.appTitle, { color: onSurface, fontSize: s(30) }]}>
              NC<Text style={[styles.appTitleAccent, { color: secondary, fontSize: s(30) }]}>Spectra</Text>
            </Text>
            <Text style={[styles.appSubtitle, { color: onSurfaceVariant, fontSize: s(12), maxWidth: contentMaxWidth * 0.78 }]}>
              Digital Companion for Field Drug Testing & Spectral Narcotics Assay
            </Text>
          </View>

          {/* Status Banner */}
          {/* <View style={[styles.statusBanner, { backgroundColor: surfaceContainerLow, padding: s(10), borderRadius: s(10), marginBottom: s(16) }]}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: primary, width: s(9), height: s(9), borderRadius: s(5), marginRight: s(8) }]} />
              <Text
                style={[styles.statusText, { color: onSurface, fontSize: s(10) }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                ZONE SERVER CONNECTED <Text style={{ color: onSurfaceVariant }}>• SEC LEVEL IV</Text>
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: surfaceContainerHigh, paddingHorizontal: s(8), paddingVertical: s(3), borderRadius: s(4) }]}>
              <Text style={[styles.statusBadgeText, { color: primary, fontSize: s(10) }]}>AUTHENTICATED</Text>
            </View>
          </View> */}

          {/* Credentials Card */}
          <View style={[styles.card, { backgroundColor: surface, borderRadius: s(16), padding: s(16), marginBottom: s(12), gap: s(14) }]}>
            {/* Officer ID */}
            <View style={styles.fieldGroup}>
              <View style={styles.fieldHeader}>
                <Text style={[styles.fieldLabel, { color: onSurfaceVariant, fontSize: s(10) }]}>
                  Officer ID / Badge Number
                </Text>
                <View style={styles.fieldHeaderRight}>
                  <MaterialIcons name="verified" size={s(12)} color={secondary} />
                  <Text style={[styles.fieldHint, { color: secondary, fontSize: s(10) }]}>VERIFIED</Text>
                </View>
              </View>
              <View style={[styles.inputRow, { backgroundColor: surfaceContainerLow, borderColor: surfaceContainerHigh, borderRadius: s(10) }]}>
                <MaterialIcons name="badge" size={s(20)} color={secondary} style={{ marginLeft: s(12), marginRight: s(4) }} />
                <TextInput
                  style={[styles.input, { color: onSurface, fontSize: s(13), paddingVertical: s(12) }]}
                  placeholder="ENTER BADGE NO."
                  placeholderTextColor={onSurfaceVariant}
                  value={officerId}
                  onChangeText={setOfficerId}
                  autoCapitalize="characters"
                />
                {/* <View style={[styles.zoneBadge, { backgroundColor: surfaceContainerHigh, marginRight: s(10), paddingHorizontal: s(8), borderRadius: s(4) }]}>
                  <Text style={[styles.zoneBadgeText, { color: primary, fontSize: s(10) }]}>ZONE-01</Text>
                </View> */}
              </View>
            </View>

            {/* Passcode */}
            <View style={styles.fieldGroup}>
              <View style={[styles.fieldHeader, { flexWrap: 'wrap', rowGap: s(4) }]}>
                <Text style={[styles.fieldLabel, { color: onSurfaceVariant, fontSize: s(10) }]}>
                  Security Passcode / Token PIN
                </Text>
                {/* <Text style={[styles.fieldHint, { color: tertiary, fontSize: s(10) }]}>TOKEN ROTATION: 42m</Text> */}
              </View>
              <View style={[styles.inputRow, { backgroundColor: surfaceContainerLow, borderColor: surfaceContainerHigh, borderRadius: s(10) }]}>
                <MaterialIcons name="lock" size={s(20)} color={onSurfaceVariant} style={{ marginLeft: s(12), marginRight: s(4) }} />
                <TextInput
                  style={[styles.input, { color: onSurface, fontSize: s(13), paddingVertical: s(12) }]}
                  placeholder="ENTER SECRET PIN"
                  placeholderTextColor={onSurfaceVariant}
                  value={passcode}
                  onChangeText={setPasscode}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ paddingRight: s(12), paddingVertical: s(12) }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={s(20)} color={onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={() => { void handleLogin(); }}
              disabled={isAuthenticating}
              style={[
                styles.loginBtn,
                {
                  backgroundColor: primaryContainer,
                  opacity: isAuthenticating ? 0.85 : 1,
                  padding: s(14),
                  borderRadius: s(12),
                  flexWrap: 'wrap',
                  rowGap: s(6),
                },
              ]}
              activeOpacity={0.9}
            >
              <View style={styles.loginBtnLeft}>
                {isAuthenticating
                  ? <ActivityIndicator size="small" color={onPrimaryContainer} style={{ marginRight: s(8) }} />
                  : <MaterialIcons name="fingerprint" size={s(22)} color={onPrimaryContainer} style={{ marginRight: s(8) }} />}
                <Text
                  style={[styles.loginBtnText, { color: onPrimaryContainer, fontSize: s(15) }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {isAuthenticating ? 'VERIFYING…' : 'SECURE LOGIN'}
                </Text>
              </View>
              <View style={[styles.loginBtnRight, { paddingHorizontal: s(8), paddingVertical: s(4), borderRadius: s(6) }]}>
                <View style={[styles.pingDot, { backgroundColor: onPrimaryContainer, width: s(6), height: s(6), borderRadius: s(3), marginRight: s(4) }]} />
                <Text style={[styles.loginBtnHint, { color: onPrimaryContainer, fontSize: s(9) }]}>
                  {isAuthenticating ? 'COMMENCING' : 'TAP TO AUTH'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { marginVertical: s(12) }]}>
            <View style={[styles.dividerLine, { backgroundColor: surfaceContainerHigh }]} />
            <Text style={[styles.dividerText, { color: onSurfaceVariant, backgroundColor: bg, fontSize: s(10), paddingHorizontal: s(10) }]}>
              OR USE SECURE BIOMETRICS
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: surfaceContainerHigh }]} />
          </View>

          {/* Biometric */}
          <TouchableOpacity
            onPress={handleBiometric}
            style={[
              styles.bioCard,
              {
                backgroundColor: surface,
                borderColor: isScanningBio ? primary : 'transparent',
                borderWidth: isScanningBio ? 2 : 0,
                padding: s(16),
                borderRadius: s(16),
                marginBottom: s(12),
              },
            ]}
            activeOpacity={0.85}
          >
            <View style={[styles.bioReticle, { backgroundColor: surfaceContainerLow, width: s(56), height: s(56), borderRadius: s(14), marginRight: s(14) }]}>
              <MaterialIcons
                name={bioSuccess ? 'check-circle' : 'fingerprint'}
                size={s(28)}
                color={bioSuccess ? primary : secondary}
              />
            </View>
            <View style={styles.bioText}>
              <View style={styles.bioTitleRow}>
                <Text style={[styles.bioTitle, { color: onSurface, fontSize: s(15) }]} numberOfLines={1}>
                  Optical / Face ID
                </Text>
                <MaterialIcons name="verified-user" size={s(14)} color={primary} style={{ marginLeft: s(4) }} />
              </View>
              <Text style={[styles.bioSubtitle, { color: secondary, fontSize: s(12) }]} numberOfLines={2}>
                {isScanningBio ? 'Scanning Facial Topography...' : bioSuccess ? 'Identity Verified!' : 'Touch Sensor for Quick Field Auth'}
              </Text>
              <View style={styles.bioMeta}>
                <MaterialIcons name="schedule" size={s(12)} color={onSurfaceVariant} />
                <Text style={[styles.bioMetaText, { color: onSurfaceVariant, fontSize: s(10) }]} numberOfLines={1}>
                  Token Valid for 12h Field Shift
                </Text>
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={s(22)} color={secondary} />
          </TouchableOpacity>

          {/* Offline Mode */}
          <TouchableOpacity
            onPress={onOfflineMode}
            style={[styles.offlineBtn, { backgroundColor: surfaceContainerLow, padding: s(12), borderRadius: s(10), marginBottom: s(20) }]}
            activeOpacity={0.8}
          >
            <View style={styles.offlineBtnLeft}>
              <MaterialIcons name="cloud-off" size={s(18)} color={tertiary} style={{ marginRight: s(8) }} />
              <Text style={[styles.offlineBtnText, { color: onSurface, fontSize: s(13) }]} numberOfLines={1}>
                Switch to Offline Field Vault
              </Text>
            </View>
            {/* <View style={[styles.offlineBadge, { backgroundColor: isDark ? '#002b10' : '#d6f0d6', paddingHorizontal: s(8), borderRadius: s(4) }]}>
              <Text style={[styles.offlineBadgeText, { color: tertiary, fontSize: s(10) }]}>Local SQLite</Text>
            </View> */}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            {/* <View style={[styles.footerPill, { backgroundColor: surfaceContainerHigh, paddingHorizontal: s(12), paddingVertical: s(5) }]}>
              <MaterialIcons name="lock" size={s(12)} color={onSurfaceVariant} />
              <Text
                style={[styles.footerPillText, { color: onSurfaceVariant, fontSize: s(9) }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                256-Bit Hardware AES • Directive NCB-SOP-2024
              </Text>
            </View> */}
            <Text style={[styles.footerNote, { color: onSurfaceVariant, fontSize: s(10) }]}>
              Narcotics Control Bureau • Ministry of Home Affairs
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Quit Confirmation — themed to match app, not the OS default dialog */}
      <Modal
        visible={showQuitConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowQuitConfirm(false)}
      >
        <TouchableOpacity
          style={[styles.modalScrim, { backgroundColor: scrim }]}
          activeOpacity={1}
          onPress={() => setShowQuitConfirm(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: '100%', maxWidth: 340 }}>
            <View
              style={[
                styles.quitCard,
                {
                  backgroundColor: surface,
                  borderColor: surfaceContainerHigh,
                  padding: s(24),
                  borderRadius: s(20),
                },
              ]}
            >
              <View style={[styles.quitIconRing, { backgroundColor: dangerContainer, width: s(56), height: s(56), borderRadius: s(28) }]}>
                <MaterialIcons name="logout" size={s(26)} color={danger} />
              </View>

              <Text style={[styles.quitTitle, { color: onSurface, fontSize: s(19) }]}>Quit NCSpectra?</Text>
              <Text style={[styles.quitMessage, { color: onSurfaceVariant, fontSize: s(13) }]}>
                Any unsaved field data may be lost. You'll need to re-authenticate on next launch.
              </Text>

              <View style={[styles.quitActions, { gap: s(10), marginTop: s(22) }]}>
                <TouchableOpacity
                  onPress={() => setShowQuitConfirm(false)}
                  activeOpacity={0.85}
                  style={[
                    styles.quitBtn,
                    styles.quitBtnGhost,
                    { backgroundColor: surfaceContainerLow, borderColor: surfaceContainerHigh, paddingVertical: s(13), borderRadius: s(12) },
                  ]}
                >
                  <Text style={[styles.quitBtnGhostText, { color: onSurface, fontSize: s(13) }]}>STAY</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setShowQuitConfirm(false); BackHandler.exitApp(); }}
                  activeOpacity={0.85}
                  style={[
                    styles.quitBtn,
                    { backgroundColor: danger, paddingVertical: s(13), borderRadius: s(12) },
                  ]}
                >
                  <MaterialIcons name="exit-to-app" size={s(16)} color="#ffffff" style={{ marginRight: s(6) }} />
                  <Text style={[styles.quitBtnText, { fontSize: s(13) }]}>QUIT APP</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  hudBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: 6,
    marginBottom: 12,
  },
  hudLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pulseDot: {},
  hudRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, flexWrap: 'wrap', justifyContent: 'flex-end' },
  hudText: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  themeQuickBtn: { alignItems: 'center', justifyContent: 'center' },
  logoSection: { alignItems: 'center' },
  emblemWrap: { alignItems: 'center', justifyContent: 'center' },
  badgePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, borderRadius: 20, marginBottom: 8 },
  badgePillText: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, flexShrink: 1 },
  appTitle: { fontWeight: '800', letterSpacing: -1, marginBottom: 4, textAlign: 'center' },
  appTitleAccent: { fontWeight: '800' },
  appSubtitle: { textAlign: 'center' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  statusDot: {},
  statusText: { fontWeight: '700', textTransform: 'uppercase', flexShrink: 1 },
  statusBadge: {},
  statusBadgeText: { fontWeight: '700', textTransform: 'uppercase' },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldGroup: { gap: 6 },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldLabel: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, flexShrink: 1 },
  fieldHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fieldHint: { fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  input: { flex: 1, paddingHorizontal: 8, fontWeight: '600', minWidth: 0 },
  zoneBadge: { paddingVertical: 3 },
  zoneBadgeText: { fontWeight: '700', textTransform: 'uppercase' },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 5 },
  loginBtnLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  loginBtnText: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  loginBtnRight: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)' },
  pingDot: {},
  loginBtnHint: { fontWeight: '700', textTransform: 'uppercase' },
  divider: { flexDirection: 'row', alignItems: 'center' },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center' },
  bioCard: { flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  bioReticle: { alignItems: 'center', justifyContent: 'center' },
  bioText: { flex: 1, minWidth: 0 },
  bioTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  bioTitle: { fontWeight: '600', flexShrink: 1 },
  bioSubtitle: { marginBottom: 4 },
  bioMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bioMetaText: {},
  offlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  offlineBtnLeft: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  offlineBtnText: { fontWeight: '500', flexShrink: 1 },
  offlineBadge: { paddingVertical: 3 },
  offlineBadgeText: { fontWeight: '700' },
  footer: { alignItems: 'center', gap: 8 },
  footerPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, maxWidth: '100%' },
  footerPillText: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 1 },
  footerNote: { textAlign: 'center' },
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
