"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Convert Obsidian wiki-links to standard markdown links.
 * [[target]] → [target](#brain:target)
 * [[target|display]] → [display](#brain:target)
 * [[path/to/page|display]] → [display](#brain:path/to/page)
 */
function preprocessWikiLinks(content: string): string {
  return content.replace(/\[\[([^\]]+?)\]\]/g, (_, inner: string) => {
    const parts = inner.split("|");
    const target = parts[0].trim();
    const display = parts.length > 1 ? parts[1].trim() : target;
    // Encode the target as a brain: prefixed anchor that we'll intercept
    return `[${display}](#brain:${encodeURIComponent(target)})`;
  });
}

function resolveImageSrc(src: unknown) {
  if (typeof src !== 'string' || !src) return '';
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:')) {
    return src;
  }
  if (src.startsWith('/Users/') || src.startsWith('/Volumes/') || src.startsWith('/private/') || src.startsWith('/tmp/')) {
    return `/api/social/media?path=${encodeURIComponent(src)}`;
  }
  return src;
}

export function Markdown({ content, onBrainNavigate }: { content: string; onBrainNavigate?: (target: string) => void }) {
  const router = useRouter();
  const processed = preprocessWikiLinks(content);
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({ children }) => (
          <h1 className="text-xl font-bold text-foreground mt-6 mb-3 font-sans border-b border-border-dim pb-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-semibold text-helios-amber mt-5 mb-2 font-sans">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold text-zeus-purple mt-4 mb-1.5 font-sans">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-sm font-medium text-foreground/90 mt-3 mb-1 font-sans">
            {children}
          </h4>
        ),
        h5: ({ children }) => (
          <h5 className="text-xs font-medium text-foreground/80 mt-2 mb-1 font-sans">
            {children}
          </h5>
        ),
        p: ({ children }) => (
          <p className="text-sm text-foreground/85 leading-relaxed mb-3">{children}</p>
        ),
        a: ({ href, children }) => {
          // Intercept brain wiki-links
          if (href?.startsWith("#brain:")) {
            const target = decodeURIComponent(href.slice(7));
            return (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (onBrainNavigate) {
                    onBrainNavigate(target);
                  } else {
                    // Navigate to docs page with brain search
                    router.push(`/docs?brain=${encodeURIComponent(target)}`);
                  }
                }}
                className="text-zeus-purple hover:text-zeus-purple/80 underline decoration-zeus-purple/30 hover:decoration-zeus-purple/60 transition-colors cursor-pointer"
              >
                {children}
              </button>
            );
          }
          return (
            <a
              href={href}
              className="text-zeus-purple hover:text-zeus-purple/80 underline decoration-zeus-purple/30 hover:decoration-zeus-purple/60 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          );
        },
        img: ({ src, alt }) => {
          const resolvedSrc = resolveImageSrc(src);
          return (
            <span className="block my-3 max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedSrc}
                alt={alt || ""}
                className="w-full max-w-full max-h-80 object-contain rounded-lg border border-border-dim bg-void"
                loading="lazy"
              />
              {alt && <span className="block text-xs text-muted-foreground mt-1 italic">{alt}</span>}
            </span>
          );
        },
        ul: ({ children }) => (
          <ul className="space-y-1 mb-3 ml-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="space-y-1 mb-3 ml-1 list-decimal list-inside">{children}</ol>
        ),
        li: ({ children }) => {
          const text = String(children);
          const isChecked = text.startsWith("☑") || text.includes("[x]");
          const isUnchecked = text.startsWith("☐") || text.includes("[ ]");
          if (isChecked || isUnchecked) {
            return (
              <li className="flex items-start gap-2 text-sm list-none">
                <span className={isChecked ? "text-status-online" : "text-muted-foreground"}>
                  {isChecked ? "✓" : "○"}
                </span>
                <span className={isChecked ? "text-muted-foreground line-through" : "text-foreground/85"}>
                  {children}
                </span>
              </li>
            );
          }
          return (
            <li className="flex items-start gap-2 text-sm list-none">
              <span className="text-zeus-purple/50 mt-0.5 shrink-0">›</span>
              <span className="text-foreground/85">{children}</span>
            </li>
          );
        },
        code: ({ className, children }) => {
          const match = /language-(\w+)/.exec(className || "");
          const lang = match?.[1];

          // Mermaid diagrams
          if (lang === "mermaid") {
            return <MermaidBlock code={String(children).trim()} />;
          }

          // Block code (fenced)
          if (lang || (className && className.includes("language-"))) {
            return (
              <code className="block rounded-lg bg-void border border-border-dim p-3 font-mono text-xs text-foreground/80 overflow-x-auto mb-3 whitespace-pre">
                {children}
              </code>
            );
          }
          // Inline code
          return (
            <code className="rounded bg-zeus-purple/10 text-zeus-purple px-1.5 py-0.5 font-mono text-xs">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="mb-3 overflow-x-auto">{children}</pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-zeus-purple/30 pl-4 my-3 text-sm text-muted-foreground italic">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-3 rounded-lg border border-border-dim">
            <table className="w-full text-xs font-mono border-collapse">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-elevated/50 border-b border-border-dim">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="text-left px-3 py-2 text-muted-foreground font-medium">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-1.5 text-foreground/80 border-b border-border-dim/30">
            {children}
          </td>
        ),
        tr: ({ children }) => (
          <tr className="hover:bg-elevated/30 transition-colors">{children}</tr>
        ),
        hr: () => <hr className="border-border-dim my-4" />,
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-foreground/75">{children}</em>
        ),
        del: ({ children }) => (
          <del className="line-through text-muted-foreground">{children}</del>
        ),
        input: ({ checked, type }) => {
          if (type === "checkbox") {
            return (
              <span className={`inline-block mr-1 ${checked ? "text-status-online" : "text-muted-foreground"}`}>
                {checked ? "✓" : "○"}
              </span>
            );
          }
          return null;
        },
      }}
    >
      {processed}
    </ReactMarkdown>
  );
}

function MermaidBlock({ code }: { code: string }) {
  const [rendered, setRendered] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Lazy-load mermaid on first render
  useState(() => {
    if (typeof window !== "undefined") {
      import("mermaid").then((mod) => {
        const mermaid = mod.default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          themeVariables: {
            primaryColor: "#8b5cf6",
            primaryTextColor: "#e8e8f0",
            primaryBorderColor: "#4a4a6a",
            lineColor: "#4a4a6a",
            secondaryColor: "#1a1a28",
            tertiaryColor: "#12121a",
            background: "#0a0a0f",
            mainBkg: "#12121a",
            nodeBorder: "#4a4a6a",
            clusterBkg: "#1a1a28",
            titleColor: "#e8e8f0",
            edgeLabelBackground: "#12121a",
          },
        });
        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        mermaid.render(id, code).then(({ svg }) => {
          setRendered(svg);
        }).catch((err) => {
          setError(String(err));
        });
      }).catch(() => {
        setError("Failed to load mermaid");
      });
    }
  });

  if (error) {
    return (
      <div className="rounded-lg bg-void border border-destructive/30 p-3 mb-3">
        <div className="text-[10px] font-mono text-destructive mb-1">MERMAID ERROR</div>
        <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{code}</pre>
      </div>
    );
  }

  if (rendered) {
    return (
      <div
        className="my-3 overflow-x-auto rounded-lg border border-border-dim bg-void/50 p-4 [&_svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: rendered }}
      />
    );
  }

  return (
    <div className="rounded-lg bg-void border border-border-dim p-3 mb-3 animate-pulse">
      <div className="text-xs text-muted-foreground">Rendering diagram…</div>
    </div>
  );
}
