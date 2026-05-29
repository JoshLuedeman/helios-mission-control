'use client';

import { useState } from 'react';
import { Markdown } from '@/components/ui/markdown';

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

interface Props {
  initialDrafts: Draft[];
  initialAuditEntries: AuditEntry[];
}

/*
  Theme strategy:
  - Component defines CSS custom properties with sensible dark defaults.
  - If a parent (e.g. Olympus MC) already sets matching vars on :root or a
    wrapping element, those cascade in automatically — no special wiring needed.
  - To override from outside, set any of these vars on a parent:
      --pub-bg, --pub-bg-surface, --pub-bg-elevated, --pub-bg-void
      --pub-fg, --pub-fg-muted
      --pub-border, --pub-border-dim
      --pub-accent-yellow, --pub-accent-green, --pub-accent-red, --pub-accent-blue, --pub-accent-purple
      --pub-font-mono
*/
const theme = `
  .pub-root {
    --pub-bg:            var(--background,      #0d0d14);
    --pub-bg-surface:    var(--surface,         #13131f);
    --pub-bg-elevated:   var(--elevated,        #1a1a2e);
    --pub-bg-void:       var(--void,            #08080f);
    --pub-fg:            var(--foreground,      #e5e7eb);
    --pub-fg-muted:      var(--muted-foreground,#6b7280);
    --pub-border:        var(--border,          rgba(255,255,255,0.12));
    --pub-border-dim:    var(--border-dim,      rgba(255,255,255,0.07));
    --pub-accent-yellow: var(--color-yellow,    #eab308);
    --pub-accent-green:  var(--color-green,     #22c55e);
    --pub-accent-red:    var(--color-red,       #ef4444);
    --pub-accent-blue:   var(--color-blue,      #3b82f6);
    --pub-accent-purple: var(--zeus-purple,     #a855f7);
    --pub-font-mono:     var(--font-mono,       ui-monospace, monospace);
  }
`;

