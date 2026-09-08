export type ScreenType = 
  | 'login' 
  | 'dashboard' 
  | 'reagents' 
  | 'scan' 
  | 'capture' 
  | 'results' 
  | 'sync' 
  | 'profile';

export type DrugCategory = 'all' | 'opiates' | 'stimulants' | 'cannabinoids' | 'synthetics';

export interface ReagentInfo {
  id: string;
  name: string;
  catNumber: string;
  expDate: string;
  category: DrugCategory;
  categoryLabel: string;
  description: string;
  substances: string[];
  targetReaction: string;
  colorHex: string;
  colorGradient: string;
  primaryMatchName: string;
  confidenceScore: number;
  deltaE: number;
  peakWavelength: string;
  absorbance: string;
  // Optional extended fields used in scan/capture/results screens
  matchScore?: string;
  colorPositive?: string;
  positiveReaction?: string;
}

export interface SeizureRecord {
  id: string;
  caseNumber: string;
  officerName?: string;
  officerBadgeNumber?: string;
  reagentName: string;
  location: string;
  liveLocation?: string;
  imageName?: string;
  timeDisplay: string;
  status: 'POSITIVE' | 'INCONCLUSIVE' | 'NEGATIVE';
  compoundName: string;
  matchScore: string;
  accentColor: string;
  custodianId: string;
  evidenceSeal: string;
  sha256: string;
  timestampUtc: string;
  coordinates: {
    lat: number;
    lng: number;
    label: string;
  };
  // Optional display fields used in SyncScreen
  date?: string;
  officer?: string;
}

export interface OfficerProfile {
  id: number;
  name: string;
  badgeNumber: string;
  zone: string;
  division: string;
  status: 'ACTIVE' | 'OFFLINE' | 'DISPATCHED';
  deviceModel: string;
  encryptionStandard: string;
  batteryPercent: number;
  gpsAccuracy: string;
  offlineReady: boolean;
  // Optional fields used in ProfileScreen
  unit?: string;
  rank?: string;
}

export interface AnalysisResult {
  caseId: string;
  sha256: string;
  compoundName: string;
  compoundClass: string;
  spectralMatch: number;
  purityIndex: number;
  confidence: number;
  stdDev: number;
  reactionThresholdExceeded: boolean;
  peakWavelength: string;
  absorbance: string;
  deltaE: number;
  status: 'POSITIVE' | 'INCONCLUSIVE' | 'NEGATIVE';
  reagentName: string;
  reagentId: string;
  officerName?: string;
  officerBadgeNumber?: string;
  liveLocation?: string;
  imageName?: string;
  timestampUtc: string;
}

export interface CaptureSubmission {
  liveLocation: string;
  imageName: string;
  lat?: number;
  lng?: number;
}
