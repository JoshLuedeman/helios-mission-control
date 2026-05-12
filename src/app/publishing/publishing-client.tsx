'use client';

import { useState } from 'react';

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

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  scheduled: 'bg-purple-100 text-purple-800',
  publishing: 'bg-orange-100 text-orange-800',
  published: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  failed: 'bg-red-200 text-red-900',
};

interface Props {
  initialDrafts: Draft[];
  initialAuditEntries: AuditEntry[];
}

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
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Publishing</h1>
        <p className="text-gray-500 text-sm mt-1">Review and approve social media drafts.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Pending Approval */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Pending Approval {pending.length > 0 && <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">{pending.length}</span>}
        </h2>
        {pending.length === 0 ? (
          <p className="text-gray-400 text-sm">No drafts awaiting approval.</p>
        ) : (
          <div className="space-y-4">
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
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">All Drafts</h2>
        {other.length === 0 ? (
          <p className="text-gray-400 text-sm">No other drafts.</p>
        ) : (
          <div className="space-y-3">
            {other.map(draft => (
              <div key={draft.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-gray-900">{draft.title || 'Untitled'}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {draft.platforms.join(', ')} · {draft.submittedBy} · {new Date(draft.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[draft.status] || 'bg-gray-100 text-gray-700'}`}>
                    {draft.status}
                  </span>
                </div>
                {draft.publishedUrl && (
                  <a href={draft.publishedUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">
                    View published post →
                  </a>
                )}
                {draft.rejectionReason && (
                  <div className="text-xs text-red-600 mt-1">Rejected: {draft.rejectionReason}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Audit Log */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Recent Activity</h2>
        {auditEntries.length === 0 ? (
          <p className="text-gray-400 text-sm">No activity yet.</p>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2 text-gray-600 font-medium">Event</th>
                  <th className="text-left px-4 py-2 text-gray-600 font-medium">Draft ID</th>
                  <th className="text-left px-4 py-2 text-gray-600 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {auditEntries.map((entry, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-2 text-gray-800 font-mono text-xs">{entry.event}</td>
                    <td className="px-4 py-2 text-gray-500 font-mono text-xs">{entry.draftId?.slice(0, 8)}...</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{new Date(entry.ts).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
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
    <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="font-semibold text-gray-900">{draft.title || 'Untitled'}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {draft.platforms.join(', ')} · {draft.submittedBy} · {new Date(draft.createdAt).toLocaleString()}
          </div>
          {draft.scheduledFor && (
            <div className="text-xs text-purple-600 mt-0.5">Scheduled for: {new Date(draft.scheduledFor).toLocaleString()}</div>
          )}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-medium">pending</span>
      </div>

      <div className="bg-white border border-gray-200 rounded p-3 text-sm text-gray-700 mb-3 whitespace-pre-wrap">
        {draft.content}
      </div>

      {!rejectMode ? (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={loading}
            className="px-4 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Approving…' : '✅ Approve'}
          </button>
          <button
            onClick={() => setRejectMode(true)}
            disabled={loading}
            className="px-4 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
          >
            ❌ Reject
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (optional)"
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { onReject(rejectReason); setRejectMode(false); }}
              disabled={loading}
              className="px-4 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 disabled:opacity-50"
            >
              Confirm Reject
            </button>
            <button
              onClick={() => setRejectMode(false)}
              className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
