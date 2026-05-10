import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Send, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";

export const Route = createFileRoute("/_authenticated/chat")({ component: ChatPage });

type FileOpt = { id: string; name: string };

function ChatPage() {
  const [files, setFiles] = useState<FileOpt[]>([]);
  const [fileId, setFileId] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("files").select("id,name").order("created_at", { ascending: false })
      .then(({ data }) => setFiles((data as FileOpt[]) ?? []));
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? ""));
  }, []);

  const transport = new DefaultChatTransport({
    api: "/api/chat",
    body: () => ({ fileId: fileId || null, token }),
  });
  const { messages, sendMessage, status } = useChat({ transport });

  const loading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage({ text: input });
    setInput("");
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] w-full max-w-4xl flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">AI Tutor</h1>
          <p className="text-xs text-muted-foreground">Ask anything about your notes.</p>
        </div>
        <Select value={fileId} onValueChange={setFileId}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Context: none" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">No file context</SelectItem>
            {files.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card className="flex-1 overflow-hidden">
        <div ref={scrollRef} className="h-full space-y-4 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="mt-12 text-center text-sm text-muted-foreground">Start a conversation. Pick a file above for grounded answers.</p>
          )}
          {messages.map((m) => {
            const text = m.parts.map(p => p.type === "text" ? p.text : "").join("");
            const isUser = m.role === "user";
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
                {!isUser && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ai/20 text-ai"><Bot className="h-4 w-4" /></div>}
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isUser ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <article className="prose prose-sm prose-invert max-w-none"><ReactMarkdown>{text}</ReactMarkdown></article>
                </div>
                {isUser && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/20"><UserIcon className="h-4 w-4" /></div>}
              </motion.div>
            );
          })}
        </div>
      </Card>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your notes…" />
        <Button type="submit" disabled={loading}><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
