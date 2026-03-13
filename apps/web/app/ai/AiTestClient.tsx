"use client";

import { useState, useEffect, useRef } from "react";
import {
  getAiSessionWithMessages,
  postAiMessage,
  type AiImageSuggestion,
} from "@/lib/api/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuroraBackground from "@/components/effects/aurora-background";
import MarkdownMessage from "@/components/ai/MarkdownMessage";
import ThinkingDots from "@/components/ai/ThinkingDots";
import AssistantAvatar from "@/components/ai/AssistantAvatar";
import AiSessionLoader from "@/components/ai/AiSessionLoader";
import { Logo } from "@/components/Logo";
import { Send, Sparkles, Pencil, X, Square, Plus, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CoverImageWithBlur } from "@/components/ui/cover-image-with-blur";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  quick_replies?: Array<{ label: string; action: string }>;
  image_suggestions?: AiImageSuggestion[];
}

interface AiTestClientProps {
  sessionId: string;
  aiUsage: { used: number; limit: number | null; percent: number | null };
}

export default function AiTestClient({ sessionId: initialSessionId, aiUsage }: AiTestClientProps) {
  const [sessionId] = useState<string>(initialSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const editingInputRef = useRef<HTMLTextAreaElement | null>(null);
  const { t } = useTranslation();
  const router = useRouter();

  const LONG_PRESS_MS = 500;

  function startLongPress(content: string, index: number) {
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null;
      handleStartEdit(content, index);
    }, LONG_PRESS_MS);
  }

  function cancelLongPress() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function stopGeneration() {
    abortControllerRef.current?.abort();
  }

  function handleStartEdit(content: string, index: number) {
    abortControllerRef.current?.abort();
    setLoading(false);
    setEditingIndex(index);
    setEditingDraft(content);
    setError(null);
  }

  function handleCancelEdit() {
    setEditingIndex(null);
    setEditingDraft("");
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAiSessionWithMessages(sessionId)
      .then((data) => {
        if (cancelled) return;
        setMessages(
          data.messages.map((m) => ({
            role: m.role,
            content: m.content,
            quick_replies: m.quick_replies,
            image_suggestions: m.image_suggestions,
          })),
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t("ai.failed_load_chat"));
        if (err instanceof Error && err.message === "Session not found") {
          router.replace("/ai");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, router]);

  async function sendMessage(text: string, fromIndex: number | null) {
    if (!text.trim() || !sessionId) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const trimmed = text.trim();
    if (fromIndex !== null) {
      setMessages((prev) => [
        ...prev.slice(0, fromIndex),
        { role: "user", content: trimmed },
      ]);
      setEditingIndex(null);
      setEditingDraft("");
    } else {
      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    }
    setLoading(true);
    setError(null);

    try {
      const res = await postAiMessage(sessionId, trimmed, {
        signal: controller.signal,
      });
      const safeMessage =
        res.message && res.message.trim().length > 0
          ? res.message
          : t("ai.empty_reply");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: safeMessage,
          quick_replies: res.quick_replies,
          image_suggestions: res.image_suggestions,
        },
      ]);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        if (fromIndex !== null) {
          setMessages((prev) => prev.slice(0, fromIndex));
          setEditingIndex(fromIndex);
          setEditingDraft(text.trim());
        }
        return;
      }
      setError(err instanceof Error ? err.message : t("ai.failed_request"));
      setMessages((prev) =>
        fromIndex !== null ? prev.slice(0, fromIndex) : prev.slice(0, -1),
      );
      if (fromIndex === null) setInput(trimmed);
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || !sessionId || loading) return;
    await sendMessage(text, null);
  }

  async function handleQuickReplyClick(action: string, label: string) {
    if (!sessionId || loading) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMessages((prev) => [...prev, { role: "user", content: label }]);
    setLoading(true);
    setError(null);

    try {
      const res = await postAiMessage(sessionId, action, {
        signal: controller.signal,
      });
      const safeMessage =
        res.message && res.message.trim().length > 0
          ? res.message
          : t("ai.empty_reply");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: safeMessage,
          quick_replies: res.quick_replies,
          image_suggestions: res.image_suggestions,
        },
      ]);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err.message : t("ai.failed_request"));
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  }

  async function handleSendFromInline() {
    if (!editingDraft.trim() || sessionId === null || editingIndex === null || loading) return;
    await sendMessage(editingDraft, editingIndex);
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (editingIndex !== null) {
      editingInputRef.current?.focus();
      editingInputRef.current?.select();
    }
  }, [editingIndex]);

  if (loading && messages.length === 0) {
    return <AiSessionLoader />;
  }

  if (error && messages.length === 0) {
    return (
      <main className="relative min-h-screen flex flex-col bg-[var(--color-background)]">
        <AuroraBackground />
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 backdrop-blur-xl p-5 max-w-md shadow-2xl">
            <p className="text-destructive font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              Error
            </p>
            <p className="text-destructive/90 text-sm mt-2">{error}</p>
          </div>
        </div>
      </main>
    );
  }


  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
        <AuroraBackground />
      </div>

      {/* Top Gradient Overlay for header reading clarity */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-background via-background/80 to-transparent z-10 pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        {/* Header — sticky so back/close is always reachable when scrolling */}
        <header className="sticky top-0 shrink-0 px-4 sm:px-6 py-4 flex items-center justify-between z-20 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-white/5">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-nowrap">
                <Logo variant="sm" className="h-8 w-auto shrink-0" />
                <h1 className="text-lg font-semibold tracking-tight text-white whitespace-nowrap">{t("ai.title_short")}</h1>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs text-white/50 font-medium flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  {t("ai.online_ready")}
                </p>
                <div className="h-3 w-px bg-white/10" />
                <p className="text-[11px] font-medium text-white/40">
                  {aiUsage.percent != null ? `${aiUsage.percent}% used` : "Tracking"}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <button
              onClick={() => router.push("/ai")}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-card/10 backdrop-blur-md border border-white/5 hover:bg-card/20 transition-colors group"
              aria-label={t("ai.back_to_chats")}
            >
              <X className="w-5 h-5 text-white/50 group-hover:text-white/80 transition-colors" />
            </button>
          </motion.div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-32">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                  className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="shrink-0 pt-1">
                      <AssistantAvatar />
                    </div>
                  )}
                  
                  <div
                    className={`relative group max-w-[85%] sm:max-w-[75%] rounded-[1.5rem] px-5 py-4 ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-[var(--color-accent)] to-[#ff8f8f] text-white shadow-[0_8px_24px_-6px_rgba(255,107,107,0.4)] order-first rounded-tr-sm"
                        : "bg-card/40 backdrop-blur-2xl border border-white/10 text-card-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_24px_-6px_rgba(0,0,0,0.2)] rounded-tl-sm"
                    }`}
                    {...(m.role === "user"
                      ? {
                          onPointerDown: () => startLongPress(m.content, i),
                          onPointerUp: cancelLongPress,
                          onPointerLeave: cancelLongPress,
                          onPointerCancel: cancelLongPress,
                        }
                      : {})}
                  >
                    {m.role === "assistant" ? (
                      <div className="space-y-3">
                        <div className="text-[15px] leading-relaxed">
                          <MarkdownMessage content={m.content} />
                        </div>
                        {m.image_suggestions && m.image_suggestions.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                            {m.image_suggestions.map((img, idx) => (
                              <button
                                key={img.id || idx}
                                type="button"
                                onClick={() => {
                                  const label = `Use image ${idx + 1}`;
                                  setInput(label);
                                }}
                                className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-white/10 bg-black/40"
                              >
                                <CoverImageWithBlur
                                  src={img.thumbnail_url}
                                  alt={img.photographer_name || t("trips.trip_cover_option_alt")}
                                  blurHash={img.blur_hash ?? undefined}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white/90">
                                  <span className="font-medium truncate">
                                    {img.photographer_name || `Image ${idx + 1}`}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full bg-black/60 text-[10px]">
                                    {idx + 1}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {m.quick_replies && m.quick_replies.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {m.quick_replies.map((qr) => (
                              <Button
                                key={`${qr.action}-${qr.label}`}
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleQuickReplyClick(qr.action, qr.label)
                                }
                                className="rounded-full border-white/20 bg-white/5 text-white/90 hover:bg-white/10 hover:text-white"
                              >
                                {qr.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : editingIndex === i ? (
                      <div className="flex flex-col gap-2 w-full min-w-0">
                        <textarea
                          ref={editingInputRef}
                          value={editingDraft}
                          onChange={(e) => setEditingDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendFromInline();
                            }
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                          rows={3}
                          className="w-full min-w-0 resize-none rounded-xl bg-white/95 text-[var(--color-background)] border border-white/40 px-4 py-3 text-[15px] placeholder:text-[var(--color-background)]/50 focus:outline-none focus:ring-2 focus:ring-white"
                          placeholder={t("ai.placeholder_edit")}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="text-white/90 hover:text-white hover:bg-white/10"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSendFromInline}
                            disabled={loading || !editingDraft.trim()}
                            className="bg-white/90 text-[var(--color-background)] hover:bg-white border-0"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Send
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium select-none touch-none">{m.content}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            cancelLongPress();
                            handleStartEdit(m.content, i);
                          }}
                          className="absolute top-1/2 -translate-y-1/2 -left-12 w-8 h-8 rounded-full bg-card/60 backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity hover:bg-card/80 text-muted-foreground hover:text-white"
                          aria-label={t("ai.edit_message")}
                          title={t("ai.edit_message_title")}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  className="flex gap-4 justify-start"
                >
                  <div className="shrink-0 pt-1">
                    <AssistantAvatar />
                  </div>
                  <div className="relative rounded-[1.5rem] rounded-tl-sm bg-card/40 backdrop-blur-2xl border border-white/10 px-6 py-5 min-w-[80px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_24px_-6px_rgba(0,0,0,0.2)]">
                    <ThinkingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {error && (
          <div className="absolute bottom-28 left-4 right-4 z-20">
            <div className="max-w-3xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-destructive/50 bg-destructive/20 backdrop-blur-xl p-4 shadow-xl"
              >
                <p className="text-destructive font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                  {error}
                </p>
              </motion.div>
            </div>
          </div>
        )}

        {/* Floating Input Area */}
        <div className="absolute bottom-6 left-0 right-0 px-4 z-20">
          <div className="max-w-3xl mx-auto">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="relative p-2 rounded-[2rem] bg-background/60 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] flex gap-2 items-center"
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    className="w-10 h-10 rounded-full bg-card/70 text-white/80 hover:bg-card hover:text-white border border-white/10 mr-1"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem
                    onClick={() => {
                      if (!loading) {
                        setInput((prev) =>
                          prev && prev.length > 0
                            ? prev
                            : "Find some Unsplash images for ",
                        );
                      }
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-[var(--color-accent)]" />
                    <span>{t("ai.find_images")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (!loading) {
                        void handleQuickReplyClick("create_trip", t("ai.create_trip"));
                      }
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-[var(--color-accent)]" />
                    <span>{t("ai.create_trip")}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (!loading) {
                        void handleQuickReplyClick("just_chat", t("ai.just_chat"));
                      }
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    <span>{t("ai.just_chat")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Input
                placeholder={t("ai.placeholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && !loading && handleSend()
                }
                disabled={loading}
                className="flex-1 h-12 border-0 bg-transparent px-4 text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
              />
              {loading ? (
                <Button
                  type="button"
                  onClick={stopGeneration}
                  size="icon"
                  aria-label={t("ai.stop_generating")}
                  className="w-12 h-12 shrink-0 rounded-full bg-destructive/90 text-destructive-foreground hover:bg-destructive transition-all flex items-center justify-center"
                >
                  <Square className="w-5 h-5 fill-current" />
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  size="icon"
                  className="w-12 h-12 shrink-0 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90 hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,107,107,0.4)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
                >
                  <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
