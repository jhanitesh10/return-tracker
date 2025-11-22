import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';

const pump = promisify(pipeline);
const CONFIG_FILE = path.join(process.cwd(), 'config.json');

function getStoragePath() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (config.storagePath) return config.storagePath;
    } catch (e) {
      console.error("Error reading config", e);
    }
  }
  return path.join(process.cwd(), 'recordings');
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const orderId = formData.get('orderId') as string;
    const skuId = formData.get('skuId') as string;
    const date = new Date().toISOString().split('T')[0];

    if (!file || !orderId || !skuId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create directory structure: recordings/YYYY-MM-DD/orderId/skuId
    const baseDir = getStoragePath();
    const uploadDir = path.join(baseDir, date, orderId, skuId);

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const timestamp = Date.now();
    const filename = `recording_${timestamp}.webm`;
    const filePath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error('Error saving video:', error);
    return NextResponse.json({ error: 'Failed to save video' }, { status: 500 });
  }
}
