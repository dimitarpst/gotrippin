"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  createAiSession,
  listAiSessions,
  updateAiSessionSummary,
  deleteAiSession,
} from "@/lib/api/ai";
import type { AiSessionListItem } from "@/lib/api/ai";
import AuroraBackground from "@/components/effects/aurora-background";
import { Logo } from "@/components/Logo";
import { MessageSquarePlus, ChevronRight, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const PAGE_SIZE = 20;

function titleToShortLabel(summary: string | null, newChatLabel: string): string {
  if (!summary?.trim()) return newChatLabel;
  const words = summary.trim().split(/\s+/).slice(0, 4);
  return words.join(" ") || newChatLabel;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function AiSessionsListClient({
  aiUsage,
}: {
  aiUsage: { used: number; limit: number | null; percent: number | null };
}) {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<AiSessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const sessionsLengthRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const router = useRouter();
  sessionsLengthRef.current = sessions.length;
  loadingMoreRef.current = loadingMore;

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const offset = sessionsLengthRef.current;
    try {
      const data = await listAiSessions("global", { limit: PAGE_SIZE, offset });
      setSessions((prev) => [...prev, ...data]);
      setHasMore(data.length >= PAGE_SIZE);
    } catch {
      // Keep hasMore true so user can retry by scrolling
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    listAiSessions("global", { limit: PAGE_SIZE, offset: 0 })
      .then((data) => {
        if (!cancelled) {
          setSessions(data);
          setHasMore(data.length >= PAGE_SIZE);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t("ai.failed_load_chat"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasMore || loading) return;
    const root = scrollContainerRef.current;
    const el = sentinelRef.current;
    if (!root || !el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || loadingMoreRef.current) return;
        loadMore();
      },
      { root, rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  async function handleNewChat() {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const data = await createAiSession({ scope: "global" });
      router.push(`/ai/${data.session_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("ai.failed_request"));
      setCreating(false);
    }
  }

  function startRename(s: AiSessionListItem) {
    setRenamingId(s.id);
    setRenameDraft((s.summary && s.summary.trim()) || "");
  }

  async function saveRename() {
    if (!renamingId) return;
    const words = renameDraft.trim().split(/\s+/).filter(Boolean).slice(0, 4);
    const value = words.length ? words.join(' ') : null;
    try {
      await updateAiSessionSummary(renamingId, value);
      setSessions((prev) =>
        prev.map((x) =>
          x.id === renamingId ? { ...x, summary: value || null } : x
        )
      );
    } catch {
      setError(t("ai.failed_rename_chat"));
    }
    setRenamingId(null);
    setRenameDraft("");
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameDraft("");
  }

  async function handleDelete(sessionId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(t("ai.delete_chat_confirm"))) return;
    try {
      await deleteAiSession(sessionId);
      setSessions((prev) => prev.filter((x) => x.id !== sessionId));
    } catch {
      setError(t("ai.failed_delete_chat"));
    }
  }

  return (
    <main className="relative min-h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-foreground)] overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
        <AuroraBackground />
      </div>
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-background via-background/80 to-transparent z-10 pointer-events-none" />

      {/* Single scroll container so the header can stick when scrolling */}
      <div
        ref={scrollContainerRef}
        className="relative z-10 flex-1 min-h-0 flex flex-col overflow-y-auto"
      >
        <header className="sticky top-0 z-20 shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 bg-[var(--color-background)]/90 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/trips")}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-card/10 backdrop-blur-md border border-white/5 hover:bg-card/20 transition-colors group shrink-0"
              aria-label={t("ai.back_to_trips")}
            >
              <ArrowLeft className="w-5 h-5 text-white/50 group-hover:text-white/80 transition-colors" />
            </button>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-nowrap">
                <Logo variant="sm" className="h-8 w-auto shrink-0" />
                <h1 className="text-lg font-semibold tracking-tight text-white whitespace-nowrap">{t("ai.title_short")}</h1>
              </div>
              <p className="text-xs text-white/50 font-medium">{t("ai.recent_chats")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-white/60 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            {aiUsage.percent != null ? `${aiUsage.percent}% used` : "Tracking"}
          </div>
        </header>

        <div className="flex flex-col flex-1 min-h-0 px-4 sm:px-6 py-4 pb-6">
        {error && (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 backdrop-blur-xl p-4 mb-6">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleNewChat}
          disabled={creating}
          className="w-full flex items-center gap-3 rounded-2xl bg-card/40 backdrop-blur-2xl border border-white/10 hover:bg-card/60 transition-colors p-4 text-left mb-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
        >
          <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 flex items-center justify-center shrink-0">
            <MessageSquarePlus className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white">{t("ai.new_chat")}</p>
            <p className="text-xs text-white/50">
              {creating ? t("ai.creating") : t("ai.start_new_conversation")}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40 shrink-0" />
        </button>

        <div className="flex-1 min-h-0">
          <p className="text-xs text-white/50 font-medium mb-3 px-1">Recent chats</p>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl bg-card/20 animate-pulse"
                  style={{ animationDelay: `${i * 80}ms` }}
                />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-white/50 px-1">{t("ai.no_chats_yet")}</p>
          ) : (
            <>
              <ul className="space-y-2">
                {sessions.map((s, i) => (
                  <motion.li
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.3) }}
                    className="relative flex items-center gap-2 rounded-2xl bg-card/40 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (renamingId === s.id) return;
                        router.push(`/ai/${s.id}`);
                      }}
                      className="flex-1 min-w-0 p-4 text-left rounded-l-2xl active:bg-card/20 transition-colors"
                    >
                      {renamingId === s.id ? (
                        <input
                          type="text"
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename();
                            if (e.key === "Escape") cancelRename();
                          }}
                          onBlur={saveRename}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-[15px] text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                          placeholder={t("ai.placeholder_sessions")}
                          autoFocus
                        />
                      ) : (
                        <>
                          <p className="font-medium text-white truncate">
                            {titleToShortLabel(s.summary, t("ai.new_chat"))}
                          </p>
                          <p className="text-xs text-white/50 mt-0.5">
                            {formatDate(s.updated_at)}
                          </p>
                        </>
                      )}
                    </button>
                    {renamingId !== s.id && (
                      <div className="flex items-center gap-1 pr-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => startRename(s)}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 active:text-white active:bg-white/10 transition-colors"
                          aria-label={t("ai.rename_chat")}
                        >
                          <Pencil className="w-[18px] h-[18px]" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(s.id, e)}
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 active:text-destructive active:bg-destructive/10 transition-colors"
                          aria-label={t("ai.delete_chat")}
                        >
                          <Trash2 className="w-[18px] h-[18px]" />
                        </button>
                        <div className="w-6 flex items-center justify-center pointer-events-none ml-1">
                          <ChevronRight className="w-5 h-5 text-white/20" />
                        </div>
                      </div>
                    )}
                  </motion.li>
                ))}
              </ul>
              <div ref={sentinelRef} className="h-4 flex items-center justify-center py-4" aria-hidden>
                {loadingMore && (
                  <span className="text-xs text-white/50">Loading more…</span>
                )}
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </main>
  );
}
