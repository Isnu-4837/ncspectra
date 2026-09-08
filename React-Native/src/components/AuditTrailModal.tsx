import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

const AUDIT_ENTRIES = [
  { action: 'Login', actor: 'Officer Sharma', time: '22:09:14 IST', type: 'auth', icon: 'login' as const },
  { action: 'Reagent Selected', actor: 'Marquis Reagent', time: '22:10:31 IST', type: 'action', icon: 'science' as const },
  { action: 'Scan Initiated', actor: 'Camera HUD', time: '22:11:04 IST', type: 'action', icon: 'photo-camera' as const },
  { action: 'Sample Captured', actor: 'Frame #A7F3', time: '22:11:22 IST', type: 'data', icon: 'camera' as const },
  { action: 'Analysis Complete', actor: 'Spectral Engine', time: '22:11:38 IST', type: 'result', icon: 'analytics' as const },
  { action: 'Result Saved', actor: 'SQLite Vault', time: '22:12:01 IST', type: 'data', icon: 'save' as const },
  { action: 'PDF Generated', actor: 'Officer Sharma', time: '22:12:44 IST', type: 'export', icon: 'picture-as-pdf' as const },
];

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ isOpen, onClose, isDark = false }) => {
  const primary = isDark ? '#4edea3' : '#00288e';
  const secondary = isDark ? '#93ccff' : '#0054a0';
  const surface = isDark ? '#0d2137' : '#ffffff';
  const surfaceContainerLow = isDark ? '#0a1c2e' : '#f0f4f0';
  const surfaceContainerHigh = isDark ? '#1c3d5e' : '#e1e5e1';
  const onSurface = isDark ? '#e6f0ff' : '#181c1b';
  const onSurfaceVariant = isDark ? '#94a9c9' : '#444653';
  const bg = isDark ? '#051424' : '#f7faf7';

  const typeColor = (type: string) => {
    if (type === 'auth') return isDark ? '#93ccff' : '#0054a0';
    if (type === 'result') return isDark ? '#4edea3' : '#00288e';
    if (type === 'export') return isDark ? '#ff9070' : '#b52800';
    return onSurfaceVariant;
  };

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.sheet, { backgroundColor: bg }]}>
          <View style={[s.handle, { backgroundColor: onSurfaceVariant + '44' }]} />

          <View style={s.header}>
            <View style={s.headerLeft}>
              <MaterialIcons name="history" size={24} color={secondary} />
              <View>
                <Text style={[s.headerTitle, { color: onSurface }]}>Audit Trail</Text>
                <Text style={[s.headerSub, { color: onSurfaceVariant }]}>Full session activity log</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: surfaceContainerLow }]}>
              <MaterialIcons name="close" size={20} color={onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Hash Banner */}
          <View style={[s.hashBanner, { backgroundColor: surfaceContainerLow }]}>
            <MaterialIcons name="lock" size={14} color={primary} />
            <Text style={[s.hashText, { color: primary }]}>Chain Hash: SHA-256:a1f3…9d2c • Tamper-Proof</Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
            {AUDIT_ENTRIES.map((entry, i) => (
              <View key={i} style={[s.entryCard, { backgroundColor: surface }]}>
                <View style={[s.entryIconWrap, { backgroundColor: typeColor(entry.type) + '22' }]}>
                  <MaterialIcons name={entry.icon} size={18} color={typeColor(entry.type)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.entryAction, { color: onSurface }]}>{entry.action}</Text>
                  <Text style={[s.entryActor, { color: onSurfaceVariant }]}>{entry.actor}</Text>
                </View>
                <View>
                  <Text style={[s.entryTime, { color: onSurfaceVariant }]}>{entry.time}</Text>
                  <View style={[s.entryTypeBadge, { backgroundColor: typeColor(entry.type) + '22' }]}>
                    <Text style={[s.entryTypeText, { color: typeColor(entry.type) }]}>{entry.type.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={onClose} style={[s.closeAllBtn, { backgroundColor: surfaceContainerLow }]} activeOpacity={0.8}>
              <Text style={[s.closeAllText, { color: onSurfaceVariant }]}>Close Audit Log</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  hashBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 10, padding: 10, borderRadius: 8 },
  hashText: { fontSize: 11, fontWeight: '600', fontFamily: 'monospace' },
  entryCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  entryIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  entryAction: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  entryActor: { fontSize: 11 },
  entryTime: { fontSize: 10, textAlign: 'right', marginBottom: 3 },
  entryTypeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-end' },
  entryTypeText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  closeAllBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  closeAllText: { fontSize: 14, fontWeight: '600' },
});
