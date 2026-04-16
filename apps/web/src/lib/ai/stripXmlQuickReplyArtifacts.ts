/**
 * Removes XML-style fragments some models leak instead of JSON quick_replies
 * (e.g. quick_replies</arg_key><arg_value>[...]</arg_value>).
 * Used when rendering stored messages so old threads do not show raw markup.
 */
export function stripXmlQuickReplyArtifacts(content: string): string {
  let text = content;
  text = text.replace(
    /(?:<arg_key>\s*)?quick_replies\s*<\/arg_key>\s*<arg_value>\s*\[[\s\S]*?\]\s*<\/arg_value>/gi,
    "",
  );
  text = text
    .replace(/<arg_key>[\s\S]*?<\/arg_key>\s*<arg_value>[\s\S]*?<\/arg_value>/gi, "")
    .trim();
  return text;
}
