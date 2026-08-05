import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { Sparkles, Send, Loader2, RotateCcw } from "lucide-react";
import { useTrackEvent } from "@/hooks/useTrackEvent";
import { cn } from "@/lib/utils";

const MODES: { id: string; label: string; framing?: string }[] = [
  { id: "general", label: "General" },
  {
    id: "competitive",
    label: "Competitive",
    framing:
      "Answer as a competitive analyst: compare vendor positions, name differentiators, and state where Microsoft Fabric Spark stands.",
  },
  {
    id: "strategic",
    label: "Strategic",
    framing:
      "Answer as a strategy advisor: focus on market direction, second-order effects, and the two-quarter outlook.",
  },
  {
    id: "decision",
    label: "Decision support",
    framing:
      "Answer as a decision-support analyst: give a recommendation, the owning role, the timeline, and the evidence behind it.",
  },
];

const SUGGESTIONS = [
  "What changed in Spark this week?",
  "Compare Iceberg vs Delta momentum",
  "What are the latest Fabric updates?",
  "Summarize major AWS EMR developments",
  "Which vendor is innovating fastest?",
];


const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/spark-copilot`;

function renderText(m: UIMessage) {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
}

const AskBigDataHub = () => {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<string>("general");
  const track = useTrackEvent();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);


  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: ENDPOINT,
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    }),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    taRef.current?.focus();
  }, [status]);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || isLoading) return;
    const framing = MODES.find((m) => m.id === mode)?.framing;
    sendMessage({ text: framing ? `${framing}\n\nQuestion: ${t}` : t });
    track("copilot_question", mode, { length: t.length });
    setInput("");
  };


  return (
    <div className="rounded-lg border border-border bg-card opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Ask Big Data Hub</h2>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            aria-label="Clear conversation"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="Clear conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      <div className="px-6 py-5">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Ask anything about Spark, Iceberg, Delta, Fabric, EMR, BigQuery, or Databricks. Grounded in this week's ingested intelligence.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs text-secondary-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-h-[480px] space-y-5 overflow-y-auto pr-2">
            {messages.map((m) => {
              const text = renderText(m);
              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground">
                      {text}
                    </div>
                  </div>
                );
              }
              return (
                <div key={m.id} className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed text-foreground/90 [&_p]:my-2 [&_ul]:my-2 [&_li]:my-0.5 [&_strong]:text-foreground [&_a]:text-primary [&_code]:rounded [&_code]:bg-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs">
                  <ReactMarkdown>{text || " "}</ReactMarkdown>
                </div>
              );
            })}
            {status === "submitted" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking...
              </div>
            )}
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error.message || "Something went wrong. Please try again."}
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
          className="mt-4 flex items-end gap-2"
        >
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            rows={1}
            placeholder="Ask about Spark, Iceberg, Delta, Fabric, EMR, BigQuery, Databricks..."
            disabled={isLoading}
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            title="Send"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AskBigDataHub;
