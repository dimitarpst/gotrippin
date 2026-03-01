"use client";

import ReactMarkdown from "react-markdown";

export default function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="text-sm [&>p]:my-2 [&>p]:leading-relaxed [&>strong]:font-semibold [&>strong]:text-[var(--color-foreground)] [&>ul]:my-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:my-2 [&>ol]:list-decimal [&>ol]:pl-5 [&>code]:text-[var(--color-accent)] [&>code]:bg-muted/80 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>a]:text-[var(--color-accent)] [&>a]:underline-offset-2 hover:[&>a]:underline">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
