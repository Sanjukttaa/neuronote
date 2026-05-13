import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload as UploadIcon, FileText, Sparkles, Loader2, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Link } from "@tanstack/react-router";
import { FoldersPanel, MoveToFolder } from "@/components/FoldersPanel";

export const Route = createFileRoute("/_authenticated/uploads")({
  component: UploadsPage,
});

type FileRow = {
  id: string;
  name: string;
  type: string;
  size_bytes: number | null;
  text_content: string | null;
  folder_id: string | null;
  storage_path: string | null;
  created_at: string;
};

async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs: any = await import("pdfjs-dist");
  // @ts-ignore
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map((it: any) => it.str).join(" ") + "\n\n";
  }
  return out;
}

async function extractPptxText(file: File): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const slideFiles = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = parseInt(a.match(/slide(\d+)/)![1]);
      const nb = parseInt(b.match(/slide(\d+)/)![1]);
      return na - nb;
    });
  let out = "";
  for (const name of slideFiles) {
    const xml = await zip.files[name].async("string");
    const text = xml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    out += text + "\n\n";
  }
  return out;
}

function UploadsPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [folder, setFolder] = useState<"all" | "unfiled" | string>("all");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("files")
      .select("id,name,type,size_bytes,text_content,folder_id,storage_path,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setFiles(data as FileRow[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (folder === "all") return files;
    if (folder === "unfiled") return files.filter((f) => !f.folder_id);
    return files.filter((f) => f.folder_id === folder);
  }, [files, folder]);

  const counts = useMemo(() => {
    const byFolder: Record<string, number> = {};
    let unfiled = 0;
    for (const f of files) {
      if (f.folder_id) byFolder[f.folder_id] = (byFolder[f.folder_id] || 0) + 1;
      else unfiled++;
    }
    return { all: files.length, unfiled, byFolder };
  }, [files]);

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!user) return;
    setBusy(true);
    try {
      for (const f of accepted) {
        const ext = f.name.split(".").pop()?.toLowerCase() || "";
        const allowed = ["txt", "md", "markdown"];
        if (!allowed.includes(ext)) {
          toast.error(`${f.name}: only .txt and .md supported right now`);
          continue;
        }
        const path = `${user.id}/${crypto.randomUUID()}-${f.name}`;
        const { error: upErr } = await supabase.storage.from("uploads").upload(path, f);
        if (upErr) { toast.error(upErr.message); continue; }
        const text = await readFileAsText(f);
        const { error: insErr } = await supabase.from("files").insert({
          user_id: user.id,
          name: f.name,
          type: ext,
          size_bytes: f.size,
          storage_path: path,
          text_content: text.slice(0, 500_000),
          folder_id: typeof folder === "string" && folder !== "all" && folder !== "unfiled" ? folder : null,
        });
        if (insErr) toast.error(insErr.message);
        else toast.success(`Uploaded ${f.name}`);
      }
      await load();
    } finally {
      setBusy(false);
    }
  }, [user, load, folder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/plain": [".txt"], "text/markdown": [".md", ".markdown"] },
  });

  const remove = async (id: string, path?: string | null) => {
    if (path) await supabase.storage.from("uploads").remove([path]);
    await supabase.from("files").delete().eq("id", id);
    await load();
  };

  const summarize = async (file: FileRow) => {
    setProcessingId(file.id);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-process`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({ action: "summary", fileId: file.id, summaryType: "concise" }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      if (file.folder_id) {
        await supabase.from("summaries").update({ folder_id: file.folder_id })
          .eq("file_id", file.id).is("folder_id", null);
      }
      toast.success("Summary ready");
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Uploads</h1>
        <p className="text-sm text-muted-foreground">Drop your notes — we'll generate summaries, flashcards, and quizzes.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <FoldersPanel selected={folder} onSelect={setFolder} counts={counts} />

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            {...(getRootProps() as any)}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-border bg-card/40"}`}
          >
            <input {...getInputProps()} />
            <UploadIcon className="mx-auto mb-3 h-10 w-10 text-primary" />
            <p className="font-medium">{isDragActive ? "Drop here" : "Drag & drop or click to upload"}</p>
            <p className="mt-1 text-xs text-muted-foreground">.txt, .md (PDF/DOCX coming soon)</p>
            {busy && <div className="absolute inset-0 grid place-items-center rounded-2xl bg-background/60"><Loader2 className="h-6 w-6 animate-spin" /></div>}
          </motion.div>

          <div className="grid gap-3">
            {filtered.map((f) => (
              <Card key={f.id} className="flex items-center gap-3 p-4">
                <FileText className="h-5 w-5 text-ai" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{(f.size_bytes ?? 0) / 1000} kB · {new Date(f.created_at).toLocaleString()}</div>
                </div>
                <Badge variant="secondary">{f.type}</Badge>
                <MoveToFolder table="files" id={f.id} currentFolderId={f.folder_id} onMoved={load} />
                <Button size="sm" onClick={() => summarize(f)} disabled={processingId === f.id}>
                  {processingId === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-1 h-4 w-4" />Summarize</>}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(f.id, f.storage_path)}><Trash2 className="h-4 w-4" /></Button>
              </Card>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {files.length === 0
                  ? <>No files yet. <Link to="/dashboard" className="text-primary underline">Back</Link></>
                  : "No files in this folder."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
