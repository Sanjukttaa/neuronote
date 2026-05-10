import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/quizzes")({
  component: () => (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="font-display text-3xl font-semibold">Quizzes</h1>
      <p className="mt-2 text-muted-foreground">Coming soon.</p>
      <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        We're wiring this up. Upload notes on the Uploads page to start generating content.
      </div>
    </div>
  ),
});
