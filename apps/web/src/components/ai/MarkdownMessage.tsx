"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.03]">
      <table className="w-full min-w-[280px] border-collapse text-left text-[14px] text-white/90">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-white/15 bg-white/[0.06]">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-3 py-2.5 text-left font-semibold text-white">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-t border-white/10 px-3 py-2 text-white/85">{children}</td>
  ),
  del: ({ children }) => <del className="text-white/50 line-through">{children}</del>,
};

export default function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="text-[15px] [&>p]:mb-4 last:[&>p]:mb-0 [&>p]:leading-relaxed [&>strong]:font-semibold [&>strong]:text-white [&>ul]:my-4 [&>ul]:list-none [&>ul]:space-y-2.5 [&>ul>li]:relative [&>ul>li]:pl-6 [&>ul>li]:before:content-[''] [&>ul>li]:before:absolute [&>ul>li]:before:left-1 [&>ul>li]:before:top-[0.6em] [&>ul>li]:before:w-1.5 [&>ul>li]:before:h-1.5 [&>ul>li]:before:rounded-full [&>ul>li]:before:bg-[var(--color-accent)] [&>ol]:my-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol>li]:pl-1.5 [&>ol>li]:marker:text-[var(--color-accent)] [&>ol>li]:marker:font-medium [&>code]:text-[var(--color-accent)] [&>code]:bg-[var(--color-accent)]/10 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:text-[13px] [&>code]:font-medium [&>a]:text-[var(--color-accent)] [&>a]:underline-offset-4 hover:[&>a]:underline">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
