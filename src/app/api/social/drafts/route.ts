import { NextResponse, NextRequest } from 'next/server';
import { proxyToSocialApp } from '@/lib/social-proxy';

// GET /api/social/drafts — list drafts
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params: Record<string, string> = {};
  if (searchParams.get('status')) params.status = searchParams.get('status')!;

  const upstream = await proxyToSocialApp('/drafts', { params });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

// POST /api/social/drafts — create draft
export async function POST(request: NextRequest) {
  const body = await request.json();
  const upstream = await proxyToSocialApp('/drafts', { method: 'POST', body });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
