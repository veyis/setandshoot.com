import { describe, it, expect } from "vitest";
import { createHeadlessEditor } from "@lexical/headless";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import { collectNodeTypes, isSupportedRichText, SUPPORTED_NODE_TYPES } from "@/lib/studio/lexical";

/** Canonical Payload-stored shape (mirrors scripts/seed/about-page.ts richParagraph). */
function payloadParagraph(text: string, format = 0) {
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: [
        {
          type: "paragraph",
          format: "",
          indent: 0,
          version: 1,
          direction: "ltr" as const,
          textFormat: format,
          children: [
            { type: "text", text, format, style: "", mode: "normal", detail: 0, version: 1 },
          ],
        },
      ],
    },
  };
}

function makeEditor() {
  return createHeadlessEditor({
    namespace: "studio-mini-spike",
    nodes: [LinkNode, AutoLinkNode],
    onError: (error) => {
      throw error;
    },
  });
}

function roundTrip(value: object) {
  const editor = makeEditor();
  editor.setEditorState(editor.parseEditorState(JSON.stringify(value)));
  return editor.getEditorState().toJSON() as ReturnType<typeof payloadParagraph>;
}

describe("lexical round-trip (Payload shape)", () => {
  it("preserves plain paragraph text", () => {
    const out = roundTrip(payloadParagraph("Torjubel nach dem 2:1"));
    expect(out.root.type).toBe("root");
    expect(out.root.children).toHaveLength(1);
    const para = out.root.children[0]!;
    expect(para.type).toBe("paragraph");
    expect(para.children[0]).toMatchObject({
      type: "text",
      text: "Torjubel nach dem 2:1",
      format: 0,
      mode: "normal",
    });
  });

  it("preserves bold (1) and italic (2) format bitmasks", () => {
    for (const format of [1, 2, 3]) {
      const out = roundTrip(payloadParagraph("Satzball", format));
      expect(out.root.children[0]!.children[0]).toMatchObject({ format });
    }
  });

  it("preserves link nodes with url", () => {
    const value = {
      root: {
        ...payloadParagraph("").root,
        children: [
          {
            type: "paragraph",
            format: "",
            indent: 0,
            version: 1,
            direction: "ltr" as const,
            textFormat: 0,
            children: [
              {
                type: "link",
                url: "https://setandshoot.com",
                rel: null,
                target: null,
                title: null,
                format: "",
                indent: 0,
                version: 1,
                direction: "ltr" as const,
                children: [
                  {
                    type: "text",
                    text: "Set & Shoot",
                    format: 0,
                    style: "",
                    mode: "normal",
                    detail: 0,
                    version: 1,
                  },
                ],
              },
            ],
          },
        ],
      },
    };
    const out = roundTrip(value);
    const link = out.root.children[0]!.children[0] as { type: string; url?: string };
    expect(link.type).toBe("link");
    expect(link.url).toBe("https://setandshoot.com");
  });

  it("output keeps the Payload envelope fields", () => {
    const out = roundTrip(payloadParagraph("x"));
    expect(out.root).toMatchObject({ type: "root", version: 1 });
    expect(out.root).toHaveProperty("direction");
    expect(out.root).toHaveProperty("format");
    expect(out.root).toHaveProperty("indent");
  });
});

describe("safety lock", () => {
  it("accepts supported documents and empty values", () => {
    expect(isSupportedRichText(payloadParagraph("ok"))).toBe(true);
    expect(isSupportedRichText(null)).toBe(true);
    expect(isSupportedRichText(undefined)).toBe(true);
    expect(isSupportedRichText({})).toBe(true);
  });

  it("rejects documents with unknown node types", () => {
    const doc = payloadParagraph("ok");
    (doc.root.children as unknown[]).push({ type: "upload", children: [], version: 1 });
    expect(isSupportedRichText(doc)).toBe(false);
  });

  it("collects nested node types", () => {
    const types = collectNodeTypes(payloadParagraph("ok").root);
    expect(types).toEqual(new Set(["root", "paragraph", "text"]));
    for (const type of types) expect(SUPPORTED_NODE_TYPES.has(type)).toBe(true);
  });
});
