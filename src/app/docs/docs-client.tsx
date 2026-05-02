"use client";

import { useState, useCallback } from "react";
import { formatFileSize } from "@/lib/format";
import { Markdown } from "@/components/ui/markdown";
import { toast } from "sonner";

interface DocItem {
  title: string;
  path: string;
  directory: string;
  content: string;
  wordCount: number;
  modifiedAt: string;
  sizeBytes: number;
}

interface BrainItem {
  title: string;
  path: string;
  absolutePath: string;
  folder: string;
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

const BRAIN_FOLDER_COLORS: Record<string, string> = {
  "00-CORE": "bg-destructive/10 text-destructive",
  "05-INBOX": "bg-status-watch/10 text-status-watch",
  "10-LIBRARIES": "bg-status-scheduled/10 text-status-scheduled",
  "20-CONTEXTS": "bg-zeus-purple/10 text-zeus-purple",
  "30-PROJECTS": "bg-status-online/10 text-status-online",
  "90-WORKBENCH": "bg-helios-amber/10 text-helios-amber",
  "95-SOURCES": "bg-muted text-muted-foreground",
};

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  fileCount: number;
}

export function DocsClient({
  docs: initialDocs,
  brainFiles,
  brainMounted,
  brainTree,
}: {
  docs: DocItem[];
  brainFiles: BrainItem[];
  brainMounted: boolean;
  brainTree: FolderNode[];
}) {
  const [docs, setDocs] = useState(initialDocs);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<(DocItem | BrainItem) & { source: "workspace" | "brain" } | null>(null);
  const [filterDir, setFilterDir] = useState<string | null>(null);
  const [selectedBrainPath, setSelectedBrainPath] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"workspace" | "brain">("workspace");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [showPreview, setShowPreview] = useState(true);

  const directories = Array.from(new Set(docs.map((d) => d.directory)));

  const filteredDocs = docs.filter((d) => {
    if (filterDir && d.directory !== filterDir) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q) || d.path.toLowerCase().includes(q);
    }
    return true;
  });

  const filteredBrain = brainFiles.filter((b) => {
    if (selectedBrainPath && !b.path.startsWith(selectedBrainPath)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.content.toLowerCase().includes(q) || b.path.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreate = useCallback(async (data: { title: string; content: string; directory: string }) => {
    const res = await fetch("/api/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success(`Created "${data.title}"`);
      setShowCreate(false);
      // Refresh would be needed here — for now just notify
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed to create document");
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedDoc || selectedDoc.source !== "workspace") return;
    const res = await fetch("/api/docs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath: selectedDoc.path, content: editContent }),
    });
    if (res.ok) {
      toast.success("Saved");
      setDocs((prev) => prev.map((d) => d.path === selectedDoc.path ? { ...d, content: editContent, wordCount: editContent.split(/\s+/).length } : d));
      setSelectedDoc({ ...selectedDoc, content: editContent });
      setEditing(false);
    } else {
      toast.error("Failed to save");
    }
  }, [selectedDoc, editContent]);

  const handleDelete = useCallback(async () => {
    if (!selectedDoc || selectedDoc.source !== "workspace") return;
    const res = await fetch(`/api/docs?path=${encodeURIComponent(selectedDoc.path)}`, { method: "DELETE" });
    if (res.ok) {
      toast.success(`Deleted "${selectedDoc.title}"`);
      setDocs((prev) => prev.filter((d) => d.path !== selectedDoc.path));
      setSelectedDoc(null);
    } else {
      toast.error("Failed to delete");
    }
  }, [selectedDoc]);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">📄 Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {docs.length} workspace docs
            {brainMounted && ` · ${brainFiles.length} brain files`}
            {!brainMounted && " · 🧠 brain not mounted"}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-zeus-purple px-4 py-2 text-sm font-medium text-white hover:bg-zeus-purple/80 transition-colors"
        >
          + New Doc
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="mb-6 rounded-xl border border-zeus-purple/30 bg-surface p-5">
          <CreateDocForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
        </div>
      )}

      {/* Section Toggle + Search */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="flex gap-1 rounded-lg bg-surface p-1">
          <button
            onClick={() => { setActiveSection("workspace"); setFilterDir(null); }}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeSection === "workspace" ? "bg-zeus-purple/20 text-zeus-purple" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Workspace ({docs.length})
          </button>
          {brainMounted && (
            <button
              onClick={() => { setActiveSection("brain"); setFilterDir(null); }}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                activeSection === "brain" ? "bg-zeus-purple/20 text-zeus-purple" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🧠 Brain ({brainFiles.length})
            </button>
          )}
        </div>
        <input
          type="text"
          placeholder={`Search ${activeSection} docs...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 max-w-md rounded-lg border border-border-dim bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-zeus-purple focus:outline-none focus:ring-1 focus:ring-zeus-purple font-mono"
        />
      </div>

      {/* Folder Filters (workspace) or Folder Tree (brain) */}
      {activeSection === "workspace" && (
        <div className="mb-4 flex gap-1 flex-wrap">
          <button
            onClick={() => setFilterDir(null)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              !filterDir ? "bg-zeus-purple/20 text-zeus-purple" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {directories.map((dir) => (
            <button
              key={dir}
              onClick={() => setFilterDir(filterDir === dir ? null : dir)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filterDir === dir ? "bg-zeus-purple/20 text-zeus-purple" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {dir}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-4">
        {/* Brain Folder Tree (left sidebar when in brain mode) */}
        {activeSection === "brain" && brainTree.length > 0 && (
          <div className="w-56 shrink-0 rounded-xl border border-border-dim bg-surface p-3 self-start sticky top-8 max-h-[calc(100vh-12rem)] overflow-auto">
            <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-2">📁 FOLDERS</div>
            <button
              onClick={() => setSelectedBrainPath(null)}
              className={`w-full text-left rounded px-2 py-1 text-xs transition-colors mb-1 ${
                !selectedBrainPath ? "bg-zeus-purple/10 text-zeus-purple font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All files ({brainFiles.length})
            </button>
            {brainTree.map((node) => (
              <FolderTreeNode
                key={node.path}
                node={node}
                selectedPath={selectedBrainPath}
                onSelect={setSelectedBrainPath}
                depth={0}
              />
            ))}
          </div>
        )}

        {/* Document List — expandable cards */}
        <div className="flex-1 space-y-2">
          {activeSection === "workspace" ? (
            filteredDocs.length === 0 ? (
              <div className="rounded-xl border border-border-dim bg-surface p-8 text-center text-muted-foreground">
                {searchQuery ? "No matching documents" : "No documents found"}
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <ExpandableDocCard
                  key={doc.path}
                  title={doc.title}
                  path={doc.path}
                  badge={doc.directory}
                  badgeColor={DIR_COLORS[doc.directory] || ""}
                  wordCount={doc.wordCount}
                  sizeBytes={doc.sizeBytes}
                  modifiedAt={doc.modifiedAt}
                  content={doc.content}
                  source="workspace"
                  isExpanded={selectedDoc?.path === doc.path}
                  onToggle={() => {
                    if (selectedDoc?.path === doc.path) {
                      setSelectedDoc(null);
                      setEditing(false);
                    } else {
                      setSelectedDoc({ ...doc, source: "workspace" });
                      setEditing(false);
                    }
                  }}
                  editing={selectedDoc?.path === doc.path && editing}
                  editContent={editContent}
                  showPreview={showPreview}
                  onEdit={() => { setEditing(true); setEditContent(doc.content); }}
                  onSave={handleSave}
                  onCancelEdit={() => setEditing(false)}
                  onTogglePreview={() => setShowPreview(!showPreview)}
                  onEditContentChange={setEditContent}
                  onDelete={handleDelete}
                />
              ))
            )
          ) : (
            filteredBrain.length === 0 ? (
              <div className="rounded-xl border border-border-dim bg-surface p-8 text-center text-muted-foreground">
                {searchQuery ? "No matching brain files" : "No brain files found"}
              </div>
            ) : (
              filteredBrain.map((bf) => (
                <ExpandableDocCard
                  key={bf.path}
                  title={bf.title}
                  path={bf.path}
                  badge={bf.folder}
                  badgeColor={BRAIN_FOLDER_COLORS[bf.folder] || "bg-muted text-muted-foreground"}
                  wordCount={bf.wordCount}
                  sizeBytes={bf.sizeBytes}
                  modifiedAt={bf.modifiedAt}
                  content={bf.content}
                  source="brain"
                  isExpanded={selectedDoc?.path === bf.path}
                  onToggle={() => {
                    if (selectedDoc?.path === bf.path) {
                      setSelectedDoc(null);
                      setEditing(false);
                    } else {
                      setSelectedDoc({ ...bf, source: "brain" });
                      setEditing(false);
                    }
                  }}
                  editing={false}
                  editContent=""
                  showPreview={true}
                  onEdit={() => {}}
                  onSave={() => {}}
                  onCancelEdit={() => {}}
                  onTogglePreview={() => {}}
                  onEditContentChange={() => {}}
                  onDelete={() => {}}
                />
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}

function ExpandableDocCard({
  title, path, badge, badgeColor, wordCount, sizeBytes, modifiedAt, content,
  source, isExpanded, onToggle,
  editing, editContent, showPreview,
  onEdit, onSave, onCancelEdit, onTogglePreview, onEditContentChange, onDelete,
}: {
  title: string; path: string; badge: string; badgeColor: string;
  wordCount: number; sizeBytes: number; modifiedAt: string; content: string;
  source: "workspace" | "brain";
  isExpanded: boolean; onToggle: () => void;
  editing: boolean; editContent: string; showPreview: boolean;
  onEdit: () => void; onSave: () => void; onCancelEdit: () => void;
  onTogglePreview: () => void; onEditContentChange: (v: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className={`rounded-xl border bg-surface overflow-hidden transition-colors ${
      isExpanded ? "border-zeus-purple/40" : "border-border-dim hover:border-border-bright"
    }`}>
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-elevated/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold truncate">{title}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono ${badgeColor}`}>
              {badge}
            </span>
            {source === "brain" && (
              <span className="rounded-full bg-helios-amber/10 text-helios-amber px-2 py-0.5 text-[10px] font-mono">🧠</span>
            )}
          </div>
          <div className="flex gap-3 text-[10px] text-muted-foreground font-mono">
            <span>{path}</span>
            <span>{wordCount.toLocaleString()} words</span>
            <span>{formatFileSize(sizeBytes)}</span>
            <span>{new Date(modifiedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <span className="text-muted-foreground text-xs shrink-0">{isExpanded ? "▼" : "▶"}</span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border-dim">
          {/* Action bar */}
          <div className="flex items-center gap-2 px-5 py-2 bg-elevated/30">
            {source === "workspace" && !editing && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="rounded-md bg-zeus-purple/10 px-3 py-1 text-xs font-medium text-zeus-purple hover:bg-zeus-purple/20 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="text-muted-foreground/50 hover:text-destructive text-xs px-1 transition-colors"
                >
                  🗑 Delete
                </button>
              </>
            )}
            {source === "brain" && (
              <span className="rounded-md bg-muted px-3 py-1 text-[10px] font-mono text-muted-foreground">
                🔒 READ ONLY
              </span>
            )}
            {editing && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onTogglePreview(); }}
                  className="rounded-md bg-elevated px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPreview ? "Source" : "Preview"}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onSave(); }}
                  className="rounded-md bg-zeus-purple px-3 py-1 text-xs font-medium text-white hover:bg-zeus-purple/80 transition-colors"
                >
                  💾 Save
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onCancelEdit(); }}
                  className="text-muted-foreground hover:text-foreground text-xs px-1"
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          {/* Content */}
          <div className="px-5 py-4 bg-void/50">
            {editing ? (
              showPreview ? (
                <Markdown content={editContent} />
              ) : (
                <textarea
                  value={editContent}
                  onChange={(e) => onEditContentChange(e.target.value)}
                  className="w-full h-96 rounded-lg border border-border-dim bg-void p-4 font-mono text-sm text-foreground resize-y focus:border-zeus-purple focus:outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              )
            ) : (
              <Markdown content={content} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CreateDocForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: { title: string; content: string; directory: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [directory, setDirectory] = useState("docs");

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (title.trim()) onSubmit({ title, content, directory }); }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-zeus-purple tracking-wider">NEW DOCUMENT</span>
        <button type="button" onClick={onCancel} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-3">
          <input
            type="text"
            placeholder="Document title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-border-dim bg-void px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-zeus-purple focus:outline-none"
            autoFocus
          />
        </div>
        <select
          value={directory}
          onChange={(e) => setDirectory(e.target.value)}
          className="rounded border border-border-dim bg-void px-2 py-2 text-xs text-foreground"
        >
          <option value="docs">docs/</option>
          <option value="articles">articles/</option>
          <option value="content">content/</option>
        </select>
      </div>
      <textarea
        placeholder="Start writing... (markdown supported)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-border-dim bg-void px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-zeus-purple focus:outline-none resize-none font-mono"
      />
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-md bg-zeus-purple px-4 py-1.5 text-xs font-medium text-white hover:bg-zeus-purple/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Create Document
        </button>
      </div>
    </form>
  );
}

function FolderTreeNode({
  node,
  selectedPath,
  onSelect,
  depth,
}: {
  node: FolderNode;
  selectedPath: string | null;
  onSelect: (path: string | null) => void;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const isSelected = selectedPath === node.path;
  const hasChildren = node.children.length > 0;
  const totalFiles = node.fileCount + node.children.reduce((s, c) => s + c.fileCount, 0);

  return (
    <div>
      <button
        onClick={() => {
          if (isSelected) {
            onSelect(null);
          } else {
            onSelect(node.path);
          }
          if (hasChildren) setExpanded(!expanded);
        }}
        className={`w-full text-left rounded px-2 py-1 text-xs transition-colors flex items-center gap-1 ${
          isSelected ? "bg-zeus-purple/10 text-zeus-purple font-medium" : "text-muted-foreground hover:text-foreground"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {hasChildren && (
          <span className="text-[10px] text-muted-foreground/50 w-3">{expanded ? "▼" : "▶"}</span>
        )}
        {!hasChildren && <span className="w-3" />}
        <span className="truncate flex-1">{node.name}</span>
        {totalFiles > 0 && (
          <span className="text-[10px] text-muted-foreground/50 shrink-0">{totalFiles}</span>
        )}
      </button>
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <FolderTreeNode
              key={child.path}
              node={child}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
