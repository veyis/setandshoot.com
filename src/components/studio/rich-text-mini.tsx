"use client";

import { useCallback } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND, type EditorState, type SerializedEditorState } from "lexical";
import { AutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";

/**
 * Minimal rich-text editor for the Studio: paragraphs, bold, italic, links.
 * Reads and writes the exact JSON shape Payload stores for Lexical fields.
 *
 * Callers MUST check isSupportedRichText(value) first and render a locked
 * fallback (link to /admin) for documents with unsupported node types.
 */

export type RichTextValue = { root: SerializedEditorState["root"] } & Record<string, unknown>;

const toolbarButtonClass =
  "border-hairline text-ink hover:bg-ink hover:text-canvas inline-flex rounded-sm border px-2 py-1 font-mono text-xs uppercase transition-colors";

function Toolbar() {
  const [editor] = useLexicalComposerContext();
  return (
    <div className="mb-1 flex gap-1" role="toolbar" aria-label="Textformat">
      <button
        type="button"
        className={toolbarButtonClass}
        aria-label="Fett"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
      >
        B
      </button>
      <button
        type="button"
        className={`${toolbarButtonClass} italic`}
        aria-label="Kursiv"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
      >
        I
      </button>
      <button
        type="button"
        className={toolbarButtonClass}
        aria-label="Link"
        onClick={() => {
          const url = window.prompt("URL");
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, url && url.trim() !== "" ? url : null);
        }}
      >
        Link
      </button>
    </div>
  );
}

export function RichTextMini({
  value,
  onChange,
  ariaLabel,
}: {
  value: RichTextValue | null | undefined;
  onChange: (next: RichTextValue) => void;
  ariaLabel: string;
}) {
  const handleChange = useCallback(
    (editorState: EditorState) => {
      onChange(editorState.toJSON() as RichTextValue);
    },
    [onChange],
  );

  return (
    <LexicalComposer
      initialConfig={{
        namespace: "studio-mini",
        nodes: [LinkNode, AutoLinkNode],
        editorState: value ? JSON.stringify(value) : undefined,
        theme: {
          paragraph: "mb-2",
          text: { bold: "font-semibold", italic: "italic" },
          link: "underline",
        },
        onError: (error) => {
          throw error;
        },
      }}
    >
      <Toolbar />
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            aria-label={ariaLabel}
            className="border-hairline bg-canvas focus:ring-accent min-h-24 w-full rounded-sm border px-3 py-2 text-base outline-none focus:ring-2"
          />
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      <OnChangePlugin onChange={handleChange} ignoreSelectionChange />
      <HistoryPlugin />
      <LinkPlugin />
    </LexicalComposer>
  );
}
