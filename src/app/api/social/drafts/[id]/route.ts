import { NextResponse, NextRequest } from 'next/server';
import { proxyToSocialApp } from '@/lib/social-proxy';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const upstream = await proxyToSocialApp(`/drafts/${id}`);
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const upstream = await proxyToSocialApp(`/drafts/${id}`, { method: 'PATCH', body });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const upstream = await proxyToSocialApp(`/drafts/${id}`, { method: 'DELETE' });
  if (upstream.status === 204) return new NextResponse(null, { status: 204 });
  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
