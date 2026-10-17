/**
 * Content model for the archive.
 *
 * An article body is a list of blocks. Every block can carry its own text
 * direction so Persian (RTL) and English (LTR) content can live in the same
 * document without forcing a single direction on the whole page.
 */

export type Dir = "rtl" | "ltr" | "auto";

export type Block =
  | { type: "heading"; level: 2 | 3; text: string; dir?: Dir }
  | { type: "paragraph"; text: string; dir?: Dir }
  | { type: "list"; ordered: boolean; items: string[]; dir?: Dir }
  | { type: "quote"; text: string; cite?: string; dir?: Dir }
  | { type: "code"; lang?: string; code: string }
  | { type: "image"; fileId: number; alt: string; caption?: string }
  | { type: "file"; fileId: number; label: string }
  | {
      type: "table";
      caption?: string;
      header: string[];
      rows: string[][];
      dir?: Dir;
    }
  | { type: "references"; items: string[]; dir?: Dir }
  | { type: "embed"; url: string; label?: string; dir?: Dir };

export const BLOCK_LABELS: Record<Block["type"], string> = {
  heading: "تیتر",
  paragraph: "پاراگراف",
  list: "فهرست",
  quote: "نقل‌قول",
  code: "کد",
  image: "تصویر",
  file: "پیوست فایل",
  table: "جدول",
  references: "منابع",
  embed: "ویدیو / لینک",
};

export function emptyBlock(type: Block["type"]): Block {
  switch (type) {
    case "heading":
      return { type: "heading", level: 2, text: "", dir: "rtl" };
    case "list":
      return { type: "list", ordered: false, items: [""], dir: "rtl" };
    case "quote":
      return { type: "quote", text: "", dir: "rtl" };
    case "code":
      return { type: "code", lang: "js", code: "" };
    case "image":
      return { type: "image", fileId: 0, alt: "" };
    case "file":
      return { type: "file", fileId: 0, label: "" };
    case "table":
      return {
        type: "table",
        header: ["ستون ۱", "ستون ۲"],
        rows: [["", ""]],
        dir: "rtl",
      };
    case "references":
      return { type: "references", items: [""], dir: "rtl" };
    case "embed":
      return { type: "embed", url: "", dir: "ltr" };
    default:
      return { type: "paragraph", text: "", dir: "rtl" };
  }
}

const INLINE_PATTERN =
  /(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(`[^`\n]+`)|(\[[^\]\n]+\]\([^)\s]+\))|(\{\{ltr\s+[^}]+\}\})/g;

/** Plain-text projection of inline markup, used for search + reading time. */
export function stripInline(text: string): string {
  return text
    .replace(/\{\{ltr\s+([^}]+)\}\}/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*`]/g, "")
    .trim();
}

export function blocksToPlain(blocks: Block[]): string {
  const out: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case "heading":
      case "paragraph":
        out.push(stripInline(block.text));
        break;
      case "list":
      case "references":
        out.push(block.items.map(stripInline).join(" "));
        break;
      case "quote":
        out.push(stripInline(block.text));
        break;
      case "code":
        out.push(block.code);
        break;
      case "table":
        out.push(block.header.join(" "));
        out.push(block.rows.map((r) => r.join(" ")).join(" "));
        break;
      case "image":
        out.push(block.alt, block.caption ?? "");
        break;
      case "file":
        out.push(block.label);
        break;
      case "embed":
        out.push(block.label ?? "", block.url);
        break;
    }
  }
  return out.filter(Boolean).join("\n");
}

export function tocOf(blocks: Block[]) {
  return blocks
    .map((block, index) => ({ block, index }))
    .filter(
      (entry): entry is { block: Extract<Block, { type: "heading" }>; index: number } =>
        entry.block.type === "heading",
    )
    .map((entry) => ({
      id: `b-${entry.index}`,
      level: entry.block.level,
      text: stripInline(entry.block.text),
    }));
}

export function readingMinutes(blocks: Block[]): number {
  const words = blocksToPlain(blocks).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

export const INLINE_HINT = "**متن پررنگ**  *متن کج*  `کد`  [متن پیوند](https://example.com)  {{ltr English phrase}}";
