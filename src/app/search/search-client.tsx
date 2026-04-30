"use client";

import { useState, useEffect, useRef } from "react";

interface SearchResult {
  source: string;
  type: "memory" | "doc" | "companion";
  title: string;
  snippet: string;
  lineNumber: number;
}

const TYPE_COLORS: Record<string, string> = {
  memory: "bg-helios-amber/10 text-helios-amber",
  doc: "bg-zeus-purple/10 text-zeus-purple",
  companion: "bg-status-scheduled/10 text-status-scheduled",
};

export function SearchClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const key = r.source;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">🔍 Search</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search across memory, documents, and companion files
        </p>
      </div>

      <input
        type="text"
        placeholder="Search everything... (e.g., &quot;calendar&quot;, &quot;Stratum&quot;, &quot;iMessage&quot;)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full max-w-2xl rounded-lg border border-border-dim bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-zeus-purple focus:outline-none focus:ring-1 focus:ring-zeus-purple font-mono"
        autoFocus
      />

      <div className="mt-6">
        {loading && (
          <div className="text-sm text-muted-foreground animate-pulse">Searching…</div>
        )}
        {!loading && query && results.length === 0 && (
          <div className="rounded-xl border border-border-dim bg-surface p-8 text-center text-muted-foreground">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}
        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <div className="text-xs font-mono text-muted-foreground">
              {results.length} result{results.length !== 1 ? "s" : ""} across {Object.keys(grouped).length} file{Object.keys(grouped).length !== 1 ? "s" : ""}
            </div>
            {Object.entries(grouped).map(([source, hits]) => (
              <div key={source} className="rounded-xl border border-border-dim bg-surface overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-elevated/50">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${TYPE_COLORS[hits[0].type] || ""}`}>
                    {hits[0].type.toUpperCase()}
                  </span>
                  <span className="font-mono text-xs text-foreground">{source}</span>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {hits.length} match{hits.length !== 1 ? "es" : ""}
                  </span>
                </div>
                <div className="divide-y divide-border-dim/50">
                  {hits.slice(0, 5).map((hit, i) => (
                    <div key={i} className="px-4 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] text-muted-foreground">L{hit.lineNumber}</span>
                        <span className="text-xs text-muted-foreground">{hit.title}</span>
                      </div>
                      <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed">
                        {highlightQuery(hit.snippet, query)}
                      </pre>
                    </div>
                  ))}
                  {hits.length > 5 && (
                    <div className="px-4 py-2 text-[10px] font-mono text-muted-foreground">
                      +{hits.length - 5} more matches
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function highlightQuery(text: string, query: string) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-zeus-purple/30 text-zeus-purple rounded px-0.5">
        {part}
      </span>
    ) : (
      part
    )
  );
}
