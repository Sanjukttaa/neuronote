import { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Search, Flame } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

export function Topbar() {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const initial = (user?.user_metadata?.name || user?.email || "?").toString().charAt(0).toUpperCase();

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("streak").eq("id", user.id).maybeSingle()
      .then(({ data }) => setStreak(data?.streak ?? 0));
  }, [user]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger />
      <div className="relative ml-2 hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search notes, flashcards, quizzes…  ⌘K" className="pl-9" />
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-streak/30 bg-streak/10 px-2.5 py-1 text-xs text-streak">
          <Flame className="h-3.5 w-3.5" /> {streak} day streak
        </div>
        <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-ai text-xs font-semibold text-primary-foreground">
          {initial}
        </div>
      </div>
    </header>
  );
}
