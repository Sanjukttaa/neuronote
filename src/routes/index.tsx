import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NeuroNote AI — Transform your notes into intelligent learning" },
      { name: "description", content: "AI summaries, spaced-repetition flashcards, adaptive quizzes, and a RAG chat tutor for your own notes." },
      { property: "og:title", content: "NeuroNote AI" },
      { property: "og:description", content: "AI-powered study platform built for students." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <FAQ />
      <Footer />
    </main>
  );
}
