import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { addRecording } from '@/lib/metadata';
import { getStorageConfig, StorageConfig } from '@/lib/config';

function getFileExtension(mimeType?: string): string {
  if (!mimeType) return 'webm';
  const lowerMimeType = mimeType.toLowerCase();

  if (lowerMimeType.includes('mp4')) return 'mp4';
  if (lowerMimeType.includes('jpeg') || lowerMimeType.includes('jpg')) return 'jpg';
  if (lowerMimeType.includes('png')) return 'png';
  if (lowerMimeType.includes('webm')) return 'webm';
  if (lowerMimeType.includes('matroska') || lowerMimeType.includes('mkv')) return 'mkv';

  // Fallbacks based on category
  if (lowerMimeType.startsWith('image/')) return 'jpg';
  if (lowerMimeType.startsWith('video/')) return 'webm';

  return 'webm';
}

async function saveToLocal(
  file: File,
  orderId: string,
  skuId: string | undefined,
  config: StorageConfig,
  mimeType?: string,
  notes?: string
) {
  const date = new Date().toISOString().split('T')[0];
  const baseDir = config.localPath || path.join(process.cwd(), 'recordings');
  // New structure: orderId/skuId/date
  const uploadDir = path.join(baseDir, orderId, skuId || 'default', date);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const uniqueId = crypto.randomUUID();
  const ext = getFileExtension(mimeType);
  const filename = `recording_${uniqueId}.${ext}`;
  const timestamp = Date.now();
  const filePath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const relativePath = path.relative(baseDir, filePath);

  // Save metadata
  await addRecording({
    orderId,
    skuId,
    notes,
    date,
    timestamp,
    storageType: 'local',
    path: relativePath,
    filename,
    mimeType: file.type || mimeType
  });

  return { success: true, path: filePath, storage: 'local' };
}

async function saveToUrl(file: File, orderId: string, skuId: string | undefined, config: StorageConfig, notes?: string) {
  if (!config.saveUrl) {
    throw new Error('Save URL not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('orderId', orderId);
  if (skuId) formData.append('skuId', skuId);
  if (notes) formData.append('notes', notes);
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
  const date = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();

  // Save metadata
  await addRecording({
    orderId,
    skuId,
    notes,
    date,
    timestamp,
    storageType: 'url',
    path: result.path || result.url || '',
    url: result.url || config.saveUrl,
    filename: result.filename || file.name,
    mimeType: file.type
  });

  return { success: true, ...result, storage: 'url' };
}

async function saveToStorj(
  file: File,
  orderId: string,
  skuId: string | undefined,
  config: StorageConfig,
  mimeType?: string,
  notes?: string
) {
  if (!config.storjAccessKey || !config.storjSecretKey || !config.storjEndpoint || !config.storjBucket) {
    throw new Error('Storj configuration incomplete');
  }

  // Initialize S3 client with Storj credentials
  const s3Client = new S3Client({
    endpoint: config.storjEndpoint,
    region: 'auto', // Storj uses 'auto' for region
    credentials: {
      accessKeyId: config.storjAccessKey,
      secretAccessKey: config.storjSecretKey,
    },
    forcePathStyle: true, // Required for S3-compatible services
  });

  const date = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();
  const uniqueId = crypto.randomUUID();
  const ext = getFileExtension(mimeType);
  const filename = `recording_${uniqueId}.${ext}`;

  // Create S3 key path: orderId/skuId/date/filename
  const key = `${orderId}/${skuId || 'default'}/${date}/${filename}`;

  // Convert file to buffer
  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload to Storj
  const command = new PutObjectCommand({
    Bucket: config.storjBucket,
    Key: key,
    Body: buffer,
    ContentType: file.type || mimeType || 'application/octet-stream',
  });

  await s3Client.send(command);

  const fileUrl = `${config.storjEndpoint}/${config.storjBucket}/${key}`;

  // Save metadata
  await addRecording({
    orderId,
    skuId,
    notes,
    date,
    timestamp,
    storageType: 'storj',
    path: key,
    url: fileUrl,
    filename,
    mimeType: file.type || mimeType
  });

  return {
    success: true,
    path: key,
    url: fileUrl,
    storage: 'storj'
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string;
    const skuId = formData.get('skuId') as string || undefined;
    const notes = formData.get('notes') as string || undefined;

    if (!file || !orderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const config = await getStorageConfig();
    const mimeType = formData.get('mimeType') as string | null;

    let result;
    if (config.storageType === 'url') {
      result = await saveToUrl(file, orderId, skuId, config, notes);
    } else if (config.storageType === 'storj') {
      result = await saveToStorj(file, orderId, skuId, config, mimeType || undefined, notes);
    } else {
      result = await saveToLocal(file, orderId, skuId, config, mimeType || undefined, notes);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving video:', error);
    return NextResponse.json({
      error: 'Failed to save media',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
