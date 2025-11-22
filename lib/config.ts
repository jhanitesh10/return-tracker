import fs from 'fs';
import path from 'path';
import { getStore } from '@netlify/blobs';

export interface StorageConfig {
  storageType: 'local' | 'url' | 'storj';
  localPath?: string;
  saveUrl?: string;
  readUrl?: string;
  apiKey?: string;
  // Storj S3-compatible fields
  storjAccessKey?: string;
  storjSecretKey?: string;
  storjEndpoint?: string;
  storjBucket?: string;
  // Video recording constraints
  maxDuration?: number;
  maxFileSize?: number;
}

const CONFIG_FILE = path.join(process.cwd(), 'config.json');
const CONFIG_BLOB_KEY = 'app-config';

/**
 * Check if running in Netlify environment
 */
function isNetlify(): boolean {
  return !!process.env.NETLIFY;
}

/**
 * Get default configuration
 */
function getDefaultConfig(): StorageConfig {
  return {
    storageType: 'local',
    localPath: path.join(process.cwd(), 'recordings'),
    saveUrl: '',
    readUrl: '',
    apiKey: '',
    storjAccessKey: '',
    storjSecretKey: '',
    storjEndpoint: '',
    storjBucket: '',
    maxDuration: 300,
    maxFileSize: 100
  };
}

/**
 * Read config from Netlify Blobs or local file
 * This mirrors the pattern used in lib/metadata.ts
 */
export async function getStorageConfig(): Promise<StorageConfig> {
  // Use Netlify Blobs in production
  if (isNetlify()) {
    console.log('🔵 Running on Netlify, reading config from Blobs');
    try {
      const store = getStore('metadata');
      const data = await store.get(CONFIG_BLOB_KEY, { type: 'json' });
      if (data) {
        console.log('✅ Config loaded from Netlify Blobs');
        return data as StorageConfig;
      }
      console.log('⚠️ No config found in Netlify Blobs, using defaults');
    } catch (error) {
      console.error('❌ Error reading config from Netlify Blobs:', error);
    }
    return getDefaultConfig();
  }

  console.log('🟢 Running locally, reading config from filesystem');
  // Use local file in development
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      console.log('✅ Config loaded from local file');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Error reading local config:', error);
    }
  }

  return getDefaultConfig();
}

/**
 * Write config to Netlify Blobs or local file
 * This mirrors the pattern used in lib/metadata.ts
 */
export async function saveStorageConfig(config: StorageConfig): Promise<void> {
  // Use Netlify Blobs in production
  if (isNetlify()) {
    try {
      const blobStore = getStore('metadata');
      await blobStore.setJSON(CONFIG_BLOB_KEY, config);
      console.log('✅ Config saved to Netlify Blobs');
      return;
    } catch (error) {
      console.error('❌ Error writing config to Netlify Blobs:', error);
      // Don't fallback to filesystem on Netlify - it's read-only!
      throw new Error('Failed to write config to Netlify Blobs: ' + (error as Error).message);
    }
  }

  // Use local file in development only
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('✅ Config saved to local file');
  } catch (error) {
    console.error('❌ Error writing local config:', error);
    throw error;
  }
}

/**
 * Get storage path for local storage
 */
export async function getStoragePath(): Promise<string> {
  const config = await getStorageConfig();
  return config.localPath || path.join(process.cwd(), 'recordings');
}
