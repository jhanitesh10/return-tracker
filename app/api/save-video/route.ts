import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'config.json');

interface StorageConfig {
  storageType: 'local' | 'url';
  localPath?: string;
  saveUrl?: string;
  readUrl?: string;
  apiKey?: string;
}

function getStorageConfig(): StorageConfig {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return config;
    } catch (e) {
      console.error("Error reading config", e);
    }
  }
  // Default to local storage
  return {
    storageType: 'local',
    localPath: path.join(process.cwd(), 'recordings')
  };
}

function getFileExtension(mimeType?: string): string {
  if (!mimeType) return 'webm';
  if (mimeType.includes('mp4')) return 'mp4';
  return 'webm';
}

async function saveToLocal(
  file: File,
  orderId: string,
  skuId: string,
  config: StorageConfig,
  mimeType?: string
) {
  const date = new Date().toISOString().split('T')[0];
  const baseDir = config.localPath || path.join(process.cwd(), 'recordings');
  const uploadDir = path.join(baseDir, date, orderId, skuId);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const timestamp = Date.now();
  const ext = getFileExtension(mimeType);
  const filename = `recording_${timestamp}.${ext}`;
  const filePath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  return { success: true, path: filePath, storage: 'local' };
}

async function saveToUrl(file: File, orderId: string, skuId: string, config: StorageConfig) {
  if (!config.saveUrl) {
    throw new Error('Save URL not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('orderId', orderId);
  formData.append('skuId', skuId);
  formData.append('date', new Date().toISOString().split('T')[0]);
  formData.append('timestamp', Date.now().toString());

  const headers: HeadersInit = {};
  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(config.saveUrl, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to save to URL: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return { success: true, ...result, storage: 'url' };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string;
    const skuId = formData.get('skuId') as string;

    if (!file || !orderId || !skuId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const config = getStorageConfig();
    const mimeType = formData.get('mimeType') as string | null;

    let result;
    if (config.storageType === 'url') {
      result = await saveToUrl(file, orderId, skuId, config);
    } else {
      result = await saveToLocal(file, orderId, skuId, config, mimeType || undefined);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving video:', error);
    return NextResponse.json({
      error: 'Failed to save video',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
