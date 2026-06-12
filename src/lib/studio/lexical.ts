/**
 * Safety lock for the Studio mini rich-text editor.
 *
 * The mini editor supports a small subset of Lexical nodes. Any document
 * containing other node types must render read-only with a link to the full
 * Payload admin editor — the mini editor must never round-trip content it
 * doesn't fully understand.
 *
 * No "server-only" here: client components import these helpers too.
 */

export const SUPPORTED_NODE_TYPES = new Set([
  "root",
  "paragraph",
  "text",
  "linebreak",
  "link",
  "autolink",
]);

type UnknownNode = { type?: unknown; children?: unknown };

export function collectNodeTypes(node: unknown, found = new Set<string>()): Set<string> {
  if (!node || typeof node !== "object") return found;
  const candidate = node as UnknownNode;
  if (typeof candidate.type === "string") found.add(candidate.type);
  if (Array.isArray(candidate.children)) {
    for (const child of candidate.children) collectNodeTypes(child, found);
  }
  return found;
}

/** A nullish value counts as supported: the editor starts empty. */
export function isSupportedRichText(value: unknown): boolean {
  const root = (value as { root?: unknown } | null | undefined)?.root;
  if (!root) return true;
  for (const type of collectNodeTypes(root)) {
    if (!SUPPORTED_NODE_TYPES.has(type)) return false;
  }
  return true;
}
