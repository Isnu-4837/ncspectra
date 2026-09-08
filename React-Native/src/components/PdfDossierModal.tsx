import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { ReagentInfo } from '../types';

interface PdfDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedReagent: ReagentInfo;
  isDark?: boolean;
}

export const PdfDossierModal: React.FC<PdfDossierModalProps> = ({
  isOpen, onClose, selectedReagent, isDark = false,
}) => {
  const primary = isDark ? '#4edea3' : '#00288e';
  const secondary = isDark ? '#93ccff' : '#0054a0';
  const surface = isDark ? '#0d2137' : '#ffffff';
  const surfaceContainerLow = isDark ? '#0a1c2e' : '#f0f4f0';
  const onSurface = isDark ? '#e6f0ff' : '#181c1b';
  const onSurfaceVariant = isDark ? '#94a9c9' : '#444653';
  const bg = isDark ? '#051424' : '#f7faf7';

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.sheet, { backgroundColor: bg }]}>
          {/* Handle */}
          <View style={[s.handle, { backgroundColor: onSurfaceVariant + '44' }]} />

          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <MaterialIcons name="picture-as-pdf" size={24} color={isDark ? '#ff6b6b' : '#c62828'} />
              <View>
                <Text style={[s.headerTitle, { color: onSurface }]}>PDF Dossier Export</Text>
                <Text style={[s.headerSub, { color: onSurfaceVariant }]}>NCB Evidence Report</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: surfaceContainerLow }]}>
              <MaterialIcons name="close" size={20} color={onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
            {/* Export Preview Card */}
            <View style={[s.previewCard, { backgroundColor: surface, borderColor: primary }]}>
              <Text style={[s.previewTitle, { color: primary }]}>FORENSIC EVIDENCE DOSSIER</Text>
              <Text style={[s.previewOrg, { color: onSurfaceVariant }]}>Narcotics Control Bureau • Ministry of Home Affairs</Text>
              <View style={s.previewDivider} />
              <Text style={[s.previewCompound, { color: onSurface }]}>{selectedReagent.name} Analysis Report</Text>
              <Text style={[s.previewDate, { color: onSurfaceVariant }]}>
                {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
              <View style={[s.previewResultBadge, { backgroundColor: isDark ? '#3d0000' : '#ffebee', borderColor: isDark ? '#ff6b6b' : '#c62828' }]}>
                <Text style={[s.previewResultText, { color: isDark ? '#ff6b6b' : '#c62828' }]}>PRELIMINARY POSITIVE — CONTROLLED SUBSTANCE</Text>
              </View>
            </View>

            {/* Report Sections */}
            <Text style={[s.sectionTitle, { color: onSurfaceVariant }]}>REPORT INCLUDES</Text>
            {[
              { icon: 'analytics' as const, label: 'Spectral Analysis Data', desc: 'Full wavelength scan with reference library match' },
              { icon: 'photo-camera' as const, label: 'Captured Evidence Images', desc: 'Timestamped field photographs with GPS metadata' },
              { icon: 'fingerprint' as const, label: 'Officer Digital Signature', desc: 'AES-256 cryptographic chain of custody' },
              { icon: 'location-on' as const, label: 'GPS Coordinates', desc: 'Field seizure location with accuracy radius' },
              { icon: 'history' as const, label: 'Audit Trail', desc: 'Complete action log with timestamps' },
            ].map((item) => (
              <View key={item.label} style={[s.sectionItem, { backgroundColor: surface }]}>
                <MaterialIcons name={item.icon} size={20} color={primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[s.sectionItemLabel, { color: onSurface }]}>{item.label}</Text>
                  <Text style={[s.sectionItemDesc, { color: onSurfaceVariant }]}>{item.desc}</Text>
                </View>
                <MaterialIcons name="check-circle" size={16} color={primary} />
              </View>
            ))}

            {/* Export Actions */}
            <TouchableOpacity
              style={[s.exportBtn, { backgroundColor: isDark ? '#ff6b6b22' : '#ffebee', borderColor: isDark ? '#ff6b6b' : '#c62828' }]}
              activeOpacity={0.85}
              onPress={onClose}
            >
              <MaterialIcons name="picture-as-pdf" size={20} color={isDark ? '#ff6b6b' : '#c62828'} />
              <Text style={[s.exportBtnText, { color: isDark ? '#ff6b6b' : '#c62828' }]}>GENERATE & EXPORT PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.shareBtn, { backgroundColor: surfaceContainerLow }]}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <MaterialIcons name="share" size={20} color={secondary} />
              <Text style={[s.shareBtnText, { color: secondary }]}>SHARE ENCRYPTED REPORT</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%', flex: 1 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  previewCard: { borderRadius: 14, padding: 16, borderWidth: 1, alignItems: 'center', gap: 6 },
  previewTitle: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
  previewOrg: { fontSize: 10, textAlign: 'center' },
  previewDivider: { height: 1, width: '100%', backgroundColor: 'rgba(128,128,128,0.2)', marginVertical: 4 },
  previewCompound: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  previewDate: { fontSize: 11, textAlign: 'center' },
  previewResultBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4 },
  previewResultText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  sectionTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  sectionItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  sectionItemLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  sectionItemDesc: { fontSize: 11 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 15, borderRadius: 14, borderWidth: 1.5 },
  exportBtnText: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 14, marginBottom: 20 },
  shareBtnText: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
