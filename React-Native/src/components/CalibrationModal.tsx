import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, desc: string, icon?: string, color?: string) => void;
  isDark?: boolean;
}

export const CalibrationModal: React.FC<CalibrationModalProps> = ({
  isOpen, onClose, onShowToast, isDark = false,
}) => {
  const [calibrating, setCalibrating] = useState(false);
  const [done, setDone] = useState(false);

  const primary = isDark ? '#4edea3' : '#00288e';
  const secondary = isDark ? '#93ccff' : '#0054a0';
  const surface = isDark ? '#0d2137' : '#ffffff';
  const surfaceContainerLow = isDark ? '#0a1c2e' : '#f0f4f0';
  const onSurface = isDark ? '#e6f0ff' : '#181c1b';
  const onSurfaceVariant = isDark ? '#94a9c9' : '#444653';
  const bg = isDark ? '#051424' : '#f7faf7';

  const handleCalibrate = () => {
    setCalibrating(true);
    setTimeout(() => {
      setCalibrating(false);
      setDone(true);
      onShowToast('Calibration Complete', 'Spectrophotometer baseline verified. Accuracy: 99.4%', 'tune', 'text-primary');
    }, 2200);
  };

  const calSteps = [
    { icon: 'light-mode' as const, label: 'White Reference', status: done ? 'PASS' : 'READY' },
    { icon: 'brightness-1' as const, label: 'Dark Reference', status: done ? 'PASS' : 'READY' },
    { icon: 'center-focus-strong' as const, label: 'Focal Alignment', status: done ? 'PASS' : 'READY' },
    { icon: 'analytics' as const, label: 'Spectral Baseline', status: done ? 'PASS' : 'READY' },
  ];

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.sheet, { backgroundColor: bg }]}>
          <View style={[s.handle, { backgroundColor: onSurfaceVariant + '44' }]} />
          <View style={s.header}>
            <View style={s.headerLeft}>
              <MaterialIcons name="tune" size={24} color={primary} />
              <View>
                <Text style={[s.headerTitle, { color: onSurface }]}>Device Calibration</Text>
                <Text style={[s.headerSub, { color: onSurfaceVariant }]}>Spectrophotometer baseline</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: surfaceContainerLow }]}>
              <MaterialIcons name="close" size={20} color={onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
            {/* Current Status */}
            <View style={[s.statusCard, { backgroundColor: surface, borderColor: done ? primary : secondary }]}>
              <MaterialIcons name={done ? 'check-circle' : 'tune'} size={28} color={done ? primary : secondary} />
              <View style={{ flex: 1 }}>
                <Text style={[s.statusTitle, { color: onSurface }]}>
                  {calibrating ? 'Calibrating...' : done ? 'Calibration Complete' : 'Ready to Calibrate'}
                </Text>
                <Text style={[s.statusDesc, { color: onSurfaceVariant }]}>
                  {done ? 'Accuracy: 99.4% • All refs PASS' : 'Place device on white reference surface'}
                </Text>
              </View>
              {calibrating && <ActivityIndicator size="small" color={primary} />}
            </View>

            {/* Steps */}
            <Text style={[s.sectionLabel, { color: onSurfaceVariant }]}>CALIBRATION STEPS</Text>
            {calSteps.map((step) => (
              <View key={step.label} style={[s.stepCard, { backgroundColor: surface }]}>
                <MaterialIcons name={step.icon} size={20} color={done ? primary : secondary} />
                <Text style={[s.stepLabel, { color: onSurface }]}>{step.label}</Text>
                <View style={[s.stepBadge, { backgroundColor: done ? primary + '22' : surfaceContainerLow }]}>
                  <Text style={[s.stepStatus, { color: done ? primary : onSurfaceVariant }]}>{step.status}</Text>
                </View>
              </View>
            ))}

            {/* Action */}
            <TouchableOpacity
              onPress={done ? onClose : handleCalibrate}
              disabled={calibrating}
              style={[s.calBtn, { backgroundColor: done ? primary + '22' : primary }]}
              activeOpacity={0.85}
            >
              {calibrating
                ? <ActivityIndicator size="small" color={isDark ? '#003822' : '#fff'} />
                : <MaterialIcons name={done ? 'check' : 'tune'} size={20} color={done ? primary : (isDark ? '#003822' : '#fff')} />}
              <Text style={[s.calBtnText, { color: done ? primary : (isDark ? '#003822' : '#fff') }]}>
                {calibrating ? 'CALIBRATING...' : done ? 'DONE — CLOSE' : 'START CALIBRATION'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1.5 },
  statusTitle: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  statusDesc: { fontSize: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 4 },
  stepCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  stepLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  stepBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  stepStatus: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  calBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 15, borderRadius: 14, marginBottom: 24 },
  calBtnText: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
});
