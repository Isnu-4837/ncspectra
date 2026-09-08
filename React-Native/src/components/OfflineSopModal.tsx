import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface OfflineSopModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

const SOP_SECTIONS = [
  {
    title: 'PRE-FIELD CHECKLIST',
    icon: 'checklist' as const,
    items: [
      'Ensure reagent vials are within expiry date',
      'Calibrate spectrophotometer before each shift',
      'Verify GPS fix and zone server connectivity',
      'Update local SQLite vault backup',
    ],
  },
  {
    title: 'SAMPLE COLLECTION PROTOCOL',
    icon: 'science' as const,
    items: [
      'Wear appropriate PPE (gloves, goggles, mask)',
      'Use dedicated spatula per sample — no cross-contamination',
      'Place 2–5mg sample in clean white ceramic well',
      'Add 3 drops of selected reagent; observe within 60s',
    ],
  },
  {
    title: 'SPECTRAL SCAN PROCEDURE',
    icon: 'analytics' as const,
    items: [
      'Launch scan within 60 seconds of reagent contact',
      'Hold device 10–15cm from sample surface',
      'Maintain 3+ seconds stable frame before capture',
      'Ensure adequate ambient or torch illumination',
    ],
  },
  {
    title: 'EVIDENCE DOCUMENTATION',
    icon: 'assignment' as const,
    items: [
      'Auto-GPS coordinates captured at scan start',
      'All results signed with officer digital key',
      'Export PDF dossier and retain for court records',
      'Sync to vault within 24h of field collection',
    ],
  },
  {
    title: 'EMERGENCY PROCEDURES',
    icon: 'emergency' as const,
    items: [
      'Accidental exposure: wash with water 15+ min, call 112',
      'If app error: hard reset then re-calibrate',
      'Data discrepancy: flag for lab confirmation',
      'Chain breach alert: contact zone commander',
    ],
  },
];

export const OfflineSopModal: React.FC<OfflineSopModalProps> = ({ isOpen, onClose, isDark = false }) => {
  const [openSection, setOpenSection] = useState<number | null>(0);

  const primary = isDark ? '#4edea3' : '#00288e';
  const secondary = isDark ? '#93ccff' : '#0054a0';
  const surface = isDark ? '#0d2137' : '#ffffff';
  const surfaceContainerLow = isDark ? '#0a1c2e' : '#f0f4f0';
  const surfaceContainerHigh = isDark ? '#1c3d5e' : '#e1e5e1';
  const onSurface = isDark ? '#e6f0ff' : '#181c1b';
  const onSurfaceVariant = isDark ? '#94a9c9' : '#444653';
  const bg = isDark ? '#051424' : '#f7faf7';

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={[s.sheet, { backgroundColor: bg }]}>
          <View style={[s.handle, { backgroundColor: onSurfaceVariant + '44' }]} />
          <View style={s.header}>
            <View style={s.headerLeft}>
              <MaterialIcons name="menu-book" size={24} color={secondary} />
              <View>
                <Text style={[s.headerTitle, { color: onSurface }]}>Offline SOP Guide</Text>
                <Text style={[s.headerSub, { color: onSurfaceVariant }]}>NCB Protocol Manual</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: surfaceContainerLow }]}>
              <MaterialIcons name="close" size={20} color={onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 40 }}>
            {/* SOP Info Banner */}
            {/* <View style={[s.infoBanner, { backgroundColor: primary + '15', borderColor: primary }]}>
              <MaterialIcons name="offline-bolt" size={16} color={primary} />
              <Text style={[s.infoBannerText, { color: primary }]}>
                Available offline • Directive NCB-SOP-2024-R4.2 • Last updated: 01 Aug 2026
              </Text>
            </View> */}

            {SOP_SECTIONS.map((section, i) => (
              <View key={i} style={[s.accordion, { backgroundColor: surface }]}>
                <TouchableOpacity
                  onPress={() => setOpenSection(openSection === i ? null : i)}
                  style={s.accordionHeader}
                  activeOpacity={0.8}
                >
                  <View style={[s.accordionIcon, { backgroundColor: primary + '22' }]}>
                    <MaterialIcons name={section.icon} size={18} color={primary} />
                  </View>
                  <Text style={[s.accordionTitle, { color: onSurface }]}>{section.title}</Text>
                  <MaterialIcons
                    name={openSection === i ? 'expand-less' : 'expand-more'}
                    size={20}
                    color={onSurfaceVariant}
                  />
                </TouchableOpacity>
                {openSection === i && (
                  <View style={[s.accordionBody, { borderTopColor: surfaceContainerHigh }]}>
                    {section.items.map((item, j) => (
                      <View key={j} style={s.sopItem}>
                        <View style={[s.sopBullet, { backgroundColor: primary }]} />
                        <Text style={[s.sopItemText, { color: onSurfaceVariant }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity onPress={onClose} style={[s.closeAllBtn, { backgroundColor: surfaceContainerLow }]} activeOpacity={0.8}>
              <Text style={[s.closeAllText, { color: onSurfaceVariant }]}>Close SOP Guide</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  infoBannerText: { flex: 1, fontSize: 11, fontWeight: '600', lineHeight: 16 },
  accordion: { borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  accordionIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  accordionTitle: { flex: 1, fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  accordionBody: { padding: 14, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  sopItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  sopBullet: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  sopItemText: { flex: 1, fontSize: 13, lineHeight: 20 },
  closeAllBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  closeAllText: { fontSize: 14, fontWeight: '600' },
});
