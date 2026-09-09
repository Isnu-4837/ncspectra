/**
 * Local offline storage for seizure records + analysis results.
 *
 * Mirrors the backend's `seizure_records` / `analysis_results` tables (see
 * app/database.py's _ensure_sqlite_record_columns for the authoritative
 * column list). Records created here always start with `sync_status = 0`
 * and a client-generated `local_id` (UUID) — the server assigns the real
 * `id` / `case_number` at sync time, since only it knows the authoritative
 * numbering sequence.
 *
 * Rows are deleted locally ONLY after the server confirms that specific
 * record was persisted (see services/syncService.ts). A failed batch never
 * deletes anything, so nothing is lost if sync is interrupted.
 *
 * Requires: npx expo install expo-sqlite
 */
import * as SQLite from 'expo-sqlite';

export type CaptureStatus = 'POSITIVE' | 'INCONCLUSIVE' | 'NEGATIVE';

export interface LocalSeizureRecord {
  local_id: string;              // client-generated UUID, primary key locally
  compound_name: string;
  reagent_id: string;
  reagent_name: string;
  officer_name: string;
  officer_badge_number: string;
  location: string;
  live_location: string;
  image_name: string | null;
  status: CaptureStatus;
  sha256: string;
  timestamp: string;             // ISO 8601
  sync_status: 0 | 1;
}

export interface LocalAnalysisResult {
  local_id: string;               // client-generated UUID
  record_local_id: string;        // FK -> LocalSeizureRecord.local_id
  reagent_id: string;
  spectral_match: number;
  purity_index: number;
  raw_delta_e: number;
  confidence: number;
}

export interface PendingRecord {
  record: LocalSeizureRecord;
  analysis: LocalAnalysisResult;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('ncspectra_offline.db');
  }
  return dbPromise;
}

/** Call once at app startup (e.g. in App.tsx before rendering navigation). */
export async function initOfflineDb(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS seizure_records (
      local_id TEXT PRIMARY KEY NOT NULL,
      compound_name TEXT NOT NULL,
      reagent_id TEXT NOT NULL,
      reagent_name TEXT NOT NULL,
      officer_name TEXT NOT NULL,
      officer_badge_number TEXT NOT NULL,
      location TEXT NOT NULL,
      live_location TEXT NOT NULL,
      image_name TEXT,
      status TEXT NOT NULL,
      sha256 TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      sync_status INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS analysis_results (
      local_id TEXT PRIMARY KEY NOT NULL,
      record_local_id TEXT NOT NULL,
      reagent_id TEXT NOT NULL,
      spectral_match REAL NOT NULL,
      purity_index REAL NOT NULL,
      raw_delta_e REAL NOT NULL,
      confidence REAL NOT NULL,
      FOREIGN KEY (record_local_id) REFERENCES seizure_records (local_id) ON DELETE CASCADE
    );
  `);
}

/** Simple UUID v4-ish generator so we don't need an extra dependency. */
export function generateLocalId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Persist a completed capture locally. Called from the "Save Vault" action
 * (ResultsScreen's onSaveToSqlite) regardless of connectivity — the sync
 * service picks it up the next time the device is online.
 */
export async function saveOfflineRecord(
  record: Omit<LocalSeizureRecord, 'local_id' | 'sync_status'>,
  analysis: Omit<LocalAnalysisResult, 'local_id' | 'record_local_id'>
): Promise<string> {
  const db = await getDb();
  const recordLocalId = generateLocalId();
  const analysisLocalId = generateLocalId();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO seizure_records
        (local_id, compound_name, reagent_id, reagent_name, officer_name, officer_badge_number,
         location, live_location, image_name, status, sha256, timestamp, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        recordLocalId,
        record.compound_name,
        record.reagent_id,
        record.reagent_name,
        record.officer_name,
        record.officer_badge_number,
        record.location,
        record.live_location,
        record.image_name,
        record.status,
        record.sha256,
        record.timestamp,
      ]
    );

    await db.runAsync(
      `INSERT INTO analysis_results
        (local_id, record_local_id, reagent_id, spectral_match, purity_index, raw_delta_e, confidence)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        analysisLocalId,
        recordLocalId,
        analysis.reagent_id,
        analysis.spectral_match,
        analysis.purity_index,
        analysis.raw_delta_e,
        analysis.confidence,
      ]
    );
  });

  return recordLocalId;
}

/** All records not yet confirmed synced, each paired with its analysis row. */
export async function getPendingRecords(): Promise<PendingRecord[]> {
  const db = await getDb();
  const records = await db.getAllAsync<LocalSeizureRecord>(
    `SELECT * FROM seizure_records WHERE sync_status = 0 ORDER BY timestamp ASC`
  );

  const pending: PendingRecord[] = [];
  for (const record of records) {
    const analysis = await db.getFirstAsync<LocalAnalysisResult>(
      `SELECT * FROM analysis_results WHERE record_local_id = ?`,
      [record.local_id]
    );
    if (analysis) pending.push({ record, analysis });
  }
  return pending;
}

export async function countPending(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM seizure_records WHERE sync_status = 0`
  );
  return row?.count ?? 0;
}

/**
 * Erase the given records (and their analysis rows) from the local DB.
 * Only ever called with local_ids the server has explicitly confirmed —
 * see syncService.ts.
 */
export async function deleteRecordsByLocalIds(localIds: string[]): Promise<void> {
  if (localIds.length === 0) return;
  const db = await getDb();
  const placeholders = localIds.map(() => '?').join(',');

  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM analysis_results WHERE record_local_id IN (${placeholders})`, localIds);
    await db.runAsync(`DELETE FROM seizure_records WHERE local_id IN (${placeholders})`, localIds);
  });
}