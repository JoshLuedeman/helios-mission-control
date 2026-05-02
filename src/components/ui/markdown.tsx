"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
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
        p: ({ children }) => (
          <p className="text-sm text-foreground/85 leading-relaxed mb-3">{children}</p>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-zeus-purple hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
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
              <li className="flex items-start gap-2 text-sm">
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
            <li className="flex items-start gap-2 text-sm">
              <span className="text-zeus-purple/50 mt-0.5">›</span>
              <span className="text-foreground/85">{children}</span>
            </li>
          );
        },
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="block rounded-lg bg-void border border-border-dim p-3 font-mono text-xs text-foreground/80 overflow-x-auto mb-3">
                {children}
              </code>
            );
          }
          return (
            <code className="rounded bg-zeus-purple/10 text-zeus-purple px-1.5 py-0.5 font-mono text-xs">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="mb-3">{children}</pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-zeus-purple/30 pl-4 my-3 text-sm text-muted-foreground italic">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-xs font-mono border-collapse">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b border-border-dim">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-3 py-1.5 text-foreground/80 border-b border-border-dim/30">
            {children}
          </td>
        ),
        hr: () => <hr className="border-border-dim my-4" />,
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-foreground/75">{children}</em>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
