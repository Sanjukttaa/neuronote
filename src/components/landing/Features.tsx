import { motion } from "framer-motion";
import { FileText, Layers, ClipboardList, Bot, CalendarDays, BarChart3 } from "lucide-react";

const features = [
  { icon: FileText, title: "AI Summaries", body: "Five styles: short, detailed, exam-ready, bullets, key concepts. One click each." },
  { icon: Layers, title: "Smart Flashcards", body: "Auto-generated decks with SM-2 spaced repetition and 3D flip animations." },
  { icon: ClipboardList, title: "Adaptive Quizzes", body: "MCQ, true/false, fill-in. Per-question timer, explanations, weak-topic retry." },
  { icon: Bot, title: "RAG Chat Tutor", body: "Ask questions — answers cite your own notes with source highlighting." },
  { icon: CalendarDays, title: "Study Planner", body: "Calendar, tasks, and a Pomodoro timer that logs every session." },
  { icon: BarChart3, title: "Progress Analytics", body: "Heatmaps, streaks, topic mastery radars, and an XP system that keeps you going." },
];

export function Features() {
  return (
    <section id="features" className="border-t border-border/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Everything you need to actually <span className="text-gradient">remember</span> what you study
          </h2>
          <p className="mt-4 text-muted-foreground">
            One workspace replaces Quizlet, Anki, ChatGPT and your tab graveyard.
          </p>
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 transition-colors hover:border-primary/40 hover:bg-card/70"
            >
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="mb-4 inline-grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-primary/20 to-ai/20 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
