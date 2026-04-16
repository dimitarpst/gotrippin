"use client";

import { useState, useEffect, useLayoutEffect, useRef, useMemo, type ReactNode } from "react";
import {
  getAiSessionWithMessages,
  postAiMessageStream,
  selectSessionCoverImage,
  type AiAttachedTripPreview,
  type AiBudgetSummary,
  type AiCoverPick,
  type AiPlaceSuggestion,
  type AiImageSuggestion,
  type AiStreamProgressLine,
  type PostAiMessageOptions,
  type PostMessageResponse,
} from "@/lib/api/ai";
import { fetchTrips, inviteTripByEmail, ApiError } from "@/lib/api/trips";
import type { Trip } from "@gotrippin/core";
import { getAuthToken } from "@/lib/api/auth";
import { searchImages } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuroraBackground from "@/components/effects/aurora-background";
import MarkdownMessage from "@/components/ai/MarkdownMessage";
import { stripXmlQuickReplyArtifacts } from "@/lib/ai/stripXmlQuickReplyArtifacts";
import { AI_PLAN_CONTEXT_STORAGE_KEY } from "@/lib/ai/aiPlanContextStorage";
import AiPlaceSuggestions from "@/components/ai/AiPlaceSuggestions";
import AiBudgetCard from "@/components/ai/AiBudgetCard";
import { GoAiWordmark } from "@/components/ai/go-ai-wordmark";
import AiSessionLoader from "@/components/ai/AiSessionLoader";
import {
  Send,
  Sparkles,
  Pencil,
  X,
  Square,
  Plus,
  Image as ImageIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Briefcase,
  MessageCircle,
  Route,
  Mic,
  Check,
  Link2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CoverImageWithBlur } from "@/components/ui/cover-image-with-blur";
import { resolveTripCoverUrl } from "@/lib/r2-public";
import { tripCoverBlurHash } from "@/lib/trip-cover-key";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
interface ChatMessage {
  role: "user" | "assistant";
  /** Wire/API text; user bubble may show a friendlier `formatUserMessageForDisplay(content)`. */
  content: string;
  linked_trip_id?: string;
  attached_trip?: AiAttachedTripPreview;
  cover_pick?: AiCoverPick;
  quick_replies?: Array<{ label: string; action: string }>;
  image_suggestions?: AiImageSuggestion[];
  place_suggestions?: AiPlaceSuggestion[];
  tool_calls?: string[];
  budget_summary?: AiBudgetSummary;
}

interface WizardAnswer {
  heading: string;
  vibe: string;
  joining: string;
  travelDates: string;
}

type WizardStep =
  | {
      kind: "options";
      key: "heading" | "vibe" | "joining";
      question: string;
      options: string[];
    }
  | {
      kind: "dates";
      key: "travelDates";
      question: string;
    };

/** User message sent when choosing “Add stops to my trip” from the composer menu (server maps just_chat:). */
const ROUTE_HELP_CHAT_PAYLOAD = "just_chat:Add stops to my trip";

/** Legacy global welcome from createSession; removed server-side — hide in thread for old sessions. */
const LEGACY_GLOBAL_ASSISTANT_WELCOME =
  "Hi! I'm your trip planning assistant. Tell me where you're headed (or what's on your mind) and we'll plan from there.";

const WIZARD_STEPS: WizardStep[] = [
  {
    kind: "options",
    key: "heading",
    question: "Where are you heading?",
    options: ["Staying in Bulgaria", "Somewhere in Europe", "Further abroad", "Still deciding"],
  },
  {
    kind: "options",
    key: "vibe",
    question: "What's the vibe you're going for?",
    options: ["Nature & outdoors", "City exploration", "Food & culture", "Chill & relaxed"],
  },
  {
    kind: "options",
    key: "joining",
    question: "Who's joining you?",
    options: ["Solo", "With my partner", "Friends group", "Family"],
  },
  {
    kind: "dates",
    key: "travelDates",
    question: "When are you traveling?",
  },
];

function formatWizardDateRangeLabel(from: Date, to: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  return `${from.toLocaleDateString("en-US", opts)} - ${to.toLocaleDateString("en-US", opts)}`;
}

const SYSTEM_PROMPT_PATTERNS = [
  /^create_trip:\s*/i,
  /Ask \d+-?\d* follow-up questions?.*/i,
  /When possible,?\s*include structured PLACE_CARDS output\.?/i,
  /then suggest a concrete itinerary with places\.?/i,
];

function cleanUserMessage(content: string): string {
  let cleaned = content;
  for (const pattern of SYSTEM_PROMPT_PATTERNS) {
    cleaned = cleaned.replace(pattern, "");
  }
  cleaned = cleaned.replace(/\n{2,}/g, "\n").trim();
  if (!cleaned || cleaned.length < 3) return content.split("\n")[0].replace(/^create_trip:\s*/i, "").trim() || content;
  return cleaned;
}

/** Island / wizard rows use plain text; AI often sends **bold** from markdown — render it. */
function formatChoiceLabelMarkdown(text: string): ReactNode {
  const re = /\*\*([^*]+)\*\*/g;
  const segments: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    }
    segments.push(
      <strong key={key++} className="font-semibold text-white/95">
        {match[1]}
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (segments.length === 0) {
    return text;
  }
  if (last < text.length) {
    segments.push(<span key={key++}>{text.slice(last)}</span>);
  }
  return <>{segments}</>;
}

interface ImageOption {
  label: string;
  thumbnailUrl: string;
  blurHash?: string;
  /** 1-based index sent to select-cover-image API */
  oneBasedIndex: number;
}

interface IslandField {
  question: string;
  options: string[];
  /** When many single-option fields are merged, subtitle per tile (former per-question titles). */
  optionSubtitles?: string[];
  imageOptions?: ImageOption[];
  value: string;
  kind: "text" | "date" | "image";
  /** When options came from quick_replies, send this (e.g. just_chat:Rome) instead of plain value */
  valueAction?: string;
  /** Parallel to options — API actions for each chip when merged from quick_replies */
  optionActions?: string[];
}

/** Sent to indicate merged cover-pick island title should use i18n `ai.island_choose_cover`. */
const COVER_ISLAND_MERGED_QUESTION = "__gt_cover_island_merged__";

/**
 * The model often emits one numbered block per cover candidate (7 pages). Collapse that into a single
 * field so users pick in one grid. Also drops duplicate tail fields when quick_replies already merged
 * all labels onto the first field.
 */
function normalizeCoverIslandFields(fields: IslandField[]): IslandField[] {
  if (fields.length < 2) return fields;

  const head = fields[0];
  if (
    head &&
    head.kind === "text" &&
    head.options.length >= 2 &&
    fields.slice(1).every((f) => f.kind === "text" && f.options.length === 1)
  ) {
    return [head];
  }

  const allTextSingleOption = fields.every(
    (f) =>
      f.kind === "text" &&
      f.options.length === 1 &&
      (f.options[0] ?? "").trim().length > 0,
  );
  if (!allTextSingleOption) return fields;

  const merged: IslandField = {
    question: COVER_ISLAND_MERGED_QUESTION,
    options: fields.map((f) => (f.options[0] ?? "").trim()),
    optionSubtitles: fields.map((f) => f.question.trim()),
    value: "",
    kind: "text",
  };

  const perFieldActions: string[] = [];
  let allHaveOneAction = true;
  for (const f of fields) {
    const action = f.optionActions?.[0];
    if (action !== undefined && action.trim().length > 0) {
      perFieldActions.push(action.trim());
    } else {
      allHaveOneAction = false;
      break;
    }
  }
  if (allHaveOneAction && perFieldActions.length === merged.options.length) {
    merged.optionActions = perFieldActions;
  }

  return [merged];
}

interface IslandHistory {
  messageIndex: number;
  fields: IslandField[];
}

/** Strips trailing punctuation so model mistakes like "create_trip." map to create_trip. */
function normalizeActionKey(raw: string): string {
  return raw.trim().replace(/\.+$/, "").toLowerCase();
}

function quickReplyActionHead(wire: string | undefined): string | undefined {
  if (!wire) return undefined;
  const s = wire.trim();
  const colon = s.indexOf(":");
  const head = (colon === -1 ? s : s.slice(0, colon)).trim();
  if (!head) return undefined;
  return normalizeActionKey(head);
}

function normalizeQuickReplyAction(q: { label: string; action: string }): string {
  const a = normalizeActionKey(q.action);
  if (a === "just_chat") return `just_chat:${q.label.trim()}`;
  return a;
}

/** Merges assistant `quick_replies` into island fields only (no duplicate chip row). */
function mergeAssistantQuickRepliesIntoIslandFields(
  fields: IslandField[],
  qrs: Array<{ label: string; action: string }>,
  syntheticQuestion: string,
): void {
  if (qrs.length === 0) return;
  const labels = qrs.map((qr) => qr.label.trim()).filter((l) => l.length > 0);
  if (labels.length === 0) return;
  const optionActions = qrs.map(normalizeQuickReplyAction);

  const emptyTextIndices = fields
    .map((f, i) => (f.kind === "text" && f.options.length === 0 ? i : -1))
    .filter((i) => i >= 0);
  if (emptyTextIndices.length === 1) {
    const emptyIdx = emptyTextIndices[0];
    if (emptyIdx !== undefined) {
      const target = fields[emptyIdx];
      if (target) {
        fields[emptyIdx] = { ...target, options: labels, optionActions };
      }
    }
    return;
  }

  const matchIdx = fields.findIndex(
    (f) =>
      f.kind === "text" &&
      f.options.length === labels.length &&
      f.options.every((o, i) => o.trim().toLowerCase() === (labels[i] ?? "").toLowerCase()),
  );
  if (matchIdx >= 0) {
    const target = fields[matchIdx];
    if (target) {
      fields[matchIdx] = { ...target, optionActions };
    }
    return;
  }

  const firstTextIdx = fields.findIndex((f) => f.kind === "text");
  if (firstTextIdx >= 0) {
    const target = fields[firstTextIdx];
    if (target) {
      fields[firstTextIdx] = { ...target, options: labels, optionActions };
    }
    return;
  }

  fields.unshift({
    question: syntheticQuestion,
    options: labels,
    optionActions,
    value: "",
    kind: "text",
  });
}

