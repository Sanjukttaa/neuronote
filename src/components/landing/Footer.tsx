import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/40 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
        <Logo />
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} NeuroNote AI. Study smarter, not harder.
        </p>
      </div>
    </footer>
  );
}
