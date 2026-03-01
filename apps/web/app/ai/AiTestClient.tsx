"use client";

import { useState, useEffect, useRef } from "react";
import { createAiSession, postAiMessage } from "@/lib/api/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuroraBackground from "@/components/effects/aurora-background";
import MarkdownMessage from "@/components/ai/MarkdownMessage";
import ThinkingDots from "@/components/ai/ThinkingDots";
import AssistantAvatar from "@/components/ai/AssistantAvatar";
import AiSessionLoader from "@/components/ai/AiSessionLoader";
import { Bot } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function AiTestClient() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sessionId) return;
    let cancelled = false;
    setLoading(true);
    createAiSession({ scope: "global" })
      .then((data) => {
        if (cancelled) return;
        setSessionId(data.session_id);
        if (data.welcome_message) {
          setMessages([{ role: "assistant", content: data.welcome_message }]);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to create session");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function handleSend() {
    const text = input.trim();
    if (!text || !sessionId || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);
    setError(null);

    try {
      const res = await postAiMessage(sessionId, text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.message },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!sessionId && loading) {
    return <AiSessionLoader />;
  }

  if (error && !sessionId) {
    return (
      <main className="relative min-h-screen flex flex-col bg-[var(--color-background)]">
        <AuroraBackground />
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 backdrop-blur-sm p-4 max-w-md">
            <p className="text-destructive font-medium">Error</p>
            <p className="text-destructive/90 text-sm mt-1">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden">
      <AuroraBackground />

      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <header className="shrink-0 border-b border-white/10 bg-background/60 backdrop-blur-xl px-4 py-2.5">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Chat
            </span>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="shrink-0 pt-0.5">
                    <AssistantAvatar />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    m.role === "user"
                      ? "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-lg shadow-[var(--color-accent)]/20 order-first"
                      : "bg-card/90 backdrop-blur-sm border border-white/10 text-card-foreground"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="text-sm leading-relaxed">
                      <MarkdownMessage content={m.content} />
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="shrink-0 pt-0.5">
                  <AssistantAvatar />
                </div>
                <div className="rounded-2xl bg-card/90 backdrop-blur-sm border border-white/10 px-4 py-3 min-w-[80px]">
                  <ThinkingDots />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {error && (
          <div className="shrink-0 mx-4 mb-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <div className="shrink-0 p-4 border-t border-white/10 bg-background/60 backdrop-blur-xl">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Input
              placeholder="Type your message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSend()
              }
              disabled={loading}
              className="flex-1 rounded-xl border-border bg-muted/50 focus-visible:ring-[var(--color-accent)]"
            />
            <Button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