const DATE_KEYWORDS = /\b(when|date|dates|planning to travel|time to travel|travel date|depart|arrive|schedule|how long|duration)\b/i;

const OPTION_LINE = /(?:^|\n)\s*[-–•]\s+([^\n]+)/g;

function parseNumberedQuestions(text: string): IslandField[] {
  const regex = /(?:^|\n)\s*(\d+)\.\s+\*{0,2}([^*\n?]+\??)\*{0,2}\s*/g;
  const fields: IslandField[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const question = match[2].trim();
    const afterQ = text.slice(match.index + match[0].length);
    const lineEnd = afterQ.indexOf("\n\n");
    const block = lineEnd > -1 ? afterQ.slice(0, lineEnd) : afterQ.slice(0, 400);
    const options: string[] = [];
    let om;
    const dashRegex = new RegExp(OPTION_LINE.source, "g");
    while ((om = dashRegex.exec(block)) !== null) options.push(om[1].trim());
    const isDate = DATE_KEYWORDS.test(question);
    if (isDate || options.length > 0) {
      fields.push({ question, options: isDate ? [] : options, value: "", kind: isDate ? "date" : "text" });
    } else {
      fields.push({ question, options: [], value: "", kind: "text" });
    }
  }

  if (fields.length === 0) {
    const standaloneQ = text.match(/(?:which one|pick one|choose|reply with|select)[^?\n]*\?/i);
    if (standaloneQ) {
      const qIdx = text.indexOf(standaloneQ[0]);
      const before = text.slice(0, qIdx);
      const options: string[] = [];
      let om;
      const dashRegex = new RegExp(OPTION_LINE.source, "g");
      while ((om = dashRegex.exec(before)) !== null) options.push(om[1].trim());
      if (options.length >= 2) {
        fields.push({ question: standaloneQ[0].trim(), options, value: "", kind: "text" });
      }
    }
  }
  // Intentionally no broad "any line with ?" fallback: generic assistant greetings
  // (e.g. "…dates in mind?") were parsed as a date island and broke dismiss / strip UX.
  return fields;
}

function stripParsedQuestions(text: string, fields: IslandField[]): string {
  if (fields.length === 0) return text;
  let stripped = text;
  for (const field of fields) {
    const qEscaped = field.question.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const qPattern = new RegExp(`\\n?\\s*\\d+\\.\\s+\\*{0,2}${qEscaped}\\*{0,2}[\\s\\S]*?(?=\\n\\s*\\d+\\.|$)`, "g");
    stripped = stripped.replace(qPattern, "");
    stripped = stripped.replace(new RegExp(`\\n?\\s*${qEscaped}\\s*`, "g"), "");

    for (const opt of field.options) {
      const optEscaped = opt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      stripped = stripped.replace(new RegExp(`\\n?\\s*[-–•]\\s+${optEscaped}\\s*`, "g"), "");
    }
  }
  stripped = stripped.replace(/(?:which one|pick one|choose|reply with|select)[^?\n]*\?/i, "");
  stripped = stripped.replace(/\(Reply with[^)]*\)/gi, "");
  stripped = stripped.replace(/\n{3,}/g, "\n\n").trim();
  return stripped;
}

type SelectedTool =
  | { kind: "image_pick"; label: string; message: string }
  | { kind: "quick_reply"; action: string; label: string }
  | { kind: "find_images"; label: string; messagePrefix: string }
  | { kind: "route_help"; label: string };

interface AiTestClientProps {
  sessionId: string;
  aiUsage: { used: number; limit: number | null; percent: number | null };
  displayName?: string | null;
}

