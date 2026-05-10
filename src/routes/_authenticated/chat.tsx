import { createFileRoute } from "@tanstack/react-router";

function Stub({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mx-auto max-w-3xl p-8">
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{desc}</p>
      <div className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        Coming soon — upload notes first to populate this view.
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/chat")({
  component: () => <Stub title="AI Chat" desc="Ask questions about your uploaded notes (RAG)." />,
});
