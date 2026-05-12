import { NextResponse, NextRequest } from 'next/server';
import { proxyToSocialApp } from '@/lib/social-proxy';

type Params = { params: Promise<{ platform: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { platform } = await params;
  const upstream = await proxyToSocialApp(`/auth/${platform}`);
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
