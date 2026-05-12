import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FoldersPanel, MoveToFolder } from "@/components/FoldersPanel";

export const Route = createFileRoute("/_authenticated/quizzes")({ component: QuizzesPage });

type Quiz = { id: string; title: string; difficulty: string; created_at: string; folder_id: string | null };
type Question = { id: string; stem: string; options: string[]; answer: string; explanation: string };
type FileOpt = { id: string; name: string; folder_id: string | null };

function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [files, setFiles] = useState<FileOpt[]>([]);
  const [picked, setPicked] = useState("");
  const [diff, setDiff] = useState("MEDIUM");
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [folder, setFolder] = useState<"all" | "unfiled" | string>("all");

  const load = async () => {
    const { data } = await supabase.from("quizzes")
      .select("id,title,difficulty,created_at,folder_id").order("created_at", { ascending: false });
    setQuizzes((data as Quiz[]) ?? []);
  };
  useEffect(() => {
    load();
    supabase.from("files").select("id,name,folder_id").order("created_at", { ascending: false })
      .then(({ data }) => setFiles((data as FileOpt[]) ?? []));
  }, []);

  const filtered = useMemo(() => {
    if (folder === "all") return quizzes;
    if (folder === "unfiled") return quizzes.filter((q) => !q.folder_id);
    return quizzes.filter((q) => q.folder_id === folder);
  }, [quizzes, folder]);

  const counts = useMemo(() => {
    const byFolder: Record<string, number> = {};
    let unfiled = 0;
    for (const q of quizzes) {
      if (q.folder_id) byFolder[q.folder_id] = (byFolder[q.folder_id] || 0) + 1;
      else unfiled++;
    }
    return { all: quizzes.length, unfiled, byFolder };
  }, [quizzes]);

  const generate = async () => {
    if (!picked) return toast.error("Pick a file first");
    setBusy(true);
    try {
      const { data: s } = await supabase.auth.getSession();
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-process`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${s.session?.access_token}` },
        body: JSON.stringify({ action: "quiz", fileId: picked, difficulty: diff }),
      });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      const file = files.find((f) => f.id === picked);
      if (file?.folder_id) {
        await supabase.from("quizzes").update({ folder_id: file.folder_id })
          .eq("file_id", picked).is("folder_id", null);
      }
      toast.success(`Quiz ready (${j.count} questions)`);
      await load();
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };

  const open = async (q: Quiz) => {
    const { data } = await supabase.from("questions")
      .select("id,stem,options,answer,explanation").eq("quiz_id", q.id).order("order");
    setActive(q);
    setQuestions((data as any) ?? []);
    setAnswers({}); setSubmitted(false);
  };

  const score = submitted ? questions.filter(q => answers[q.id] === q.answer).length : 0;

  const submit = async () => {
    setSubmitted(true);
    if (!active) return;
    const { data: s } = await supabase.auth.getSession();
    await supabase.from("quiz_attempts").insert({
      user_id: s.session?.user.id!, quiz_id: active.id,
      answers, score: score / Math.max(1, questions.length),
    });
    await supabase.from("study_sessions").insert({
      user_id: s.session?.user.id!, type: "quiz", duration_seconds: 60, xp_earned: score * 10,
    });
  };

  if (active) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-4 p-6">
        <Button variant="ghost" onClick={() => setActive(null)}>← Back</Button>
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold">{active.title}</h1>
          <MoveToFolder table="quizzes" id={active.id} currentFolderId={active.folder_id} onMoved={load} />
        </div>
        <Badge>{active.difficulty}</Badge>
        {submitted && (
          <Card className="p-4 text-center">
            <div className="font-display text-3xl">{score} / {questions.length}</div>
            <p className="text-sm text-muted-foreground">{Math.round((score / Math.max(1,questions.length))*100)}%</p>
          </Card>
        )}
        <div className="space-y-4">
          {questions.map((q, qi) => {
            const picked = answers[q.id];
            return (
              <Card key={q.id} className="p-4">
                <p className="mb-3 font-medium">{qi + 1}. {q.stem}</p>
                <div className="grid gap-2">
                  {(q.options ?? []).map(opt => {
                    const correct = submitted && opt === q.answer;
                    const wrong = submitted && picked === opt && opt !== q.answer;
                    return (
                      <button key={opt} disabled={submitted}
                        onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition
                        ${picked === opt ? "border-primary bg-primary/10" : "border-border"}
                        ${correct ? "border-success bg-success/10" : ""}
                        ${wrong ? "border-destructive bg-destructive/10" : ""}`}>
                        <span>{opt}</span>
                        {correct && <Check className="h-4 w-4 text-success" />}
                        {wrong && <X className="h-4 w-4 text-destructive" />}
                      </button>
                    );
                  })}
                </div>
                {submitted && q.explanation && (
                  <p className="mt-2 text-xs text-muted-foreground">💡 {q.explanation}</p>
                )}
              </Card>
            );
          })}
        </div>
        {!submitted && <Button className="w-full" onClick={submit}>Submit</Button>}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Quizzes</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} quizzes</p>
        </div>
        <div className="flex gap-2">
          <Select value={picked} onValueChange={setPicked}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Pick a file" /></SelectTrigger>
            <SelectContent>{files.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={diff} onValueChange={setDiff}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generate} disabled={busy || !picked}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-1 h-4 w-4" />Generate</>}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <FoldersPanel selected={folder} onSelect={setFolder} counts={counts} />

        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map(q => (
            <motion.div key={q.id} whileHover={{ y: -2 }}>
              <Card className="cursor-pointer p-4" onClick={() => open(q)}>
                <div className="flex items-start justify-between">
                  <h3 className="font-medium">{q.title}</h3>
                  <Badge variant="secondary">{q.difficulty}</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(q.created_at).toLocaleString()}</p>
              </Card>
            </motion.div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground">{quizzes.length === 0 ? <>No quizzes yet. <Link to="/uploads" className="text-primary underline">Upload a note</Link>.</> : "No quizzes in this folder."}</p>}
        </div>
      </div>
    </div>
  );
}
