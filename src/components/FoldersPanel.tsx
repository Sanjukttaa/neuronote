import { useEffect, useState } from "react";
import { Folder as FolderIcon, FolderPlus, Inbox, Layers, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export type Folder = { id: string; name: string; color: string | null };

type Selection = "all" | "unfiled" | string;

export function FoldersPanel({
  selected, onSelect, counts,
}: {
  selected: Selection;
  onSelect: (s: Selection) => void;
  counts?: { all?: number; unfiled?: number; byFolder?: Record<string, number> };
}) {
  const { user } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Folder | null>(null);

  const load = async () => {
    const { data } = await supabase.from("folders")
      .select("id,name,color").order("created_at", { ascending: true });
    setFolders((data as Folder[]) ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from("folders")
      .insert({ user_id: user.id, name: name.trim() });
    if (error) toast.error(error.message);
    else { setName(""); setCreating(false); await load(); }
  };

  const rename = async () => {
    if (!editing || !name.trim()) return;
    await supabase.from("folders").update({ name: name.trim() }).eq("id", editing.id);
    setEditing(null); setName(""); await load();
  };

  const remove = async (id: string) => {
    await supabase.from("folders").delete().eq("id", id);
    if (selected === id) onSelect("all");
    await load();
  };

  const Item = ({ active, onClick, icon: Icon, label, count, action }: any) => (
    <div className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${active ? "bg-primary/10 text-primary" : "hover:bg-muted/50"}`}>
      <button onClick={onClick} className="flex flex-1 items-center gap-2 truncate text-left">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{label}</span>
      </button>
      {typeof count === "number" && <span className="text-xs text-muted-foreground">{count}</span>}
      {action}
    </div>
  );

  return (
    <aside className="space-y-1">
      <div className="mb-2 flex items-center justify-between px-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Folders</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setCreating(true); setName(""); }}>
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>
      <Item active={selected === "all"} onClick={() => onSelect("all")} icon={Layers} label="All" count={counts?.all} />
      <Item active={selected === "unfiled"} onClick={() => onSelect("unfiled")} icon={Inbox} label="Unfiled" count={counts?.unfiled} />
      {folders.map((f) => (
        <Item key={f.id} active={selected === f.id} onClick={() => onSelect(f.id)}
          icon={FolderIcon} label={f.name} count={counts?.byFolder?.[f.id]}
          action={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { setEditing(f); setName(f.name); }}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => remove(f.id)} className="text-destructive">
                  <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      ))}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>New folder</DialogTitle></DialogHeader>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Folder name" onKeyDown={(e) => e.key === "Enter" && create()} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={create}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename folder</DialogTitle></DialogHeader>
          <Input autoFocus value={name} onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && rename()} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={rename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  useEffect(() => {
    supabase.from("folders").select("id,name,color").order("created_at")
      .then(({ data }) => setFolders((data as Folder[]) ?? []));
  }, []);
  return folders;
}

export function MoveToFolder({ table, id, currentFolderId, onMoved }: {
  table: "files" | "summaries" | "flashcards" | "quizzes";
  id: string;
  currentFolderId: string | null;
  onMoved?: () => void;
}) {
  const folders = useFolders();
  const move = async (folderId: string | null) => {
    const { error } = await supabase.from(table).update({ folder_id: folderId }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Moved"); onMoved?.(); }
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Move to folder">
          <FolderIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => move(null)} disabled={currentFolderId === null}>
          <Inbox className="mr-2 h-3.5 w-3.5" />Unfiled
        </DropdownMenuItem>
        {folders.map((f) => (
          <DropdownMenuItem key={f.id} onClick={() => move(f.id)} disabled={currentFolderId === f.id}>
            <FolderIcon className="mr-2 h-3.5 w-3.5" />{f.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
