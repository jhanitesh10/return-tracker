import fs from 'fs';
import path from 'path';
import { getStore } from '@netlify/blobs';

const METADATA_FILE = path.join(process.cwd(), 'recordings-metadata.json');
const METADATA_BLOB_KEY = 'recordings-metadata';

export interface RecordingMetadata {
  orderId: string;
  skuId?: string;
  notes?: string;
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
 * Check if running in Netlify environment
 */
function isNetlify(): boolean {
  return !!(
    process.env.NETLIFY ||
    process.env.NETLIFY_DEV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME
  );
}

/**
 * Read metadata from Netlify Blobs or local file
 */
export async function readMetadata(): Promise<MetadataStore> {
  // Use Netlify Blobs in production
  if (isNetlify()) {
    console.log('🔵 Running on Netlify, using Blobs storage');
    try {
      const store = getStore('metadata');
      const data = await store.get(METADATA_BLOB_KEY, { type: 'json' });
      if (data) {
        console.log('✅ Metadata loaded from Netlify Blobs');
        return data as MetadataStore;
      }
      console.log('⚠️ No metadata found in Netlify Blobs, returning empty store');
    } catch (error) {
      console.error('❌ Error reading from Netlify Blobs:', error);
    }
    return { recordings: [], lastUpdated: Date.now() };
  }

  console.log('🟢 Running locally, using filesystem');
  // Use local file in development
  if (fs.existsSync(METADATA_FILE)) {
    try {
      const data = fs.readFileSync(METADATA_FILE, 'utf-8');
      console.log('✅ Metadata loaded from local file');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Error reading local metadata:', error);
    }
  }

  return { recordings: [], lastUpdated: Date.now() };
}

/**
 * Write metadata to Netlify Blobs or local file
 */
export async function writeMetadata(store: MetadataStore): Promise<void> {
  store.lastUpdated = Date.now();

  // Use Netlify Blobs in production
  if (isNetlify()) {
    try {
      const blobStore = getStore('metadata');
      await blobStore.setJSON(METADATA_BLOB_KEY, store);
      console.log('✅ Metadata saved to Netlify Blobs');
      return;
    } catch (error) {
      console.error('❌ Error writing to Netlify Blobs:', error);
      // Don't fallback to filesystem on Netlify - it's read-only!
      throw new Error('Failed to write metadata to Netlify Blobs: ' + (error as Error).message);
    }
  }

  // Use local file in development only
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(store, null, 2));
    console.log('✅ Metadata saved to local file');
  } catch (error) {
    console.error('❌ Error writing local metadata:', error);
    throw error;
  }
}

/**
 * Module-level write lock — serializes concurrent addRecording calls so that
 * read-then-write is never interleaved between two simultaneous uploads.
 */
let writeLock: Promise<void> = Promise.resolve();

/**
 * Add a new recording to metadata (concurrency-safe with retries).
 * All writes are queued through a promise chain to prevent race conditions.
 */
export async function addRecording(recording: RecordingMetadata): Promise<void> {
  // Create a promise for this specific operation with retry logic
  const operation = (async () => {
    let retries = 3;
    while (retries > 0) {
      try {
        const store = await readMetadata();
        store.recordings.unshift(recording);
        await writeMetadata(store);
        return;
      } catch (error) {
        retries--;
        console.warn(`Metadata write failed. Retries left: ${retries}`, error);
        if (retries === 0) throw error;
        // Exponential backoff
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
      }
    }
  });

  const nextLock = writeLock.then(operation).catch(err => {
    // Propagate the error so the await below catches it
    throw err;
  });

  // Keep the chain resolving so it never permanently breaks future writes if one fails
  writeLock = nextLock.catch(() => {});

  // Wait on our actual operation so the caller gets any final unrecoverable error
  await nextLock;
}

/**
 * Get recent recordings (last N)
 */
export async function getRecentRecordings(limit: number = 10): Promise<RecordingMetadata[]> {
  const store = await readMetadata();
  return store.recordings.slice(0, limit);
}

/**
 * Search recordings by query
 */
export async function searchRecordings(query: string): Promise<RecordingMetadata[]> {
  const store = await readMetadata();
  const lowerQuery = query.toLowerCase();

  return store.recordings.filter((rec: RecordingMetadata) =>
    rec.orderId.toLowerCase().includes(lowerQuery) ||
    (rec.skuId || '').toLowerCase().includes(lowerQuery) ||
    (rec.notes || '').toLowerCase().includes(lowerQuery) ||
    rec.date.includes(lowerQuery)
  );
}

/**
 * Get recordings with pagination
 */
export async function getRecordings(offset: number = 0, limit: number = 20): Promise<{
  recordings: RecordingMetadata[];
  total: number;
  hasMore: boolean;
}> {
  const store = await readMetadata();
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
export async function getRecordingsByPath(pathSegments: string[]): Promise<{
  folders: string[];
  files: RecordingMetadata[];
}> {
  const store = await readMetadata();

  if (pathSegments.length === 0) {
    // Root level: return unique order IDs
    const orderIds = [...new Set(store.recordings.map((r: RecordingMetadata) => r.orderId))].sort();
    return { folders: orderIds, files: [] };
  }

  if (pathSegments.length === 1) {
    // Order level: return unique SKU IDs for this order
    const [orderId] = pathSegments;
    const skuIds = [...new Set(
      store.recordings
        .filter((r: RecordingMetadata) => r.orderId === orderId)
        .map((r: RecordingMetadata) => r.skuId || 'default')
    )].sort();
    return { folders: skuIds, files: [] };
  }

  if (pathSegments.length === 2) {
    // SKU level: return unique dates for this order/SKU
    const [orderId, skuId] = pathSegments;
    const dates = [...new Set(
      store.recordings
        .filter((r: RecordingMetadata) => r.orderId === orderId && r.skuId === skuId)
        .map((r: RecordingMetadata) => r.date)
    )].sort().reverse(); // Most recent first
    return { folders: dates, files: [] };
  }

  if (pathSegments.length === 3) {
    // Date level: return files for this order/SKU/date
    const [orderId, skuId, date] = pathSegments;
    const files = store.recordings.filter(
      (r: RecordingMetadata) => r.orderId === orderId && r.skuId === skuId && r.date === date
    );
    return { folders: [], files };
  }

  return { folders: [], files: [] };
}

/**
 * Migrate existing local recordings to metadata
 */
export async function migrateLocalRecordings(localPath: string): Promise<number> {
  if (!fs.existsSync(localPath)) {
    return 0;
  }

  const store = await readMetadata();
  let migratedCount = 0;

  function scanDirectory(dirPath: string, pathParts: string[] = []) {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        scanDirectory(fullPath, [...pathParts, item.name]);
      } else if (item.name.match(/\.(webm|mp4)$/)) {
        // Extract metadata from path structure: orderId/skuId/date/filename
        if (pathParts.length >= 3) {
          const [orderId, skuId, date] = pathParts;
          const relativePath = path.relative(localPath, fullPath);

          // Check if already in metadata
          const exists = store.recordings.some((r: RecordingMetadata) => r.path === relativePath);
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
    store.recordings.sort((a: RecordingMetadata, b: RecordingMetadata) => b.timestamp - a.timestamp);
    await writeMetadata(store);
  }

  return migratedCount;
}
