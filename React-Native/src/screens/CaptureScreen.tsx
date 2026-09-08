import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing, BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { CaptureSubmission, ReagentInfo } from '../types';

interface CaptureScreenProps {
  selectedReagent: ReagentInfo;
  onRetake: () => void;
  onConfirmAnalyze: (capture: CaptureSubmission) => Promise<void> | void;
  onShowToast: (title: string, desc: string, icon?: string, color?: string) => void;
  isDark?: boolean;
  onBack?: () => void;
  officerName?: string;
  officerBadgeNumber?: string;
}

/** Animated horizontal bar that fills from 0 to its target percentage on mount. */
const AnimatedMetricBar: React.FC<{
  value: string;
  color: string;
  trackColor: string;
  delay: number;
}> = ({ value, color, trackColor, delay }) => {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const target = parseFloat(value) || 0;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: target,
      duration: 900,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width animations can't use the native driver
    }).start();
  }, [target, delay, widthAnim]);

  return (
    <View style={[s.metricBarBg, { backgroundColor: trackColor }]}>
      <Animated.View
        style={[
          s.metricBarFill,
          {
            backgroundColor: color,
            width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
};

/** Small wrapper that fades + slides its children up on mount, staggered by `delay`. */
const FadeInUp: React.FC<{ delay?: number; style?: any; children: React.ReactNode }> = ({
  delay = 0,
  style,
  children,
}) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

/** Button that scales down slightly on press for tactile feedback. */
const PressableScale: React.FC<{
  onPress: () => void;
  disabled?: boolean;
  style?: any;
  children: React.ReactNode;
}> = ({ onPress, disabled, style, children }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        activeOpacity={0.9}
        style={s.fill}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

export const CaptureScreen: React.FC<CaptureScreenProps> = ({
  selectedReagent,
  onRetake,
  onConfirmAnalyze,
  onShowToast,
  isDark = false,
  onBack,
  officerName = 'Officer Sharma',
  officerBadgeNumber = 'NCB-DEL-9842',
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const backAction = () => {
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
  }, [onBack]);

  const primary = isDark ? '#4edea3' : '#00288e';
  const secondary = isDark ? '#93ccff' : '#0054a0';
  const tertiary = isDark ? '#56d474' : '#003e17';
  const surface = isDark ? '#0d2137' : '#ffffff';
  const surfaceContainerLow = isDark ? '#0a1c2e' : '#f0f4f0';
  const surfaceContainerHigh = isDark ? '#1c3d5e' : '#e1e5e1';
  const onSurface = isDark ? '#e6f0ff' : '#181c1b';
  const onSurfaceVariant = isDark ? '#94a9c9' : '#444653';
  const bg = isDark ? '#051424' : '#f7faf7';
  const liveLocation = 'DEL 28.6139°N 77.2090°E';
  const imageName = `${selectedReagent.id}_${Date.now().toString(36).toUpperCase()}.jpg`;

  // Pulsing "LOCKED" status dot — draws the eye without being distracting.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Continuous spin for the "analyzing" sync icon.
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isAnalyzing) {
      spin.setValue(0);
      const loop = Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
      );
      loop.start();
      return () => loop.stop();
    }
  }, [isAnalyzing, spin]);
  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    onShowToast('Processing...', 'Running spectral analysis algorithm.');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1400));
      await onConfirmAnalyze({
        liveLocation,
        imageName,
        lat: 28.6139,
        lng: 77.209,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const metadata = [
    { label: 'REAGENT', value: selectedReagent.name, icon: 'science' as const, color: primary },
    { label: 'TIMESTAMP', value: new Date().toLocaleTimeString(), icon: 'schedule' as const, color: secondary },
    { label: 'GPS LOCK', value: liveLocation, icon: 'location-on' as const, color: tertiary },
    { label: 'OFFICER', value: `${officerBadgeNumber} ${officerName}`, icon: 'badge' as const, color: primary },
    { label: 'IMAGE NAME', value: imageName, icon: 'image' as const, color: secondary },
    { label: 'EVIDENCE HASH', value: 'SHA-256:a1f3…9d2c', icon: 'fingerprint' as const, color: tertiary },
  ];

  const metrics = [
    { label: 'Spectral Match', value: selectedReagent.matchScore || '91.2%', color: primary },
    { label: 'Purity Index', value: '88.7%', color: secondary },
    { label: 'Confidence', value: '94.1%', color: tertiary },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 100 }}>
      {/* Header */}
      <FadeInUp delay={0} style={{ marginBottom: 16 }}>
        <Text style={[s.headerEyebrow, { color: primary }]}>SAMPLE REVIEW</Text>
        <Text style={[s.headerTitle, { color: onSurface }]}>Confirm Capture &amp; Analyze</Text>
        <Text style={[s.headerSub, { color: onSurfaceVariant }]}>
          Review the frame and chain-of-custody details before running the spectral analysis.
        </Text>
      </FadeInUp>

      {/* Captured Image */}
      <FadeInUp delay={80} style={[s.capturedFrame, { borderColor: primary, backgroundColor: isDark ? '#0a0f18' : '#111', shadowColor: primary }]}>
        <View style={s.frameTopRow}>
          <Text style={[s.frameLabel, { color: primary }]}>CAPTURED FRAME</Text>
          <View style={[s.statusPill, { backgroundColor: 'rgba(78,222,163,0.15)', borderColor: primary }]}>
            <Animated.View style={[s.statusDot, { backgroundColor: primary, opacity: pulse }]} />
            <Text style={[s.statusPillText, { color: primary }]}>LOCKED</Text>
          </View>
        </View>

        {/* Simulated camera capture display */}
        <View style={s.captureDisplay}>
          <MaterialIcons name="center-focus-strong" size={64} color={primary + '60'} />
          <Text style={[s.captureDisplayLabel, { color: primary }]}>{selectedReagent.name} Sample</Text>
          <Text style={[s.captureDisplaySub, { color: primary + 'aa' }]}>Frame captured • Ready for analysis</Text>
        </View>

        {/* Subtle gradient scrim grounds the swatch row against the dark frame */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)']}
          style={s.scrim}
          pointerEvents="none"
        />

        {/* Color reaction swatches */}
        <View style={s.swatches}>
          {['#fff', '#888', '#06b6d4', '#d946ef', '#eab308', '#000'].map((c, i) => (
            <View key={i} style={[s.swatch, { backgroundColor: c }]} />
          ))}
        </View>
      </FadeInUp>

      {/* Spectral Analysis Preview */}
      <FadeInUp delay={160} style={[s.card, { backgroundColor: surface, borderColor: surfaceContainerHigh }]}>
        <View style={s.sectionHeaderRow}>
          <MaterialIcons name="insights" size={14} color={onSurfaceVariant} />
          <Text style={[s.sectionTitle, { color: onSurfaceVariant }]}>PRELIMINARY SPECTRAL READ</Text>
        </View>
        <View style={{ gap: 12 }}>
          {metrics.map((metric, i) => (
            <View key={metric.label} style={s.metricRow}>
              <Text style={[s.metricLabel, { color: onSurfaceVariant }]}>{metric.label}</Text>
              <AnimatedMetricBar
                value={metric.value}
                color={metric.color}
                trackColor={surfaceContainerHigh}
                delay={200 + i * 120}
              />
              <Text style={[s.metricValue, { color: metric.color }]}>{metric.value}</Text>
            </View>
          ))}
        </View>
      </FadeInUp>

      {/* Evidence Metadata */}
      <FadeInUp delay={240} style={[s.card, { backgroundColor: surface, borderColor: surfaceContainerHigh }]}>
        <View style={s.sectionHeaderRow}>
          <MaterialIcons name="fact-check" size={14} color={onSurfaceVariant} />
          <Text style={[s.sectionTitle, { color: onSurfaceVariant }]}>EVIDENCE CHAIN OF CUSTODY</Text>
        </View>
        <View style={{ gap: 4 }}>
          {metadata.map((item, i) => (
            <View
              key={item.label}
              style={[
                s.metadataRow,
                { borderBottomColor: surfaceContainerLow, borderBottomWidth: i === metadata.length - 1 ? 0 : 1 },
              ]}
            >
              <View style={[s.metadataIconWrap, { backgroundColor: item.color + '1a' }]}>
                <MaterialIcons name={item.icon} size={14} color={item.color} />
              </View>
              <Text style={[s.metadataLabel, { color: onSurfaceVariant }]}>{item.label}</Text>
              <Text style={[s.metadataValue, { color: onSurface }]} numberOfLines={1}>{item.value}</Text>
            </View>
          ))}
        </View>
      </FadeInUp>

      {/* Action Buttons */}
      <FadeInUp delay={320} style={s.actionRow}>
        <PressableScale onPress={onRetake} style={[s.retakeBtn, { backgroundColor: surfaceContainerLow, borderColor: surfaceContainerHigh }]}>
          <MaterialIcons name="flip-camera-android" size={18} color={onSurfaceVariant} />
          <Text style={[s.retakeBtnText, { color: onSurfaceVariant }]}>RETAKE</Text>
        </PressableScale>

        <PressableScale onPress={() => { void handleAnalyze(); }} disabled={isAnalyzing} style={[s.analyzeBtn, { backgroundColor: primary, shadowColor: primary }]}>
          <Animated.View style={{ transform: [{ rotate: isAnalyzing ? spinDeg : '0deg' }] }}>
            <MaterialIcons name={isAnalyzing ? 'sync' : 'analytics'} size={20} color={isDark ? '#003822' : '#fff'} />
          </Animated.View>
          <Text style={[s.analyzeBtnText, { color: isDark ? '#003822' : '#fff' }]}>
            {isAnalyzing ? 'ANALYZING...' : 'CONFIRM & ANALYZE'}
          </Text>
        </PressableScale>
      </FadeInUp>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  fill: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  headerEyebrow: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  headerTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  headerSub: { fontSize: 12.5, lineHeight: 18 },
  capturedFrame: {
    borderRadius: 18,
    borderWidth: 2,
    overflow: 'hidden',
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  frameTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  frameLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  captureDisplay: { alignItems: 'center', justifyContent: 'center', height: 160, gap: 8 },
  captureDisplayLabel: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  captureDisplaySub: { fontSize: 11 },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 24, height: 40 },
  swatches: { flexDirection: 'row', height: 24 },
  swatch: { flex: 1 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  sectionTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricLabel: { width: 100, fontSize: 11 },
  metricBarBg: { flex: 1, height: 7, borderRadius: 4, overflow: 'hidden' },
  metricBarFill: { height: 7, borderRadius: 4 },
  metricValue: { width: 50, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  metadataRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  metadataIconWrap: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  metadataLabel: { width: 96, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  metadataValue: { flex: 1, fontSize: 12, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  retakeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 14, borderWidth: 1 },
  retakeBtnText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  analyzeBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  analyzeBtnText: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
});
