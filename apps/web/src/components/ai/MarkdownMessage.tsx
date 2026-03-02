"use client";

import ReactMarkdown from "react-markdown";

export default function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="text-[15px] [&>p]:mb-4 last:[&>p]:mb-0 [&>p]:leading-relaxed [&>strong]:font-semibold [&>strong]:text-white [&>ul]:my-4 [&>ul]:list-none [&>ul]:space-y-2.5 [&>ul>li]:relative [&>ul>li]:pl-6 [&>ul>li]:before:content-[''] [&>ul>li]:before:absolute [&>ul>li]:before:left-1 [&>ul>li]:before:top-[0.6em] [&>ul>li]:before:w-1.5 [&>ul>li]:before:h-1.5 [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-[var(--color-accent)] [&>ol]:my-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol>li]:pl-1.5 [&>ol>li]:marker:text-[var(--color-accent)] [&>ol>li]:marker:font-medium [&>code]:text-[var(--color-accent)] [&>code]:bg-[var(--color-accent)]/10 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:text-[13px] [&>code]:font-medium [&>a]:text-[var(--color-accent)] [&>a]:underline-offset-4 hover:[&>a]:underline">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
