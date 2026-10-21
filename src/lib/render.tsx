import type { ReactNode } from "react";
import type { Block, Dir } from "@/lib/blocks";

/* ────────────────────────────────────────────────────────────
   Inline markup → React nodes.
   Supported: **bold** · *italic* · `code` · [text](url) · {{ltr …}}
   No raw HTML is ever injected, so stored content cannot break out.
   ──────────────────────────────────────────────────────────── */

const INLINE_RE =
  /(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(`[^`\n]+`)|(\[[^\]\n]+\]\([^)\s]+\))|(\{\{ltr\s+[^}]+\}\})/g;

export function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let key = 0;
  INLINE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const k = `i${key++}`;

    if (token.startsWith("**")) {
      nodes.push(<strong key={k}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={k}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      nodes.push(
        <code key={k} className="inline-code" dir="ltr">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("[")) {
      const close = token.indexOf("](");
      const label = token.slice(1, close);
      const href = token.slice(close + 2, -1);
      const safe = /^(https?:|\/|#|mailto:)/i.test(href) ? href : "#";
      nodes.push(
        <a key={k} href={safe} dir="auto" target={safe.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
          {label}
        </a>,
      );
    } else if (token.startsWith("{{ltr")) {
      nodes.push(
        <span key={k} className="ltr-inline" dir="ltr">
          {token.replace(/^\{\{ltr\s+/, "").replace(/\}\}$/, "")}
        </span>,
      );
    }

    last = match.index + token.length;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function dirAttr(dir?: Dir): "rtl" | "ltr" | undefined {
  return dir === "auto" ? undefined : dir;
}

function embedSrc(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("aparat.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://www.aparat.com/video/video/embed/videohash/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

/* ── one content block ───────────────────────────────────── */

export function BlockView({
  block,
  index,
  preview = false,
}: {
  block: Block;
  index: number;
  preview?: boolean;
}) {
  const id = `b-${index}`;

  switch (block.type) {
    case "heading": {
      const Tag = block.level === 3 ? "h3" : "h2";
      return (
        <Tag id={id} dir={dirAttr(block.dir) ?? "rtl"}>
          {renderInline(block.text)}
        </Tag>
      );
    }

    case "paragraph":
      return (
        <p id={id} dir={dirAttr(block.dir) ?? "rtl"}>
          {renderInline(block.text)}
        </p>
      );

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag id={id} dir={dirAttr(block.dir) ?? "rtl"}>
          {block.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </Tag>
      );
    }

    case "quote":
      return (
        <blockquote id={id} dir={dirAttr(block.dir) ?? "rtl"}>
          {renderInline(block.text)}
          {block.cite ? <cite>{block.cite}</cite> : null}
        </blockquote>
      );

    case "code":
      return (
        <div id={id} className="not-prose">
          <div className="flex items-center justify-between border border-ink/20 border-b-0 bg-paper-3 px-4 py-1.5">
            <span className="num text-[11px] text-ink-soft">{block.lang || "code"}</span>
            <span className="num text-[11px] text-ink-soft">CODE BLOCK</span>
          </div>
          <pre dir="ltr">
            <code>{block.code}</code>
          </pre>
        </div>
      );

    case "image":
      // Public pages never show an empty placeholder — only the editor preview does.
      if (!block.fileId && !preview) return null;
      return (
        <figure id={id} className="not-prose">
          {block.fileId ? (
            <img src={`/api/files/${block.fileId}`} alt={block.alt || ""} loading="lazy" />
          ) : (
            <div className="grid h-52 place-items-center border border-dashed border-rule bg-paper-2 text-[13px] text-ink-soft">
              تصویری انتخاب نشده است
            </div>
          )}
          {block.caption ? (
            <figcaption>
              {renderInline(block.caption)}
              {block.alt ? <span className="block text-[11px] opacity-70">متن جایگزین: {block.alt}</span> : null}
            </figcaption>
          ) : null}
        </figure>
      );

    case "file":
      if (!block.fileId) {
        return preview ? (
          <p id={id} className="not-prose text-[13px] text-ink-soft">
            پیوستی بارگذاری نشده است.
          </p>
        ) : null;
      }
      return (
        <p id={id} className="not-prose">
          <a
            href={block.fileId ? `/api/files/${block.fileId}?download=1` : "#"}
            className="inline-flex items-center gap-2.5 border border-rule bg-paper-2 px-3.5 py-2 text-[14px] text-ink no-underline hover:border-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {block.label || "دریافت پیوست"}
          </a>
        </p>
      );

    case "table":
      return (
        <div id={id} className="not-prose">
          {block.caption ? (
            <p className="mb-2 text-[13px] text-ink-soft">
              <span className="num">جدول</span> — {block.caption}
            </p>
          ) : null}
          <div className="table-scroll">
            <table dir={dirAttr(block.dir) ?? "rtl"}>
              {block.header.length ? (
                <thead>
                  <tr>
                    {block.header.map((cell, i) => (
                      <th key={i}>{renderInline(cell)}</th>
                    ))}
                  </tr>
                </thead>
              ) : null}
              <tbody>
                {block.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{renderInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

    case "references":
      return (
        <div id={id} className="not-prose">
          <h2 className="!mt-10 border-t border-rule pt-4 text-lg font-black">منابع و مراجع</h2>
          <ol dir={dirAttr(block.dir) ?? "rtl"} className="mt-4 space-y-2.5">
            {block.items.map((item, i) => (
              <li key={i} className="border-e-2 border-rule pe-3 text-[14px] leading-8 text-ink-2">
                <span className="num me-2 text-ink-soft">{i + 1}.</span>
                {renderInline(item)}
              </li>
            ))}
          </ol>
        </div>
      );

    case "embed": {
      const src = embedSrc(block.url);
      return (
        <figure id={id} className="not-prose">
          {src ? (
            <div className="border border-rule bg-ink">
              <iframe
                src={src}
                title={block.label || "ویدیو"}
                className="aspect-video w-full"
                allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <a
              href={block.url}
              target="_blank"
              rel="noreferrer"
              className="block border border-rule bg-paper-2 px-4 py-3.5 text-[14px] text-ink no-underline hover:border-ink"
            >
              <span className="num block text-[11px] text-ink-soft">{block.url}</span>
              <span className="mt-1 block font-bold">{block.label || "مشاهدهٔ پیوند"}</span>
            </a>
          )}
          {block.label && src ? <figcaption>{block.label}</figcaption> : null}
        </figure>
      );
    }

    default:
      return null;
  }
}

export function BlockList({ blocks, preview = false }: { blocks: Block[]; preview?: boolean }) {
  return (
    <div className="prose-fa">
      {blocks.map((block, index) => (
        <BlockView key={index} block={block} index={index} preview={preview} />
      ))}
    </div>
  );
}
