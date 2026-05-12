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
}

interface AuditEntry {
  event: string;
  draftId: string;
  actor?: string;
  ts: string;
}

async function getData() {
  try {
    const [drafts, auditResult] = await Promise.all([
      proxySocialJson<Draft[]>('/drafts'),
      proxySocialJson<{ entries: AuditEntry[] }>('/audit', { params: { limit: '20' } }),
    ]);
    return { drafts, auditEntries: auditResult.entries };
  } catch (err) {
    console.error('[publishing page] failed to fetch data:', err);
    return { drafts: [], auditEntries: [] };
  }
}

export default async function PublishingPage() {
  const { drafts, auditEntries } = await getData();
  return <PublishingClient initialDrafts={drafts} initialAuditEntries={auditEntries} />;
}
