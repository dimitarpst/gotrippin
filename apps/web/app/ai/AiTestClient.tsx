"use client";

import { useState, useEffect, useRef } from "react";
import {
  getAiSessionWithMessages,
  postAiMessage,
  type AiPlaceSuggestion,
  type AiImageSuggestion,
} from "@/lib/api/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuroraBackground from "@/components/effects/aurora-background";
import MarkdownMessage from "@/components/ai/MarkdownMessage";
import ThinkingDots from "@/components/ai/ThinkingDots";
import AssistantAvatar from "@/components/ai/AssistantAvatar";
import AiSessionLoader from "@/components/ai/AiSessionLoader";
import { GoAiWordmark } from "@/components/ai/go-ai-wordmark";
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
import AiPlaceSuggestions from "@/components/ai/AiPlaceSuggestions";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  quick_replies?: Array<{ label: string; action: string }>;
  image_suggestions?: AiImageSuggestion[];
  place_suggestions?: AiPlaceSuggestion[];
}

interface WizardAnswer {
  heading: string;
  vibe: string;
  joining: string;
}

const WIZARD_STEPS: Array<{
  key: keyof WizardAnswer;
  question: string;
  options: string[];
}> = [
  {
    key: "heading",
    question: "Where are you heading?",
    options: ["Staying in Bulgaria", "Somewhere in Europe", "Further abroad", "Still deciding"],
  },
  {
    key: "vibe",
    question: "What's the vibe you're going for?",
    options: ["Nature & outdoors", "City exploration", "Food & culture", "Chill & relaxed"],
  },
  {
    key: "joining",
    question: "Who's joining you?",
    options: ["Solo", "With my partner", "Friends group", "Family"],
  },
];

const WORKING_STATUSES = [
  "Thinking...",
  "Searching for places...",
  "Building your route...",
  "Checking availability...",
  "Planning your trip...",
];

function WorkingStatus() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % WORKING_STATUSES.length);
    }, 2400);
    return () => clearInterval(timer);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={idx}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.25 }}
        className="text-xs text-white/60"
      >
        {WORKING_STATUSES[idx]}
      </motion.p>
    </AnimatePresence>
  );
}

type SelectedTool =
  | { kind: "image_pick"; label: string; message: string }
  | { kind: "quick_reply"; action: string; label: string }
  | { kind: "find_images"; label: string; messagePrefix: string };

interface AiTestClientProps {
  sessionId: string;
  aiUsage: { used: number; limit: number | null; percent: number | null };
}

