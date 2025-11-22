import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { readMetadata } from '@/lib/metadata';
import { getStorageConfig, getStoragePath } from '@/lib/config';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Check if this is a URL or Storj path in metadata
    const metadata = await readMetadata();
    const recording = metadata.recordings.find(r => r.path === filePath);

    if (recording) {
      // Handle Storj storage - generate signed URL
      if (recording.storageType === 'storj') {
        const config = await getStorageConfig();

        if (!config.storjAccessKey || !config.storjSecretKey || !config.storjEndpoint || !config.storjBucket) {
          return NextResponse.json({ error: 'Storj configuration incomplete' }, { status: 500 });
        }

        try {
          const s3Client = new S3Client({
            endpoint: config.storjEndpoint,
            region: 'auto',
            credentials: {
              accessKeyId: config.storjAccessKey,
              secretAccessKey: config.storjSecretKey,
            },
            forcePathStyle: true,
          });

          const command = new GetObjectCommand({
            Bucket: config.storjBucket,
            Key: recording.path,
          });

          // Generate signed URL valid for 1 hour
          const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

          // Redirect to signed URL
          return NextResponse.redirect(signedUrl);
        } catch (error) {
          console.error('Error generating Storj signed URL:', error);
          return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
        }
      }

      // Handle URL storage - redirect to URL
      if (recording.storageType === 'url' && recording.url) {
        return NextResponse.redirect(recording.url);
      }
    }

    // Otherwise, stream from local file
    const storagePath = await getStoragePath();
    const absolutePath = path.join(storagePath, filePath);

    // Security check: prevent directory traversal
    if (!absolutePath.startsWith(storagePath)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    if (!fs.existsSync(absolutePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const stat = fs.statSync(absolutePath);
    const fileSize = stat.size;
    const range = req.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(absolutePath, { start, end });

      return new NextResponse(file as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': 'video/webm',
        },
      });
    } else {
      const file = fs.createReadStream(absolutePath);
      return new NextResponse(file as any, {
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': 'video/webm',
        },
      });
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    return NextResponse.json({ error: 'Failed to stream video' }, { status: 500 });
  }
}
