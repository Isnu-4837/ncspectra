import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, BackHandler } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { INITIAL_SEIZURE_RECORDS } from '../data/mockData';
import { ScreenType } from '../types';

interface SyncScreenProps {
  offlineQueueCount: number;
  setOfflineQueueCount: React.Dispatch<React.SetStateAction<number>>;
  onNavigate: (screen: ScreenType) => void;
  onShowToast: (title: string, desc: string, icon?: string, color?: string) => void;
  isDark?: boolean;
  onBack?: () => void;
}

export const SyncScreen: React.FC<SyncScreenProps> = ({
  offlineQueueCount, setOfflineQueueCount, onNavigate, onShowToast, isDark = false, onBack
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

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

  const handleSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncDone(true);
      setOfflineQueueCount(0);
      onShowToast('Vault Sync Complete', 'All records encrypted & committed to cloud partition.', 'cloud_done', 'text-primary');
    }, 2500);
  };

  const vaultStats = [
    { label: 'ZONE SERVER', value: 'DEL-NORTH-HQ', icon: 'dns' as const, color: primary, status: 'CONNECTED' },
    { label: 'ENCRYPTION', value: 'AES-256-CBC', icon: 'lock' as const, color: secondary, status: 'ACTIVE' },
    { label: 'PENDING', value: String(offlineQueueCount), icon: 'cloud-upload' as const, color: tertiary, status: offlineQueueCount > 0 ? 'QUEUED' : 'CLEAR' },
    { label: 'LAST SYNC', value: '14 min ago', icon: 'schedule' as const, color: onSurfaceVariant, status: 'OK' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }} contentContainerStyle={{ paddingVertical: 16, paddingBottom: 100 }}>
      {/* Vault Header */}
      <View style={[s.card, { backgroundColor: surface }]}>
        <View style={s.vaultHeader}>
          <MaterialCommunityIcons name="cloud-sync" size={28} color={syncDone ? primary : isSyncing ? secondary : onSurfaceVariant} />
          <View style={{ flex: 1 }}>
            <Text style={[s.vaultTitle, { color: onSurface }]}>SQLite Cipher Vault</Text>
            <Text style={[s.vaultSub, { color: onSurfaceVariant }]}>ZONE SERVER • DEL-NORTH-HQ</Text>
          </View>
          <View style={[s.vaultStatusPill, { backgroundColor: (syncDone || offlineQueueCount === 0) ? primary + '22' : tertiary + '22', borderColor: (syncDone || offlineQueueCount === 0) ? primary : tertiary }]}>
            <Text style={[s.vaultStatusText, { color: (syncDone || offlineQueueCount === 0) ? primary : tertiary }]}>
              {isSyncing ? 'SYNCING' : syncDone || offlineQueueCount === 0 ? 'IN SYNC' : `${offlineQueueCount} PENDING`}
            </Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={s.statsGrid}>
          {vaultStats.map((stat) => (
            <View key={stat.label} style={[s.statCard, { backgroundColor: surfaceContainerLow }]}>
              <MaterialIcons name={stat.icon} size={18} color={stat.color} />
              <Text style={[s.statLabel, { color: onSurfaceVariant }]}>{stat.label}</Text>
              <Text style={[s.statValue, { color: stat.color }]}>{stat.value}</Text>
              <View style={[s.statStatus, { backgroundColor: stat.color + '22' }]}>
                <Text style={[s.statStatusText, { color: stat.color }]}>{stat.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Sync Button */}
        <TouchableOpacity
          onPress={handleSync}
          disabled={isSyncing || (offlineQueueCount === 0 && !syncDone)}
          style={[s.syncBtn, {
            backgroundColor: isSyncing ? surfaceContainerHigh : syncDone ? primary + '22' : primary,
            opacity: (offlineQueueCount === 0 && !isSyncing) ? 0.6 : 1,
          }]}
          activeOpacity={0.85}
        >
          {isSyncing
            ? <ActivityIndicator size="small" color={primary} />
            : <MaterialCommunityIcons name="cloud-upload" size={20} color={syncDone ? primary : (isDark ? '#003822' : '#fff')} />}
          <Text style={[s.syncBtnText, { color: isSyncing ? primary : syncDone ? primary : (isDark ? '#003822' : '#fff') }]}>
            {isSyncing ? 'SYNCING TO VAULT...' : syncDone ? 'FULLY SYNCED' : `SYNC ${offlineQueueCount} RECORDS`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Records */}
      <Text style={[s.sectionTitle, { color: onSurfaceVariant }]}>OFFLINE RECORD QUEUE</Text>
      {INITIAL_SEIZURE_RECORDS.slice(0, 4).map((record) => (
        <View key={record.id} style={[s.recordCard, { backgroundColor: surface }]}>
          <View style={[s.recordDot, { backgroundColor: syncDone ? primary : tertiary }]} />
          <View style={{ flex: 1 }}>
            <View style={s.recordHeader}>
              <Text style={[s.recordCase, { color: primary }]}>{record.caseNumber}</Text>
              <Text style={[s.recordDate, { color: onSurfaceVariant }]}>{record.date}</Text>
            </View>
            <Text style={[s.recordCompound, { color: onSurface }]}>{record.compoundName}</Text>
            <Text style={[s.recordMeta, { color: onSurfaceVariant }]}>{record.reagentName} • {record.officer}</Text>
          </View>
          <View style={[s.recordStatusBadge, { backgroundColor: syncDone ? primary + '22' : surfaceContainerHigh }]}>
            <MaterialIcons name={syncDone ? 'cloud-done' : 'pending'} size={14} color={syncDone ? primary : onSurfaceVariant} />
            <Text style={[s.recordStatusText, { color: syncDone ? primary : onSurfaceVariant }]}>
              {syncDone ? 'SYNCED' : 'PENDING'}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  vaultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  vaultTitle: { fontSize: 17, fontWeight: '700' },
  vaultSub: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  vaultStatusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  vaultStatusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  statCard: { width: '47%', borderRadius: 12, padding: 12, gap: 4 },
  statLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 14, fontWeight: '700' },
  statStatus: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  statStatusText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, borderRadius: 12 },
  syncBtnText: { fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  sectionTitle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 },
  recordCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 10, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  recordDot: { width: 10, height: 10, borderRadius: 5 },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  recordCase: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  recordDate: { fontSize: 10 },
  recordCompound: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  recordMeta: { fontSize: 11 },
  recordStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  recordStatusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
});