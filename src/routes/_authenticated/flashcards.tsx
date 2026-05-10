import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/flashcards")({
  component: FlashcardsPage,
});

type Card = { id: string; front: string; back: string; file_id: string | null; mastered: boolean };
type FileOpt = { id: string; name: string };

function FlashcardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [files, setFiles] = useState<FileOpt[]>([]);
  const [picked, setPicked] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("flashcards")
      .select("id,front,back,file_id,mastered").order("created_at", { ascending: false });
    setCards((data as Card[]) ?? []);
  };
  useEffect(() => {
    load();
    supabase.from("files").select("id,name").order("created_at", { ascending: false })
      .then(({ data }) => setFiles((data as FileOpt[]) ?? []));
  }, []);

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
      toast.success(`Created ${j.count} cards`);
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setGenerating(false); }
  };

  const review = async (quality: number) => {
    const card = cards[idx];
    if (!card) return;
    // SM-2 lite
    await supabase.from("flashcards").update({
      mastered: quality >= 4,
      next_review_at: new Date(Date.now() + (quality >= 4 ? 3 : 1) * 86400000).toISOString(),
    }).eq("id", card.id);
    setFlipped(false);
    setIdx((i) => (i + 1) % cards.length);
  };

  const card = cards[idx];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Flashcards</h1>
          <p className="text-sm text-muted-foreground">{cards.length} cards · {cards.filter(c=>c.mastered).length} mastered</p>
        </div>
        <div className="flex gap-2">
          <Select value={picked} onValueChange={setPicked}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Pick a file" /></SelectTrigger>
            <SelectContent>
              {files.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={generate} disabled={generating || !picked}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-1 h-4 w-4" />Generate</>}
          </Button>
        </div>
      </div>

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
          <p className="text-center text-xs text-muted-foreground">
            Card {idx + 1} of {cards.length} · click to flip
          </p>
        </div>
      ) : (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          No flashcards yet. <Link to="/uploads" className="text-primary underline">Upload a note</Link>, then generate.
        </Card>
      )}
    </div>
  );
}
