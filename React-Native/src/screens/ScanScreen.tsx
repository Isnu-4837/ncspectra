import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Easing,
  BackHandler, useWindowDimensions,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReagentInfo } from '../types';

interface ScanScreenProps {
  selectedReagent: ReagentInfo;
  onCapture: () => void;
  onAbort: () => void;
  onShowToast: (title: string, desc: string, icon?: string, color?: string) => void;
  isDark?: boolean;
  onBack?: () => void;
}

// ---------------------------------------------------------------------------
// FadeInUp – mounts children with a staggered slide-up + fade
// ---------------------------------------------------------------------------
const FadeInUp: React.FC<{ delay?: number; style?: any; children: React.ReactNode }> = ({
  delay = 0, style, children,
}) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1, duration: 450, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

// ---------------------------------------------------------------------------
// PressableScale – tactile spring-scale press feedback
// ---------------------------------------------------------------------------
const PressableScale: React.FC<{
  onPress: () => void; style?: any; children: React.ReactNode;
}> = ({ onPress, style, children }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 30, bounciness: 6 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={0.9}
        style={s.btnInner}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ---------------------------------------------------------------------------
// ScanScreen
// ---------------------------------------------------------------------------
export const ScanScreen: React.FC<ScanScreenProps> = ({
  selectedReagent, onCapture, onAbort, onShowToast, isDark = false, onBack,
}) => {
  const { width: screenW, height: screenH } = useWindowDimensions();

  const [torchActive, setTorchActive] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Hardware back button
  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (onBack) { onBack(); return true; }
      return false;
    });
    return () => handler.remove();
  }, [onBack]);

  // ── Colours ──────────────────────────────────────────────────────────────
  const primary              = isDark ? '#4edea3' : '#00288e';
  const secondary            = isDark ? '#93ccff' : '#0054a0';
  const onSurface            = isDark ? '#e6f0ff' : '#181c1b';
  const onSurfaceVariant     = isDark ? '#94a9c9' : '#444653';
  const surface              = isDark ? '#0d2137' : '#ffffff';
  const surfaceContainerLow  = isDark ? '#0a1c2e' : '#f0f4f0';
  const surfaceContainerHigh = isDark ? '#1c3d5e' : '#e1e5e1';
  const errorColor           = isDark ? '#ff6b6b' : '#c62828';
  const successColor         = isDark ? '#56d474' : '#00700e';
  const bg                   = isDark ? '#000a1a' : '#111';

  // ── Animations ────────────────────────────────────────────────────────────
  const livePulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(livePulse, { toValue: 0.3, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(livePulse, { toValue: 1,   duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [livePulse]);

  const reticlePulse = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(reticlePulse, { toValue: 1,   duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(reticlePulse, { toValue: 0.6, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reticlePulse]);

  const scanLine = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(scanLine, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [scanLine]);

  const captureGlow = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(captureGlow, { toValue: 0.9, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(captureGlow, { toValue: 0.4, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [captureGlow]);

  const iconPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(iconPulse, { toValue: 1.12, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(iconPulse, { toValue: 1,    duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [iconPulse]);

  // ── Responsive sizing ─────────────────────────────────────────────────────
  // Reticle: 56% of screen width, clamped between 180–260
  const reticleSize = Math.min(260, Math.max(180, Math.round(screenW * 0.56)));
  const cornerSize  = Math.round(reticleSize * 0.11);
  const scanLineMax = reticleSize - 16;

  const scanLineTranslate = scanLine.interpolate({ inputRange: [0, 1], outputRange: [8, scanLineMax] });
  const scanLineOpacity   = scanLine.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 1, 1, 0] });

  // Buttons: taller on larger screens
  const btnH = screenH < 700 ? 52 : 60;

  // ── Data ──────────────────────────────────────────────────────────────────
  const specBars = [
    { label: 'MATCH',      value: '91.2%', color: primary },
    { label: 'PURITY',     value: '88.7%', color: secondary },
    { label: 'CONFIDENCE', value: '94.1%', color: successColor },
  ];

  // ── Permission screen ─────────────────────────────────────────────────────
  if (!permission) return <View style={{ flex: 1, backgroundColor: bg }} />;

  if (!permission.granted) {
    return (
      <View style={[s.permissionContainer, { backgroundColor: bg }]}>
        <FadeInUp delay={0} style={s.permissionIconRing}>
          <Animated.View
            style={[s.permissionIconGlow, { backgroundColor: primary + '20', transform: [{ scale: iconPulse }] }]}
          />
          <View style={[s.permissionIconWrap, { backgroundColor: primary + '18', borderColor: primary }]}>
            <MaterialIcons name="camera-alt" size={40} color={primary} />
          </View>
        </FadeInUp>

        <FadeInUp delay={110}>
          <Text style={[s.permissionTitle, { color: onSurface }]}>Optics Offline</Text>
        </FadeInUp>

        <FadeInUp delay={170}>
          <Text style={[s.permissionDesc, { color: onSurfaceVariant }]}>
            Hardware access is required to perform spectral analysis on physical evidence.
          </Text>
        </FadeInUp>

        <FadeInUp delay={230} style={s.permissionBtnWrap}>
          <PressableScale
            onPress={requestPermission}
            style={[s.permissionBtn, { backgroundColor: primary, shadowColor: primary, height: btnH }]}
          >
            <MaterialIcons name="lock-open" size={18} color={isDark ? '#003822' : '#fff'} />
            <Text style={[s.permissionBtnText, { color: isDark ? '#003822' : '#fff' }]}>AUTHORIZE CAMERA</Text>
          </PressableScale>
        </FadeInUp>

        <FadeInUp delay={290}>
          <TouchableOpacity
            onPress={onAbort}
            style={s.permissionAbortWrap}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[s.permissionAbortText, { color: errorColor }]}>ABORT SCAN</Text>
          </TouchableOpacity>
        </FadeInUp>
      </View>
    );
  }

  // ── Main scan screen ──────────────────────────────────────────────────────
  return (
    <View style={[s.root, { backgroundColor: bg }]}>

      {/* ── Viewfinder ─────────────────────────────────────────────────── */}
      <View style={s.viewfinder}>
        <CameraView style={StyleSheet.absoluteFill} facing="back" enableTorch={torchActive} />

        {/* Scrims for legibility */}
        <LinearGradient
          colors={['rgba(0,0,0,0.65)', 'transparent']}
          style={s.topScrim}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.72)']}
          style={s.bottomScrim}
          pointerEvents="none"
        />

        {/* ── HUD Top ──────────────────────────────────────────────────── */}
        <View style={s.hudTop}>
          {/* Left: LIVE badge */}
          <View style={[s.hudPill, { backgroundColor: 'rgba(0,0,0,0.75)', borderColor: primary }]}>
            <Animated.View style={[s.liveDot, { backgroundColor: primary, opacity: livePulse }]} />
            <Text style={[s.hudSmallText, { color: primary }]}>LIVE SCAN</Text>
          </View>

          {/* Right: RAW 4K pill + Torch button */}
          <View style={s.hudTopRight}>
            <View style={[s.hudPill, { backgroundColor: 'rgba(0,0,0,0.75)', borderColor: 'transparent' }]}>
              <MaterialIcons name="videocam" size={11} color={primary} />
              <Text style={[s.hudSmallText, { color: primary }]}>RAW 4K</Text>
            </View>
            <PressableScale
              onPress={() => {
                setTorchActive(!torchActive);
                onShowToast(torchActive ? 'Torch Off' : 'Torch On', 'Hardware illumination toggled.');
              }}
              style={[s.torchBtn, { backgroundColor: torchActive ? primary : 'rgba(0,0,0,0.65)', borderColor: primary }]}
            >
              <MaterialIcons
                name={torchActive ? 'flash-on' : 'flash-off'}
                size={18}
                color={torchActive ? '#000' : primary}
              />
            </PressableScale>
          </View>
        </View>

        {/* ── Reticle ──────────────────────────────────────────────────── */}
        <View style={[s.reticleArea, { width: reticleSize, height: reticleSize }]}>
          {/* Corner brackets */}
          {(
            [s.reticleTopLeft, s.reticleTopRight, s.reticleBottomLeft, s.reticleBottomRight] as const
          ).map((pos, i) => (
            <Animated.View
              key={i}
              style={[
                s.reticleCorner,
                pos,
                { borderColor: primary, opacity: reticlePulse, width: cornerSize, height: cornerSize },
              ]}
            />
          ))}

          {/* Sweeping scan line */}
          <Animated.View
            pointerEvents="none"
            style={[
              s.scanLine,
              {
                backgroundColor: primary,
                opacity: scanLineOpacity,
                transform: [{ translateY: scanLineTranslate }],
                shadowColor: primary,
              },
            ]}
          />

          <MaterialCommunityIcons name="atom" size={48} color={primary + '80'} style={s.reticleIcon} />
          <Text style={[s.reagentOverlay, { color: primary }]}>{selectedReagent.name}</Text>
          <Text style={[s.analyzeHint, { color: '#fff' }]}>Align sample within grid</Text>
        </View>

        {/* ── Telemetry Strip ───────────────────────────────────────────── */}
        <View style={[s.telemetryStrip, { borderTopColor: primary + '30' }]}>
          <View style={s.telemetryItem}>
            <MaterialIcons name="center-focus-weak" size={12} color={primary} />
            <Text style={[s.telemetryText, { color: primary }]} numberOfLines={1}>AUTO-MACRO [12cm]</Text>
          </View>
          <View style={s.telemetryDivider} />
          <View style={s.telemetryItem}>
            <MaterialIcons name="show-chart" size={12} color={secondary} />
            <Text style={[s.telemetryText, { color: secondary }]} numberOfLines={1}>ΔE: 0.42</Text>
          </View>
          <View style={s.telemetryDivider} />
          <View style={s.telemetryItem}>
            <MaterialIcons name="cloud-done" size={12} color={primary} />
            <Text style={[s.telemetryText, { color: primary }]} numberOfLines={1}>SYNCED [99.2%]</Text>
          </View>
        </View>
      </View>

      {/* ── Control Panel ──────────────────────────────────────────────────── */}
      <View style={[s.controlPanel, { backgroundColor: surface }]}>
        {/* Drag handle */}
        <View style={[s.grabber, { backgroundColor: surfaceContainerHigh }]} />

        {/* ── Sample Details ────────────────────────────────────────────── */}
        <FadeInUp delay={0}>
          <View style={s.sectionLabelRow}>
            <MaterialIcons name="badge" size={12} color={onSurfaceVariant} />
            <Text style={[s.sectionLabelText, { color: onSurfaceVariant }]}>SAMPLE DETAILS</Text>
          </View>
          <View style={s.reagentInfo}>
            <View
              style={[
                s.reagentColorDot,
                {
                  backgroundColor: selectedReagent.colorPositive || primary,
                  shadowColor: selectedReagent.colorPositive || primary,
                },
              ]}
            />
            <View style={s.reagentTextBlock}>
              <Text style={[s.reagentTitle, { color: onSurface }]} numberOfLines={1}>
                {selectedReagent.name}
              </Text>
              <Text style={[s.reagentSub, { color: onSurfaceVariant }]} numberOfLines={1}>
                {selectedReagent.categoryLabel}
              </Text>
            </View>
            <View style={[s.readyBadge, { backgroundColor: primary + '22' }]}>
              <View style={[s.readyDot, { backgroundColor: primary }]} />
              <Text style={[s.readyText, { color: primary }]}>READY</Text>
            </View>
          </View>
        </FadeInUp>

        {/* ── Spectral Bars ─────────────────────────────────────────────── */}
        <FadeInUp delay={70}>
          <View style={s.sectionLabelRow}>
            <MaterialIcons name="insights" size={12} color={onSurfaceVariant} />
            <Text style={[s.sectionLabelText, { color: onSurfaceVariant }]}>PRELIMINARY SPECTRAL READ</Text>
          </View>
          <View style={[s.specBars, { backgroundColor: surfaceContainerLow, borderColor: surfaceContainerHigh }]}>
            {specBars.map((bar, i) => (
              <React.Fragment key={bar.label}>
                {i > 0 && <View style={[s.specDivider, { backgroundColor: surfaceContainerHigh }]} />}
                <View style={s.specBarItem}>
                  <Text style={[s.specBarLabel, { color: onSurfaceVariant }]}>{bar.label}</Text>
                  <Text style={[s.specBarValue, { color: bar.color }]}>{bar.value}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </FadeInUp>

        {/* ── Action Buttons ────────────────────────────────────────────── */}
        <FadeInUp delay={140} style={s.actionRow}>
          {/* Abort */}
          <PressableScale
            onPress={onAbort}
            style={[
              s.abortBtn,
              { backgroundColor: surfaceContainerLow, borderColor: errorColor, height: btnH },
            ]}
          >
            <MaterialIcons name="close" size={18} color={errorColor} />
            <Text style={[s.abortText, { color: errorColor }]}>ABORT</Text>
          </PressableScale>

          {/* Capture */}
          <Animated.View
            style={[
              s.captureGlowWrap,
              { shadowColor: primary, shadowOpacity: captureGlow as unknown as number },
            ]}
          >
            <PressableScale
              onPress={onCapture}
              style={[s.captureBtn, { backgroundColor: primary, height: btnH }]}
            >
              <MaterialIcons name="photo-camera" size={22} color={isDark ? '#003822' : '#fff'} />
              <Text style={[s.captureBtnText, { color: isDark ? '#003822' : '#fff' }]}>
                CAPTURE SAMPLE
              </Text>
            </PressableScale>
          </Animated.View>
        </FadeInUp>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  // ── Root ──────────────────────────────────────────────────────────────────
  root: { flex: 1 },

  // ── Shared button inner (TouchableOpacity fill) ───────────────────────────
  btnInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },

  // ── Permission Screen ──────────────────────────────────────────────────────
  permissionContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28,
  },
  permissionIconRing: {
    alignItems: 'center', justifyContent: 'center', width: 96, height: 96, marginBottom: 24,
  },
  permissionIconGlow: {
    position: 'absolute', width: 96, height: 96, borderRadius: 48,
  },
  permissionIconWrap: {
    width: 84, height: 84, borderRadius: 42, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: 22, fontWeight: '800', marginBottom: 10,
    textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center',
  },
  permissionDesc: {
    fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 21, paddingHorizontal: 4,
  },
  permissionBtnWrap: { width: '100%' },
  permissionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingHorizontal: 24, borderRadius: 14, width: '100%',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  permissionBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  permissionAbortWrap: { marginTop: 22, padding: 4 },
  permissionAbortText: {
    fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1,
  },

  // ── Viewfinder ────────────────────────────────────────────────────────────
  viewfinder: {
    flex: 1, backgroundColor: '#000',
    alignItems: 'center', justifyContent: 'center',
  },
  topScrim: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 110, zIndex: 5,
  },
  bottomScrim: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, zIndex: 5,
  },

  // ── HUD ───────────────────────────────────────────────────────────────────
  hudTop: {
    position: 'absolute', top: 12, left: 12, right: 12,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10,
  },
  hudTopRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hudPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  hudSmallText: {
    fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1,
  },
  torchBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Reticle ───────────────────────────────────────────────────────────────
  reticleArea: {
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  reticleCorner: { position: 'absolute', borderWidth: 3 },
  reticleTopLeft:     { top: 0,    left: 0,  borderRightWidth: 0, borderBottomWidth: 0 },
  reticleTopRight:    { top: 0,    right: 0, borderLeftWidth: 0,  borderBottomWidth: 0 },
  reticleBottomLeft:  { bottom: 0, left: 0,  borderRightWidth: 0, borderTopWidth: 0 },
  reticleBottomRight: { bottom: 0, right: 0, borderLeftWidth: 0,  borderTopWidth: 0 },
  scanLine: {
    position: 'absolute', left: 4, right: 4, height: 2, borderRadius: 1,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6,
  },
  reticleIcon: { opacity: 0.6 },
  reagentOverlay: {
    fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginTop: 10,
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  analyzeHint: {
    fontSize: 11, marginTop: 5, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.9)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },

  // ── Telemetry Strip ───────────────────────────────────────────────────────
  telemetryStrip: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 9, paddingHorizontal: 8,
    borderTopWidth: 1, backgroundColor: 'rgba(0,0,0,0.82)', zIndex: 10,
  },
  telemetryItem: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, flexShrink: 1,
  },
  telemetryDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  telemetryText: {
    fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, flexShrink: 1,
  },

  // ── Control Panel ─────────────────────────────────────────────────────────
  controlPanel: {
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24, gap: 12,
    elevation: 12, borderTopLeftRadius: 22, borderTopRightRadius: 22, zIndex: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 12,
  },
  grabber: {
    width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 2,
  },

  // Section labels
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  sectionLabelText: {
    fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1,
  },

  // Reagent info row
  reagentInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reagentColorDot: {
    width: 18, height: 18, borderRadius: 9, flexShrink: 0,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 5, elevation: 3,
  },
  reagentTextBlock: { flex: 1, minWidth: 0 },
  reagentTitle: { fontSize: 18, fontWeight: '800' },
  reagentSub: {
    fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1,
  },
  readyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, flexShrink: 0,
  },
  readyDot: { width: 6, height: 6, borderRadius: 3 },
  readyText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },

  // Spectral bars
  specBars: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingVertical: 14, paddingHorizontal: 8, borderRadius: 14, borderWidth: 1,
  },
  specDivider: { width: 1, height: 36 },
  specBarItem: { flex: 1, alignItems: 'center', gap: 6 },
  specBarLabel: {
    fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center',
  },
  specBarValue: { fontSize: 20, fontWeight: '800' },

  // Action buttons
  actionRow: { flexDirection: 'row', gap: 10 },
  abortBtn: {
    flex: 1, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden',
  },
  abortText: {
    fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1,
  },
  captureGlowWrap: {
    flex: 2, borderRadius: 14, overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 }, shadowRadius: 14, elevation: 8,
  },
  captureBtn: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  captureBtnText: {
    fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1,
  },
});
