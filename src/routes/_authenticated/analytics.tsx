import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { Flame, Trophy, BookOpen, Brain } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const [stats, setStats] = useState({ files: 0, summaries: 0, flashcards: 0, quizzes: 0, xp: 0, streak: 0 });
  const [daily, setDaily] = useState<{ day: string; xp: number }[]>([]);
  const [scores, setScores] = useState<{ name: string; score: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [f, s, fc, qz, ss, atts, prof] = await Promise.all([
        supabase.from("files").select("id", { count: "exact", head: true }),
        supabase.from("summaries").select("id", { count: "exact", head: true }),
        supabase.from("flashcards").select("id", { count: "exact", head: true }),
        supabase.from("quizzes").select("id", { count: "exact", head: true }),
        supabase.from("study_sessions").select("created_at,xp_earned").order("created_at"),
        supabase.from("quiz_attempts").select("score,completed_at,quiz_id").order("completed_at", { ascending: false }).limit(10),
        supabase.from("profiles").select("streak,xp").maybeSingle(),
      ]);

      const buckets: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        buckets[d.toISOString().slice(0, 10)] = 0;
      }
      (ss.data ?? []).forEach((r: any) => {
        const k = r.created_at.slice(0, 10);
        if (k in buckets) buckets[k] += r.xp_earned ?? 0;
      });
      setDaily(Object.entries(buckets).map(([day, xp]) => ({ day: day.slice(5), xp })));
      setScores((atts.data ?? []).reverse().map((a: any, i: number) =>
        ({ name: `#${i + 1}`, score: Math.round((a.score ?? 0) * 100) })));

      setStats({
        files: f.count ?? 0, summaries: s.count ?? 0, flashcards: fc.count ?? 0, quizzes: qz.count ?? 0,
        xp: prof.data?.xp ?? 0, streak: prof.data?.streak ?? 0,
      });
    })();
  }, []);

  const Stat = ({ icon: Icon, label, value, accent }: any) => (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${accent}`}><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-semibold">{value}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <h1 className="font-display text-3xl font-semibold">Analytics</h1>
      <div className="grid gap-3 md:grid-cols-4">
        <Stat icon={Flame} label="Streak" value={`${stats.streak}d`} accent="bg-streak/15 text-streak" />
        <Stat icon={Trophy} label="Total XP" value={stats.xp} accent="bg-primary/15 text-primary" />
        <Stat icon={BookOpen} label="Files" value={stats.files} accent="bg-ai/15 text-ai" />
        <Stat icon={Brain} label="Flashcards" value={stats.flashcards} accent="bg-success/15 text-success" />
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-display text-lg">XP last 7 days</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.2} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="xp" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 font-display text-lg">Recent quiz scores (%)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scores}>
              <CartesianGrid stroke="hsl(var(--border))" strokeOpacity={0.2} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="score" fill="hsl(var(--ai))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
