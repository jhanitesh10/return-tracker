import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getStorageConfig, saveStorageConfig, StorageConfig } from '@/lib/config';

export async function GET() {
  try {
    const config = await getStorageConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('Error loading settings:', error);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as StorageConfig;
    const {
      storageType, localPath, saveUrl, readUrl, apiKey,
      storjAccessKey, storjSecretKey, storjEndpoint, storjBucket,
      maxDuration, maxFileSize
    } = body;

    if (!storageType) {
      return NextResponse.json({ error: 'Storage type is required' }, { status: 400 });
    }

    // Validate video constraints
    if (maxDuration !== undefined && (maxDuration < 10 || maxDuration > 3600)) {
      return NextResponse.json({
        error: 'Max duration must be between 10 seconds and 1 hour (3600 seconds)'
      }, { status: 400 });
    }

    if (maxFileSize !== undefined && (maxFileSize < 1 || maxFileSize > 1000)) {
      return NextResponse.json({
        error: 'Max file size must be between 1 MB and 1000 MB'
      }, { status: 400 });
    }

    // Validate based on storage type
    if (storageType === 'local') {
      if (!localPath) {
        return NextResponse.json({ error: 'Local path is required for local storage' }, { status: 400 });
      }

      // Validate and create local path
      try {
        if (!fs.existsSync(localPath)) {
          fs.mkdirSync(localPath, { recursive: true });
        }
      } catch (e) {
        return NextResponse.json({ error: 'Invalid path or permission denied' }, { status: 400 });
      }
    } else if (storageType === 'url') {
      if (!saveUrl) {
        return NextResponse.json({ error: 'Save URL is required for URL storage' }, { status: 400 });
      }

      // Basic URL validation
      try {
        new URL(saveUrl);
        if (readUrl) new URL(readUrl);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
      }
    } else if (storageType === 'storj') {
      if (!storjAccessKey || !storjSecretKey || !storjEndpoint || !storjBucket) {
        return NextResponse.json({
          error: 'Storj configuration requires: Access Key, Secret Key, Endpoint, and Bucket name'
        }, { status: 400 });
      }

      // Validate endpoint URL
      try {
        new URL(storjEndpoint);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid Storj endpoint URL format' }, { status: 400 });
      }
    }

    const config: StorageConfig = {
      storageType,
      localPath: localPath || '',
      saveUrl: saveUrl || '',
      readUrl: readUrl || '',
      apiKey: apiKey || '',
      storjAccessKey: storjAccessKey || '',
      storjSecretKey: storjSecretKey || '',
      storjEndpoint: storjEndpoint || '',
      storjBucket: storjBucket || '',
      maxDuration: maxDuration || 300,
      maxFileSize: maxFileSize || 100
    };

    await saveStorageConfig(config);
    return NextResponse.json({ success: true, ...config });
  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
