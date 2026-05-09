import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, FileText, Layers, MessageSquare } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-mesh pb-24 pt-20 md:pb-32 md:pt-28">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-ai/30 bg-ai/10 px-3 py-1 text-xs text-ai">
            <Sparkles className="h-3 w-3" />
            AI-powered study, built for students
          </div>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Transform your notes into{" "}
            <span className="text-gradient">intelligent learning</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Upload PDFs, get instant AI summaries, spaced-repetition flashcards, adaptive
            quizzes, and a chat tutor that cites your own notes.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-ai text-primary-foreground hover:opacity-90">
              <Link to="/signup">
                Start studying free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#features">See features</a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="relative rounded-2xl border border-border/60 bg-card/50 p-2 shadow-glow backdrop-blur">
            <div className="grid gap-2 rounded-xl bg-background/60 p-4 md:grid-cols-3">
              <PreviewCard
                icon={<FileText className="h-4 w-4" />}
                tag="Summary"
                title="Cell Biology · Chapter 4"
                body="Mitochondria generate ATP via oxidative phosphorylation. Inner membrane folds (cristae) increase surface area for the electron transport chain…"
              />
              <PreviewCard
                icon={<Layers className="h-4 w-4" />}
                tag="Flashcard"
                title="What does ATP synthase do?"
                body="Uses the proton gradient across the inner mitochondrial membrane to phosphorylate ADP → ATP."
                accent
              />
              <PreviewCard
                icon={<MessageSquare className="h-4 w-4" />}
                tag="Chat"
                title="Why are cristae folded?"
                body="Folding increases the surface area available for the electron transport chain, allowing more ATP to be produced per unit volume…"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PreviewCard({
  icon, tag, title, body, accent,
}: { icon: React.ReactNode; tag: string; title: string; body: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 text-left ${accent ? "border-ai/40 bg-ai/5" : "border-border/60 bg-card/60"}`}>
      <div className={`mb-2 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${accent ? "bg-ai/15 text-ai" : "bg-primary/15 text-primary"}`}>
        {icon}{tag}
      </div>
      <h4 className="text-sm font-semibold leading-snug">{title}</h4>
      <p className="mt-2 line-clamp-4 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