function greetingBucket(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export default function AiTestClient({
  sessionId: initialSessionId,
  aiUsage: initialAiUsage,
  displayName: displayNameProp,
}: AiTestClientProps) {
  const sessionId = initialSessionId;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedTool, setSelectedTool] = useState<SelectedTool | null>(null);
  const [inputAreaMounted, setInputAreaMounted] = useState(false);
  const [aiUsage, setAiUsage] = useState(initialAiUsage);
  /** Draft trip UUID from session slots (API) until an assistant message carries linked_trip_id. */
  const [sessionCurrentTripId, setSessionCurrentTripId] = useState<string | null>(null);
  const [sessionScope, setSessionScope] = useState<"global" | "trip" | null>(null);
  /** Global chats only: trip context merged server-side on each send. */
  const [attachedTripId, setAttachedTripId] = useState<string | null>(null);
  const [attachedTripTitle, setAttachedTripTitle] = useState<string | null>(null);
  const [attachedTripCoverSrc, setAttachedTripCoverSrc] = useState<string | null>(null);
  const [attachedTripCoverBlurHash, setAttachedTripCoverBlurHash] = useState<string | null>(null);
  const [attachTripDrawerOpen, setAttachTripDrawerOpen] = useState(false);
  const [tripsForAttach, setTripsForAttach] = useState<Trip[]>([]);
  const [tripsForAttachLoading, setTripsForAttachLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingDraft, setEditingDraft] = useState("");
  const [wizardStep, setWizardStep] = useState(0);
  /** When true, show the guided questionnaire in the composer (opt-in; not auto-started). */
  const [wizardFlowActive, setWizardFlowActive] = useState(false);
  /** User hid the guided-setup CTA; can bring it back via subtle link. */
  const [guidedSetupDismissed, setGuidedSetupDismissed] = useState(false);
  const [wizardAnswers, setWizardAnswers] = useState<Partial<WizardAnswer>>({});
  const [islandFields, setIslandFields] = useState<IslandField[]>([]);
  const [islandDismissed, setIslandDismissed] = useState(false);
  const [islandPage, setIslandPage] = useState(0);
  const [islandHistory, setIslandHistory] = useState<IslandHistory[]>([]);
  const [islandPreview, setIslandPreview] = useState<IslandHistory | null>(null);
  const [streamActiveTool, setStreamActiveTool] = useState<string | null>(null);
  const [streamRecentTool, setStreamRecentTool] = useState<string | null>(null);
  const [streamPhase, setStreamPhase] = useState<string | null>(null);
  const [islandOptionPreviews, setIslandOptionPreviews] = useState<
    Record<string, { url: string; blurHash: string | null }>
  >({});
  const [islandDateOpen, setIslandDateOpen] = useState(false);
  const [islandDateRangeDraft, setIslandDateRangeDraft] = useState<DateRange | undefined>(undefined);
  const [wizardDateOpen, setWizardDateOpen] = useState(false);
  const [wizardDateRangeDraft, setWizardDateRangeDraft] = useState<DateRange | undefined>(undefined);
  /** After guided wizard + trip id exists: optional email invite for non-Solo “who’s joining”. */
  const [postWizardPartnerInvite, setPostWizardPartnerInvite] = useState<null | { tripId: string; email: string }>(
    null,
  );
  const [postWizardInviteSending, setPostWizardInviteSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const islandOptionPreviewsRef = useRef<Record<string, { url: string; blurHash: string | null }>>({});
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const editingInputRef = useRef<HTMLTextAreaElement | null>(null);
  const composerGrowRef = useRef<HTMLTextAreaElement | null>(null);
  /** Prevents double auto-send of create-trip "Plan with AI" bootstrap (e.g. React Strict Mode). */
  const planBootstrapConsumedRef = useRef(false);
  const { t, i18n } = useTranslation();
  const router = useRouter();

  function applyStreamProgress(ev: AiStreamProgressLine) {
    if (ev.type === "tool") {
      if (ev.phase === "start") {
        setStreamActiveTool(ev.name);
        setStreamRecentTool(ev.name);
      } else {
        setStreamActiveTool(null);
        setStreamRecentTool(ev.name);
      }
      return;
    }
    if (ev.type === "phase") {
      setStreamPhase(ev.phase);
      if (ev.phase === "thinking" || ev.phase === "reply" || ev.phase === "formatting") {
        setStreamActiveTool(null);
        setStreamRecentTool(null);
      }
    }
  }

  function streamActivityKey(): string {
    if (streamActiveTool) return `run:${streamActiveTool}`;
    if (streamPhase === "formatting") return "fmt";
    if (streamPhase === "reply") return "reply";
    if (streamPhase === "tools") {
      return streamRecentTool
        ? `tools:${streamRecentTool}:${streamActiveTool ?? ""}`
        : "tools";
    }
    if (streamPhase === "model") {
      return streamRecentTool ? `model:${streamRecentTool}` : "model";
    }
    if (streamPhase === "thinking") return "think";
    return "idle";
  }

  function streamToolDisplayName(toolName: string): string {
    const key = toolName === "create_trip" ? "createTripDraft" : toolName;
    return t(`ai.tool.${key}`, { defaultValue: toolName });
  }

  function streamActivityLabel(): string {
    if (streamActiveTool) {
      const toolLabel = streamToolDisplayName(streamActiveTool);
      return t("ai.stream.active_tool", {
        tool: toolLabel,
        defaultValue: `Using ${toolLabel}…`,
      });
    }
    if (streamPhase === "formatting") {
      return t("ai.stream.phase_formatting", { defaultValue: "Preparing the message…" });
    }
    if (streamPhase === "reply") {
      return t("ai.stream.phase_reply", { defaultValue: "Writing your reply…" });
    }
    if (streamPhase === "tools" && streamRecentTool && !streamActiveTool) {
      const toolLabel = streamToolDisplayName(streamRecentTool);
      return t("ai.stream.after_tool_batch", {
        tool: toolLabel,
        defaultValue: `Finished ${toolLabel} · continuing…`,
      });
    }
    if (streamPhase === "tools") {
      return t("ai.stream.phase_tools", { defaultValue: "Running tools…" });
    }
    if (streamPhase === "model" && streamRecentTool) {
      const toolLabel = streamToolDisplayName(streamRecentTool);
      return t("ai.stream.phase_model_followup", {
        tool: toolLabel,
        defaultValue: `After ${toolLabel} · planning next step…`,
      });
    }
    if (streamPhase === "model") {
      return t("ai.stream.phase_model", { defaultValue: "Reasoning…" });
    }
    if (streamPhase === "thinking") {
      return t("ai.stream.phase_thinking", { defaultValue: "Planning…" });
    }
    return t("ai.working_neutral");
  }

  function formatUserMessageForDisplay(content: string): string {
    const s = content.trim();
    if (!s.includes(":") && normalizeActionKey(s) === "create_trip") {
      return t("ai.create_trip");
    }
    // Island send can be "Human chip. just_chat:…" — wire is for the API; hide the suffix in the bubble.
    const pickedPlusWire = /^([\s\S]+?)\.\s+(just_chat:.+)$/;
    const pickedWire = pickedPlusWire.exec(s);
    if (pickedWire && pickedWire[1]) {
      const human = pickedWire[1].trim();
      if (human.length > 0) return human;
    }
    if (s.startsWith("just_chat:")) {
      const rest = s.slice("just_chat:".length).trim();
      if (rest === "Add stops to my trip") return t("ai.add_stops_to_trip");
      return rest.length > 0 ? rest : t("ai.just_chat");
    }
    if (s === "just_chat") return t("ai.just_chat");
    if (s.startsWith("create_trip:")) {
      const rest = s.slice("create_trip:".length).trim();
      return rest.length > 0 ? rest : t("ai.create_trip");
    }
    if (s === "create_trip") return t("ai.create_trip");
    if (s.startsWith("find_images:")) {
      const rest = s.slice("find_images:".length).trim();
      return rest.length > 0 ? rest : t("ai.find_images");
    }
    if (s === "find_images") return t("ai.find_images");
    return content;
  }

  function assistantMessageFromPostResponse(res: PostMessageResponse): ChatMessage {
    const trimmed = res.message?.trim() ?? "";
    return {
      role: "assistant",
      content: trimmed.length > 0 ? trimmed : t("ai.empty_reply"),
      quick_replies: res.quick_replies,
      image_suggestions: res.image_suggestions,
      place_suggestions: res.place_suggestions,
      tool_calls: res.tool_calls,
      budget_summary: res.budget_summary,
      ...(res.linked_trip_id ? { linked_trip_id: res.linked_trip_id } : {}),
    };
  }

  async function handleSelectCoverFromIsland(oneBasedIndex: number) {
    if (!sessionId || loading || islandViewOnly) return;
    const nonImage = islandFields.filter((f) => f.kind !== "image");
    if (nonImage.some((f) => !f.value.trim())) {
      setError(t("ai.cover_answer_questions_first"));
      return;
    }
    const answers_summary =
      nonImage.length > 0
        ? nonImage.map((f) => f.value.trim()).filter(Boolean).join(". ")
        : undefined;
    setLoading(true);
    setError(null);
    try {
      const data = await selectSessionCoverImage(sessionId, {
        index: oneBasedIndex,
        answers_summary,
      });
      setMessages((prev) => [
        ...prev,
        ...data.messages.map((m) => ({
          role: m.role,
          content: m.role === "user" ? cleanUserMessage(m.content) : m.content,
          ...(m.cover_pick ? { cover_pick: m.cover_pick } : {}),
          ...(m.linked_trip_id ? { linked_trip_id: m.linked_trip_id } : {}),
        })),
      ]);
      setIslandFields([]);
      setIslandDismissed(false);
      setIslandPage(0);
      setIslandPreview(null);
      setInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("ai.failed_request"));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

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
    setStreamActiveTool(null);
    setStreamRecentTool(null);
    setStreamPhase(null);
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

  const activeTripIdForRoute = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const m = messages[i];
      if (m?.role === "assistant" && m.linked_trip_id) return m.linked_trip_id;
    }
    return sessionCurrentTripId;
  }, [messages, sessionCurrentTripId]);

  const composerGreetingLine = useMemo(() => {
    const hour = new Date().getHours();
    const bucket = greetingBucket(hour);
    const period = t(`ai.greeting.${bucket}`);
    const raw = displayNameProp?.trim();
    if (!raw) return period;
    return `${period}, ${raw}`;
  }, [t, displayNameProp]);

  const hasUserMessage = useMemo(
    () => messages.some((m) => m.role === "user"),
    [messages],
  );

  useEffect(() => {
    setWizardFlowActive(false);
    setWizardStep(0);
    setPostWizardPartnerInvite(null);
    setPostWizardInviteSending(false);
    planBootstrapConsumedRef.current = false;
    try {
      setGuidedSetupDismissed(sessionStorage.getItem(`ai_guided_setup_dismiss_${sessionId}`) === "1");
    } catch {
      setGuidedSetupDismissed(false);
    }
  }, [sessionId]);

  function dismissGuidedSetupCta() {
    try {
      sessionStorage.setItem(`ai_guided_setup_dismiss_${sessionId}`, "1");
    } catch {
      /* ignore */
    }
    setGuidedSetupDismissed(true);
  }

  function restoreGuidedSetupCta() {
    try {
      sessionStorage.removeItem(`ai_guided_setup_dismiss_${sessionId}`);
    } catch {
      /* ignore */
    }
    setGuidedSetupDismissed(false);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAiSessionWithMessages(sessionId)
      .then((data) => {
        if (cancelled) return;
        const tid = data.session.current_trip_id?.trim();
        setSessionCurrentTripId(tid && tid.length > 0 ? tid : null);
        setSessionScope(data.session.scope === "trip" ? "trip" : "global");
        setMessages(
          data.messages.map((m) => ({
            role: m.role,
            content: m.role === "user" ? cleanUserMessage(m.content) : m.content,
            ...(m.linked_trip_id ? { linked_trip_id: m.linked_trip_id } : {}),
            ...(m.attached_trip ? { attached_trip: m.attached_trip } : {}),
            ...(m.cover_pick ? { cover_pick: m.cover_pick } : {}),
            quick_replies: m.quick_replies,
            image_suggestions: m.image_suggestions,
            place_suggestions: m.place_suggestions,
            tool_calls: m.tool_calls,
            budget_summary: m.budget_summary,
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
  }, [sessionId, router, t]);

  useEffect(() => {
    if (!attachTripDrawerOpen) return;
    let cancelled = false;
    setTripsForAttachLoading(true);
    fetchTrips()
      .then((list) => {
        if (!cancelled) setTripsForAttach(list);
      })
      .catch((err) => {
        console.error(err);
        toast.error(t("ai.attach_trip_load_failed"));
      })
      .finally(() => {
        if (!cancelled) setTripsForAttachLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attachTripDrawerOpen, t]);

  function formatAttachTripDateRange(tr: Trip): string | null {
    const locale = i18n.language;
    const formatOne = (iso: string | null | undefined) => {
      if (!iso) return null;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return null;
      return d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
    };
    const start = formatOne(tr.start_date ?? undefined);
    const end = formatOne(tr.end_date ?? undefined);
    if (start && end) return `${start} – ${end}`;
    return start ?? end ?? null;
  }

  /**
   * List trips often omit `image_url` but include `cover_photo.storage_key` (R2).
   * Prefer explicit URL, then public URL from storage (same as trip cards elsewhere).
   */
  function tripCoverForAttachUi(tr: Trip): { src: string | null; blurHash: string | null } {
    const blurHash = tripCoverBlurHash(tr);
    const fromUrl = tr.image_url?.trim();
    if (fromUrl && fromUrl.length > 0) {
      return { src: fromUrl, blurHash };
    }
    const fromStorage = resolveTripCoverUrl(tr);
    if (fromStorage) {
      return { src: fromStorage, blurHash };
    }
    return { src: null, blurHash };
  }

  function clearAttachedTrip() {
    setAttachedTripId(null);
    setAttachedTripTitle(null);
    setAttachedTripCoverSrc(null);
    setAttachedTripCoverBlurHash(null);
  }

  function postStreamOpts(signal?: AbortSignal): PostAiMessageOptions {
    const opts: PostAiMessageOptions = { signal };
    if (sessionScope === "global" && attachedTripId) {
      opts.attached_trip_id = attachedTripId;
    }
    return opts;
  }

  async function sendMessage(text: string, fromIndex: number | null) {
    if (!text.trim() || !sessionId) return;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const trimmed = text.trim();
    const optimisticAttachedTrip: AiAttachedTripPreview | undefined =
      sessionScope === "global" && attachedTripId && attachedTripTitle
        ? {
            id: attachedTripId,
            title: attachedTripTitle,
            destination: null,
            image_url: attachedTripCoverSrc,
            blur_hash: attachedTripCoverBlurHash,
          }
        : undefined;
    if (fromIndex !== null) {
      setMessages((prev) => [
        ...prev.slice(0, fromIndex),
        { role: "user", content: trimmed },
      ]);
      setEditingIndex(null);
      setEditingDraft("");
    } else {
      setInput("");
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: trimmed,
          ...(optimisticAttachedTrip ? { attached_trip: optimisticAttachedTrip } : {}),
        },
      ]);
    }
    setLoading(true);
    setError(null);
    setStreamActiveTool(null);
    setStreamRecentTool(null);
    setStreamPhase(null);

    try {
      const res = await postAiMessageStream(sessionId, trimmed, applyStreamProgress, postStreamOpts(controller.signal));
      setMessages((prev) => [...prev, assistantMessageFromPostResponse(res)]);
      if (res.usage) setAiUsage(res.usage);
      clearAttachedTrip();
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
      setStreamActiveTool(null);
      setStreamRecentTool(null);
      setStreamPhase(null);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (loading) return;
    if (sessionScope !== "global") return;
    if (messages.length > 0) return;
    if (planBootstrapConsumedRef.current) return;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(AI_PLAN_CONTEXT_STORAGE_KEY);
    } catch {
      return;
    }
    if (!raw) return;
    planBootstrapConsumedRef.current = true;
    try {
      sessionStorage.removeItem(AI_PLAN_CONTEXT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    let parsed: { title?: string; start_date?: string | null; end_date?: string | null };
    try {
      parsed = JSON.parse(raw) as typeof parsed;
    } catch {
      planBootstrapConsumedRef.current = false;
      return;
    }
    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    const d1 = parsed.start_date ? new Date(parsed.start_date) : null;
    const d2 = parsed.end_date ? new Date(parsed.end_date) : null;
    const locale = i18n.language;
    const fmt = (d: Date | null) =>
      d && !Number.isNaN(d.getTime())
        ? d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" })
        : null;
    const ds = fmt(d1);
    const de = fmt(d2);
    const datesText =
      ds && de ? `${ds} – ${de}` : ds ? ds : de ? de : t("trips.plan_with_ai_bootstrap_dates_unknown");
    const text = t("trips.plan_with_ai_bootstrap", {
      title: title.length > 0 ? title : t("trips.untitled_trip"),
      dates: datesText,
    });
    void sendMessage(text, null);
  }, [loading, sessionScope, messages.length, sessionId, t, i18n.language]);

  const wizardActive =
    wizardFlowActive &&
    wizardStep < WIZARD_STEPS.length &&
    messages.every((m) => m.role !== "user");
  const activeIslandFields = islandPreview?.fields ?? islandFields;
  const islandViewOnly = islandPreview !== null;
  const islandActive = activeIslandFields.length >= 1 && (islandViewOnly || (!islandDismissed && !wizardActive && !loading));
  const islandExpanded = wizardActive || islandActive;

  const currentIslandField =
    islandActive && !islandViewOnly ? activeIslandFields[islandPage] : undefined;
  const hideIslandFreeformRow =
    !wizardActive &&
    (currentIslandField?.kind === "date" || currentIslandField?.kind === "image");
  const currentWizardStep = wizardActive ? WIZARD_STEPS[wizardStep] : undefined;
  const wizardHeaderQuestion: ReactNode = useMemo(() => {
    if (!wizardActive) return "";
    const step = WIZARD_STEPS[wizardStep];
    return step ? formatChoiceLabelMarkdown(step.question) : "";
  }, [wizardActive, wizardStep, t]);
  const showMainComposerRow = !wizardActive || currentWizardStep?.kind !== "dates";
  /** Reserve scroll space so the last messages clear the fixed composer (expanded island or tool chip). */
  const composerScrollReserveResolved =
    islandExpanded || selectedTool || attachedTripId || postWizardPartnerInvite
      ? "pb-[min(52vh,360px)]"
      : "pb-[5.75rem]";

  const canSendFromComposer =
    Boolean(input.trim()) ||
    Boolean(selectedTool) ||
    (islandActive && !islandViewOnly && islandFields.some((f) => f.value.trim()));

  const showModelPickerInBar =
    !wizardActive && (!islandExpanded || !hideIslandFreeformRow);

  function syncComposerTextareaHeight() {
    const el = composerGrowRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 168);
    el.style.height = `${Math.max(next, 44)}px`;
  }

  useLayoutEffect(() => {
    syncComposerTextareaHeight();
  }, [input, islandExpanded, hideIslandFreeformRow, islandViewOnly, loading, attachedTripId]);

  async function resolveTripIdAfterWizardResponse(
    res: PostMessageResponse,
    sessionTripIdHint: string | null,
  ): Promise<string | null> {
    let tripId = res.linked_trip_id?.trim() ?? "";
    if (!tripId && sessionTripIdHint?.trim()) {
      tripId = sessionTripIdHint.trim();
    }
    if (!tripId) {
      try {
        const loadSessionTripId = async () => {
          const refreshed = await getAiSessionWithMessages(sessionId);
          return refreshed.session.current_trip_id?.trim() ?? "";
        };
        let tid = await loadSessionTripId();
        if (!tid) {
          await new Promise((r) => setTimeout(r, 800));
          tid = await loadSessionTripId();
        }
        if (tid) {
          tripId = tid;
        }
      } catch (refetchErr) {
        console.error("AiTestClient: session refetch for trip id failed", refetchErr);
      }
    }
    return tripId.length > 0 ? tripId : null;
  }

  async function handlePostWizardPartnerInviteSend() {
    if (!postWizardPartnerInvite) return;
    const email = postWizardPartnerInvite.email.trim();
    if (!email) {
      toast.error(t("ai.wizard_collab_email_required"));
      return;
    }
    setPostWizardInviteSending(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        toast.error(t("common.auth_required"));
        return;
      }
      await inviteTripByEmail(postWizardPartnerInvite.tripId, email, token);
      toast.success(t("ai.wizard_collab_invite_sent"));
      setPostWizardPartnerInvite(null);
    } catch (inviteErr) {
      const msg =
        inviteErr instanceof ApiError ? inviteErr.message : t("ai.wizard_collab_invite_failed");
      console.error("AiTestClient: post-wizard inviteTripByEmail failed", inviteErr);
      toast.error(t("ai.wizard_collab_invite_failed"), { description: msg });
    } finally {
      setPostWizardInviteSending(false);
    }
  }

  async function submitWizardToServer(answers: WizardAnswer) {
    const { heading, vibe, joining, travelDates } = answers;
    const displayText = `${heading} · ${vibe} · ${joining} · ${travelDates}`;
    const wizardPrompt = [
      `create_trip: Plan a trip with these preferences: destination region: ${heading}, vibe: ${vibe}, group: ${joining}, travel dates: ${travelDates}.`,
      "Ask 1-2 follow-up questions if needed, then suggest a concrete itinerary with places.",
      "When possible, include structured PLACE_CARDS output.",
    ].join("\n");

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setMessages((prev) => [...prev, { role: "user", content: displayText }]);
    setLoading(true);
    setError(null);
    setStreamActiveTool(null);
    setStreamRecentTool(null);
    setStreamPhase(null);

    try {
      const res = await postAiMessageStream(sessionId, wizardPrompt, applyStreamProgress, postStreamOpts(controller.signal));
      setMessages((prev) => [...prev, assistantMessageFromPostResponse(res)]);
      if (res.usage) setAiUsage(res.usage);
      const tid = await resolveTripIdAfterWizardResponse(res, sessionCurrentTripId);
      if (tid) {
        setSessionCurrentTripId(tid);
      }
      if (answers.joining !== "Solo" && tid) {
        setPostWizardPartnerInvite({ tripId: tid, email: "" });
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setPostWizardPartnerInvite(null);
      setError(err instanceof Error ? err.message : t("ai.failed_request"));
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      abortControllerRef.current = null;
      setStreamActiveTool(null);
      setStreamRecentTool(null);
      setStreamPhase(null);
      setLoading(false);
    }
  }

  function handleWizardSelect(value: string) {
    const currentStep = WIZARD_STEPS[wizardStep];
    if (!currentStep || loading || currentStep.kind !== "options") return;
    const nextAnswers = { ...wizardAnswers, [currentStep.key]: value };
    setWizardAnswers(nextAnswers);

    if (wizardStep < WIZARD_STEPS.length - 1) {
      setWizardStep((prev) => prev + 1);
    }
  }

  async function handleWizardDateDrawerDone() {
    if (!wizardDateRangeDraft?.from || !wizardDateRangeDraft?.to || loading) return;
    const travelDates = formatWizardDateRangeLabel(wizardDateRangeDraft.from, wizardDateRangeDraft.to);
    const nextAnswers: WizardAnswer = {
      heading: wizardAnswers.heading ?? "Still deciding",
      vibe: wizardAnswers.vibe ?? "City exploration",
      joining: wizardAnswers.joining ?? "Solo",
      travelDates,
    };
    setWizardAnswers(nextAnswers);
    setWizardDateOpen(false);
    setWizardDateRangeDraft(undefined);
    setWizardStep(WIZARD_STEPS.length);
    await submitWizardToServer(nextAnswers);
  }

  function handleWizardCustom() {
    const currentStep = WIZARD_STEPS[wizardStep];
    if (!currentStep || loading || !input.trim() || currentStep.kind !== "options") return;
    void handleWizardSelect(input.trim());
    setInput("");
  }

  function handleWizardSkip() {
    setPostWizardPartnerInvite(null);
    setWizardFlowActive(false);
    setWizardStep(WIZARD_STEPS.length);
    setWizardDateOpen(false);
    setWizardDateRangeDraft(undefined);
    setIslandFields([]);
    setIslandDismissed(false);
    setIslandPage(0);
    setIslandPreview(null);
    setIslandHistory([]);
    setIslandOptionPreviews({});
    islandOptionPreviewsRef.current = {};
  }

  function updateIslandField(
    fieldIdx: number,
    value: string,
    opts?: { valueAction?: string | null },
  ) {
    if (islandViewOnly) return;
    setIslandFields((prev) =>
      prev.map((f, i) => {
        if (i !== fieldIdx) return f;
        const next: IslandField = { ...f, value };
        if (opts && "valueAction" in opts && opts.valueAction === null) {
          delete next.valueAction;
        } else if (opts?.valueAction !== undefined && opts.valueAction !== null) {
          next.valueAction = opts.valueAction;
        }
        return next;
      }),
    );
  }

  async function handleSend() {
    if (!sessionId || loading) return;
    if (islandActive && !islandViewOnly) {
      const filled = islandFields.filter((f) => f.value.trim());
      if (filled.length === 0) return;
      const composed =
        filled
          .map((f) => {
            const action = f.valueAction?.trim();
            if (action) return action;
            return f.value.trim();
          })
          .filter(Boolean)
          .join(". ") + ".";
      const msgIdx = messages.length - 1;
      setIslandHistory((prev) => [...prev.filter((h) => h.messageIndex !== msgIdx), { messageIndex: msgIdx, fields: islandFields.map((f) => ({ ...f })) }]);
      setIslandFields([]);
      setIslandDismissed(true);
      setInput("");
      await sendMessage(composed, null);
      return;
    }
    if (selectedTool) {
      if (selectedTool.kind === "quick_reply") {
        const extra = input.trim();
        setSelectedTool(null);
        setInput("");
        await handleQuickReplyClick(selectedTool.action, selectedTool.label, extra);
      } else if (selectedTool.kind === "route_help") {
        setSelectedTool(null);
        setInput("");
        await sendMessage(ROUTE_HELP_CHAT_PAYLOAD, null);
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
    switch (normalizeActionKey(action)) {
      case "find_images":
        return t("ai.find_images");
      case "create_trip":
        return t("ai.create_trip");
      case "just_chat":
        return t("ai.just_chat");
      default:
        return action.trim();
    }
  }

  /** When the model sends a raw action as the chip label (e.g. "create_trip."), show the real title. */
  function displayQuickReplyOptionLabel(opt: string, actionWire: string | undefined): ReactNode {
    const head = quickReplyActionHead(actionWire);
    if (head === "create_trip" || normalizeActionKey(opt) === "create_trip") {
      return t("ai.create_trip");
    }
    if (head === "find_images" || normalizeActionKey(opt) === "find_images") {
      return t("ai.find_images");
    }
    return formatChoiceLabelMarkdown(opt);
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
    setStreamActiveTool(null);
    setStreamRecentTool(null);
    setStreamPhase(null);

    const payload = extraText ? `${action}: ${extraText}` : action;
    try {
      const res = await postAiMessageStream(sessionId, payload, applyStreamProgress, postStreamOpts(controller.signal));
      setMessages((prev) => [...prev, assistantMessageFromPostResponse(res)]);
      if (res.usage) setAiUsage(res.usage);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      setError(err instanceof Error ? err.message : t("ai.failed_request"));
    } finally {
      abortControllerRef.current = null;
      setStreamActiveTool(null);
      setStreamRecentTool(null);
      setStreamPhase(null);
      setLoading(false);
    }
  }

  async function handleSendFromInline() {
    if (!editingDraft.trim() || sessionId === null || editingIndex === null || loading) return;
    await sendMessage(editingDraft, editingIndex);
  }

  useEffect(() => {
    islandOptionPreviewsRef.current = islandOptionPreviews;
  }, [islandOptionPreviews]);

  useEffect(() => {
    if (loading) return;
    if (messages.length === 0) {
      setIslandFields([]);
      setIslandDismissed(false);
      setIslandPage(0);
      setIslandPreview(null);
      setIslandOptionPreviews({});
      islandOptionPreviewsRef.current = {};
      return;
    }
    const last = messages[messages.length - 1];
    if (last.role !== "assistant") return;
    const fields = parseNumberedQuestions(last.content);
    const qrs = last.quick_replies ?? [];
    if (qrs.length >= 1) {
      mergeAssistantQuickRepliesIntoIslandFields(fields, qrs, t("ai.island_pick_reply"));
    }
    const fieldsNormalized = normalizeCoverIslandFields(fields);
    if (last.image_suggestions && last.image_suggestions.length > 0) {
      const imgField: IslandField = {
        question: "Pick a cover image",
        options: [],
        imageOptions: last.image_suggestions.map((img, idx) => ({
          label: img.photographer_name || `Image ${idx + 1}`,
          thumbnailUrl: img.thumbnail_url,
          blurHash: img.blur_hash ?? undefined,
          oneBasedIndex: idx + 1,
        })),
        value: "",
        kind: "image",
      };
      fieldsNormalized.push(imgField);
    }
    if (fieldsNormalized.length >= 1) {
      setIslandFields(fieldsNormalized);
      setIslandDismissed(false);
      setIslandPage(0);
      setIslandPreview(null);
      setIslandOptionPreviews({});
      islandOptionPreviewsRef.current = {};
    } else {
      setIslandFields([]);
      setIslandPage(0);
    }
  }, [messages, loading, t]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const token = await getAuthToken();
      if (!token || cancelled) return;
      for (let fi = 0; fi < islandFields.length; fi += 1) {
        const f = islandFields[fi];
        if (f.kind !== "text" || f.options.length === 0) continue;
        for (let oi = 0; oi < f.options.length; oi += 1) {
          const key = `${fi}-${oi}`;
          if (islandOptionPreviewsRef.current[key]) continue;
          const label = f.options[oi];
          if (!label) continue;
          try {
            const sub = f.optionSubtitles?.[oi]?.trim();
            const query =
              sub && sub.length > 0
                ? `${sub} travel landscape`
                : `${label} city travel landmark`;
            const res = await searchImages(query, 1, 1, token);
            const first = res.results[0];
            if (cancelled || !first) continue;
            const url = first.urls?.small ?? first.urls?.thumb ?? "";
            if (!url) continue;
            setIslandOptionPreviews((prev) => {
              if (prev[key]) return prev;
              return {
                ...prev,
                [key]: { url, blurHash: first.blur_hash },
              };
            });
            islandOptionPreviewsRef.current = {
              ...islandOptionPreviewsRef.current,
              [key]: { url, blurHash: first.blur_hash },
            };
          } catch (err) {
            console.error("[AiTestClient] Unsplash preview for island option failed", err);
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [islandFields]);

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
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium leading-tight text-white/55">
              {aiUsage.percent != null
                ? t("profile.ai_usage_value", { percent: aiUsage.percent })
                : t("profile.ai_usage_badge_no_cap", {
                    used: new Intl.NumberFormat(i18n.language).format(aiUsage.used),
                  })}
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
        <div
          className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${composerScrollReserveResolved}`}
        >
          <div className="max-w-3xl mx-auto px-4 py-6 pb-4 space-y-8">
            {sessionScope === "global" && !hasUserMessage && !wizardFlowActive && (
              <div className="relative z-[2] flex w-full flex-col items-center px-2 pb-8 pt-14 text-center sm:pt-20">
                <p className="mb-5 max-w-lg break-words font-serif text-4xl font-light leading-[1.12] tracking-[-0.02em] text-white/[0.96] sm:mb-6 sm:text-5xl sm:leading-[1.08] md:text-[3.25rem]">
                  {composerGreetingLine}
                </p>
                <p className="mb-8 max-w-md text-[15px] leading-relaxed text-white/40 sm:mb-10 sm:text-base">
                  {t("ai.empty_state_tagline")}
                </p>
                {!guidedSetupDismissed ? (
                  <div className="relative z-[3] flex w-full max-w-sm flex-col items-center gap-3">
                    <div className="w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full rounded-full border border-white/12 bg-white/[0.06] px-6 py-3 text-[15px] font-medium text-white/90 shadow-none backdrop-blur-sm hover:bg-white/[0.1] sm:min-w-[14rem]"
                        onClick={() => {
                          setPostWizardPartnerInvite(null);
                          setWizardFlowActive(true);
                          setWizardStep(0);
                        }}
                      >
                        {t("ai.guided_trip_setup")}
                      </Button>
                    </div>
                    <button
                      type="button"
                      onClick={dismissGuidedSetupCta}
                      className="relative z-[3] inline-flex min-h-11 min-w-[min(100%,12rem)] cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-[14px] font-medium text-white/40 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/65 hover:decoration-white/35"
                    >
                      {t("ai.guided_trip_dismiss")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={restoreGuidedSetupCta}
                    className="relative z-[3] inline-flex min-h-11 min-w-[min(100%,12rem)] cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-[14px] font-medium text-white/45 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white/75 hover:decoration-white/40"
                  >
                    {t("ai.guided_trip_setup_restore")}
                  </button>
                )}
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((m, i) => {
                if (
                  m.role === "assistant" &&
                  m.content.trim() === LEGACY_GLOBAL_ASSISTANT_WELCOME
                ) {
                  return null;
                }
                return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
                  className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`relative group ${
                      m.role === "user"
                        ? "max-w-[85%] sm:max-w-[75%] rounded-[1.5rem] rounded-tr-sm px-5 py-4 bg-gradient-to-br from-[var(--color-accent)] to-[#ff8f8f] text-white shadow-[0_8px_24px_-6px_rgba(255,118,112,0.4)]"
                        : "w-full text-card-foreground"
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
                        {m.linked_trip_id ? (
                          <div className="flex justify-start pb-1">
                            <Link
                              href={`/trips/${m.linked_trip_id}`}
                              prefetch={false}
                              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-gradient-to-r from-[var(--color-accent)]/20 via-white/6 to-white/4 px-4 py-2.5 text-[13px] font-semibold tracking-wide text-white/95 shadow-[0_0_28px_-6px_rgba(255,118,112,0.5)] backdrop-blur-md transition hover:border-[var(--color-accent)]/35 hover:shadow-[0_0_32px_-4px_rgba(255,118,112,0.55)]"
                            >
                              <Sparkles className="w-4 h-4 shrink-0 text-[var(--color-accent)]" />
                              <span>{t("ai.open_trip")}</span>
                              <ArrowRight className="w-4 h-4 shrink-0 opacity-55 transition group-hover:translate-x-0.5 group-hover:opacity-90" />
                            </Link>
                          </div>
                        ) : null}
                        <div className="text-[15px] leading-relaxed">
                          <MarkdownMessage content={(() => {
                            const hist = islandHistory.find((h) => h.messageIndex === i);
                            const isCurrentIsland = i === messages.length - 1 && islandFields.length >= 1;
                            const fieldsForStrip = hist?.fields ?? (isCurrentIsland ? islandFields : []);
                            const raw =
                              fieldsForStrip.length > 0
                                ? stripParsedQuestions(m.content, fieldsForStrip)
                                : m.content;
                            return stripXmlQuickReplyArtifacts(raw);
                          })()} />
                        </div>
                        {m.tool_calls && m.tool_calls.length > 0 ? (
                          <div className="flex flex-col gap-1.5 pt-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">
                              {t("ai.tools_used")}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {m.tool_calls.map((name, ti) => (
                                <span
                                  key={`${i}-${name}-${ti}`}
                                  className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/85"
                                >
                                  {t(`ai.tool.${name}`, { defaultValue: name })}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {m.budget_summary ? <AiBudgetCard budget={m.budget_summary} /> : null}
                        {(() => {
                          const hist = islandHistory.find((h) => h.messageIndex === i);
                          if (!hist) return null;
                          const answered = hist.fields.filter((f) => f.value.trim());
                          if (answered.length === 0) return null;
                          return (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {answered.map((f, fIdx) => (
                                <span
                                  key={fIdx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--color-accent)]/10 text-[11px] font-medium text-[var(--color-accent)]"
                                >
                                  <Sparkles className="w-3 h-3 opacity-60" />
                                  {f.value}
                                </span>
                              ))}
                            </div>
                          );
                        })()}

                        {m.place_suggestions && m.place_suggestions.length > 0 ? (
                          <AiPlaceSuggestions
                            key={m.place_suggestions.map((p) => p.name).join("|")}
                            places={m.place_suggestions}
                            defaultTargetTripId={
                              sessionScope === "trip"
                                ? sessionCurrentTripId
                                : sessionScope === "global"
                                  ? attachedTripId
                                  : null
                            }
                          />
                        ) : null}
                        {i === messages.length - 1 && islandDismissed && islandFields.length >= 1 && (
                          <motion.button
                            type="button"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={() => setIslandDismissed(false)}
                            className="flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[12px] font-medium hover:bg-[var(--color-accent)]/20 transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Answer questions
                          </motion.button>
                        )}
                        {(() => {
                          const hist = islandHistory.find((h) => h.messageIndex === i);
                          if (!hist || hist.fields.length === 0) return null;
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                setIslandPreview({ messageIndex: i, fields: hist.fields.map((f) => ({ ...f })) });
                                setIslandPage(0);
                              }}
                              className="mt-1 text-[11px] text-white/40 hover:text-white/70 transition-colors"
                            >
                              View answered island
                            </button>
                          );
                        })()}
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
                        {m.attached_trip ? (
                          <div className="w-full min-w-0 space-y-3">
                            <Link
                              href={`/trips/${m.attached_trip.id}`}
                              prefetch={false}
                              className="block max-w-full rounded-xl border border-white/25 bg-white/10 shadow-lg sm:max-w-[280px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex gap-3 p-2.5 text-left">
                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white/15">
                                  {m.attached_trip.image_url ? (
                                    <CoverImageWithBlur
                                      src={m.attached_trip.image_url}
                                      alt={m.attached_trip.title}
                                      blurHash={m.attached_trip.blur_hash ?? undefined}
                                      className="h-full w-full"
                                      imgClassName="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-white/40">
                                      <Briefcase className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 py-0.5">
                                  <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
                                    {t("ai.attached_trip_message_label")}
                                  </p>
                                  <p className="mt-0.5 truncate text-[14px] font-semibold leading-snug text-white">
                                    {m.attached_trip.title}
                                  </p>
                                  {m.attached_trip.destination ? (
                                    <p className="mt-0.5 truncate text-[12px] text-white/75">
                                      {m.attached_trip.destination}
                                    </p>
                                  ) : null}
                                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-white/85">
                                    {t("ai.open_trip")}
                                    <ArrowRight className="h-3 w-3 opacity-80" aria-hidden />
                                  </p>
                                </div>
                              </div>
                            </Link>
                            {m.content.trim() ? (
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium select-none touch-none">
                                {formatUserMessageForDisplay(m.content)}
                              </p>
                            ) : null}
                          </div>
                        ) : m.cover_pick ? (
                          <div className="space-y-3 w-full min-w-0">
                            {m.content.trim() ? (
                              <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium select-none touch-none">
                                {formatUserMessageForDisplay(m.content)}
                              </p>
                            ) : null}
                            <div className="rounded-xl overflow-hidden border border-white/25 shadow-lg max-w-full sm:max-w-[280px]">
                              <CoverImageWithBlur
                                src={m.cover_pick.image_url}
                                alt={
                                  m.cover_pick.photographer_name
                                    ? `Cover — ${m.cover_pick.photographer_name}`
                                    : "Trip cover"
                                }
                                blurHash={m.cover_pick.blur_hash ?? undefined}
                                className="w-full aspect-[4/3] object-cover"
                              />
                            </div>
                            {m.cover_pick.photographer_name ? (
                              <p className="text-[11px] text-white/80">
                                Photo: {m.cover_pick.photographer_name}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium select-none touch-none">
                            {formatUserMessageForDisplay(m.content)}
                          </p>
                        )}
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
              );
              })}
              
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  className="flex max-w-3xl flex-col gap-2 py-2 pl-1"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center self-center">
                      {streamActiveTool ||
                      streamRecentTool ||
                      streamPhase === "tools" ||
                      streamPhase === "model" ? (
                        <Briefcase className="h-4 w-4 text-white/45" aria-hidden />
                      ) : (
                        <span className="block h-2.5 w-2.5 rounded-full border border-white/35" aria-hidden />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 items-center">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={streamActivityKey()}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                          className="flex min-w-0 w-full items-start justify-start"
                        >
                          <motion.p
                            animate={{ opacity: [0.62, 1, 0.62] }}
                            transition={{ duration: 2.35, repeat: Infinity, ease: "easeInOut" }}
                            className="w-full min-w-0 text-left break-words text-[15px] font-medium leading-[1.35] tracking-tight text-white/72"
                          >
                            {streamActivityLabel()}
                          </motion.p>
                        </motion.div>
                      </AnimatePresence>
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

        {/* Composer fixed over the scroll area — avoids a full-width flex “footer” slab of page background */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-1">
          <div className="pointer-events-auto mx-auto max-w-3xl">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
              className={`relative flex min-w-0 flex-col gap-0 overflow-hidden rounded-[2rem] border border-white/10 bg-background/60 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-3xl ${islandExpanded || selectedTool || postWizardPartnerInvite ? "p-2 pb-2 pt-3" : "p-2"}`}
            >
              {postWizardPartnerInvite && !wizardActive && !loading ? (
                <div className="border-b border-white/10 px-3 pb-3 pt-2">
                  <p className="mb-2 text-[14px] font-semibold leading-snug text-white/90">
                    {t("ai.post_wizard_partner_invite_title")}
                  </p>
                  <p className="mb-2.5 text-[12px] leading-snug text-white/45">
                    {t("ai.post_wizard_partner_invite_body")}
                  </p>
                  <Input
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    placeholder={t("ai.wizard_collab_email_placeholder")}
                    value={postWizardPartnerInvite.email}
                    onChange={(e) =>
                      setPostWizardPartnerInvite((prev) =>
                        prev ? { ...prev, email: e.target.value } : prev,
                      )
                    }
                    disabled={postWizardInviteSending}
                    className="mb-2.5 h-11 rounded-xl border-white/15 bg-white/5 text-white/90 placeholder:text-white/35"
                  />
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-2">
                    <Button
                      type="button"
                      className="flex-1 rounded-xl bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90 disabled:opacity-50"
                      disabled={postWizardInviteSending}
                      onClick={() => void handlePostWizardPartnerInviteSend()}
                    >
                      {t("ai.wizard_collab_send_invite")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
                      disabled={postWizardInviteSending}
                      onClick={() => setPostWizardPartnerInvite(null)}
                    >
                      {t("ai.post_wizard_partner_invite_dismiss")}
                    </Button>
                  </div>
                </div>
              ) : null}
              {/* === Wizard — one question per page, Claude-style === */}
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
                    <div className="px-3 pb-3 pt-2">
                      {/* Header: question + nav */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <motion.p
                          key={`wq-${wizardStep}`}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-[15px] font-semibold text-white/90 leading-snug"
                        >
                          {wizardHeaderQuestion}
                        </motion.p>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={wizardStep === 0}
                            onClick={() => {
                              setWizardStep((p) => Math.max(0, p - 1));
                            }}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors disabled:opacity-20 disabled:pointer-events-none"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-[11px] text-white/40 tabular-nums min-w-[3rem] text-center">
                            {wizardStep + 1} of {WIZARD_STEPS.length}
                          </span>
                          <button
                            type="button"
                            disabled={wizardStep >= WIZARD_STEPS.length - 1}
                            onClick={() => setWizardStep((p) => Math.min(WIZARD_STEPS.length - 1, p + 1))}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors disabled:opacity-20 disabled:pointer-events-none"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleWizardSkip}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors ml-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {(() => {
                        const step = WIZARD_STEPS[wizardStep];
                        if (step.kind === "options") {
                          return (
                            <div className="space-y-1">
                              {step.options.map((option, idx) => (
                                <motion.button
                                  key={option}
                                  type="button"
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.03 * idx + 0.08, type: "spring", stiffness: 500, damping: 30 }}
                                  onClick={() => handleWizardSelect(option)}
                                  className="flex items-center justify-between w-full rounded-xl px-2 py-3 text-left text-[14px] font-medium text-white/80 transition-all hover:bg-white/5 active:scale-[0.98]"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-lg bg-white/10 text-[12px] font-semibold text-white/50 flex items-center justify-center shrink-0">
                                      {idx + 1}
                                    </span>
                                    <span>{formatChoiceLabelMarkdown(option)}</span>
                                  </div>
                                  <span className="text-white/20">→</span>
                                </motion.button>
                              ))}
                            </div>
                          );
                        }
                        const draft = wizardDateRangeDraft;
                        const draftLabel =
                          draft?.from && draft?.to
                            ? formatWizardDateRangeLabel(draft.from, draft.to)
                            : null;
                        return (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setWizardDateRangeDraft(undefined);
                                setWizardDateOpen(true);
                              }}
                              className="flex items-center gap-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-[14px] font-medium text-white/80 transition-all hover:bg-white/10 hover:border-white/20"
                            >
                              <CalendarDays className="w-4 h-4 text-white/40 shrink-0" />
                              <span className={draftLabel ? "text-white/90" : "text-white/30"}>
                                {draftLabel ?? "Pick start and end dates…"}
                              </span>
                            </button>
                            <Drawer
                              open={wizardDateOpen}
                              onOpenChange={(open) => {
                                setWizardDateOpen(open);
                                if (!open) setWizardDateRangeDraft(undefined);
                              }}
                            >
                              <DrawerContent className="min-h-0">
                                <DrawerHeader className="shrink-0">
                                  <div className="flex items-center justify-between">
                                    <DrawerClose asChild>
                                      <Button type="button" variant="ghost">
                                        Cancel
                                      </Button>
                                    </DrawerClose>
                                    <DrawerTitle className="mb-0">Trip dates</DrawerTitle>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      disabled={!wizardDateRangeDraft?.from || !wizardDateRangeDraft?.to}
                                      onClick={() => void handleWizardDateDrawerDone()}
                                    >
                                      Done
                                    </Button>
                                  </div>
                                </DrawerHeader>
                                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                                  <Calendar
                                    mode="range"
                                    numberOfMonths={2}
                                    selected={wizardDateRangeDraft}
                                    onSelect={(range) => setWizardDateRangeDraft(range)}
                                    disabled={(date) => date < new Date()}
                                    className="w-full"
                                  />
                                </div>
                              </DrawerContent>
                            </Drawer>
                          </>
                        );
                      })()}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* === AI question fields — paginated, one per page === */}
              <AnimatePresence mode="wait">
                {islandActive && activeIslandFields[islandPage] ? (
                  <motion.div
                    key={`island-${islandPage}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 28 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-2">
                      {/* Header: question + nav */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <motion.p
                          key={`iq-${islandPage}`}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-[15px] font-semibold text-white/90 leading-snug"
                        >
                          {activeIslandFields[islandPage].question === COVER_ISLAND_MERGED_QUESTION
                            ? t("ai.island_choose_cover")
                            : formatChoiceLabelMarkdown(activeIslandFields[islandPage].question)}
                        </motion.p>
                        <div className="flex items-center gap-1 shrink-0">
                          {activeIslandFields.length > 1 ? (
                            <>
                              <button
                                type="button"
                                disabled={islandPage === 0}
                                onClick={() => setIslandPage((p) => Math.max(0, p - 1))}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors disabled:opacity-20 disabled:pointer-events-none"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-[11px] text-white/40 tabular-nums min-w-[3rem] text-center">
                                {islandPage + 1} of {activeIslandFields.length}
                              </span>
                              <button
                                type="button"
                                disabled={islandPage >= activeIslandFields.length - 1}
                                onClick={() => setIslandPage((p) => Math.min(activeIslandFields.length - 1, p + 1))}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-colors disabled:opacity-20 disabled:pointer-events-none"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              if (islandViewOnly) {
                                setIslandPreview(null);
                              } else {
                                setIslandDismissed(true);
                              }
                              setInput("");
                            }}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors ml-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content based on field kind */}
                      {activeIslandFields[islandPage].kind === "date" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              if (islandViewOnly) return;
                              setIslandDateRangeDraft(undefined);
                              setIslandDateOpen(true);
                            }}
                            disabled={islandViewOnly}
                            className="flex items-center gap-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-[14px] font-medium text-white/80 transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-60"
                          >
                            <CalendarDays className="w-4 h-4 text-white/40 shrink-0" />
                            <span className={activeIslandFields[islandPage].value ? "text-white/90" : "text-white/30"}>
                              {activeIslandFields[islandPage].value || "Pick dates..."}
                            </span>
                          </button>
                          <Drawer open={islandDateOpen && !islandViewOnly} onOpenChange={setIslandDateOpen}>
                            <DrawerContent className="min-h-0">
                              <DrawerHeader className="shrink-0">
                                <div className="flex items-center justify-between">
                                  <DrawerClose asChild>
                                    <Button variant="ghost">Cancel</Button>
                                  </DrawerClose>
                                  <DrawerTitle className="mb-0">Select Dates</DrawerTitle>
                                  <Button
                                    variant="ghost"
                                    disabled={!islandDateRangeDraft?.from || !islandDateRangeDraft?.to}
                                    onClick={() => {
                                      if (!islandDateRangeDraft?.from || !islandDateRangeDraft?.to) return;
                                      updateIslandField(
                                        islandPage,
                                        `${islandDateRangeDraft.from.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} - ${islandDateRangeDraft.to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
                                      );
                                      setIslandDateOpen(false);
                                      if (islandPage < activeIslandFields.length - 1) {
                                        setTimeout(() => setIslandPage((p) => p + 1), 250);
                                      }
                                    }}
                                  >
                                    Done
                                  </Button>
                                </div>
                              </DrawerHeader>
                              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                                <Calendar
                                  mode="range"
                                  numberOfMonths={2}
                                  selected={islandDateRangeDraft}
                                  onSelect={(range) => setIslandDateRangeDraft(range)}
                                  disabled={(date) => date < new Date()}
                                  className="w-full"
                                />
                              </div>
                            </DrawerContent>
                          </Drawer>
                        </>
                      ) : activeIslandFields[islandPage].kind === "image" && activeIslandFields[islandPage].imageOptions ? (
                        <div className="grid grid-cols-3 gap-2">
                          {activeIslandFields[islandPage].imageOptions!.map((img, imgIdx) => (
                            <motion.button
                              key={imgIdx}
                              type="button"
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.05 * imgIdx + 0.08, type: "spring", stiffness: 400, damping: 25 }}
                              onClick={() => {
                                if (islandViewOnly) return;
                                void handleSelectCoverFromIsland(img.oneBasedIndex);
                              }}
                              disabled={islandViewOnly || loading}
                              className="relative aspect-[4/3] rounded-xl overflow-hidden transition-all active:scale-95 hover:ring-1 hover:ring-white/20"
                            >
                              <CoverImageWithBlur
                                src={img.thumbnailUrl}
                                alt={img.label}
                                blurHash={img.blurHash}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center bg-black/50 text-white/70">
                                {imgIdx + 1}
                              </span>
                              <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-medium text-white/80 truncate">
                                {img.label}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      ) : activeIslandFields[islandPage].kind === "text" && activeIslandFields[islandPage].options.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 max-h-[min(52vh,440px)] overflow-y-auto overflow-x-hidden pb-1 [scrollbar-width:thin]">
                          {activeIslandFields[islandPage].options.map((opt, oIdx) => {
                            const previewKey = `${islandPage}-${oIdx}`;
                            const pv = islandOptionPreviews[previewKey];
                            const selected = activeIslandFields[islandPage].value === opt;
                            const wire = activeIslandFields[islandPage].optionActions?.[oIdx];
                            const subtitle = activeIslandFields[islandPage].optionSubtitles?.[oIdx];
                            return (
                              <motion.button
                                key={`${islandPage}-${oIdx}-${opt}`}
                                type="button"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                  delay: Math.min(0.04 * oIdx + 0.06, 0.45),
                                  type: "spring",
                                  stiffness: 480,
                                  damping: 28,
                                }}
                                onClick={() => {
                                  if (islandViewOnly) return;
                                  if (wire !== undefined && wire.trim().length > 0) {
                                    updateIslandField(islandPage, opt, { valueAction: wire });
                                  } else {
                                    updateIslandField(islandPage, opt, { valueAction: null });
                                  }
                                  if (islandPage < activeIslandFields.length - 1) {
                                    setTimeout(() => setIslandPage((p) => p + 1), 200);
                                  }
                                }}
                                disabled={islandViewOnly}
                                className={`relative overflow-hidden rounded-2xl border text-left transition-all active:scale-[0.98] aspect-[4/3] ${
                                  selected
                                    ? "border-[var(--color-accent)]/50 ring-1 ring-[var(--color-accent)]/35 shadow-[0_0_20px_-4px_rgba(255,118,112,0.35)]"
                                    : "border-white/15 hover:border-white/25"
                                }`}
                              >
                                <div className="relative h-full w-full bg-white/5">
                                  {pv ? (
                                    <CoverImageWithBlur
                                      src={pv.url}
                                      alt={subtitle ?? opt}
                                      blurHash={pv.blurHash ?? undefined}
                                      className="h-full w-full"
                                      imgClassName="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center">
                                      {subtitle ? (
                                        <span className="line-clamp-3 text-[11px] font-semibold leading-snug text-white/75">
                                          {formatChoiceLabelMarkdown(subtitle)}
                                        </span>
                                      ) : null}
                                      <span className="line-clamp-2 text-[11px] font-medium leading-tight text-white/50">
                                        {displayQuickReplyOptionLabel(opt, wire)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-2 pb-2 pt-10">
                                    {subtitle ? (
                                      <p className="line-clamp-2 text-[10px] font-semibold leading-snug text-white/95">
                                        {formatChoiceLabelMarkdown(subtitle)}
                                      </p>
                                    ) : null}
                                    <p
                                      className={
                                        subtitle ? "mt-0.5 line-clamp-2 text-[10px] leading-snug text-white/70" : "line-clamp-2 text-[11px] font-semibold leading-snug text-white"
                                      }
                                    >
                                      {displayQuickReplyOptionLabel(opt, wire)}
                                    </p>
                                  </div>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Main composer: typing area on top, + / tool chips / model / voice / send below (Claude-style) */}
              {showMainComposerRow ? (
                <div
                  className={`flex min-w-0 flex-col ${
                    sessionScope === "global" && attachedTripId && attachedTripTitle ? "gap-1.5" : "gap-0"
                  } ${islandExpanded ? "mt-0 pt-3" : ""}`}
                >
                  {sessionScope === "global" && attachedTripId && attachedTripTitle ? (
                    <div className="mx-1.5 flex min-w-0 items-center gap-2.5 rounded-xl border border-white/[0.12] bg-white/[0.05] p-2 pr-1.5">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white/10">
                        {attachedTripCoverSrc ? (
                          <CoverImageWithBlur
                            src={attachedTripCoverSrc}
                            alt={attachedTripTitle ?? t("ai.attach_trip")}
                            blurHash={attachedTripCoverBlurHash ?? undefined}
                            className="h-full w-full"
                            imgClassName="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-white/35">
                            <Briefcase className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold leading-tight text-white/90">
                          {attachedTripTitle}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-white/45">{t("ai.attach_trip_preview_hint")}</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearAttachedTrip}
                        className="shrink-0 rounded-full p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white/90"
                        aria-label={t("ai.remove_attached_trip")}
                      >
                        <X className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  ) : null}
                  {islandExpanded && hideIslandFreeformRow ? (
                    <div className="min-h-8 px-3 pt-1" aria-hidden />
                  ) : (
                    <>
                    <textarea
                      ref={composerGrowRef}
                      placeholder={
                        islandViewOnly
                          ? "Viewing previous answers"
                          : islandExpanded
                            ? "Something else..."
                            : t("ai.placeholder")
                      }
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        if (islandActive && !islandViewOnly && activeIslandFields[islandPage]) {
                          updateIslandField(islandPage, e.target.value);
                        }
                        requestAnimationFrame(syncComposerTextareaHeight);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.shiftKey) return;
                        if (e.key !== "Enter" || loading) return;
                        e.preventDefault();
                        if (wizardActive && input.trim()) {
                          handleWizardCustom();
                        } else if (islandActive && !islandViewOnly && input.trim()) {
                          if (islandPage < activeIslandFields.length - 1) {
                            setIslandPage((p) => p + 1);
                            setInput("");
                          } else {
                            void handleSend();
                          }
                        } else if (!islandExpanded) {
                          void handleSend();
                        }
                      }}
                      disabled={loading || islandViewOnly}
                      rows={1}
                      className="mx-1 max-h-[10.5rem] min-h-[44px] w-[calc(100%-0.5rem)] resize-none overflow-hidden border-0 bg-transparent px-3 py-2 text-[15px] text-white/95 shadow-none outline-none ring-0 placeholder:text-white/40 focus:border-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                    />
                    </>
                  )}
                  <div className="flex min-w-0 items-end justify-between gap-1.5 px-1 pb-0.5 pt-1">
                    <div className="flex min-w-0 flex-1 items-center gap-1">
                      {!islandExpanded && !inputAreaMounted ? (
                        <span
                          className="inline-flex h-10 w-10 items-center justify-center text-white/35"
                          aria-hidden
                        >
                          <Plus className="h-5 w-5" strokeWidth={1.75} />
                        </span>
                      ) : (
                        <>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/6 hover:text-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                                aria-label={t("ai.composer_attach_menu")}
                              >
                                <Plus className="h-5 w-5" strokeWidth={1.75} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="w-56 border border-white/15 bg-zinc-950 text-white"
                            >
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
                                <ImageIcon className="mr-2 h-4 w-4 text-amber-200/90" />
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
                                <Sparkles className="mr-2 h-4 w-4 text-[var(--color-accent)]" />
                                <span>{t("ai.create_trip")}</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  if (loading) return;
                                  if (!activeTripIdForRoute) {
                                    toast.info(t("ai.add_stops_need_trip"));
                                    return;
                                  }
                                  setSelectedTool({
                                    kind: "route_help",
                                    label: t("ai.add_stops_to_trip"),
                                  });
                                  setInput("");
                                }}
                              >
                                <Route className="mr-2 h-4 w-4 text-emerald-300/90" />
                                <span>{t("ai.add_stops_to_trip")}</span>
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
                                <MessageCircle className="mr-2 h-4 w-4 text-sky-300/90" />
                                <span>{t("ai.just_chat")}</span>
                              </DropdownMenuItem>
                              {sessionScope === "global" ? (
                                <>
                                  <DropdownMenuSeparator className="bg-white/10" />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setAttachTripDrawerOpen(true);
                                    }}
                                  >
                                    <Link2 className="mr-2 h-4 w-4 text-white/70" strokeWidth={1.75} />
                                    <span>{t("ai.attach_trip")}</span>
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {selectedTool ? (
                            <span className="inline-flex max-w-[min(280px,78vw)] min-w-0 shrink-0 items-center gap-1 rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/20 px-2.5 py-1.5 text-[12px] font-medium leading-tight text-[var(--color-accent)]">
                              {selectedTool.kind === "image_pick" ? (
                                <ImageIcon className="h-4 w-4 shrink-0" />
                              ) : selectedTool.kind === "find_images" ? (
                                <ImageIcon className="h-4 w-4 shrink-0" />
                              ) : selectedTool.kind === "route_help" ? (
                                <Route className="h-4 w-4 shrink-0 text-emerald-300/90" />
                              ) : selectedTool.kind === "quick_reply" && selectedTool.action === "just_chat" ? (
                                <MessageCircle className="h-4 w-4 shrink-0 text-sky-300/90" />
                              ) : (
                                <Sparkles className="h-4 w-4 shrink-0" />
                              )}
                              <span className="min-w-0 truncate">
                                {selectedTool.kind === "route_help"
                                  ? t("ai.add_stops_chip_short")
                                  : selectedTool.kind === "quick_reply"
                                    ? actionToDisplayLabel(selectedTool.action)
                                    : selectedTool.label}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedTool(null)}
                                className="shrink-0 rounded-full p-0.5 hover:bg-[var(--color-accent)]/20"
                                aria-label={t("ai.remove_tool")}
                              >
                                <X className="h-3.5 w-3.5" strokeWidth={2} />
                              </button>
                            </span>
                          ) : null}
                        </>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {showModelPickerInBar ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex min-h-9 min-w-[4.75rem] shrink-0 items-center justify-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[12px] font-medium text-white/75 shadow-none transition-colors hover:bg-white/[0.08] hover:text-white/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                            >
                              <span>{t("ai.model_glm5")}</span>
                              <ChevronDown className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="end"
                            side="top"
                            sideOffset={10}
                            className="w-[min(calc(100vw-2rem),20rem)] max-w-[20rem] overflow-hidden rounded-2xl border border-white/12 bg-zinc-950 p-0 text-white shadow-[0_16px_48px_rgba(0,0,0,0.55)]"
                          >
                            <div className="bg-white/[0.06] px-4 py-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold leading-tight text-white">
                                    {t("ai.model_glm5")}
                                  </p>
                                  <p className="mt-1 text-[13px] leading-snug text-white/50">
                                    {t("ai.model_glm5_subtitle")}
                                  </p>
                                </div>
                                <Check
                                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]"
                                  strokeWidth={2.5}
                                  aria-hidden
                                />
                              </div>
                            </div>
                            <div className="h-px bg-white/10" />
                            <div className="px-4 py-3">
                              <p className="text-[11px] font-medium uppercase tracking-wide text-white/40">
                                {t("ai.model_more_models_heading")}
                              </p>
                              <div className="mt-2 flex items-start justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
                                <p className="min-w-0 text-[13px] leading-snug text-white/55">
                                  {t("ai.model_more_soon_body")}
                                </p>
                                <span className="shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[11px] font-medium text-white/45">
                                  {t("ai.model_catalog_soon")}
                                </span>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : null}
                      {loading ? (
                        <Button
                          type="button"
                          onClick={stopGeneration}
                          size="icon"
                          aria-label={t("ai.stop_generating")}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground transition-all hover:bg-destructive"
                        >
                          <Square className="h-4 w-4 fill-current" />
                        </Button>
                      ) : canSendFromComposer ? (
                        <Button
                          onClick={() => {
                            if (wizardActive && input.trim()) {
                              handleWizardCustom();
                            } else {
                              void handleSend();
                            }
                          }}
                          size="icon"
                          aria-label={t("ai.send_message")}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] shadow-[0_0_15px_rgba(255,118,112,0.4)] transition-all hover:scale-105 hover:opacity-90"
                        >
                          <Send className="mt-0.5 h-[18px] w-[18px] -ml-0.5" />
                        </Button>
                      ) : !islandExpanded ? (
                        <button
                          type="button"
                          onClick={() => toast.info(t("ai.voice_coming_soon"))}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/55 transition-colors hover:bg-white/6 hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                          aria-label={t("ai.voice_coming_soon")}
                        >
                          <Mic className="h-[18px] w-[18px]" strokeWidth={1.75} />
                        </button>
                      ) : (
                        <Button
                          type="button"
                          disabled
                          size="icon"
                          aria-label={t("ai.send_message")}
                          className="flex h-10 w-10 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-foreground)] opacity-45 shadow-none"
                        >
                          <Send className="mt-0.5 h-[18px] w-[18px] -ml-0.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        </div>
      </div>

      {sessionScope === "global" ? (
        <Drawer open={attachTripDrawerOpen} onOpenChange={setAttachTripDrawerOpen}>
          <DrawerContent className="flex max-h-[min(88dvh,560px)] flex-col">
            <DrawerHeader className="shrink-0 text-left">
              <DrawerTitle>{t("ai.attach_trip")}</DrawerTitle>
              <DrawerDescription className="text-white/50">{t("ai.attach_trip_drawer_hint")}</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
              {tripsForAttachLoading ? (
                <p className="text-[13px] text-white/50">{t("common.loading", { defaultValue: "Loading…" })}</p>
              ) : tripsForAttach.length === 0 ? (
                <p className="text-[13px] text-white/50">{t("trips.no_trips")}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {tripsForAttach.map((tr) => {
                    const primary =
                      (tr.title && tr.title.trim()) ||
                      (tr.destination && tr.destination.trim()) ||
                      t("trips.untitled_trip");
                    const destinationLine =
                      tr.destination?.trim() &&
                      tr.title?.trim() &&
                      tr.destination.trim() !== tr.title.trim()
                        ? tr.destination.trim()
                        : null;
                    const dateLine = formatAttachTripDateRange(tr);
                    const cover = tripCoverForAttachUi(tr);
                    return (
                      <li key={tr.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setAttachedTripId(tr.id);
                            setAttachedTripTitle(
                              (tr.title && tr.title.trim()) ||
                                (tr.destination && tr.destination.trim()) ||
                                t("trips.untitled_trip"),
                            );
                            setAttachedTripCoverSrc(cover.src);
                            setAttachedTripCoverBlurHash(cover.blurHash);
                            setAttachTripDrawerOpen(false);
                          }}
                          className="flex w-full gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-2.5 text-left transition-colors hover:bg-white/[0.08]"
                        >
                          <div className="relative h-[4.5rem] w-[5.75rem] shrink-0 overflow-hidden rounded-lg bg-white/10">
                            {cover.src ? (
                              <CoverImageWithBlur
                                src={cover.src}
                                alt={primary}
                                blurHash={cover.blurHash ?? undefined}
                                className="h-full w-full"
                                imgClassName="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-white/30">
                                <Briefcase className="h-8 w-8" strokeWidth={1.25} aria-hidden />
                              </div>
                            )}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-0.5">
                            <span className="text-[14px] font-semibold leading-snug text-white/95">{primary}</span>
                            {destinationLine ? (
                              <span className="text-[12px] leading-snug text-white/55">{destinationLine}</span>
                            ) : null}
                            {dateLine ? (
                              <span className="text-[11px] leading-snug text-white/40">{dateLine}</span>
                            ) : null}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </DrawerContent>
        </Drawer>
      ) : null}

    </main>
  );
}
