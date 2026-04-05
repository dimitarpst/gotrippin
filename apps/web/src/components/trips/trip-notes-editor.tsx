"use client";

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { TaskList, TaskItem } from "@tiptap/extension-list";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  CheckSquare,
  Quote,
  Code,
  Code2,
  Minus,
  Undo2,
  Redo2,
  Link as LinkIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { updateTripAction } from "@/actions/trips";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  parseStoredTripNotes,
  TRIP_NOTES_STORAGE_MAX_CHARS,
} from "@/lib/trip-notes-doc";

import "./trip-notes-editor.css";

const AUTOSAVE_MS = 1200;

type SaveState = "idle" | "saving" | "saved" | "error";

function useEditorRerender(editor: Editor | null) {
  const [, force] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!editor) {
      return undefined;
    }
    const onTx = () => force();
    editor.on("transaction", onTx);
    return () => {
      editor.off("transaction", onTx);
    };
  }, [editor]);
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-8 w-8 shrink-0", isActive && "bg-accent text-accent-foreground")}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={isActive}
    >
      {children}
    </Button>
  );
}

function NotesToolbar({ editor }: { editor: Editor | null }) {
  const { t } = useTranslation();
  useEditorRerender(editor);

  if (!editor) {
    return (
      <div className="flex flex-wrap gap-1 border-b border-border bg-muted/40 p-2 min-h-[48px] rounded-t-xl" />
    );
  }

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(
      t("trip_notes.link_prompt", { defaultValue: "Link URL" }),
      prev ?? "https://",
    );
    if (url === null) {
      return;
    }
    const trimmed = url.trim();
    if (trimmed === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
  };

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-2 rounded-t-xl"
      role="toolbar"
      aria-label={t("trip_notes.toolbar_a11y", { defaultValue: "Formatting" })}
    >
      <ToolbarButton
        title={t("trip_notes.tool_bold", { defaultValue: "Bold" })}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("trip_notes.tool_italic", { defaultValue: "Italic" })}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("trip_notes.tool_strike", { defaultValue: "Strikethrough" })}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <div className="mx-1 h-6 w-px bg-border shrink-0" aria-hidden />
      <ToolbarButton
        title={t("trip_notes.tool_h2", { defaultValue: "Heading 2" })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("trip_notes.tool_h3", { defaultValue: "Heading 3" })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <div className="mx-1 h-6 w-px bg-border shrink-0" aria-hidden />
      <ToolbarButton
        title={t("trip_notes.tool_bullet", { defaultValue: "Bullet list" })}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("trip_notes.tool_ordered", { defaultValue: "Numbered list" })}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("trip_notes.tool_tasks", { defaultValue: "Task list" })}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive("taskList")}
      >
        <CheckSquare className="h-4 w-4" />
      </ToolbarButton>
      <div className="mx-1 h-6 w-px bg-border shrink-0" aria-hidden />
      <ToolbarButton
        title={t("trip_notes.tool_quote", { defaultValue: "Quote" })}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
      >
        <Quote className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("trip_notes.tool_code", { defaultValue: "Inline code" })}
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
      >
        <Code className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("trip_notes.tool_code_block", { defaultValue: "Code block" })}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
      >
        <Code2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("trip_notes.tool_hr", { defaultValue: "Divider" })}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton title={t("trip_notes.tool_link", { defaultValue: "Link" })} onClick={setLink}>
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <div className="mx-1 h-6 w-px bg-border shrink-0" aria-hidden />
      <ToolbarButton
        title={t("trip_notes.tool_undo", { defaultValue: "Undo" })}
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <Undo2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        title={t("trip_notes.tool_redo", { defaultValue: "Redo" })}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        <Redo2 className="h-4 w-4" />
      </ToolbarButton>
    </div>
  );
}

export function TripNotesEditor({
  tripId,
  initialNotesRaw,
  onSaveStateChange,
  className,
}: {
  tripId: string;
  initialNotesRaw: string | null | undefined;
  onSaveStateChange?: (state: SaveState) => void;
  /** Merged onto root Card — use `flex-1 min-h-0` to grow in a flex column layout. */
  className?: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [initialDoc] = useState(() => parseStoredTripNotes(initialNotesRaw));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tripIdRef = useRef(tripId);
  tripIdRef.current = tripId;

  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    onSaveStateChange?.(saveState);
  }, [saveState, onSaveStateChange]);

  useEffect(() => {
    setSaveState("idle");
  }, [tripId]);

  const persist = useCallback(
    async (ed: Editor) => {
      const json = ed.getJSON();
      const serialized = JSON.stringify(json);
      if (serialized.length > TRIP_NOTES_STORAGE_MAX_CHARS) {
        setSaveState("error");
        toast.error(t("trip_notes.oversize_title", { defaultValue: "Notes are too large" }), {
          description: t("trip_notes.oversize_body", {
            defaultValue: "Remove some content and try again.",
          }),
        });
        return;
      }
      const plain = ed.getText().trim();
      const payload = plain === "" ? { notes: null } : { notes: serialized };
      setSaveState("saving");
      const result = await updateTripAction(tripIdRef.current, payload);
      if (!result.success) {
        setSaveState("error");
        toast.error(t("trip_overview.notes_save_failed", { defaultValue: "Could not save notes" }), {
          description: result.error,
        });
        return;
      }
      setSaveState("saved");
      router.refresh();
      window.setTimeout(() => {
        setSaveState("idle");
      }, 2000);
    },
    [router, t],
  );

  const scheduleSave = useCallback(
    (editor: Editor) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        void persist(editor);
      }, AUTOSAVE_MS);
    },
    [persist],
  );

  useEffect(
    () => () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    },
    [],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
        },
      }),
      Placeholder.configure({
        placeholder: t("trip_notes.editor_placeholder", {
          defaultValue: "Plans, packing lists, links, ideas…",
        }),
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: initialDoc,
    editorProps: {
      attributes: {
        class: "trip-notes-editor",
        spellCheck: "true",
      },
    },
    onUpdate: ({ editor: ed }) => {
      scheduleSave(ed);
    },
  });

  return (
    <Card
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-border bg-card shadow-sm dark:border-white/[0.08]",
        className,
      )}
    >
      <NotesToolbar editor={editor} />
      <EditorContent
        editor={editor}
        className="trip-notes-editor trip-notes-editor--scroll text-card-foreground min-h-0 flex-1 overflow-y-auto"
      />
    </Card>
  );
}
