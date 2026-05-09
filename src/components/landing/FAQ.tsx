import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Is NeuroNote free?", a: "You can sign up free and try every feature. AI usage is metered — heavy users may hit limits." },
  { q: "What files can I upload?", a: "PDF, plain text and markdown for now. DOCX/PPTX support is coming soon." },
  { q: "Does the AI actually read my notes?", a: "Yes — we chunk and embed your documents, then retrieve the most relevant passages for every question. Every chat answer cites the source chunk." },
  { q: "Is my data private?", a: "Your files and generated content are scoped to your account. Nobody else can read them." },
  { q: "How does spaced repetition work?", a: "We use the SM-2 algorithm — every flashcard schedules its next review based on how easily you recall it." },
  { q: "Can I export my data?", a: "Yes. Decks export to CSV, summaries export to Markdown, everything is yours." },
];

export function FAQ() {
  return (
    <section id="faq" className="border-t border-border/40 py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-center font-display text-4xl font-bold tracking-tight md:text-5xl">Frequently asked</h2>
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border/60">
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
