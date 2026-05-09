import { Brain } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-primary to-ai shadow-glow">
        <Brain className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <span className="font-display text-lg font-bold tracking-tight">
        Neuro<span className="text-gradient">Note</span>
      </span>
    </div>
  );
}
