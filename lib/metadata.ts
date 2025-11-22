import fs from 'fs';
import path from 'path';

const METADATA_FILE = path.join(process.cwd(), 'recordings-metadata.json');

export interface RecordingMetadata {
  orderId: string;
  skuId: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  storageType: 'local' | 'url' | 'storj';
  path: string; // Relative path for local, S3 key for Storj, or URL
  url?: string; // Full URL for accessing the file
  filename: string;
  mimeType?: string;
}

interface MetadataStore {
  recordings: RecordingMetadata[];
  lastUpdated: number;
}

/**
 * Read metadata from file
 */
export function readMetadata(): MetadataStore {
  if (!fs.existsSync(METADATA_FILE)) {
    return { recordings: [], lastUpdated: Date.now() };
  }

  try {
    const data = fs.readFileSync(METADATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading metadata:', error);
    return { recordings: [], lastUpdated: Date.now() };
  }
}

/**
 * Write metadata to file
 */
export function writeMetadata(store: MetadataStore): void {
  try {
    store.lastUpdated = Date.now();
    fs.writeFileSync(METADATA_FILE, JSON.stringify(store, null, 2));
  } catch (error) {
    console.error('Error writing metadata:', error);
    throw error;
  }
}

/**
 * Add a new recording to metadata
 */
export function addRecording(recording: RecordingMetadata): void {
  const store = readMetadata();
  store.recordings.unshift(recording); // Add to beginning
  writeMetadata(store);
}

/**
 * Get recent recordings (last N)
 */
export function getRecentRecordings(limit: number = 10): RecordingMetadata[] {
  const store = readMetadata();
  return store.recordings.slice(0, limit);
}

/**
 * Search recordings by query
 */
export function searchRecordings(query: string): RecordingMetadata[] {
  const store = readMetadata();
  const lowerQuery = query.toLowerCase();

  return store.recordings.filter(rec =>
    rec.orderId.toLowerCase().includes(lowerQuery) ||
    rec.skuId.toLowerCase().includes(lowerQuery) ||
    rec.date.includes(lowerQuery)
  );
}

/**
 * Get recordings with pagination
 */
export function getRecordings(offset: number = 0, limit: number = 20): {
  recordings: RecordingMetadata[];
  total: number;
  hasMore: boolean;
} {
  const store = readMetadata();
  const total = store.recordings.length;
  const recordings = store.recordings.slice(offset, offset + limit);

  return {
    recordings,
    total,
    hasMore: offset + limit < total
  };
}

/**
 * Get recordings grouped by date/order/sku for navigation
 */
export function getRecordingsByPath(pathSegments: string[]): {
  folders: string[];
  files: RecordingMetadata[];
} {
  const store = readMetadata();

  if (pathSegments.length === 0) {
    // Root level: return unique dates
    const dates = [...new Set(store.recordings.map(r => r.date))].sort().reverse();
    return { folders: dates, files: [] };
  }

  if (pathSegments.length === 1) {
    // Date level: return unique order IDs for this date
    const [date] = pathSegments;
    const orderIds = [...new Set(
      store.recordings
        .filter(r => r.date === date)
        .map(r => r.orderId)
    )].sort();
    return { folders: orderIds, files: [] };
  }

  if (pathSegments.length === 2) {
    // Order level: return unique SKU IDs for this date/order
    const [date, orderId] = pathSegments;
    const skuIds = [...new Set(
      store.recordings
        .filter(r => r.date === date && r.orderId === orderId)
        .map(r => r.skuId)
    )].sort();
    return { folders: skuIds, files: [] };
  }

  if (pathSegments.length === 3) {
    // SKU level: return files for this date/order/sku
    const [date, orderId, skuId] = pathSegments;
    const files = store.recordings.filter(
      r => r.date === date && r.orderId === orderId && r.skuId === skuId
    );
    return { folders: [], files };
  }

  return { folders: [], files: [] };
}

/**
 * Migrate existing local recordings to metadata
 */
export function migrateLocalRecordings(localPath: string): number {
  if (!fs.existsSync(localPath)) {
    return 0;
  }

  const store = readMetadata();
  let migratedCount = 0;

  function scanDirectory(dirPath: string, pathParts: string[] = []) {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        scanDirectory(fullPath, [...pathParts, item.name]);
      } else if (item.name.match(/\.(webm|mp4)$/)) {
        // Extract metadata from path structure: date/orderId/skuId/filename
        if (pathParts.length >= 3) {
          const [date, orderId, skuId] = pathParts;
          const relativePath = path.relative(localPath, fullPath);

          // Check if already in metadata
          const exists = store.recordings.some(r => r.path === relativePath);
          if (!exists) {
            const stats = fs.statSync(fullPath);
            store.recordings.push({
              orderId,
              skuId,
              date,
              timestamp: stats.mtimeMs,
              storageType: 'local',
              path: relativePath,
              filename: item.name,
              mimeType: item.name.endsWith('.mp4') ? 'video/mp4' : 'video/webm'
            });
            migratedCount++;
          }
        }
      }
    }
  }

  scanDirectory(localPath);

  if (migratedCount > 0) {
    // Sort by timestamp descending
    store.recordings.sort((a, b) => b.timestamp - a.timestamp);
    writeMetadata(store);
  }

  return migratedCount;
}
