import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'config.json');

export async function GET() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      return NextResponse.json(config);
    }
    return NextResponse.json({ storagePath: path.join(process.cwd(), 'recordings') });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storagePath } = body;

    if (!storagePath) {
      return NextResponse.json({ error: 'Storage path is required' }, { status: 400 });
    }

    // Validate path (basic check)
    try {
      if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true });
      }
    } catch (e) {
       return NextResponse.json({ error: 'Invalid path or permission denied' }, { status: 400 });
    }

    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ storagePath }, null, 2));
    return NextResponse.json({ success: true, storagePath });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
