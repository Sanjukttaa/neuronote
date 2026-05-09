import { motion } from "framer-motion";
import { Upload, Sparkles, GraduationCap } from "lucide-react";

const steps = [
  { n: "01", icon: Upload, title: "Upload your notes", body: "Drop a PDF or paste text. Lecture slides, textbook chapters, study guides." },
  { n: "02", icon: Sparkles, title: "AI processes it", body: "Summaries, flashcards, quizzes and embeddings — generated in seconds." },
  { n: "03", icon: GraduationCap, title: "Learn & review", body: "Spaced repetition + chat tutor. Track streaks. Crush the exam." },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-t border-border/40 bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">From PDF to mastery in three steps</h2>
        </div>
        <div className="relative mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border border-border/60 bg-card/40 p-8"
            >
              <div className="font-display text-6xl font-bold text-muted-foreground/20">{s.n}</div>
              <s.icon className="mt-4 h-7 w-7 text-ai" />
              <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
