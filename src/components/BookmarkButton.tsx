import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function BookmarkButton({ entityType, entityId, size = "icon" }: {
  entityType: "file" | "summary" | "flashcard" | "quiz";
  entityId: string;
  size?: "icon" | "sm";
}) {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancel = false;
    supabase.from("bookmarks").select("id")
      .eq("entity_type", entityType).eq("entity_id", entityId).maybeSingle()
      .then(({ data }) => { if (!cancel) setOn(!!data); });
    return () => { cancel = true; };
  }, [entityType, entityId]);

  const toggle = async () => {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (on) {
      await supabase.from("bookmarks").delete()
        .eq("user_id", u.user.id).eq("entity_type", entityType).eq("entity_id", entityId);
      setOn(false);
    } else {
      const { error } = await supabase.from("bookmarks")
        .insert({ user_id: u.user.id, entity_type: entityType, entity_id: entityId });
      if (error) toast.error(error.message); else setOn(true);
    }
    setBusy(false);
  };

  return (
    <Button variant="ghost" size={size === "icon" ? "icon" : "sm"} onClick={toggle} disabled={busy}
      className={on ? "text-primary" : "text-muted-foreground"}>
      <Bookmark className={`h-4 w-4 ${on ? "fill-current" : ""}`} />
    </Button>
  );
}
