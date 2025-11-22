import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

// Recursive search for files matching a query
function searchFiles(dirPath: string, query: string, arrayOfFiles: any[] = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;

  const files = fs.readdirSync(dirPath);

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = searchFiles(fullPath, query, arrayOfFiles);
    } else {
      if (file.endsWith('.webm')) {
        // Check if path contains query (Order ID, SKU, Date)
        const relativePath = path.relative(getStoragePath(), fullPath);
        if (relativePath.toLowerCase().includes(query.toLowerCase())) {
            const parts = relativePath.split(path.sep);
            if (parts.length >= 4) {
                arrayOfFiles.push({
                    type: 'file',
                    date: parts[0],
                    orderId: parts[1],
                    skuId: parts[2],
                    filename: parts[3],
                    fullPath: fullPath,
                    relativePath: relativePath
                });
            }
        }
      }
    }
  });

  return arrayOfFiles;
}

// List contents of a specific directory
function listDirectory(basePath: string, relativePath: string) {
    const targetPath = path.join(basePath, relativePath);

    // Security check: prevent directory traversal
    if (!targetPath.startsWith(basePath)) {
        throw new Error("Invalid path");
    }

    if (!fs.existsSync(targetPath)) return [];

    const items = fs.readdirSync(targetPath, { withFileTypes: true });

    const mappedItems = items.map(item => {
        const itemPath = path.join(relativePath, item.name);
        return {
            name: item.name,
            type: item.isDirectory() ? 'folder' : 'file',
            path: itemPath,
            fullPath: path.join(targetPath, item.name)
        };
    }).filter(item => item.type === 'folder' || item.name.endsWith('.webm'));

    // Sort: Folders first, then Files (alphabetical)
    mappedItems.sort((a, b) => {
        if (a.type === b.type) {
            return a.name.localeCompare(b.name);
        }
        return a.type === 'folder' ? -1 : 1;
    });

    return mappedItems;
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('search');
    const dir = searchParams.get('path') || '';

    const storagePath = getStoragePath();

    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (query) {
        // Search Mode - Return ALL results (ignore limit/offset for search as requested)
        const results = searchFiles(storagePath, query);
        // Sort by date descending
        results.sort((a, b) => b.date.localeCompare(a.date));
        return NextResponse.json({
            mode: 'search',
            items: results,
            total: results.length
        });
    } else {
        // Navigation Mode - Apply Pagination
        const allItems = listDirectory(storagePath, dir);
        const total = allItems.length;
        const paginatedItems = allItems.slice(offset, offset + limit);

        return NextResponse.json({
            mode: 'list',
            items: paginatedItems,
            currentPath: dir,
            total,
            hasMore: offset + limit < total
        });
    }

  } catch (error) {
    console.error('Error fetching recordings:', error);
    return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 });
  }
}
