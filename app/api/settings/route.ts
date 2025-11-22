import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'config.json');

interface StorageConfig {
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
}

export async function GET() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return NextResponse.json(config);
    }
    // Default config
    return NextResponse.json({
      storageType: 'local',
      localPath: path.join(process.cwd(), 'recordings'),
      saveUrl: '',
      readUrl: '',
      apiKey: '',
      storjAccessKey: '',
      storjSecretKey: '',
      storjEndpoint: '',
      storjBucket: ''
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as StorageConfig;
    const { storageType, localPath, saveUrl, readUrl, apiKey, storjAccessKey, storjSecretKey, storjEndpoint, storjBucket } = body;

    if (!storageType) {
      return NextResponse.json({ error: 'Storage type is required' }, { status: 400 });
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
      storjBucket: storjBucket || ''
    };

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return NextResponse.json({ success: true, ...config });
  } catch (error) {
    console.error('Settings save error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
