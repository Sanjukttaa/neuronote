import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, FileText, Layers, ClipboardList, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/bookmarks")({
  head: () => ({ meta: [{ title: "Bookmarks — NeuroNote AI" }] }),
  component: BookmarksPage,
});

type Row = { id: string; entity_type: string; entity_id: string; created_at: string; label?: string };

const icons: Record<string, any> = { file: FileText, summary: FileText, flashcard: Layers, quiz: ClipboardList };
const routes: Record<string, string> = { file: "/uploads", summary: "/summaries", flashcard: "/flashcards", quiz: "/quizzes" };

function BookmarksPage() {
  const [items, setItems] = useState<Row[]>([]);

  const load = async () => {
    const { data } = await supabase.from("bookmarks").select("*").order("created_at", { ascending: false });
    const rows = (data ?? []) as Row[];
    // Fetch labels in parallel
    const enriched = await Promise.all(rows.map(async (r) => {
      try {
        if (r.entity_type === "file") {
          const { data: f } = await supabase.from("files").select("name").eq("id", r.entity_id).maybeSingle();
          return { ...r, label: f?.name };
        }
        if (r.entity_type === "summary") {
          const { data: s } = await supabase.from("summaries").select("type,file_id").eq("id", r.entity_id).maybeSingle();
          return { ...r, label: s ? `${s.type} summary` : undefined };
        }
        if (r.entity_type === "flashcard") {
          const { data: c } = await supabase.from("flashcards").select("front").eq("id", r.entity_id).maybeSingle();
          return { ...r, label: c?.front?.slice(0, 60) };
        }
        if (r.entity_type === "quiz") {
          const { data: q } = await supabase.from("quizzes").select("title").eq("id", r.entity_id).maybeSingle();
          return { ...r, label: q?.title };
        }
      } catch {}
      return r;
    }));
    setItems(enriched);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    await supabase.from("bookmarks").delete().eq("id", id);
    toast.success("Removed");
    load();
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Bookmark className="h-6 w-6 text-primary" />
        <h1 className="font-display text-3xl font-semibold">Bookmarks</h1>
      </div>
      {items.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          You haven't bookmarked anything yet. Star summaries, flashcards, or quizzes to keep them handy.
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((b) => {
            const Icon = icons[b.entity_type] ?? Bookmark;
            return (
              <Card key={b.id} className="flex items-center gap-3 p-4">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{b.label ?? b.entity_id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{b.entity_type}</p>
                </div>
                <Button asChild size="sm" variant="ghost"><Link to={routes[b.entity_type] ?? "/dashboard"}>Open</Link></Button>
                <Button size="sm" variant="ghost" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4" /></Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
