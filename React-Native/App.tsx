/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { View, Appearance } from 'react-native';
import { REAGENTS_DATA, INITIAL_SEIZURE_RECORDS } from './src/data/mockData';
import { ReagentInfo, ScreenType, SeizureRecord } from './types';
import { Header } from './src/components/Header';
import { BottomNav } from './src/components/BottomNav';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { ReagentsScreen } from './src/screens/ReagentsScreen';
import { ScanScreen } from './src/screens/ScanScreen';
import { CaptureScreen } from './src/screens/CaptureScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SyncScreen } from './src/screens/SyncScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { PdfDossierModal } from './src/components/PdfDossierModal';
import { AuditTrailModal } from './src/components/AuditTrailModal';
import { CalibrationModal } from './src/components/CalibrationModal';
import { OfflineSopModal } from './src/components/OfflineSopModal';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [selectedReagent, setSelectedReagent] = useState<ReagentInfo>(REAGENTS_DATA[0]);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(3);
  const [isDark, setIsDark] = useState<boolean>(
    Appearance.getColorScheme() === 'dark'
  );

  // Modals state
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isSopOpen, setIsSopOpen] = useState(false);

  // Tactical Toast notification
  const [toast, setToast] = useState<{
    isOpen: boolean;
    title: string;
    desc: string;
    icon?: string;
    color?: string;
  }>({
    isOpen: false,
    title: '',
    desc: '',
    icon: 'check-circle',
    color: 'text-primary',
  });

  const showToast = (title: string, desc: string, icon = 'check-circle', color = 'text-primary') => {
    setToast({ isOpen: true, title, desc, icon, color });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, isOpen: false }));
    }, 3600);
  };

  // Listen to system color scheme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDark(colorScheme === 'dark');
    });
    return () => subscription.remove();
  }, []);

  const handleSelectRecentRecord = (record: SeizureRecord) => {
    const matchedReagent = REAGENTS_DATA.find((r) => r.name.toLowerCase().includes(record.reagentName.toLowerCase())) || REAGENTS_DATA[0];
    setSelectedReagent(matchedReagent);
    setCurrentScreen('results');
    showToast(`Case ${record.caseNumber}`, `Loaded forensic evidence file for ${record.compoundName}`, 'folder-open', 'text-primary');
  };

  const handleBack = () => {
    if (currentScreen === 'scan') setCurrentScreen('reagents');
    else if (currentScreen === 'capture') setCurrentScreen('scan');
    else if (currentScreen === 'results') setCurrentScreen('dashboard');
    else setCurrentScreen('dashboard');
  };

  const getHeaderTitle = () => {
    switch (currentScreen) {
      case 'scan': return 'LIVE SPECTRAL SCAN';
      case 'capture':
      case 'results': return 'EVIDENCE CUSTODY LOG';
      case 'reagents': return 'NCSPECTRA';
      case 'sync': return 'VAULT SYNC';
      case 'profile': return 'OFFICER PROFILE';
      default: return 'NCSPECTRA';
    }
  };

  const getHeaderSubtitle = () => {
    switch (currentScreen) {
      case 'scan':
      case 'capture':
      case 'results': return 'SECURE HUD SESSION';
      case 'reagents': return 'NCB TACTICAL FIELD v2.4';
      case 'sync': return 'SQLITE CIPHER PARTITION';
      case 'profile': return 'CREDENTIALS & AUDIT';
      default: return 'NCB TACTICAL FIELD v2.4';
    }
  };

  return (
     <SafeAreaProvider>
    <View style={{ flex: 1, backgroundColor: isDark ? '#051424' : '#f7faf7' }}>
      {/* Header (displayed for all screens except login) */}
      {currentScreen !== 'login' && (
        <Header
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          isDark={isDark}
          onToggleTheme={setIsDark}
          onBack={handleBack}
          title={getHeaderTitle()}
          subtitle={getHeaderSubtitle()}
        />
      )}

      {/* Main Content Area */}
      <View style={{ flex: 1, width: '100%', backgroundColor: isDark ? '#051424' : '#f7faf7', paddingHorizontal: currentScreen === 'login' ? 0 : 16 }}>
        {currentScreen === 'login' && (
          <LoginScreen
            onLoginSuccess={() => {
              setCurrentScreen('dashboard');
              showToast('Authentication Verified', 'Welcome Officer Sharma. Zone 01 session initialized.', 'verified', 'text-primary');
            }}
            onOfflineMode={() => {
              setCurrentScreen('dashboard');
              showToast('Offline Vault Active', 'Local SQLite database encrypted and unlocked.', 'cloud-off', 'text-tertiary');
            }}
            isDark={isDark}
            onToggleTheme={setIsDark}
          />
        )}

        {currentScreen === 'dashboard' && (
          <DashboardScreen
            onStartNewTest={() => setCurrentScreen('reagents')}
            onSelectRecord={handleSelectRecentRecord}
            onOpenCalibration={() => setIsCalibrationOpen(true)}
            onOpenSop={() => setIsSopOpen(true)}
            onOpenExport={() => setIsPdfOpen(true)}
            onNavigate={setCurrentScreen}
            offlineQueueCount={offlineQueueCount}
            setOfflineQueueCount={setOfflineQueueCount}
            onShowToast={showToast}
            isDark={isDark}
          />
        )}

        {currentScreen === 'reagents' && (
          <ReagentsScreen
            onSelectReagent={(reagent) => {
              setSelectedReagent(reagent);
              setCurrentScreen('scan');
            }}
            onShowToast={showToast}
            isDark={isDark}
            onBack={handleBack}
          />
        )}

        {currentScreen === 'scan' && (
          <ScanScreen
            selectedReagent={selectedReagent}
            onCapture={() => setCurrentScreen('capture')}
            onAbort={() => setCurrentScreen('reagents')}
            onShowToast={showToast}
            isDark={isDark}
            onBack={handleBack}
          />
        )}

        {currentScreen === 'capture' && (
          <CaptureScreen
            selectedReagent={selectedReagent}
            onRetake={() => setCurrentScreen('scan')}
            onConfirmAnalyze={() => {
              setCurrentScreen('results');
              showToast('Spectral Assay Complete', 'Preliminary positive convergence confirmed with Marquis Standard.', 'check-circle', 'text-primary');
            }}
            onShowToast={showToast}
            isDark={isDark}
            onBack={handleBack}
          />
        )}

        {currentScreen === 'results' && (
          <ResultsScreen
            selectedReagent={selectedReagent}
            onOpenPdfModal={() => setIsPdfOpen(true)}
            onOpenAuditTrail={() => setIsAuditOpen(true)}
            onSaveToSqlite={() => {
              setOfflineQueueCount((c) => c + 1);
            }}
            onDone={() => setCurrentScreen('dashboard')}
            onShowToast={showToast}
            isDark={isDark}
            onBack={handleBack}
          />
        )}

        {currentScreen === 'sync' && (
          <SyncScreen
            offlineQueueCount={offlineQueueCount}
            setOfflineQueueCount={setOfflineQueueCount}
            onNavigate={setCurrentScreen}
            onShowToast={showToast}
            isDark={isDark}
            onBack={handleBack}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            onLogout={() => {
              setCurrentScreen('login');
              showToast('Session Locked', 'Cryptographic keys purged from memory cache.', 'lock', 'text-secondary');
            }}
            onNavigate={setCurrentScreen}
            onOpenSop={() => setIsSopOpen(true)}
            onShowToast={showToast}
            isDark={isDark}
            onBack={handleBack}
          />
        )}
      </View>

      {/* Bottom Tab Bar */}
      {currentScreen !== 'login' && currentScreen !== 'scan' && (
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          pendingSyncCount={offlineQueueCount}
          isDark={isDark}
        />
      )}

      {/* Modals */}
      <PdfDossierModal
        isOpen={isPdfOpen}
        onClose={() => setIsPdfOpen(false)}
        selectedReagent={selectedReagent}
        isDark={isDark}
      />
      <AuditTrailModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        isDark={isDark}
      />
      <CalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        onShowToast={showToast}
        isDark={isDark}
      />
      <OfflineSopModal
        isOpen={isSopOpen}
        onClose={() => setIsSopOpen(false)}
        isDark={isDark}
      />
    </View>
    </SafeAreaProvider>
  );
}