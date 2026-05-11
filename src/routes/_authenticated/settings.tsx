import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings as SettingsIcon, LogOut } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — NeuroNote AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name,avatar_url").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        setName(data?.name ?? user.user_metadata?.name ?? "");
        setAvatar(data?.avatar_url ?? "");
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles")
      .upsert({ id: user.id, email: user.email, name, avatar_url: avatar });
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Saved");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
      </div>

      <Card className="space-y-4 p-6">
        <h2 className="font-display text-lg">Profile</h2>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={user?.email ?? ""} disabled />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avatar">Avatar URL</Label>
          <Input id="avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
        </div>
        <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-primary to-ai">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="font-display text-lg">Account</h2>
        <p className="text-sm text-muted-foreground">Sign out of NeuroNote on this device.</p>
        <Button variant="outline" onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </Card>
    </div>
  );
}
