import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { BookmarkButton } from "@/components/BookmarkButton";
import { FoldersPanel, MoveToFolder } from "@/components/FoldersPanel";

export const Route = createFileRoute("/_authenticated/summaries")({
  component: SummariesPage,
});

type Row = {
  id: string;
  type: string;
  content: string;
  word_count: number | null;
  created_at: string;
  file_id: string;
  folder_id: string | null;
};

type FileLite = { id: string; name: string };

const LENGTHS = ["SHORT", "MEDIUM", "LONG"] as const;
type Length = typeof LENGTHS[number];

type Group = {
  file_id: string;
  fileName: string;
  folder_id: string | null;
  byType: Partial<Record<Length, Row>>;
  latest: Row;
};

function SummariesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [files, setFiles] = useState<Record<string, FileLite>>({});
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activeLen, setActiveLen] = useState<Length>("SHORT");
  const [folder, setFolder] = useState<"all" | "unfiled" | string>("all");
  const [generating, setGenerating] = useState<Length | null>(null);

  const load = async () => {
    const [{ data: sums }, { data: fs }] = await Promise.all([
      supabase.from("summaries").select("id,type,content,word_count,created_at,file_id,folder_id").order("created_at", { ascending: false }),
      supabase.from("files").select("id,name"),
    ]);
    setRows((sums as Row[]) ?? []);
    const map: Record<string, FileLite> = {};
    for (const f of (fs as FileLite[]) ?? []) map[f.id] = f;
    setFiles(map);
  };

  useEffect(() => { load(); }, []);

  const groups = useMemo<Group[]>(() => {
    const m = new Map<string, Group>();
    for (const r of rows) {
      const t = (r.type as Length);
      const g = m.get(r.file_id);
      if (!g) {
        m.set(r.file_id, {
          file_id: r.file_id,
          fileName: files[r.file_id]?.name ?? "Untitled",
          folder_id: r.folder_id,
          byType: LENGTHS.includes(t) ? { [t]: r } as any : {},
          latest: r,
        });
      } else {
        if (LENGTHS.includes(t) && !g.byType[t]) g.byType[t] = r;
        if (new Date(r.created_at) > new Date(g.latest.created_at)) g.latest = r;
      }
    }
    return Array.from(m.values()).sort((a, b) => +new Date(b.latest.created_at) - +new Date(a.latest.created_at));
  }, [rows, files]);

  const filtered = useMemo(() => {
    if (folder === "all") return groups;
    if (folder === "unfiled") return groups.filter((g) => !g.folder_id);
    return groups.filter((g) => g.folder_id === folder);
  }, [groups, folder]);

  const counts = useMemo(() => {
    const byFolder: Record<string, number> = {};
    let unfiled = 0;
    for (const g of groups) {
      if (g.folder_id) byFolder[g.folder_id] = (byFolder[g.folder_id] || 0) + 1;
      else unfiled++;
    }
    return { all: groups.length, unfiled, byFolder };
  }, [groups]);

  const activeGroup = filtered.find((g) => g.file_id === activeFileId) ?? null;
  const activeRow = activeGroup?.byType[activeLen] ?? activeGroup?.latest ?? null;

  const generate = async (fileId: string, len: Length) => {
    setGenerating(len);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-process`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.session?.access_token}` },
        body: JSON.stringify({ action: "summary", fileId, summaryType: len }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(`${len[0]}${len.slice(1).toLowerCase()} summary ready`);
      await load();
      setActiveLen(len);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl p-6">
      <h1 className="font-display text-3xl font-semibold">Summaries</h1>
      <p className="mb-6 text-sm text-muted-foreground">AI-generated summaries from your uploads.</p>
      <div className="grid gap-6 md:grid-cols-[200px_300px_1fr]">
        <FoldersPanel selected={folder} onSelect={setFolder} counts={counts} />

        <div className="space-y-2">
          {filtered.map((g) => (
            <motion.button
              key={g.file_id} whileHover={{ x: 2 }}
              onClick={() => {
                setActiveFileId(g.file_id);
                const firstAvail = LENGTHS.find((l) => g.byType[l]) ?? "SHORT";
                setActiveLen(firstAvail);
              }}
              className={`flex w-full items-start gap-2 rounded-lg border p-3 text-left ${activeFileId === g.file_id ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <FileText className="mt-0.5 h-4 w-4 text-ai" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{g.fileName}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1">
                  {LENGTHS.filter((l) => g.byType[l]).map((l) => (
                    <Badge key={l} variant="secondary" className="text-[10px]">{l}</Badge>
                  ))}
                  <span className="text-[10px] text-muted-foreground">{new Date(g.latest.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">{groups.length === 0 ? <>No summaries yet. <Link to="/uploads" className="text-primary underline">Upload a note</Link>.</> : "Empty folder."}</p>}
        </div>

        <Card className="p-6">
          {activeGroup && activeRow ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
                  {LENGTHS.map((l) => {
                    const has = !!activeGroup.byType[l];
                    const isActive = activeLen === l;
                    const isGen = generating === l;
                    return (
                      <Button
                        key={l}
                        size="sm"
                        variant={isActive ? "default" : "ghost"}
                        className="h-7 gap-1 text-xs"
                        disabled={!!generating}
                        onClick={() => has ? setActiveLen(l) : generate(activeGroup.file_id, l)}
                      >
                        {isGen ? <Loader2 className="h-3 w-3 animate-spin" /> : !has && <Sparkles className="h-3 w-3" />}
                        {l}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-1">
                  <MoveToFolder table="summaries" id={activeRow.id} currentFolderId={activeRow.folder_id} onMoved={load} />
                  <BookmarkButton entityType="summary" entityId={activeRow.id} />
                </div>
              </div>
              <article className="prose prose-invert max-w-none prose-headings:font-display">
                <ReactMarkdown>{activeRow.content}</ReactMarkdown>
              </article>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a summary to read.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
