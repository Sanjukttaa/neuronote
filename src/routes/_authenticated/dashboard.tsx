import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { FileText, Layers, ClipboardList, Sparkles, Bot, Upload, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — NeuroNote AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ summaries: 0, mastered: 0, attempts: 0, streak: 0 });
  const [recent, setRecent] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [s, fc, qa, prof, files] = await Promise.all([
        supabase.from("summaries").select("id", { count: "exact", head: true }),
        supabase.from("flashcards").select("id", { count: "exact", head: true }).eq("mastered", true),
        supabase.from("quiz_attempts").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("streak").maybeSingle(),
        supabase.from("files").select("id,name").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({
        summaries: s.count ?? 0, mastered: fc.count ?? 0, attempts: qa.count ?? 0,
        streak: prof.data?.streak ?? 0,
      });
      setRecent(files.data ?? []);
    })();
  }, []);

  const name = user?.user_metadata?.name || user?.email?.split("@")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/10 p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{greeting},</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">
              {name}. <span className="text-gradient">Let's learn.</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-streak/30 bg-streak/10 px-3 py-1.5 text-streak">
            <Flame className="h-4 w-4" /><span className="text-sm font-medium">Day 0 · start your streak</span>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild className="bg-gradient-to-r from-primary to-ai">
            <Link to="/uploads"><Upload className="mr-2 h-4 w-4" />Upload notes</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/chat"><Bot className="mr-2 h-4 w-4" />Ask the AI tutor</Link>
          </Button>
        </div>
      </motion.section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: FileText, label: "Summaries", value: "0" },
          { icon: Layers, label: "Flashcards mastered", value: "0" },
          { icon: ClipboardList, label: "Quizzes taken", value: "0" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border/60 bg-card/50 p-5">
            <s.icon className="h-5 w-5 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">{s.label}</p>
            <p className="font-display text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Recent files" empty="No files yet — upload your first PDF to get started." cta={{ label: "Upload", to: "/uploads" }} />
        <Card title="Continue learning" empty="Generate flashcards from a file to start a session." cta={{ label: "Browse files", to: "/uploads" }} />
        <Card title="AI recommendations" empty="Take a quiz so the AI can spot your weak topics.">
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-ai/30 bg-ai/5 p-3 text-sm">
            <Sparkles className="h-4 w-4 text-ai" />
            <span>Upload notes to unlock personalized recommendations.</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, empty, cta, children }: {
  title: string; empty: string; cta?: { label: string; to: string }; children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-5">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      {children ?? <p className="mt-2 text-sm text-muted-foreground/70">{empty}</p>}
      {cta && <Button asChild size="sm" variant="ghost" className="mt-3 -ml-2"><Link to={cta.to}>{cta.label} →</Link></Button>}
    </div>
  );
}
