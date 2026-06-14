type LexicalNode = { text?: unknown; children?: unknown };

/** Flatten a Payload Lexical richtext value to plain text (concatenated text nodes). */
export function lexicalToPlainText(value: unknown): string {
  const root = (value as { root?: unknown } | null | undefined)?.root;
  if (!root) return "";
  const parts: string[] = [];
  const walk = (node: unknown): void => {
    if (!node || typeof node !== "object") return;
    const n = node as LexicalNode;
    if (typeof n.text === "string") parts.push(n.text);
    if (Array.isArray(n.children)) for (const c of n.children) walk(c);
  };
  walk(root);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}