export function PublishingClient({ initialDrafts, initialAuditEntries }: Props) {
  const [drafts, setDrafts] = useState<Draft[]>(initialDrafts);
  const [auditEntries] = useState<AuditEntry[]>(initialAuditEntries);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve(id: string) {
    setLoading(id);
    setError(null);
    try {
      const res = await fetch(`/api/social/drafts/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'josh' }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDrafts(ds => ds.map(d => d.id === id ? { ...d, status: 'approved' } : d));
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(null);
    }
  }

  async function reject(id: string, reason: string) {
    setLoading(id);
    setError(null);
    try {
      const res = await fetch(`/api/social/drafts/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectedBy: 'josh', reason }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDrafts(ds => ds.map(d => d.id === id ? { ...d, status: 'rejected', rejectionReason: reason } : d));
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(null);
    }
  }

  const pending = drafts.filter(d => d.status === 'pending_approval');
  const other = drafts.filter(d => d.status !== 'pending_approval');

  return (
    <>
      <style>{theme}</style>
      <div className="pub-root" style={{
        padding: '1.5rem',
        maxWidth: '56rem',
        margin: '0 auto',
        color: 'var(--pub-fg)',
        fontFamily: 'inherit',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--pub-fg)', margin: 0 }}>
            📢 Publishing
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--pub-fg-muted)', marginTop: '0.25rem' }}>
            Review and approve social media drafts.
          </p>
        </div>

        {error && (
          <div style={{
            background: `color-mix(in srgb, var(--pub-accent-red) 10%, transparent)`,
            border: `1px solid color-mix(in srgb, var(--pub-accent-red) 30%, transparent)`,
            color: 'var(--pub-accent-red)',
            padding: '0.75rem 1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        {/* Pending Approval */}
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--pub-fg)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Pending Approval
            {pending.length > 0 && (
              <span style={{
                background: `color-mix(in srgb, var(--pub-accent-yellow) 12%, transparent)`,
                color: 'var(--pub-accent-yellow)',
                fontSize: '0.75rem',
                padding: '0.1rem 0.5rem',
                borderRadius: '9999px',
                fontFamily: 'var(--pub-font-mono)',
              }}>
                {pending.length}
              </span>
            )}
          </h2>
          {pending.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--pub-fg-muted)' }}>No drafts awaiting approval.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pending.map(draft => (
                <DraftCard
                  key={draft.id}
                  draft={draft}
                  loading={loading === draft.id}
                  onApprove={() => approve(draft.id)}
                  onReject={(reason) => reject(draft.id, reason)}
                />
              ))}
            </div>
          )}
        </section>

        {/* All Drafts */}
        {other.length > 0 && (
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--pub-fg)', marginBottom: '0.75rem' }}>
              All Drafts
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {other.map(draft => (
                <div key={draft.id} style={{
                  border: `1px solid var(--pub-border-dim)`,
                  borderRadius: '0.5rem',
                  padding: '1rem',
                  background: 'var(--pub-bg-surface)',
                }}>
                  {draft.heroImageDataUri && (
                    <div style={{ marginBottom: '0.75rem', borderRadius: '0.5rem', overflow: 'hidden' }}>
                      <img
                        src={draft.heroImageDataUri}
                        alt={draft.title || 'Draft hero image'}
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                      />
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--pub-fg)' }}>{draft.title || 'Untitled'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--pub-fg-muted)', marginTop: '0.2rem', fontFamily: 'var(--pub-font-mono)' }}>
                        {draft.platforms.join(', ')} · {draft.submittedBy} · {new Date(draft.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <StatusBadge status={draft.status} />
                  </div>
                  <div style={{
                    background: 'var(--pub-bg-void)',
                    border: `1px solid var(--pub-border-dim)`,
                    borderRadius: '0.5rem',
                    padding: '0.75rem',
                    marginTop: '0.75rem',
                    marginBottom: '1rem',
                  }}>
                    <Markdown content={draft.content} />
                  </div>
                  {draft.publishedUrl && (
                    <a href={draft.publishedUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: 'var(--pub-accent-blue)', display: 'block', marginTop: '0.4rem' }}>
                      View published post →
                    </a>
                  )}
                  {draft.rejectionReason && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--pub-accent-red)', marginTop: '0.3rem' }}>
                      Rejected: {draft.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Audit Log */}
        <section>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--pub-fg)', marginBottom: '0.75rem' }}>
            Recent Activity
          </h2>
          {auditEntries.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: 'var(--pub-fg-muted)' }}>No activity yet.</p>
          ) : (
            <div style={{ border: `1px solid var(--pub-border-dim)`, borderRadius: '0.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--pub-bg-elevated)', borderBottom: `1px solid var(--pub-border-dim)` }}>
                    {['Event', 'Draft ID', 'Time'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.5rem 1rem', color: 'var(--pub-fg-muted)', fontWeight: 500, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditEntries.map((entry, i) => (
                    <tr key={i} style={{ borderBottom: i < auditEntries.length - 1 ? `1px solid var(--pub-border-dim)` : 'none' }}>
                      <td style={{ padding: '0.5rem 1rem', color: 'var(--pub-fg)', fontFamily: 'var(--pub-font-mono)', fontSize: '0.75rem' }}>{entry.event}</td>
                      <td style={{ padding: '0.5rem 1rem', color: 'var(--pub-fg-muted)', fontFamily: 'var(--pub-font-mono)', fontSize: '0.75rem' }}>{entry.draftId?.slice(0, 8)}…</td>
                      <td style={{ padding: '0.5rem 1rem', color: 'var(--pub-fg-muted)', fontSize: '0.75rem' }}>{new Date(entry.ts).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    draft:            'var(--pub-fg-muted)',
    pending_approval: 'var(--pub-accent-yellow)',
    approved:         'var(--pub-accent-blue)',
    scheduled:        'var(--pub-accent-purple)',
    publishing:       'var(--pub-accent-yellow)',
    published:        'var(--pub-accent-green)',
    rejected:         'var(--pub-accent-red)',
    failed:           'var(--pub-accent-red)',
  };
  const color = colorMap[status] || 'var(--pub-fg-muted)';
  return (
    <span style={{
      fontSize: '0.7rem',
      padding: '0.15rem 0.5rem',
      borderRadius: '9999px',
      fontFamily: 'var(--pub-font-mono)',
      fontWeight: 500,
      background: `color-mix(in srgb, ${color} 12%, transparent)`,
      color,
      border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

function DraftCard({
  draft,
  loading,
  onApprove,
  onReject,
}: {
  draft: Draft;
  loading: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  return (
    <div style={{
      border: `1px solid color-mix(in srgb, var(--pub-accent-yellow) 30%, transparent)`,
      borderRadius: '0.5rem',
      padding: '1rem',
      background: `color-mix(in srgb, var(--pub-accent-yellow) 4%, transparent)`,
    }}>
      {draft.heroImageDataUri && (
        <div style={{ marginBottom: '0.75rem', borderRadius: '0.5rem', overflow: 'hidden' }}>
          <img
            src={draft.heroImageDataUri}
            alt={draft.title || 'Draft hero image'}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--pub-fg)' }}>{draft.title || 'Untitled'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--pub-fg-muted)', marginTop: '0.2rem', fontFamily: 'var(--pub-font-mono)' }}>
            {draft.platforms.join(', ')} · {draft.submittedBy} · {new Date(draft.createdAt).toLocaleString()}
          </div>
          {draft.scheduledFor && (
            <div style={{ fontSize: '0.75rem', color: 'var(--pub-accent-purple)', marginTop: '0.2rem', fontFamily: 'var(--pub-font-mono)' }}>
              Scheduled: {new Date(draft.scheduledFor).toLocaleString()}
            </div>
          )}
        </div>
        <StatusBadge status={draft.status} />
      </div>

      {/* Post content */}
      <div style={{
        background: 'var(--pub-bg-void)',
        border: `1px solid var(--pub-border-dim)`,
        borderRadius: '0.5rem',
        padding: '0.75rem',
        marginBottom: '1rem',
      }}>
        <Markdown content={draft.content} />
      </div>

      {!rejectMode ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onApprove}
            disabled={loading}
            style={{
              padding: '0.375rem 1rem',
              background: `color-mix(in srgb, var(--pub-accent-green) 18%, transparent)`,
              color: 'var(--pub-accent-green)',
              border: `1px solid color-mix(in srgb, var(--pub-accent-green) 30%, transparent)`,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? 'Approving…' : '✅ Approve'}
          </button>
          <button
            onClick={() => setRejectMode(true)}
            disabled={loading}
            style={{
              padding: '0.375rem 1rem',
              background: `color-mix(in srgb, var(--pub-accent-red) 18%, transparent)`,
              color: 'var(--pub-accent-red)',
              border: `1px solid color-mix(in srgb, var(--pub-accent-red) 30%, transparent)`,
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            ❌ Reject
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input
            type="text"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (optional)"
            style={{
              width: '100%',
              background: 'var(--pub-bg-void)',
              border: `1px solid var(--pub-border-dim)`,
              borderRadius: '0.5rem',
              padding: '0.375rem 0.75rem',
              fontSize: '0.875rem',
              color: 'var(--pub-fg)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => { onReject(rejectReason); setRejectMode(false); }}
              disabled={loading}
              style={{
                padding: '0.375rem 1rem',
                background: `color-mix(in srgb, var(--pub-accent-red) 18%, transparent)`,
                color: 'var(--pub-accent-red)',
                border: `1px solid color-mix(in srgb, var(--pub-accent-red) 30%, transparent)`,
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Confirm Reject
            </button>
            <button
              onClick={() => setRejectMode(false)}
              style={{
                padding: '0.375rem 1rem',
                background: 'var(--pub-bg-elevated)',
                color: 'var(--pub-fg-muted)',
                border: `1px solid var(--pub-border-dim)`,
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
