import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
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

function SummariesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [active, setActive] = useState<Row | null>(null);
  const [folder, setFolder] = useState<"all" | "unfiled" | string>("all");

  const load = () => supabase
    .from("summaries")
    .select("id,type,content,word_count,created_at,file_id,folder_id")
    .order("created_at", { ascending: false })
    .then(({ data }) => setRows((data as Row[]) ?? []));

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (folder === "all") return rows;
    if (folder === "unfiled") return rows.filter((r) => !r.folder_id);
    return rows.filter((r) => r.folder_id === folder);
  }, [rows, folder]);

  const counts = useMemo(() => {
    const byFolder: Record<string, number> = {};
    let unfiled = 0;
    for (const r of rows) {
      if (r.folder_id) byFolder[r.folder_id] = (byFolder[r.folder_id] || 0) + 1;
      else unfiled++;
    }
    return { all: rows.length, unfiled, byFolder };
  }, [rows]);

  return (
    <div className="mx-auto w-full max-w-7xl p-6">
      <h1 className="font-display text-3xl font-semibold">Summaries</h1>
      <p className="mb-6 text-sm text-muted-foreground">AI-generated summaries from your uploads.</p>
      <div className="grid gap-6 md:grid-cols-[200px_300px_1fr]">
        <FoldersPanel selected={folder} onSelect={setFolder} counts={counts} />

        <div className="space-y-2">
          {filtered.map((r) => (
            <motion.button
              key={r.id} whileHover={{ x: 2 }}
              onClick={() => setActive(r)}
              className={`flex w-full items-start gap-2 rounded-lg border p-3 text-left ${active?.id === r.id ? "border-primary bg-primary/5" : "border-border"}`}
            >
              <FileText className="mt-0.5 h-4 w-4 text-ai" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{r.content.slice(0, 60)}…</div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{r.type}</Badge>
                  <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">{rows.length === 0 ? <>No summaries yet. <Link to="/uploads" className="text-primary underline">Upload a note</Link>.</> : "Empty folder."}</p>}
        </div>

        <Card className="p-6">
          {active ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <Badge variant="secondary">{active.type}</Badge>
                <div className="flex items-center gap-1">
                  <MoveToFolder table="summaries" id={active.id} currentFolderId={active.folder_id} onMoved={load} />
                  <BookmarkButton entityType="summary" entityId={active.id} />
                </div>
              </div>
              <article className="prose prose-invert max-w-none prose-headings:font-display">
                <ReactMarkdown>{active.content}</ReactMarkdown>
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