export default function AiTestClient({ sessionId: initialSessionId, aiUsage: initialAiUsage }: AiTestClientProps) {
  const [sessionId] = useState<string>(initialSessionId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedTool, setSelectedTool] = useState<SelectedTool | null>(null);
  const [inputAreaMounted, setInputAreaMounted] = useState(false);
  const [aiUsage, setAiUsage] = useState(initialAiUsage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardAnswers, setWizardAnswers] = useState<Partial<WizardAnswer>>({});
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
    setInputAreaMounted(true);
  }, []);

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
            place_suggestions: m.place_suggestions,
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
          place_suggestions: res.place_suggestions,
        },
      ]);
      if (res.usage) setAiUsage(res.usage);
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

  const wizardActive = wizardStep < WIZARD_STEPS.length && messages.every((m) => m.role !== "user");

  async function handleWizardSelect(value: string) {
    const currentStep = WIZARD_STEPS[wizardStep];
    if (!currentStep || loading) return;
    const nextAnswers = { ...wizardAnswers, [currentStep.key]: value };
    setWizardAnswers(nextAnswers);

    if (wizardStep < WIZARD_STEPS.length - 1) {
      setWizardStep((prev) => prev + 1);
      return;
    }

    setWizardStep(WIZARD_STEPS.length);

    const heading = nextAnswers.heading ?? "Still deciding";
    const vibe = nextAnswers.vibe ?? "City exploration";
    const joining = nextAnswers.joining ?? "Solo";

    const displayText = `${heading} · ${vibe} · ${joining}`;
    const wizardPrompt = [
      `create_trip: Plan a trip with these preferences: destination region: ${heading}, vibe: ${vibe}, group: ${joining}.`,
      "Ask 1-2 follow-up questions if needed, then suggest a concrete itinerary with places.",
      "When possible, include structured PLACE_CARDS output.",
    ].join("\n");

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setMessages((prev) => [...prev, { role: "user", content: displayText }]);
    setLoading(true);
    setError(null);

    try {
      const res = await postAiMessage(sessionId, wizardPrompt, { signal: controller.signal });
      const safeMessage = res.message?.trim() || t("ai.empty_reply");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: safeMessage,
          quick_replies: res.quick_replies,
          image_suggestions: res.image_suggestions,
          place_suggestions: res.place_suggestions,
        },
      ]);
      if (res.usage) setAiUsage(res.usage);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : t("ai.failed_request"));
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  }

  function handleWizardSkip() {
    setWizardStep(WIZARD_STEPS.length);
  }

  async function handleSend() {
    if (!sessionId || loading) return;
    if (selectedTool) {
      if (selectedTool.kind === "quick_reply") {
        const extra = input.trim();
        setSelectedTool(null);
        setInput("");
        await handleQuickReplyClick(selectedTool.action, selectedTool.label, extra);
      } else if (selectedTool.kind === "find_images") {
        const text = (selectedTool.messagePrefix + input.trim()).trim();
        setSelectedTool(null);
        setInput("");
        if (text) await sendMessage(text, null);
      } else {
        setSelectedTool(null);
        await sendMessage(selectedTool.message, null);
      }
      return;
    }
    const text = input.trim();
    if (!text) return;
    await sendMessage(text, null);
  }

  function actionToDisplayLabel(action: string): string {
    switch (action) {
      case "find_images":
        return t("ai.find_images");
      case "create_trip":
        return t("ai.create_trip");
      case "just_chat":
        return t("ai.just_chat");
      default:
        return action;
    }
  }

  async function handleQuickReplyClick(action: string, label: string, extraText?: string) {
    if (!sessionId || loading) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const displayContent = extraText?.trim()
      ? extraText.trim()
      : (label?.trim() || actionToDisplayLabel(action));
    setMessages((prev) => [
      ...prev,
      { role: "user", content: displayContent },
    ]);
    setLoading(true);
    setError(null);

    const payload = extraText ? `${action}: ${extraText}` : action;
    try {
      const res = await postAiMessage(sessionId, payload, {
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
          place_suggestions: res.place_suggestions,
        },
      ]);
      if (res.usage) setAiUsage(res.usage);
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
    <main className="relative h-dvh flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden font-sans">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
        <AuroraBackground />
      </div>

      {/* Top gradient for header */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-background/90 to-transparent z-10 pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1 min-h-0 h-full">
        {/* Header — always visible at top */}
        <header className="shrink-0 px-4 sm:px-6 py-4 flex items-center justify-between bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-white/5">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <h1 className="m-0 shrink-0 leading-none">
                <GoAiWordmark alt={t("ai.title")} />
              </h1>
              <p className="text-xs text-white/50 font-medium flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                {t("ai.online_ready")}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white/60">
              {aiUsage.percent != null ? `${aiUsage.percent}% used` : "Tracking"}
            </div>
            <button
              onClick={() => router.push("/ai")}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-card/10 backdrop-blur-md border border-white/5 hover:bg-card/20 transition-colors group"
              aria-label={t("ai.back_to_chats")}
            >
              <X className="w-5 h-5 text-white/50 group-hover:text-white/80 transition-colors" />
            </button>
          </motion.div>
        </header>

        {/* Chat Area — only this scrolls */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="max-w-3xl mx-auto px-4 py-6 pb-4 space-y-8">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="flex flex-col items-center justify-center pt-[15vh] text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-accent)]/30 to-[var(--color-accent)]/10 border border-white/10 flex items-center justify-center mb-5">
                  <Sparkles className="w-7 h-7 text-[var(--color-accent)]" />
                </div>
                <h2 className="text-xl font-semibold text-white/90 mb-2">
                  {wizardActive ? "Let's plan your trip" : t("ai.title")}
                </h2>
                <p className="text-sm text-white/50 max-w-sm">
                  {wizardActive
                    ? "Answer a few quick questions below to get started"
                    : "Ask me anything about travel — I'll help you plan, find places, and build your perfect trip."}
                </p>
              </motion.div>
            )}
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
                        ? "bg-gradient-to-br from-[var(--color-accent)] to-[#ff8f8f] text-white shadow-[0_8px_24px_-6px_rgba(255, 118, 112,0.4)] order-first rounded-tr-sm"
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
                                  setSelectedTool({
                                    kind: "image_pick",
                                    label: `Image ${idx + 1}`,
                                    message: `Use image ${idx + 1}`,
                                  });
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
                        {m.place_suggestions && m.place_suggestions.length > 0 ? (
                          <AiPlaceSuggestions places={m.place_suggestions} />
                        ) : null}
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
                    <div className="space-y-3">
                      <ThinkingDots />
                      <WorkingStatus />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {error && (
          <div className="px-4 pt-2">
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

        {/* Input Area — dynamic island */}
        <div className="shrink-0 px-4 py-4 pb-6 pt-2">
          <div className="max-w-3xl mx-auto">
            <motion.div
              layout
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ layout: { type: "spring", stiffness: 400, damping: 30 }, delay: 0.1, duration: 0.4, type: "spring" }}
              className={`relative rounded-[2rem] bg-background/60 backdrop-blur-3xl border border-white/10 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] flex flex-col gap-0 min-w-0 overflow-hidden ${selectedTool || wizardActive ? "p-2 pb-2 pt-3" : "p-2"}`}
            >
              {/* Wizard dynamic island expansion */}
              <AnimatePresence mode="wait">
                {wizardActive && !loading && WIZARD_STEPS[wizardStep] ? (
                  <motion.div
                    key={`wizard-${wizardStep}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-1">
                      <div className="flex items-center justify-between mb-2">
                        <motion.p
                          key={`q-${wizardStep}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="text-sm font-medium text-white/90"
                        >
                          {WIZARD_STEPS[wizardStep].question}
                        </motion.p>
                        <button
                          type="button"
                          onClick={handleWizardSkip}
                          className="text-[11px] text-white/50 hover:text-white/80 transition-colors px-1.5 py-0.5 rounded-md hover:bg-white/5"
                        >
                          Skip
                        </button>
                      </div>
                      <div className="flex gap-1 mb-3">
                        {WIZARD_STEPS.map((_, sIdx) => (
                          <motion.div
                            key={sIdx}
                            className="h-0.5 flex-1 rounded-full overflow-hidden bg-white/10"
                          >
                            <motion.div
                              className="h-full bg-[var(--color-accent)]"
                              initial={{ width: sIdx < wizardStep ? "100%" : "0%" }}
                              animate={{ width: sIdx <= wizardStep ? "100%" : "0%" }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                            />
                          </motion.div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {WIZARD_STEPS[wizardStep].options.map((option, idx) => (
                          <motion.button
                            key={option}
                            type="button"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * idx + 0.12, type: "spring", stiffness: 500, damping: 30 }}
                            onClick={() => void handleWizardSelect(option)}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left text-[13px] font-medium text-white/90 transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            {option}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <AnimatePresence mode="wait">
                {selectedTool && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2 overflow-hidden shrink-0 mb-2"
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/40 px-3 py-1.5 text-sm font-medium shrink-0">
                      {selectedTool.kind === "image_pick" ? (
                        <ImageIcon className="w-4 h-4" />
                      ) : selectedTool.kind === "find_images" ? (
                        <ImageIcon className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      <span>{selectedTool.label}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTool(null)}
                        className="rounded-full p-0.5 hover:bg-[var(--color-accent)]/20 -mr-0.5"
                        aria-label={t("ai.remove_tool")}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex gap-2 items-center min-w-0">
                {!inputAreaMounted ? (
                  <Button
                    type="button"
                    size="icon"
                    className="w-10 h-10 rounded-full bg-card/70 text-white/80 border border-white/10 shrink-0"
                    aria-hidden
                    tabIndex={-1}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        className="w-10 h-10 rounded-full bg-card/70 text-white/80 hover:bg-card hover:text-white border border-white/10 shrink-0"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuItem
                        onClick={() => {
                          if (!loading) {
                            setSelectedTool({
                              kind: "find_images",
                              label: t("ai.find_images"),
                              messagePrefix: "Find some Unsplash images for ",
                            });
                            setInput("");
                          }
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-2 text-[var(--color-accent)]" />
                        <span>{t("ai.find_images")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (!loading) {
                            setSelectedTool({
                              kind: "quick_reply",
                              action: "create_trip",
                              label: t("ai.create_trip"),
                            });
                          }
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-2 text-[var(--color-accent)]" />
                        <span>{t("ai.create_trip")}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (!loading) {
                            setSelectedTool({
                              kind: "quick_reply",
                              action: "just_chat",
                              label: t("ai.just_chat"),
                            });
                          }
                        }}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        <span>{t("ai.just_chat")}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Input
                  placeholder={wizardActive ? "Choose an option above..." : t("ai.placeholder")}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && !loading && !wizardActive && handleSend()
                  }
                  disabled={loading || wizardActive}
                  className="flex-1 min-w-0 h-12 border-0 bg-transparent px-4 text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
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
                    disabled={!input.trim() && !selectedTool}
                    size="icon"
                    className="w-12 h-12 shrink-0 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90 hover:scale-105 transition-all shadow-[0_0_15px_rgba(255, 118, 112,0.4)] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
                  >
                    <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
