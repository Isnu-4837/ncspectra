import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ReagentInfo } from '../types';

interface ResultsScreenProps {
  selectedReagent: ReagentInfo;
  onOpenPdfModal: () => void;
  onOpenAuditTrail: () => void;
  onSaveToSqlite: () => void;
  onDone: () => void;
  onShowToast: (title: string, desc: string, icon?: string, color?: string) => void;
  isDark?: boolean;
  onBack?: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  selectedReagent, onOpenPdfModal, onOpenAuditTrail, onSaveToSqlite, onDone, onShowToast, isDark = false, onBack
}) => {
  const [saved, setSaved] = useState(false);

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
  const positiveColor = isDark ? '#ff6b6b' : '#c62828';
  const positiveContainerBg = isDark ? '#3d0000' : '#ffebee';

  const handleSave = () => {
    setSaved(true);
    onSaveToSqlite();
    onShowToast('Saved to Vault', 'Evidence record encrypted and stored in local SQLite.', 'save', 'text-primary');
  };

  const confidence = 97.3;
  const caseId = `NCB-DEL-${Date.now().toString(36).toUpperCase().slice(-4)}`;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingVertical: 16, paddingBottom: 100 }}>
      {/* Header Status */}
      <View style={s.headerRow}>
        <View style={[s.statusPill, { backgroundColor: '#4edea322', borderColor: primary }]}>
          <View style={[s.statusDot, { backgroundColor: primary }]} />
          <Text style={[s.statusPillText, { color: primary }]}>ANALYSIS COMPLETE</Text>
        </View>
        <Text style={[s.caseId, { color: onSurfaceVariant }]}>Case: {caseId}</Text>
      </View>

      {/* Positive Result Banner */}
      <View style={[s.resultBanner, { backgroundColor: positiveContainerBg, borderColor: positiveColor }]}>
        <MaterialIcons name="warning" size={24} color={positiveColor} />
        <Text style={[s.resultBannerTitle, { color: positiveColor }]}>Preliminary Match: Positive</Text>
      </View>

      {/* Main Result Card */}
      <View style={[s.card, { backgroundColor: surface }]}>
        <Text style={[s.resultHash, { color: onSurfaceVariant }]}>
          SHA:{Date.now().toString(16).toUpperCase()}
        </Text>
        <Text style={[s.compoundName, { color: onSurface }]}>{selectedReagent.name} — Confirmed</Text>
        <Text style={[s.compoundSub, { color: primary }]}>Opioid Class — Schedule I Controlled Substance</Text>
        <Text style={[s.fieldMeta, { color: onSurfaceVariant }]}>
          <MaterialIcons name="location-on" size={12} color={onSurfaceVariant} /> DEL-NORTH-HQ •{' '}
          <MaterialIcons name="schedule" size={12} color={onSurfaceVariant} /> {new Date().toLocaleTimeString()}
        </Text>

        {/* Confidence Bar */}
        <View style={{ marginTop: 16 }}>
          <View style={s.confidenceRow}>
            <Text style={[s.confidenceLabel, { color: onSurfaceVariant }]}>Confidence</Text>
            <Text style={[s.confidenceValue, { color: primary }]}>{confidence}%</Text>
          </View>
          <View style={[s.progressBg, { backgroundColor: surfaceContainerHigh }]}>
            <View style={[s.progressFill, { width: `${confidence}%`, backgroundColor: primary }]} />
          </View>
        </View>
      </View>

      {/* Spectral Comparison */}
      <View style={[s.card, { backgroundColor: surface }]}>
        <Text style={[s.sectionTitle, { color: onSurfaceVariant }]}>SPECTRAL METRICS</Text>
        <View style={{ gap: 12 }}>
          {[
            { label: 'Spectral Match Score', value: selectedReagent.matchScore || '91.2%', icon: 'analytics' as const, color: primary },
            { label: 'Purity Index', value: '88.7%', icon: 'verified' as const, color: secondary },
            { label: 'Standard Deviation', value: '±0.03 ΔE', icon: 'show-chart' as const, color: tertiary },
            { label: 'Reaction Threshold', value: 'EXCEEDED (+12%)', icon: 'trending-up' as const, color: positiveColor },
          ].map((m) => (
            <View key={m.label} style={s.metricRow}>
              <MaterialIcons name={m.icon} size={16} color={m.color} />
              <Text style={[s.metricLabel, { color: onSurfaceVariant }]}>{m.label}</Text>
              <Text style={[s.metricValue, { color: m.color }]}>{m.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Reagent Details */}
      <View style={[s.card, { backgroundColor: surface }]}>
        <Text style={[s.sectionTitle, { color: onSurfaceVariant }]}>REAGENT PROFILE</Text>
        <View style={s.reagentDetailRow}>
          <View style={[s.colorSwatch, { backgroundColor: selectedReagent.colorPositive || primary }]} />
          <View>
            <Text style={[s.reagentDetailName, { color: onSurface }]}>{selectedReagent.name}</Text>
            <Text style={[s.reagentDetailSub, { color: onSurfaceVariant }]}>Positive reaction: {selectedReagent.positiveReaction}</Text>
          </View>
        </View>
        <View style={s.substancesList}>
          {selectedReagent.substances.map((sub) => (
            <View key={sub} style={[s.substancePill, { backgroundColor: surfaceContainerLow, borderColor: surfaceContainerHigh }]}>
              <Text style={[s.substancePillText, { color: onSurfaceVariant }]}>{sub}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={s.actionsGrid}>
        <TouchableOpacity onPress={onOpenPdfModal} style={[s.actionBtn, { backgroundColor: surfaceContainerLow }]} activeOpacity={0.8}>
          <MaterialIcons name="picture-as-pdf" size={20} color={positiveColor} />
          <Text style={[s.actionBtnText, { color: onSurface }]}>Export PDF</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenAuditTrail} style={[s.actionBtn, { backgroundColor: surfaceContainerLow }]} activeOpacity={0.8}>
          <MaterialIcons name="history" size={20} color={secondary} />
          <Text style={[s.actionBtnText, { color: onSurface }]}>Audit Trail</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} disabled={saved} style={[s.actionBtn, { backgroundColor: saved ? primary + '22' : surfaceContainerLow }]} activeOpacity={0.8}>
          <MaterialIcons name={saved ? 'check-circle' : 'save'} size={20} color={saved ? primary : tertiary} />
          <Text style={[s.actionBtnText, { color: onSurface }]}>{saved ? 'Saved' : 'Save Vault'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDone} style={[s.doneBtn, { backgroundColor: primary }]} activeOpacity={0.9}>
          <MaterialIcons name="check" size={20} color={isDark ? '#003822' : '#fff'} />
          <Text style={[s.doneBtnText, { color: isDark ? '#003822' : '#fff' }]}>DONE</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  caseId: { fontSize: 10, fontWeight: '600', fontFamily: 'monospace' },
  resultBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 14 },
  resultBannerTitle: { fontSize: 15, fontWeight: '700' },
  card: { borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  resultHash: { fontSize: 10, fontFamily: 'monospace', marginBottom: 6 },
  compoundName: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  compoundSub: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  fieldMeta: { fontSize: 11 },
  confidenceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  confidenceLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  confidenceValue: { fontSize: 18, fontWeight: '800' },
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  metricRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricLabel: { flex: 1, fontSize: 12 },
  metricValue: { fontSize: 13, fontWeight: '700' },
  reagentDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  colorSwatch: { width: 14, height: 14, borderRadius: 7 },
  reagentDetailName: { fontSize: 15, fontWeight: '700' },
  reagentDetailSub: { fontSize: 11 },
  substancesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  substancePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  substancePillText: { fontSize: 11 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { width: '47%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 12 },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  doneBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14 },
  doneBtnText: { fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2 },
});