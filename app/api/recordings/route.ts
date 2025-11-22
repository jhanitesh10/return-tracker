import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  searchRecordings,
  getRecordingsByPath,
  migrateLocalRecordings,
  readMetadata
} from '@/lib/metadata';
import { getStoragePath } from '@/lib/config';

// Auto-migrate existing local recordings on first access
let migrationDone = false;
async function ensureMigration() {
  if (!migrationDone) {
    const store = await readMetadata();
    if (store.recordings.length === 0) {
      // No metadata yet, try to migrate local recordings
      const localPath = await getStoragePath();
      const count = await migrateLocalRecordings(localPath);
      if (count > 0) {
        console.log(`Migrated ${count} existing recordings to metadata`);
      }
    }
    migrationDone = true;
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureMigration();

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('search');
    const pathParam = searchParams.get('path') || '';

    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (query) {
      // Search Mode
      const results = await searchRecordings(query);

      // Convert to file items format
      const items = results.map(rec => ({
        type: 'file' as const,
        name: rec.filename,
        path: rec.path,
        fullPath: rec.path,
        date: rec.date,
        orderId: rec.orderId,
        skuId: rec.skuId,
        relativePath: rec.path,
        url: rec.url,
        storageType: rec.storageType
      }));

      return NextResponse.json({
        mode: 'search',
        items,
        total: items.length
      });
    } else {
      // Navigation Mode
      const pathSegments = pathParam.split('/').filter(Boolean);
      const { folders, files } = await getRecordingsByPath(pathSegments);

      // Convert folders to items
      const folderItems = folders.map(name => ({
        type: 'folder' as const,
        name,
        path: [...pathSegments, name].join('/'),
        fullPath: [...pathSegments, name].join('/')
      }));

      // Convert files to items
      const fileItems = files.map(rec => ({
        type: 'file' as const,
        name: rec.filename,
        path: rec.path,
        fullPath: rec.path,
        url: rec.url,
        storageType: rec.storageType
      }));

      const allItems = [...folderItems, ...fileItems];
      const total = allItems.length;
      const paginatedItems = allItems.slice(offset, offset + limit);

      return NextResponse.json({
        mode: 'list',
        items: paginatedItems,
        currentPath: pathParam,
        total,
        hasMore: offset + limit < total
      });
    }

  } catch (error) {
    console.error('Error fetching recordings:', error);
    return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 });
  }
}
