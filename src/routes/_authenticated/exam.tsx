import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { GraduationCap, Timer, Sparkles, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/exam")({
  head: () => ({ meta: [{ title: "Exam Mode — NeuroNote AI" }] }),
  component: ExamPage,
});

type Q = { id: string; stem: string; options: string[]; answer: string; explanation: string };

function ExamPage() {
  const [files, setFiles] = useState<{ id: string; name: string }[]>([]);
  const [fileId, setFileId] = useState<string>("");
  const [count, setCount] = useState("10");
  const [difficulty, setDifficulty] = useState("MEDIUM");
  const [generating, setGenerating] = useState(false);

  const [quizId, setQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idx, setIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    supabase.from("files").select("id,name").order("created_at", { ascending: false })
      .then(({ data }) => setFiles(data ?? []));
  }, []);

  useEffect(() => {
    if (!quizId || submitted || secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft((s) => (s <= 1 ? (handleSubmit(), 0) : s - 1)), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId, submitted, secondsLeft]);

  const startExam = async () => {
    if (!fileId) return toast.error("Pick a file first");
    setGenerating(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-process`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token ?? ""}` },
        body: JSON.stringify({ action: "quiz", fileId, difficulty, count: Number(count) }),
      });
      if (!r.ok) throw new Error(await r.text());
      const { quizId: qid } = await r.json();
      const { data: qs } = await supabase.from("questions")
        .select("id,stem,options,answer,explanation").eq("quiz_id", qid).order("order");
      setQuizId(qid);
      setQuestions((qs ?? []).map((q: any) => ({ ...q, options: q.options ?? [] })));
      setAnswers({});
      setIdx(0);
      setSubmitted(false);
      setSecondsLeft(Number(count) * 60);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to start exam");
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!quizId || submitted) return;
    const correct = questions.filter((q) => answers[q.id] === q.answer).length;
    const pct = questions.length ? correct / questions.length : 0;
    setScore(pct);
    setSubmitted(true);
    const elapsed = Number(count) * 60 - secondsLeft;
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      await supabase.from("quiz_attempts").insert({
        user_id: u.user.id, quiz_id: quizId, answers, score: pct, time_taken_seconds: elapsed,
      });
      await supabase.from("study_sessions").insert({
        user_id: u.user.id, type: "exam", duration_seconds: elapsed, xp_earned: Math.round(pct * 100),
      });
    }
  };

  const reset = () => { setQuizId(null); setQuestions([]); setSubmitted(false); };
  const current = questions[idx];
  const progress = useMemo(() => questions.length ? ((idx + 1) / questions.length) * 100 : 0, [idx, questions.length]);
  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const secs = (secondsLeft % 60).toString().padStart(2, "0");

  if (!quizId) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-ai/15 text-ai"><GraduationCap className="h-5 w-5" /></div>
          <div>
            <h1 className="font-display text-3xl font-semibold">Exam Mode</h1>
            <p className="text-sm text-muted-foreground">Timed, scored, single-attempt practice exams.</p>
          </div>
        </div>
        <Card className="space-y-4 p-6">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Source file</label>
            <Select value={fileId} onValueChange={setFileId}>
              <SelectTrigger><SelectValue placeholder="Choose a file" /></SelectTrigger>
              <SelectContent>
                {files.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Questions</label>
              <Select value={count} onValueChange={setCount}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["5","10","15","20"].map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["EASY","MEDIUM","HARD"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">⏱ Timer: 1 minute per question.</p>
          <Button onClick={startExam} disabled={generating || !fileId} className="w-full bg-gradient-to-r from-primary to-ai">
            {generating ? "Generating exam…" : <><Sparkles className="mr-2 h-4 w-4" />Start exam</>}
          </Button>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <Card className="p-8 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-primary to-ai">
            <Trophy />
          </div>
          <h2 className="mt-4 font-display text-3xl font-semibold">{Math.round(score * 100)}%</h2>
          <p className="text-muted-foreground">{questions.filter((q) => answers[q.id] === q.answer).length} / {questions.length} correct</p>
          <Button onClick={reset} className="mt-6">New exam</Button>
        </Card>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const correct = answers[q.id] === q.answer;
            return (
              <Card key={q.id} className="p-4">
                <p className="text-sm text-muted-foreground">Q{i + 1}</p>
                <p className="font-medium">{q.stem}</p>
                <div className={`mt-2 flex items-center gap-2 text-sm ${correct ? "text-success" : "text-destructive"}`}>
                  {correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  Your answer: {answers[q.id] ?? "—"}
                </div>
                {!correct && <p className="text-sm text-muted-foreground">Correct: {q.answer}</p>}
                {q.explanation && <p className="mt-2 text-xs text-muted-foreground">{q.explanation}</p>}
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Question {idx + 1} of {questions.length}</p>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1 text-sm">
          <Timer className="h-4 w-4 text-ai" /> {mins}:{secs}
        </div>
      </div>
      <Progress value={progress} />
      <AnimatePresence mode="wait">
        {current && (
          <motion.div key={current.id}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="space-y-4 p-6">
              <p className="font-display text-lg">{current.stem}</p>
              <div className="space-y-2">
                {current.options.map((opt) => {
                  const selected = answers[current.id] === opt;
                  return (
                    <button key={opt}
                      onClick={() => setAnswers({ ...answers, [current.id]: opt })}
                      className={`w-full rounded-xl border p-3 text-left text-sm transition ${selected ? "border-primary bg-primary/10" : "border-border/60 hover:bg-muted/40"}`}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex justify-between">
        <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Previous</Button>
        {idx < questions.length - 1
          ? <Button onClick={() => setIdx(idx + 1)}>Next</Button>
          : <Button onClick={handleSubmit} className="bg-gradient-to-r from-primary to-ai">Submit exam</Button>}
      </div>
    </div>
  );
}

function Trophy() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM5 4H3v3a3 3 0 003 3M19 4h2v3a3 3 0 01-3 3"/></svg>;
}
