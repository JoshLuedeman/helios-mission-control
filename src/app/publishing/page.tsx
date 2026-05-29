import fs from 'fs';
import path from 'path';
import { proxySocialJson } from '@/lib/social-proxy';
import { PublishingClient } from './publishing-client';

export const dynamic = 'force-dynamic';

interface Draft {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  status: string;
  scheduledFor: string | null;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
  publishedUrl: string | null;
  rejectionReason: string | null;
  heroImage?: string | null;
  heroImageDataUri?: string | null;
}

interface AuditEntry {
  event: string;
  draftId: string;
  actor?: string;
  ts: string;
}

function toDataUri(filePath?: string | null) {
  if (!filePath) return null;
  if (!fs.existsSync(filePath)) return null;
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
}

async function getData() {
  try {
    const [drafts, auditResult] = await Promise.all([
      proxySocialJson<Draft[]>('/drafts'),
      proxySocialJson<{ entries: AuditEntry[] }>('/audit', { params: { limit: '20' } }),
    ]);
    const enrichedDrafts = drafts.map(draft => ({
      ...draft,
      heroImageDataUri: toDataUri(draft.heroImage),
    }));
    return { drafts: enrichedDrafts, auditEntries: auditResult.entries };
  } catch (err) {
    console.error('[publishing page] failed to fetch data:', err);
    return { drafts: [], auditEntries: [] };
  }
}

export default async function PublishingPage() {
  const { drafts, auditEntries } = await getData();
  return <PublishingClient initialDrafts={drafts} initialAuditEntries={auditEntries} />;
}
