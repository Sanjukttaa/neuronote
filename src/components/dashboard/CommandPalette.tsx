import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { House, Bot, Upload, BarChart3, FileText, Layers, ClipboardList, GraduationCap, CalendarDays, Bookmark, Settings } from "lucide-react";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: House },
  { title: "AI Chat", url: "/chat", icon: Bot },
  { title: "Uploads", url: "/uploads", icon: Upload },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Summaries", url: "/summaries", icon: FileText },
  { title: "Flashcards", url: "/flashcards", icon: Layers },
  { title: "Quizzes", url: "/quizzes", icon: ClipboardList },
  { title: "Exam Mode", url: "/exam", icon: GraduationCap },
  { title: "Planner", url: "/planner", icon: CalendarDays },
  { title: "Bookmarks", url: "/bookmarks", icon: Bookmark },
  { title: "Settings", url: "/settings", icon: Settings },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump to anywhere…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {items.map((it) => (
            <CommandItem key={it.url} onSelect={() => { setOpen(false); navigate({ to: it.url }); }}>
              <it.icon className="mr-2 h-4 w-4" />
              {it.title}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
