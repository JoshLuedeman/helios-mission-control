import { NextResponse, NextRequest } from 'next/server';
import { proxyToSocialApp } from '@/lib/social-proxy';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params: Record<string, string> = {};
  if (searchParams.get('limit')) params.limit = searchParams.get('limit')!;
  if (searchParams.get('offset')) params.offset = searchParams.get('offset')!;

  const upstream = await proxyToSocialApp('/audit', { params });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
