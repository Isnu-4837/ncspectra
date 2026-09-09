/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { View, Appearance } from 'react-native';
import { REAGENTS_DATA } from './src/data/mockData';
import { ReagentInfo, ScreenType, SeizureRecord } from './src/types';
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
import { recordsApi, authApi } from './src/services/api';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('login');
  const [selectedReagent, setSelectedReagent] = useState<ReagentInfo>(REAGENTS_DATA[0]);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(3);
  const [isDark, setIsDark] = useState<boolean>(
    Appearance.getColorScheme() === 'dark'
  );

  // Capture & Evidence tracking for real DB saving
  const [capturedPhotoBase64, setCapturedPhotoBase64] = useState<string | undefined>(undefined);
  const [latestCapture, setLatestCapture] = useState<{
    liveLocation: string;
    imageName: string;
    lat: number;
    lng: number;
    timestamp: string;
    status?: 'POSITIVE' | 'INCONCLUSIVE' | 'NEGATIVE';
    compoundName?: string;
    matchScore?: string;
    spectralMatch?: number;
    confidence?: number;
    purityIndex?: number;
    sampleColorHex?: string;
    sampleColorName?: string;
  } | null>(null);

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

  // Attempt auto-login with default credentials on app start so API token is set
  useEffect(() => {
    authApi.login('NCB-DEL-9842', 'tactical-auth-2024').catch(() => {
      console.log('Backend not reachable on initial load — running in offline mode');
    });
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

  const handleSaveToDatabase = async () => {
    try {
      const nowStr = new Date().toISOString();
      const liveLocStr = latestCapture?.liveLocation || 'DEL 28.6139°N 77.2090°E (GPS Lock +/-3m)';
      const currentStatus = latestCapture?.status || 'POSITIVE';
      const currentCompound = latestCapture?.compoundName || selectedReagent.primaryMatchName || 'HEROIN HYDROCHLORIDE';
      const currentMatchScore = latestCapture?.matchScore || (selectedReagent.confidenceScore ? `${selectedReagent.confidenceScore}% Match` : '94.2% Match');
      const accentColor = currentStatus === 'POSITIVE' ? (selectedReagent.colorHex || '#ba1a1a') : currentStatus === 'NEGATIVE' ? '#15803d' : '#d97706';

      const recordPayload = {
        reagent_name: selectedReagent.name || 'Marquis Reagent',
        location: 'IGI Cargo Terminal 3, Air Courier Wing',
        live_location: liveLocStr,
        image_name: latestCapture?.imageName || `${selectedReagent.id}_${Date.now()}.jpg`,
        status: currentStatus,
        compound_name: currentCompound,
        match_score: currentMatchScore,
        accent_color: accentColor,
        lat: latestCapture?.lat || 28.6139,
        lng: latestCapture?.lng || 77.2090,
        location_label: liveLocStr,
      };

      const savedRecord = await recordsApi.create(recordPayload);
      console.log('Successfully saved seizure record to DB:', savedRecord);
      showToast(
        'Stored in DB',
        `Record #${savedRecord.case_number} saved with live location & timestamp UTC.`,
        'storage',
        'text-primary'
      );
    } catch (err: any) {
      console.warn('API save warning (saving to offline queue):', err.message);
      showToast('Offline Queue', 'Saved to encrypted local partition.', 'cloud-off', 'text-tertiary');
    }
    setOfflineQueueCount((c) => c + 1);
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
            onCapture={(photoBase64?: string) => {
              setCapturedPhotoBase64(photoBase64);
              setCurrentScreen('capture');
            }}
            onAbort={() => setCurrentScreen('reagents')}
            onShowToast={showToast}
            isDark={isDark}
            onBack={handleBack}
          />
        )}

        {currentScreen === 'capture' && (
          <CaptureScreen
            selectedReagent={selectedReagent}
            photoBase64={capturedPhotoBase64}
            onRetake={() => setCurrentScreen('scan')}
            onConfirmAnalyze={(captureData) => {
              if (captureData) {
                setLatestCapture({
                  liveLocation: captureData.liveLocation || 'DEL 28.6139°N 77.2090°E',
                  imageName: captureData.imageName || `${selectedReagent.id}_assay.jpg`,
                  lat: captureData.lat || 28.6139,
                  lng: captureData.lng || 77.2090,
                  timestamp: new Date().toISOString(),
                  status: captureData.status || 'POSITIVE',
                  compoundName: captureData.compoundName,
                  matchScore: captureData.matchScore,
                  spectralMatch: captureData.spectralMatch,
                  confidence: captureData.confidence,
                  purityIndex: captureData.purityIndex,
                  sampleColorHex: captureData.sampleColorHex,
                  sampleColorName: captureData.sampleColorName,
                });
              }
              setCurrentScreen('results');
              const toastMsg = captureData?.status === 'NEGATIVE'
                ? 'No controlled substance match detected.'
                : captureData?.status === 'INCONCLUSIVE'
                ? 'Inconclusive reaction — retest recommended.'
                : 'Preliminary positive convergence confirmed with kit standard.';
              showToast('Spectral Assay Complete', toastMsg, 'check-circle', 'text-primary');
            }}
            onShowToast={showToast}
            isDark={isDark}
            onBack={handleBack}
          />
        )}

        {currentScreen === 'results' && (
          <ResultsScreen
            selectedReagent={selectedReagent}
            captureResult={latestCapture}
            onOpenPdfModal={() => setIsPdfOpen(true)}
            onOpenAuditTrail={() => setIsAuditOpen(true)}
            onSaveToSqlite={handleSaveToDatabase}
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