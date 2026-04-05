/** Stored in `trips.notes` as JSON (Tiptap document) or legacy plain text. */

export const TRIP_NOTES_STORAGE_MAX_CHARS = 500_000;

const EMPTY_DOC = {
  type: "doc" as const,
  content: [{ type: "paragraph" as const }],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTiptapDoc(value: unknown): value is { type: "doc"; content: unknown[] } {
  return isRecord(value) && value.type === "doc" && Array.isArray(value.content);
}

function legacyPlainTextToDoc(text: string): { type: "doc"; content: unknown[] } {
  const lines = text.split(/\r?\n/);
  const content = lines.map((line) => {
    if (line.length === 0) {
      return { type: "paragraph" as const };
    }
    return {
      type: "paragraph" as const,
      content: [{ type: "text" as const, text: line }],
    };
  });
  return { type: "doc", content };
}

/** Parse DB value into a Tiptap JSON document object. */
export function parseStoredTripNotes(raw: string | null | undefined): Record<string, unknown> {
  if (raw == null || raw.trim() === "") {
    return { ...EMPTY_DOC, content: [...EMPTY_DOC.content] };
  }
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (isTiptapDoc(parsed)) {
        return parsed;
      }
    } catch {
      // fall through to plain text
    }
  }
  return legacyPlainTextToDoc(trimmed);
}

function plainFromNode(node: unknown): string {
  if (!isRecord(node)) {
    return "";
  }
  if (node.type === "text" && typeof node.text === "string") {
    return node.text;
  }
  if (node.type === "hardBreak") {
    return "\n";
  }
  const content = node.content;
  if (!Array.isArray(content)) {
    return "";
  }
  const inner = content.map(plainFromNode).join("");
  if (
    node.type === "paragraph" ||
    node.type === "heading" ||
    node.type === "blockquote" ||
    node.type === "listItem" ||
    node.type === "taskItem" ||
    node.type === "codeBlock"
  ) {
    return `${inner}\n`;
  }
  if (node.type === "doc") {
    return inner.replace(/\n+$/, "");
  }
  return inner;
}

/** Human-readable text for PDF, search, etc. */
export function tripNotesStorageToPlainText(raw: string | null | undefined): string {
  if (raw == null || raw.trim() === "") {
    return "";
  }
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (isTiptapDoc(parsed)) {
        return plainFromNode(parsed).trim();
      }
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}
