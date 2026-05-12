import { NextResponse, NextRequest } from 'next/server';
import { proxyToSocialApp } from '@/lib/social-proxy';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const upstream = await proxyToSocialApp(`/drafts/${id}/reject`, { method: 'POST', body });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
