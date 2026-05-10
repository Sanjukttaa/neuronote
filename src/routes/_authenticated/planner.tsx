import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/planner")({ component: PlannerPage });

type Task = { id: string; title: string; subject: string | null; due_date: string | null; priority: string; done: boolean };

function PlannerPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [date, setDate] = useState<Date | undefined>();

  const load = async () => {
    const { data } = await supabase.from("tasks")
      .select("id,title,subject,due_date,priority,done").order("due_date", { ascending: true, nullsFirst: false });
    setTasks((data as Task[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!title.trim() || !user) return;
    await supabase.from("tasks").insert({
      user_id: user.id, title, subject: subject || null,
      due_date: date?.toISOString() ?? null, priority: priority as "HIGH" | "MEDIUM" | "LOW",
    });
    setTitle(""); setSubject(""); setDate(undefined); setPriority("MEDIUM");
    await load();
  };

  const toggle = async (t: Task) => {
    await supabase.from("tasks").update({ done: !t.done }).eq("id", t.id);
    await load();
  };
  const remove = async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    await load();
  };

  const priColor = (p: string) =>
    p === "HIGH" ? "bg-destructive/15 text-destructive" :
    p === "LOW" ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Planner</h1>
        <p className="text-sm text-muted-foreground">Organize study sessions and deadlines.</p>
      </div>

      <Card className="p-4">
        <div className="grid gap-2 md:grid-cols-[1fr_140px_120px_180px_auto]">
          <Input placeholder="Task title" value={title} onChange={e => setTitle(e.target.value)} />
          <Input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start font-normal", !date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Due date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <Button onClick={add}><Plus className="mr-1 h-4 w-4" />Add</Button>
        </div>
      </Card>

      <div className="space-y-2">
        <AnimatePresence>
          {tasks.map(t => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -8 }}>
              <Card className={cn("flex items-center gap-3 p-3", t.done && "opacity-60")}>
                <Checkbox checked={t.done} onCheckedChange={() => toggle(t)} />
                <div className="min-w-0 flex-1">
                  <div className={cn("font-medium", t.done && "line-through")}>{t.title}</div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {t.subject && <span>{t.subject}</span>}
                    {t.due_date && <span>· {format(new Date(t.due_date), "PP")}</span>}
                  </div>
                </div>
                <Badge className={priColor(t.priority)} variant="outline">{t.priority}</Badge>
                <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4" /></Button>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
        {tasks.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No tasks yet.</p>}
      </div>
    </div>
  );
}
