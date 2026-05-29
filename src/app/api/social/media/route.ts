'use server';

import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';

const ALLOWED_PREFIXES = [
  '/Users/helios/.openclaw/media',
  '/Users/helios/.openclaw/workspace/uploads',
];

function isSafePath(imgPath: string) {
  return ALLOWED_PREFIXES.some(prefix => imgPath.startsWith(prefix));
}

export async function GET(req: NextRequest) {
  const imgPath = req.nextUrl.searchParams.get('path');
  if (!imgPath) {
    return new Response('Missing path', { status: 400 });
  }

  if (!isSafePath(imgPath)) {
    return new Response('Forbidden', { status: 403 });
  }

  if (!fs.existsSync(imgPath)) {
    return new Response('Not found', { status: 404 });
  }

  const ext = path.extname(imgPath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  const data = fs.readFileSync(imgPath);

  return new Response(data, {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
