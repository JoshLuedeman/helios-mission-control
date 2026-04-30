"use client";

import { useState } from "react";
import { formatFileSize } from "@/lib/format";

interface DocItem {
  title: string;
  path: string;
  directory: string;
  content: string;
  wordCount: number;
  modifiedAt: string;
  sizeBytes: number;
}

const DIR_COLORS: Record<string, string> = {
  docs: "bg-zeus-purple/10 text-zeus-purple",
  articles: "bg-helios-amber/10 text-helios-amber",
  content: "bg-status-oneshot/10 text-status-oneshot",
  workspace: "bg-status-scheduled/10 text-status-scheduled",
};

export function DocsClient({ docs }: { docs: DocItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [filterDir, setFilterDir] = useState<string | null>(null);

  const directories = Array.from(new Set(docs.map((d) => d.directory)));

  const filtered = docs.filter((d) => {
    if (filterDir && d.directory !== filterDir) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.content.toLowerCase().includes(q) ||
        d.path.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">📄 Documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {docs.length} documents · {docs.reduce((s, d) => s + d.wordCount, 0).toLocaleString()} words total
        </p>
      </div>

      {/* Search + Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md rounded-lg border border-border-dim bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-zeus-purple focus:outline-none focus:ring-1 focus:ring-zeus-purple font-mono"
        />
        <div className="flex gap-1">
          <button
            onClick={() => setFilterDir(null)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              !filterDir ? "bg-zeus-purple/20 text-zeus-purple" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {directories.map((dir) => (
            <button
              key={dir}
              onClick={() => setFilterDir(filterDir === dir ? null : dir)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filterDir === dir
                  ? "bg-zeus-purple/20 text-zeus-purple"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {dir}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Document List */}
        <div className="w-full max-w-lg space-y-2">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-border-dim bg-surface p-8 text-center text-muted-foreground">
              {searchQuery ? "No matching documents" : "No documents found"}
            </div>
          ) : (
            filtered.map((doc) => (
              <button
                key={doc.path}
                onClick={() => setSelectedDoc(doc)}
                className={`w-full rounded-xl border bg-surface p-4 text-left transition-all hover:bg-elevated ${
                  selectedDoc?.path === doc.path
                    ? "border-zeus-purple/50"
                    : "border-border-dim hover:border-border-bright"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{doc.title}</div>
                    <div className="mt-1 font-mono text-[11px] text-muted-foreground truncate">
                      {doc.path}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono ${DIR_COLORS[doc.directory] || ""}`}>
                    {doc.directory}
                  </span>
                </div>
                <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground font-mono">
                  <span>{doc.wordCount.toLocaleString()} words</span>
                  <span>{formatFileSize(doc.sizeBytes)}</span>
                  <span>{new Date(doc.modifiedAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Document Viewer */}
        {selectedDoc && (
          <div className="flex-1 rounded-xl border border-border-dim bg-surface p-6 sticky top-8 self-start max-h-[calc(100vh-8rem)] overflow-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{selectedDoc.title}</h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                ✕
              </button>
            </div>
            <div className="mb-3 flex gap-2 text-[10px] font-mono text-muted-foreground">
              <span className={`rounded-full px-2 py-0.5 ${DIR_COLORS[selectedDoc.directory] || ""}`}>
                {selectedDoc.directory}
              </span>
              <span>{selectedDoc.wordCount.toLocaleString()} words</span>
              <span>{formatFileSize(selectedDoc.sizeBytes)}</span>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground mb-4">{selectedDoc.path}</div>
            <div className="border-t border-border-dim pt-4">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-mono">
                {selectedDoc.content}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
