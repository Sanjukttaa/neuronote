import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, FileText, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookmarkButton } from "@/components/BookmarkButton";
import { FoldersPanel, MoveToFolder } from "@/components/FoldersPanel";

export const Route = createFileRoute("/_authenticated/flashcards")({
  component: FlashcardsPage,
});

type Card = { id: string; front: string; back: string; file_id: string | null; mastered: boolean; folder_id: string | null };
type FileOpt = { id: string; name: string; folder_id: string | null };

function FlashcardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [files, setFiles] = useState<FileOpt[]>([]);
  const [picked, setPicked] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [folder, setFolder] = useState<"all" | "unfiled" | string>("all");
  const [activeDeck, setActiveDeck] = useState<string | "unfiled" | null>(null);

  const load = async () => {
    const { data } = await supabase.from("flashcards")
      .select("id,front,back,file_id,mastered,folder_id").order("created_at", { ascending: false });
    setCards((data as Card[]) ?? []);
  };
  useEffect(() => {
    load();
    supabase.from("files").select("id,name,folder_id").order("created_at", { ascending: false })
      .then(({ data }) => setFiles((data as FileOpt[]) ?? []));
  }, []);

  // Cards filtered by folder first
  const folderCards = useMemo(() => {
    if (folder === "all") return cards;
    if (folder === "unfiled") return cards.filter((c) => !c.folder_id);
    return cards.filter((c) => c.folder_id === folder);
  }, [cards, folder]);

  // Group folderCards into decks by file_id
  const decks = useMemo(() => {
    const fileMap = new Map(files.map((f) => [f.id, f.name] as const));
    const m = new Map<string, { key: string; fileId: string | null; name: string; cards: Card[] }>();
    for (const c of folderCards) {
      const key = c.file_id ?? "unfiled";
      const name = c.file_id ? (fileMap.get(c.file_id) ?? "Untitled file") : "Unfiled cards";
      const d = m.get(key) ?? { key, fileId: c.file_id, name, cards: [] };
      d.cards.push(c);
      m.set(key, d);
    }
    return Array.from(m.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [folderCards, files]);

  // Auto-select first deck
  useEffect(() => {
    if (!activeDeck && decks.length > 0) setActiveDeck(decks[0].key);
    if (activeDeck && !decks.find((d) => d.key === activeDeck)) {
      setActiveDeck(decks[0]?.key ?? null);
    }
    setIdx(0); setFlipped(false);
  }, [decks, activeDeck]);

  const activeCards = useMemo(
    () => decks.find((d) => d.key === activeDeck)?.cards ?? [],
    [decks, activeDeck]
  );

  useEffect(() => { setIdx(0); setFlipped(false); }, [activeDeck]);

  const counts = useMemo(() => {
    const byFolder: Record<string, number> = {};
    let unfiled = 0;
    for (const c of cards) {
      if (c.folder_id) byFolder[c.folder_id] = (byFolder[c.folder_id] || 0) + 1;
      else unfiled++;
    }
    return { all: cards.length, unfiled, byFolder };
  }, [cards]);

  // Files that don't have flashcards yet
  const filesWithCards = useMemo(() => {
    const s = new Set<string>();
    for (const c of cards) if (c.file_id) s.add(c.file_id);
    return s;
  }, [cards]);
  const availableFiles = useMemo(
    () => files.filter((f) => !filesWithCards.has(f.id)),
    [files, filesWithCards]
  );

  const generate = async () => {
    if (!picked) return toast.error("Pick a file first");
    setGenerating(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-process`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session?.access_token}` },
        body: JSON.stringify({ action: "flashcards", fileId: picked }),
      });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      const file = files.find((f) => f.id === picked);
      if (file?.folder_id) {
        await supabase.from("flashcards").update({ folder_id: file.folder_id })
          .eq("file_id", picked).is("folder_id", null);
      }
      toast.success(`Created ${j.count} cards`);
      setActiveDeck(picked);
      setPicked("");
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setGenerating(false); }
  };

  const review = async (quality: number) => {
    const card = activeCards[idx];
    if (!card) return;
    await supabase.from("flashcards").update({
      mastered: quality >= 4,
      next_review_at: new Date(Date.now() + (quality >= 4 ? 3 : 1) * 86400000).toISOString(),
    }).eq("id", card.id);
    setFlipped(false);
    setIdx((i) => (i + 1) % Math.max(1, activeCards.length));
    await load();
  };

  const card = activeCards[idx];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Flashcards</h1>
          <p className="text-sm text-muted-foreground">
            {activeCards.length} cards · {activeCards.filter(c => c.mastered).length} mastered
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={picked} onValueChange={setPicked}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder={availableFiles.length === 0 ? "All files have decks" : "Pick a file"} />
            </SelectTrigger>
            <SelectContent>
              {availableFiles.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">No files without flashcards</div>
              ) : availableFiles.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={generate} disabled={generating || !picked}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-1 h-4 w-4" />Generate</>}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[200px_240px_1fr]">
        <FoldersPanel selected={folder} onSelect={setFolder} counts={counts} />

        <div className="space-y-2">
          <div className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Decks</div>
          {decks.map((d) => {
            const mastered = d.cards.filter((c) => c.mastered).length;
            const isActive = activeDeck === d.key;
            return (
              <motion.button
                key={d.key} whileHover={{ x: 2 }}
                onClick={() => setActiveDeck(d.key)}
                className={`flex w-full items-start gap-2 rounded-lg border p-3 text-left ${isActive ? "border-primary bg-primary/5" : "border-border"}`}
              >
                {d.fileId ? <FileText className="mt-0.5 h-4 w-4 text-ai" /> : <Layers className="mt-0.5 h-4 w-4 text-muted-foreground" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{d.name}</div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">{d.cards.length} cards · {mastered} mastered</div>
                </div>
              </motion.button>
            );
          })}
          {decks.length === 0 && <p className="px-1 text-xs text-muted-foreground">No decks here.</p>}
        </div>

        <div>
          {card ? (
            <div className="space-y-4">
              <div className="relative mx-auto h-72 w-full max-w-2xl [perspective:1200px]">
                <motion.div
                  className="absolute inset-0 cursor-pointer [transform-style:preserve-3d]"
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 22 }}
                  onClick={() => setFlipped(f => !f)}
                >
                  <Card className="absolute inset-0 grid place-items-center p-8 text-center text-xl [backface-visibility:hidden]">
                    {card.front}
                  </Card>
                  <Card className="absolute inset-0 grid place-items-center bg-ai/10 p-8 text-center text-lg [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    {card.back}
                  </Card>
                </motion.div>
              </div>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => review(1)}>Again</Button>
                <Button variant="outline" onClick={() => review(3)}>Hard</Button>
                <Button onClick={() => review(4)}>Good</Button>
                <Button variant="secondary" onClick={() => review(5)}>Easy</Button>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <span>Card {idx + 1} of {activeCards.length} · click to flip</span>
                <MoveToFolder table="flashcards" id={card.id} currentFolderId={card.folder_id} onMoved={load} />
                <BookmarkButton entityType="flashcard" entityId={card.id} size="sm" />
              </div>
            </div>
          ) : (
            <Card className="p-12 text-center text-sm text-muted-foreground">
              {cards.length === 0
                ? <>No flashcards yet. <Link to="/uploads" className="text-primary underline">Upload a note</Link>, then generate.</>
                : "Pick a deck to start studying."}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
