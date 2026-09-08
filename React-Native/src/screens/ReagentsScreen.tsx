import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { REAGENTS_DATA } from '../data/mockData';
import type { DrugCategory, ReagentInfo } from '../types';

interface ReagentsScreenProps {
  onSelectReagent: (reagent: ReagentInfo) => void;
  onShowToast: (title: string, desc: string, icon?: string, color?: string) => void;
  isDark?: boolean;
  onBack: () => void; // Added onBack prop to trigger navigation
}

export const ReagentsScreen: React.FC<ReagentsScreenProps> = ({ onSelectReagent, onShowToast, isDark = false, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<DrugCategory>('all');
  const [calibratingId, setCalibratingId] = useState<string | null>(null);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (onBack) {
        onBack(); // Navigate back to the previous screen
        return true; // Return true to prevent default behavior (exiting the app)
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove(); // Cleanup listener on unmount
  }, [onBack]);

  const primary = isDark ? '#4edea3' : '#00288e';
  const secondary = isDark ? '#93ccff' : '#0054a0';
  const tertiary = isDark ? '#56d474' : '#003e17';
  const bg = isDark ? '#051424' : '#f7faf7';
  const surface = isDark ? '#0d2137' : '#ffffff';
  const surfaceContainerLow = isDark ? '#0a1c2e' : '#f0f4f0';
  const surfaceContainerHigh = isDark ? '#1c3d5e' : '#e1e5e1';
  const onSurface = isDark ? '#e6f0ff' : '#181c1b';
  const onSurfaceVariant = isDark ? '#94a9c9' : '#444653';
  const outline = isDark ? '#2d4f70' : '#cdd1cd';

  const categories: { id: DrugCategory; label: string }[] = [
    { id: 'all', label: 'All Kits' },
    { id: 'opiates', label: 'Opiates' },
    { id: 'stimulants', label: 'Stimulants' },
    { id: 'cannabinoids', label: 'Cannabinoids' },
    { id: 'synthetics', label: 'Synthetics' },
  ];

  const filteredReagents = useMemo(() => {
    return REAGENTS_DATA.filter((reagent) => {
      const matchesFilter = activeFilter === 'all' || reagent.category === activeFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        reagent.name.toLowerCase().includes(query) ||
        reagent.description.toLowerCase().includes(query) ||
        reagent.categoryLabel.toLowerCase().includes(query) ||
        reagent.substances.some((s: string) => s.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [searchQuery, activeFilter]);

  const handleLaunch = (reagent: ReagentInfo) => {
    setCalibratingId(reagent.id);
    onShowToast('Optics Ready', `Calibrated spectrophotometer profile for ${reagent.name}`, 'tune', 'text-primary');
    setTimeout(() => { setCalibratingId(null); onSelectReagent(reagent); }, 900);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingVertical: 16, paddingBottom: 100 }}>
      {/* Search Bar */}
      <View style={[s.searchRow, { backgroundColor: surface, borderColor: outline }]}>
        <MaterialIcons name="search" size={20} color={onSurfaceVariant} style={{ marginLeft: 12 }} />
        <TextInput
          style={[s.searchInput, { color: onSurface }]}
          placeholder="Search reagent, compound, substance..."
          placeholderTextColor={onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={{ paddingHorizontal: 12 }}>
            <MaterialIcons name="close" size={18} color={onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => setActiveFilter(cat.id)}
            style={[s.filterChip, {
              backgroundColor: activeFilter === cat.id ? primary : surfaceContainerLow,
              borderColor: activeFilter === cat.id ? primary : outline,
            }]}
            activeOpacity={0.8}
          >
            <Text style={[s.filterChipText, { color: activeFilter === cat.id ? (isDark ? '#003822' : '#fff') : onSurfaceVariant }]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Reagent Cards */}
      {filteredReagents.map((reagent) => (
        <View key={reagent.id} style={[s.card, { backgroundColor: surface }]}>
          {/* Card Header */}
          <View style={s.cardHeader}>
            <View style={[s.colorDot, { backgroundColor: reagent.colorHex || primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={[s.reagentName, { color: onSurface }]}>{reagent.name}</Text>
              <Text style={[s.reagentCategory, { color: secondary }]}>{reagent.categoryLabel}</Text>
            </View>
            <View style={[s.accuracyBadge, { backgroundColor: primary + '22' }]}>
              <Text style={[s.accuracyText, { color: primary }]}>{reagent.confidenceScore}% acc</Text>
            </View>
          </View>

          {/* Description */}
          <Text style={[s.reagentDesc, { color: onSurfaceVariant }]}>{reagent.description}</Text>

          {/* Substances */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }} contentContainerStyle={{ gap: 6 }}>
            {reagent.substances.slice(0, 5).map((sub: string) => (
              <View key={sub} style={[s.substancePill, { backgroundColor: surfaceContainerLow, borderColor: outline }]}>
                <Text style={[s.substancePillText, { color: onSurfaceVariant }]}>{sub}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Reaction Info */}
          <View style={[s.reactionRow, { backgroundColor: surfaceContainerLow, borderColor: outline }]}>
            <View style={[s.reactionColor, { backgroundColor: reagent.colorHex || primary }]} />
            <Text style={[s.reactionText, { color: onSurfaceVariant }]}>Positive: {reagent.targetReaction}</Text>
          </View>

          {/* Action Buttons */}
          <View style={s.cardActions}>
            <TouchableOpacity
              onPress={() => handleLaunch(reagent)}
              style={[s.launchBtn, { backgroundColor: primary }]}
              disabled={calibratingId === reagent.id}
              activeOpacity={0.85}
            >
              <MaterialIcons
                name={calibratingId === reagent.id ? 'sync' : 'photo-camera'}
                size={18}
                color={isDark ? '#003822' : '#fff'}
              />
              <Text style={[s.launchBtnText, { color: isDark ? '#003822' : '#fff' }]}>
                {calibratingId === reagent.id ? 'CALIBRATING...' : 'LAUNCH SCAN'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {filteredReagents.length === 0 && (
        <View style={s.empty}>
          <MaterialIcons name="search" size={40} color={onSurfaceVariant} />
          <Text style={[s.emptyText, { color: onSurfaceVariant }]}>No reagents match your search</Text>
        </View>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 14 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterChipText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  reagentName: { fontSize: 16, fontWeight: '700' },
  reagentCategory: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  accuracyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  accuracyText: { fontSize: 11, fontWeight: '700' },
  reagentDesc: { fontSize: 12, lineHeight: 18, marginBottom: 4 },
  substancePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  substancePillText: { fontSize: 11, fontWeight: '500' },
  reactionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 8, borderRadius: 8, borderWidth: 1, marginVertical: 8 },
  reactionColor: { width: 12, height: 12, borderRadius: 6 },
  reactionText: { fontSize: 12 },
  cardActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  launchBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 10 },
  launchBtnText: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  empty: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 14 },
});