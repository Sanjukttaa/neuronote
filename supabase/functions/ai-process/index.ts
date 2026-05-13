// AI processing edge function: summary | flashcards | quiz
// Uses Lovable AI Gateway (no API key required from user).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUMMARY_PROMPTS: Record<string, string> = {
  SHORT: "Write a concise 200-word summary in markdown with a brief intro and 3-5 key bullets.",
  DETAILED: "Write a detailed markdown summary with headings, key concepts, and examples.",
  BULLETS: "Return a markdown bulleted outline of the key points.",
  KEY_CONCEPTS: "List and explain the key concepts in friendly markdown.",
  EXAM: "Write an exam-style cheat sheet in markdown: definitions, formulas, must-know facts.",
};

// Map legacy/lowercase types to enum values
const SUMMARY_TYPE_MAP: Record<string, string> = {
  concise: "SHORT", short: "SHORT", SHORT: "SHORT",
  detailed: "DETAILED", DETAILED: "DETAILED",
  bullets: "BULLETS", BULLETS: "BULLETS",
  eli5: "KEY_CONCEPTS", key_concepts: "KEY_CONCEPTS", KEY_CONCEPTS: "KEY_CONCEPTS",
  exam: "EXAM", EXAM: "EXAM",
};

async function callAI(messages: any[], model = "google/gemini-2.5-flash") {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`AI ${r.status}: ${t}`);
  }
  const j = await r.json();
  return j.choices?.[0]?.message?.content ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } }
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return new Response("Unauthorized", { status: 401, headers: cors });
    const userId = userData.user.id;

    const body = await req.json();
    const { action, fileId, summaryType = "concise" } = body;
    const { data: file, error: fErr } = await supabase
      .from("files").select("id,name,text_content").eq("id", fileId).single();
    if (fErr || !file) return new Response("File not found", { status: 404, headers: cors });
    const text = (file.text_content || "").slice(0, 60_000);
    if (!text.trim()) return new Response("File has no text", { status: 400, headers: cors });

    if (action === "summary") {
      const normalizedType = SUMMARY_TYPE_MAP[summaryType] ?? "SHORT";
      const prompt = SUMMARY_PROMPTS[normalizedType] ?? SUMMARY_PROMPTS.SHORT;
      const content = await callAI([
        { role: "system", content: "You are NeuroNote, a study assistant. Output clean markdown only." },
        { role: "user", content: `${prompt}\n\nSOURCE:\n${text}` },
      ]);
      const wc = content.split(/\s+/).length;
      const { data: ins, error: insErr } = await supabase.from("summaries")
        .insert({ user_id: userId, file_id: file.id, type: normalizedType, content, word_count: wc })
        .select().single();
      if (insErr) throw insErr;
      return new Response(JSON.stringify({ ok: true, summary: ins }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (action === "flashcards") {
      const raw = await callAI([
        { role: "system", content: "Return ONLY valid JSON: an array of {front, back} objects, 8-12 items." },
        { role: "user", content: `Generate flashcards from:\n${text}` },
      ]);
      const json = JSON.parse(raw.replace(/```json|```/g, "").trim());
      const rows = json.map((c: any) => ({
        user_id: userId, file_id: file.id,
        front: String(c.front), back: String(c.back),
      }));
      const { error } = await supabase.from("flashcards").insert(rows);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, count: rows.length }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (action === "quiz") {
      const { difficulty = "MEDIUM", count = 8 } = body;
      const raw = await callAI([
        { role: "system", content: `Return ONLY valid JSON: { "title": string, "questions": [{"stem": string, "type": "MCQ", "options": [string,string,string,string], "answer": string, "explanation": string}] }. Generate ${count} ${difficulty} multiple choice questions. answer must equal one of the options exactly.` },
        { role: "user", content: `Topic source:\n${text}` },
      ]);
      const json = JSON.parse(raw.replace(/```json|```/g, "").trim());
      const { data: quiz, error: qe } = await supabase.from("quizzes")
        .insert({ user_id: userId, file_id: file.id, title: json.title || `Quiz: ${file.name}`, difficulty })
        .select().single();
      if (qe) throw qe;
      const qrows = (json.questions ?? []).map((q: any, i: number) => ({
        quiz_id: quiz.id, stem: q.stem, type: "MCQ", options: q.options ?? [],
        answer: q.answer, explanation: q.explanation ?? "", order: i,
      }));
      const { error: qre } = await supabase.from("questions").insert(qrows);
      if (qre) throw qre;
      return new Response(JSON.stringify({ ok: true, quizId: quiz.id, count: qrows.length }),
        { headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response("Unknown action", { status: 400, headers: cors });

  } catch (e) {
    console.error(e);
    return new Response(String((e as Error).message), { status: 500, headers: cors });
  }
});
