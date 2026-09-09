/**
 * Auto-sync service: watches connectivity, uploads everything sitting in
 * local SQLite (sync_status = 0), and erases only the rows the server
 * confirms it persisted.
 *
 * Pairs with Offlinedb.ts and the backend's POST /api/sync/batch
 * (app/api/routes/sync.py).
 *
 * Auth: reads the JWT from api.ts's in-memory `authToken` (set at login).
 * If the token is null it attempts to reload from SecureStore first, so
 * background syncs after an app restart still work.
 *
 * Requires: npx expo install @react-native-community/netinfo
 */
import NetInfo, { NetInfoSubscription } from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  PendingRecord,
  deleteRecordsByLocalIds,
  getPendingRecords,
} from './Offlinedb';
import { getAuthToken, loadStoredToken } from './api';

// ─── API endpoint ──────────────────────────────────────────────────────────────
// Uses the same base URL logic as api.ts (reads EXPO_PUBLIC_API_BASE_URL from
// the .env, or falls back to the Metro-bundler host, Android emulator, etc.)
const _env = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env;

function getSyncBaseUrl(): string {
  if (_env?.EXPO_PUBLIC_API_BASE_URL) {
    return _env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  }
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.developer?.tool;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:8000/api`;
    }
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000/api';
  return 'http://localhost:8000/api';
}

const SYNC_ENDPOINT = `${getSyncBaseUrl()}/sync/batch`;

export interface SyncSummary {
  synced: number;
  failed: number;
}

let isSyncing = false;
let netInfoUnsubscribe: NetInfoSubscription | null = null;

/**
 * Returns the current JWT. Checks the in-memory token first (set when the
 * officer logs in), then falls back to SecureStore so syncs work after an
 * app restart without a full re-login.
 */
async function resolveAuthToken(): Promise<string | null> {
  const inMemory = getAuthToken();
  if (inMemory) return inMemory;
  return await loadStoredToken();
}

function toSyncPayload(pending: PendingRecord) {
  const { record, analysis } = pending;
  return {
    local_id: record.local_id,
    compound_name: record.compound_name,
    reagent_id: record.reagent_id,
    reagent_name: record.reagent_name,
    officer_name: record.officer_name,
    officer_badge_number: record.officer_badge_number,
    location: record.location,
    live_location: record.live_location,
    image_name: record.image_name,
    status: record.status,
    sha256: record.sha256,
    timestamp: record.timestamp,
    analysis: {
      reagent_id: analysis.reagent_id,
      spectral_match: analysis.spectral_match,
      purity_index: analysis.purity_index,
      raw_delta_e: analysis.raw_delta_e,
      confidence: analysis.confidence,
    },
  };
}

interface SyncResult {
  local_id: string;
  status: 'created' | 'duplicate' | 'error';
  id?: string;
  case_number?: string;
  detail?: string;
}

/**
 * Uploads every pending record in one batch. Records the server confirms
 * as `created` or `duplicate` are erased locally; `error` rows are left in
 * place so the next sync attempt retries them.
 *
 * Safe to call repeatedly (e.g. from a NetInfo listener and a manual
 * "sync now" button) — concurrent calls collapse into a no-op via
 * `isSyncing`.
 */
export async function syncPendingRecords(): Promise<SyncSummary> {
  if (isSyncing) return { synced: 0, failed: 0 };
  isSyncing = true;

  try {
    const pending = await getPendingRecords();
    if (pending.length === 0) {
      console.log('[sync] nothing to sync');
      return { synced: 0, failed: 0 };
    }

    const token = await resolveAuthToken();
    if (!token) {
      console.warn('[sync] no auth token available — skipping this attempt');
      return { synced: 0, failed: pending.length };
    }

    console.log(`[sync] uploading ${pending.length} record(s)…`);

    const response = await fetch(SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ records: pending.map(toSyncPayload) }),
    });

    if (!response.ok) {
      console.warn('[sync] batch upload failed, HTTP', response.status);
      return { synced: 0, failed: pending.length };
    }

    const body: { results: SyncResult[] } = await response.json();

    const confirmedLocalIds = body.results
      .filter((r) => r.status === 'created' || r.status === 'duplicate')
      .map((r) => r.local_id);

    const erroredResults = body.results.filter((r) => r.status === 'error');
    if (erroredResults.length > 0) {
      console.warn('[sync] some records failed and will be retried:', erroredResults);
    }

    if (confirmedLocalIds.length > 0) {
      await deleteRecordsByLocalIds(confirmedLocalIds);
      console.log(`[sync] confirmed and removed ${confirmedLocalIds.length} local record(s)`);
    }

    return {
      synced: confirmedLocalIds.length,
      failed: pending.length - confirmedLocalIds.length,
    };
  } catch (err) {
    console.warn('[sync] unexpected error during sync:', err);
    return { synced: 0, failed: 0 };
  } finally {
    isSyncing = false;
  }
}

/**
 * Call once at app startup (e.g. alongside initOfflineDb() in App.tsx).
 * Kicks off a sync immediately if already online, then re-syncs any time
 * connectivity is (re)gained.
 */
export function startAutoSync(): void {
  if (netInfoUnsubscribe) return; // already running

  netInfoUnsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      syncPendingRecords().catch((err) =>
        console.warn('[sync] auto-sync listener error:', err)
      );
    }
  });

  // Also fire once immediately in case we're already online
  NetInfo.fetch().then((state) => {
    if (state.isConnected && state.isInternetReachable !== false) {
      syncPendingRecords().catch((err) =>
        console.warn('[sync] initial sync error:', err)
      );
    }
  });
}

export function stopAutoSync(): void {
  netInfoUnsubscribe?.();
  netInfoUnsubscribe = null;
}
