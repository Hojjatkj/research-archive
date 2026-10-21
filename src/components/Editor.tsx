"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Block, Dir } from "@/lib/blocks";
import { BLOCK_LABELS, emptyBlock } from "@/lib/blocks";
import { BlockList } from "@/lib/render";
import { Grain } from "@/components/Grain";
import {
  deleteItemAction,
  saveItemAction,
  type ItemInput,
} from "@/app/dashboard/actions";

export type ItemDTO = {
  id: number;
  title: string;
  slug: string;
  type: string;
  course: string;
  summary: string;
  tags: string[];
  status: "draft" | "published";
  content: Block[];
  coverFileId: number | null;
  hiddenByAdmin?: boolean;
  moderationNote?: string;
};

const TYPE_OPTIONS = [
  ["assignment", "تکلیف / گزارش"],
  ["research", "متن و مقالهٔ پژوهشی"],
  ["presentation", "ارائه"],
  ["notes", "جزوه"],
];

const DIR_OPTIONS: [Dir, string][] = [
  ["rtl", "راست‌به‌چپ"],
  ["ltr", "چپ‌به‌راست"],
  ["auto", "خودکار"],
];

const FIELD_CLASS =
  "w-full border border-rule bg-paper-2 px-3.5 py-2.5 text-[14px] leading-8 text-ink placeholder:text-ink-soft/60 focus:border-ink focus:bg-white focus:outline-none";

function tableToText(header: string[], rows: string[][]) {
  return [header, ...rows].map((r) => r.join(" | ")).join("\n");
}

function textToTable(text: string): { header: string[]; rows: string[][] } {
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  if (!lines.length) return { header: [], rows: [] };
  const parsed = lines.map((line) => line.split("|").map((cell) => cell.trim()));
  return { header: parsed[0], rows: parsed.slice(1) };
}

export function Editor({ initial, savedFlash }: { initial: ItemDTO | null; savedFlash?: boolean }) {
  const router = useRouter();
  const fieldRefs = useRef(new Map<string, HTMLTextAreaElement | HTMLInputElement>());

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [type, setType] = useState(initial?.type ?? "assignment");
  const [course, setCourse] = useState(initial?.course ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join("، "));
  const [coverFileId, setCoverFileId] = useState<number | null>(initial?.coverFileId ?? null);
  const [status, setStatus] = useState<"draft" | "published">(
    initial?.status === "published" ? "published" : "draft",
  );
  const [blocks, setBlocks] = useState<Block[]>(
    initial?.content?.length
      ? initial.content
      : [{ type: "heading", level: 2, text: "", dir: "rtl" }, emptyBlock("paragraph")],
  );

  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState<"save" | "delete" | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(savedFlash ? "تغییرات ذخیره شد." : null);

  function patchBlock(index: number, patch: Record<string, unknown>) {
    setBlocks((prev) =>
      prev.map((block, i) => (i === index ? ({ ...block, ...patch } as Block) : block)),
    );
  }

  function moveBlock(index: number, delta: number) {
    setBlocks((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeBlock(index: number) {
    if (!window.confirm("این بلوک حذف شود؟")) return;
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function addBlock(kind: Block["type"]) {
    setBlocks((prev) => [...prev, emptyBlock(kind)]);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });
  }

  function attachRef(key: string) {
    return (el: HTMLTextAreaElement | HTMLInputElement | null) => {
      if (el) fieldRefs.current.set(key, el);
      else fieldRefs.current.delete(key);
    };
  }

  function wrapField(
    key: string,
    before: string,
    after: string,
    placeholder: string,
    commit: (value: string) => void,
  ) {
    const el = fieldRefs.current.get(key);
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const value = el.value;
    const selected = value.slice(start, end) || placeholder;
    commit(value.slice(0, start) + before + selected + after + value.slice(end));
    window.requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  }

  async function upload(file: File): Promise<{ id: number; name: string }> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/files", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "بارگذاری فایل ناموفق بود.");
    return data.file;
  }

  async function handleUpload(index: number, file: File, kind: "image" | "file") {
    setBusy(index);
    setError(null);
    try {
      const uploaded = await upload(file);
      if (kind === "image") {
        patchBlock(index, { fileId: uploaded.id });
      } else {
        patchBlock(index, { fileId: uploaded.id, label: uploaded.name });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "بارگذاری فایل ناموفق بود.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCover(file: File) {
    setBusy("save");
    setError(null);
    try {
      const uploaded = await upload(file);
      setCoverFileId(uploaded.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "بارگذاری تصویر ناموفق بود.");
    } finally {
      setBusy(null);
    }
  }

  async function save(nextStatus?: "draft" | "published") {
    const finalStatus = nextStatus ?? status;
    setBusy("save");
    setError(null);

    const payload: ItemInput = {
      id: initial?.id,
      title,
      slug,
      type,
      course,
      summary,
      tags: tags
        .split(/[،,]/)
        .map((t) => t.trim())
        .filter(Boolean),
      status: finalStatus,
      content: blocks,
      coverFileId,
    };

    let result: Awaited<ReturnType<typeof saveItemAction>>;
    try {
      result = await saveItemAction(payload);
    } catch {
      setBusy(null);
      setError("ذخیرهٔ مطلب ناموفق بود. لطفاً دوباره تلاش کنید.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setBusy(null);

    if (!result.ok) {
      setError(result.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setStatus(result.status === "published" ? "published" : "draft");
    setFlash(
      result.status === "published"
        ? "مطلب ذخیره و منتشر شد."
        : "پیش‌نویس ذخیره شد.",
    );
    window.setTimeout(() => setFlash(null), 4000);

    if (!initial?.id) {
      router.replace(`/dashboard/edit/${result.id}?saved=1`);
    } else {
      router.refresh();
    }
  }

  async function remove() {
    if (!initial?.id) return;
    const ok = window.confirm(
      `مطلب «${title}» برای همیشه حذف شود؟ این عملیات قابل بازگشت نیست.`,
    );
    if (!ok) return;
    setBusy("delete");
    try {
      const result = await deleteItemAction(initial.id);
      if (!result.ok) {
        setError(result.error ?? "حذف انجام نشد.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("حذف انجام نشد. دوباره تلاش کنید.");
    } finally {
      setBusy(null);
    }
  }

  function toolbar(key: string, commit: (value: string) => void) {
    const wrap = (before: string, after: string, ph: string) =>
      wrapField(key, before, after, ph, commit);
    return (
      <div className="flex flex-wrap items-center gap-1.5 border-b border-rule bg-paper-3/40 px-2.5 py-1.5">
        <span className="num me-1 text-[10px] text-ink-soft">INLINE</span>
        <button
          type="button"
          onClick={() => wrap("**", "**", "متن پررنگ")}
          className="border border-rule bg-paper-2 px-2 py-1 text-[12px] font-bold hover:border-ink"
          title="متن پررنگ"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => wrap("*", "*", "متن کج")}
          className="border border-rule bg-paper-2 px-2 py-1 text-[12px] italic hover:border-ink"
          title="متن کج"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => wrap("`", "`", "code")}
          className="num border border-rule bg-paper-2 px-2 py-1 text-[11px] hover:border-ink"
          title="کد درون‌خطی"
        >
          {"</>"}
        </button>
        <button
          type="button"
          onClick={() => wrap("[", "](https://example.com)", "متن پیوند")}
          className="border border-rule bg-paper-2 px-2 py-1 text-[12px] hover:border-ink"
          title="پیوند"
        >
          🔗
        </button>
        <button
          type="button"
          onClick={() => wrap("{{ltr ", "}}", "English phrase")}
          className="border border-rule bg-paper-2 px-2 py-1 text-[11px] hover:border-ink"
          title="متن انگلیسی درون جملهٔ فارسی"
        >
          EN
        </button>
        <span className="ms-auto text-[10.5px] text-ink-soft">
          نشانه‌گذاری در پیش‌نمایش به متن قالب‌بندی‌شده تبدیل می‌شود
        </span>
      </div>
    );
  }

  function dirControl(block: Block, index: number) {
    if (!("dir" in block)) return null;
    return (
      <div className="flex items-center gap-1">
        {DIR_OPTIONS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => patchBlock(index, { dir: value })}
            className={`border px-2 py-1 text-[11px] ${
              (block.dir ?? "rtl") === value
                ? "border-ink bg-ink text-paper-2"
                : "border-rule text-ink-soft hover:border-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <Grain />

      <div className="relative z-10">
        <header className="no-print sticky top-0 z-30 border-b border-ink/25 bg-ink text-paper-2">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-5 gap-y-3 px-5 py-3.5 lg:px-8">
            <div>
              <p className="num text-[10px] text-paper-2/55">
                {initial?.id ? `EDIT #${initial.id}` : "NEW ITEM"}
              </p>
              <h1 className="mt-0.5 text-[17px] font-black">
                {initial?.id ? "ویرایش مطلب" : "نوشتن مطلب تازه"}
              </h1>
            </div>

            <div className="ms-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPreview((v) => !v)}
                className="border border-paper-2/30 px-3.5 py-2 text-[12.5px] text-paper-2 hover:border-paper-2"
              >
                {preview ? "بازگشت به ویرایش" : "پیش‌نمایش"}
              </button>
              <button
                type="button"
                onClick={() => void save("draft")}
                disabled={busy === "save"}
                className="border border-paper-2/30 px-3.5 py-2 text-[12.5px] text-paper-2 hover:border-paper-2 disabled:opacity-50"
              >
                ذخیرهٔ پیش‌نویس
              </button>
              <button
                type="button"
                onClick={() => void save("published")}
                disabled={busy === "save"}
                className="border border-accent bg-accent px-3.5 py-2 text-[12.5px] font-bold text-paper-2 hover:bg-accent-2 disabled:opacity-50"
              >
                {busy === "save" ? "در حال ذخیره…" : "ذخیره و انتشار"}
              </button>
              <Link
                href="/dashboard"
                className="border border-paper-2/20 px-3.5 py-2 text-[12.5px] text-paper-2/75 hover:border-paper-2/50"
              >
                میز کار
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1180px] px-5 py-9 lg:px-8">
          {flash ? (
            <p
              role="status"
              className="mb-6 border-e-4 border-moss bg-moss/10 px-4 py-3 text-[13px] text-moss"
            >
              {flash}{" "}
              {initial?.id && status === "published" ? (
                <Link href={`/item/${initial.slug}`} className="font-bold underline">
                  مشاهدهٔ مطلب در وب‌سایت
                </Link>
              ) : null}
            </p>
          ) : null}

          {error ? (
            <p
              role="alert"
              className="mb-6 border-e-4 border-accent bg-accent/10 px-4 py-3 text-[13px] text-accent-2"
            >
              {error}
            </p>
          ) : null}

          {initial?.hiddenByAdmin ? (
            <p
              role="note"
              className="mb-6 border-s-4 border-accent bg-accent/10 px-4 py-3 text-[13px] leading-7 text-accent-2"
            >
              مدیر کلاس این مطلب را از دید عموم خارج کرده است
              {initial.moderationNote ? ` — «${initial.moderationNote}»` : "."} مطلب برای شما محفوظ است؛
              ویرایش‌ها ذخیره می‌شوند و پس از بازگرداندن توسط مدیر دوباره نمایش داده می‌شود.
            </p>
          ) : null}

          {preview ? (
            <div className="border border-rule bg-paper-2 px-7 py-10">
              <p className="mb-8 border-b border-rule pb-4 text-[12px] text-ink-soft">
                پیش‌نمایش مطلب — دقیقاً با همان قالب‌بندی وب‌سایت
              </p>
              <h1 className="text-[clamp(1.8rem,4vw,2.75rem)] font-black leading-[1.35] text-ink">
                {title || "بدون عنوان"}
              </h1>
              {summary ? (
                <p className="mt-5 border-e-2 border-accent pe-5 text-[16px] leading-9 text-ink-2">
                  {summary}
                </p>
              ) : null}
              <div className="mt-10">
                <BlockList blocks={blocks} preview />
              </div>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[1fr_19rem]">
              <div>
                {/* ── blocks ───────────────────────── */}
                <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-ink pb-4">
                  <h2 className="text-[20px] font-black text-ink">بدنهٔ مطلب</h2>
                  <p className="num text-[11px] text-ink-soft">
                    {String(blocks.length).padStart(2, "0")} BLOCK
                  </p>
                </div>

                <div className="mt-6 space-y-5">
                  {blocks.map((block, index) => (
                    <section
                      key={index}
                      className="border border-rule bg-paper-2 shadow-[0_10px_30px_rgba(22,35,63,0.05)]"
                    >
                      <div className="flex flex-wrap items-center gap-2.5 border-b border-rule px-3 py-2">
                        <span className="num text-[11px] text-ink-soft">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <select
                          value={block.type}
                          onChange={(e) => {
                            const kind = e.target.value as Block["type"];
                            setBlocks((prev) =>
                              prev.map((b, i) => (i === index ? emptyBlock(kind) : b)),
                            );
                          }}
                          className="border border-rule bg-paper-2 px-2 py-1 text-[12px] focus:border-ink focus:outline-none"
                          aria-label="نوع بلوک"
                        >
                          {Object.entries(BLOCK_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>

                        {dirControl(block, index)}

                        <div className="ms-auto flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveBlock(index, -1)}
                            className="border border-rule px-2 py-1 text-[11px] hover:border-ink"
                            aria-label="انتقال به بالا"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(index, 1)}
                            className="border border-rule px-2 py-1 text-[11px] hover:border-ink"
                            aria-label="انتقال به پایین"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(index)}
                            className="border border-rule px-2 py-1 text-[11px] text-accent hover:border-accent hover:bg-accent hover:text-paper-2"
                          >
                            حذف
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 px-3 py-4">
                        {block.type === "heading" ? (
                          <>
                            {toolbar(`h-${index}`, (value) => patchBlock(index, { text: value }))}
                            <div className="flex gap-2">
                              <select
                                value={block.level}
                                onChange={(e) =>
                                  patchBlock(index, { level: Number(e.target.value) as 2 | 3 })
                                }
                                className="border border-rule bg-paper-2 px-2 py-2 text-[12px] focus:border-ink focus:outline-none"
                                aria-label="سطح تیتر"
                              >
                                <option value={2}>تیتر اصلی</option>
                                <option value={3}>تیتر فرعی</option>
                              </select>
                              <input
                                ref={attachRef(`h-${index}`)}
                                value={block.text}
                                onChange={(e) => patchBlock(index, { text: e.target.value })}
                                placeholder="متن تیتر…"
                                className={FIELD_CLASS}
                              />
                            </div>
                          </>
                        ) : null}

                        {block.type === "paragraph" ? (
                          <>
                            {toolbar(`p-${index}`, (value) => patchBlock(index, { text: value }))}
                            <textarea
                              ref={attachRef(`p-${index}`)}
                              rows={5}
                              value={block.text}
                              onChange={(e) => patchBlock(index, { text: e.target.value })}
                              placeholder="متن پاراگراف…"
                              className={`${FIELD_CLASS} resize-y`}
                            />
                          </>
                        ) : null}

                        {block.type === "list" ? (
                          <>
                            {toolbar(`l-${index}`, (value) =>
                              patchBlock(index, { items: value.split("\n") }),
                            )}
                            <label className="flex items-center gap-2 text-[12px] text-ink-2">
                              <input
                                type="checkbox"
                                checked={block.ordered}
                                onChange={(e) => patchBlock(index, { ordered: e.target.checked })}
                              />
                              فهرست شماره‌دار
                            </label>
                            <textarea
                              ref={attachRef(`l-${index}`)}
                              rows={5}
                              value={block.items.join("\n")}
                              onChange={(e) => patchBlock(index, { items: e.target.value.split("\n") })}
                              placeholder="هر مورد در یک سطر…"
                              className={`${FIELD_CLASS} resize-y`}
                            />
                          </>
                        ) : null}

                        {block.type === "quote" ? (
                          <>
                            {toolbar(`q-${index}`, (value) => patchBlock(index, { text: value }))}
                            <textarea
                              ref={attachRef(`q-${index}`)}
                              rows={4}
                              value={block.text}
                              onChange={(e) => patchBlock(index, { text: e.target.value })}
                              placeholder="متن نقل‌قول…"
                              className={`${FIELD_CLASS} resize-y`}
                            />
                            <input
                              value={block.cite ?? ""}
                              onChange={(e) => patchBlock(index, { cite: e.target.value })}
                              placeholder="منبع نقل‌قول (اختیاری)"
                              className={FIELD_CLASS}
                            />
                          </>
                        ) : null}

                        {block.type === "code" ? (
                          <>
                            <input
                              value={block.lang ?? ""}
                              onChange={(e) => patchBlock(index, { lang: e.target.value })}
                              placeholder="زبان کد، مثلاً js"
                              className={`${FIELD_CLASS} num`}
                              dir="ltr"
                            />
                            <textarea
                              ref={attachRef(`c-${index}`)}
                              rows={7}
                              value={block.code}
                              onChange={(e) => patchBlock(index, { code: e.target.value })}
                              placeholder="// code"
                              dir="ltr"
                              className={`${FIELD_CLASS} num resize-y text-left`}
                            />
                          </>
                        ) : null}

                        {block.type === "image" ? (
                          <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                              {block.fileId ? (
                                <img
                                  src={`/api/files/${block.fileId}`}
                                  alt=""
                                  className="h-24 w-32 border border-rule object-cover"
                                />
                              ) : null}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) void handleUpload(index, file, "image");
                                }}
                                className="text-[12px]"
                              />
                              {busy === index ? (
                                <span className="num text-[11px] text-ink-soft">در حال بارگذاری…</span>
                              ) : null}
                            </div>
                            <input
                              value={block.alt}
                              onChange={(e) => patchBlock(index, { alt: e.target.value })}
                              placeholder="متن جایگزین تصویر (برای دسترس‌پذیری)"
                              className={FIELD_CLASS}
                            />
                            <input
                              value={block.caption ?? ""}
                              onChange={(e) => patchBlock(index, { caption: e.target.value })}
                              placeholder="توضیح زیر تصویر (اختیاری)"
                              className={FIELD_CLASS}
                            />
                          </div>
                        ) : null}

                        {block.type === "file" ? (
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void handleUpload(index, file, "file");
                              }}
                              className="text-[12px]"
                            />
                            <input
                              value={block.label}
                              onChange={(e) => patchBlock(index, { label: e.target.value })}
                              placeholder="عنوان پیوست"
                              className={`${FIELD_CLASS} max-w-sm`}
                            />
                            {busy === index ? (
                              <span className="num text-[11px] text-ink-soft">در حال بارگذاری…</span>
                            ) : null}
                          </div>
                        ) : null}

                        {block.type === "table" ? (
                          <div className="space-y-3">
                            <input
                              value={block.caption ?? ""}
                              onChange={(e) => patchBlock(index, { caption: e.target.value })}
                              placeholder="عنوان جدول (اختیاری)"
                              className={FIELD_CLASS}
                            />
                            {toolbar(`t-${index}`, (value) => {
                              const parsed = textToTable(value);
                              patchBlock(index, { header: parsed.header, rows: parsed.rows });
                            })}
                            <textarea
                              ref={attachRef(`t-${index}`)}
                              rows={7}
                              value={tableToText(block.header, block.rows)}
                              onChange={(e) => {
                                const parsed = textToTable(e.target.value);
                                patchBlock(index, { header: parsed.header, rows: parsed.rows });
                              }}
                              placeholder={"ستون ۱ | ستون ۲ | ستون ۳\nمقدار ۱ | مقدار ۲ | مقدار ۳"}
                              className={`${FIELD_CLASS} resize-y`}
                            />
                            <p className="text-[11px] leading-7 text-ink-soft">
                              هر سطر یک ردیف جدول است و ستون‌ها با <span className="num">|</span>{" "}
                              از هم جدا می‌شوند. سطر نخست، سرستون است.
                            </p>
                          </div>
                        ) : null}

                        {block.type === "references" ? (
                          <textarea
                            rows={5}
                            value={block.items.join("\n")}
                            onChange={(e) => patchBlock(index, { items: e.target.value.split("\n") })}
                            placeholder="هر منبع در یک سطر…"
                            className={`${FIELD_CLASS} resize-y`}
                          />
                        ) : null}

                        {block.type === "embed" ? (
                          <>
                            <input
                              value={block.url}
                              onChange={(e) => patchBlock(index, { url: e.target.value })}
                              placeholder="https://…"
                              dir="ltr"
                              className={`${FIELD_CLASS} num text-left`}
                            />
                            <input
                              value={block.label ?? ""}
                              onChange={(e) => patchBlock(index, { label: e.target.value })}
                              placeholder="توضیح پیوند یا ویدیو"
                              className={FIELD_CLASS}
                            />
                            <p className="text-[11px] leading-7 text-ink-soft">
                              پیوند YouTube و Aparat به‌صورت جاسازی‌شده نمایش داده می‌شود؛
                              پیوندهای دیگر به‌صورت کارت پیوند نمایش داده می‌شوند.
                            </p>
                          </>
                        ) : null}
                      </div>
                    </section>
                  ))}
                </div>

                <div className="mt-8 border border-dashed border-rule px-5 py-6">
                  <p className="text-[13px] font-bold text-ink-2">افزودن بلوک</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(BLOCK_LABELS).map(([kind, label]) => (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => addBlock(kind as Block["type"])}
                        className="border border-rule bg-paper-2 px-3.5 py-2 text-[12.5px] text-ink-2 hover:border-ink hover:bg-paper-3"
                      >
                        + {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── meta rail ─────────────────────── */}
              <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
                <div className="border border-rule bg-paper-2">
                  <p className="border-b border-rule px-5 py-3.5 text-[13px] font-bold text-ink-2">
                    اطلاعات مطلب
                  </p>
                  <div className="space-y-4 px-5 py-5">
                    <div>
                      <label htmlFor="f-title" className="mb-1.5 block text-[12px] text-ink-soft">
                        عنوان *
                      </label>
                      <input
                        id="f-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={FIELD_CLASS}
                      />
                    </div>
                    <div>
                      <label htmlFor="f-slug" className="mb-1.5 block text-[12px] text-ink-soft">
                        نشانی (اسلاگ)
                      </label>
                      <input
                        id="f-slug"
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        placeholder="خودکار از عنوان ساخته می‌شود"
                        dir="ltr"
                        className={`${FIELD_CLASS} text-left`}
                      />
                    </div>
                    <div>
                      <label htmlFor="f-type" className="mb-1.5 block text-[12px] text-ink-soft">
                        بخش
                      </label>
                      <select
                        id="f-type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className={FIELD_CLASS}
                      >
                        {TYPE_OPTIONS.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="f-course" className="mb-1.5 block text-[12px] text-ink-soft">
                        درس / مقطع
                      </label>
                      <input
                        id="f-course"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        className={FIELD_CLASS}
                      />
                    </div>
                    <div>
                      <label htmlFor="f-summary" className="mb-1.5 block text-[12px] text-ink-soft">
                        خلاصه
                      </label>
                      <textarea
                        id="f-summary"
                        rows={4}
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className={`${FIELD_CLASS} resize-y`}
                      />
                    </div>
                    <div>
                      <label htmlFor="f-tags" className="mb-1.5 block text-[12px] text-ink-soft">
                        برچسب‌ها (جداشده با ویرگول)
                      </label>
                      <input
                        id="f-tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="پژوهش، روش تحقیق"
                        className={FIELD_CLASS}
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-rule bg-paper-2">
                  <p className="border-b border-rule px-5 py-3.5 text-[13px] font-bold text-ink-2">
                    تصویر شاخص
                  </p>
                  <div className="space-y-3 px-5 py-5">
                    {coverFileId ? (
                      <img
                        src={`/api/files/${coverFileId}`}
                        alt=""
                        className="w-full border border-rule object-cover"
                      />
                    ) : null}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleCover(file);
                      }}
                      className="text-[12px]"
                    />
                    {coverFileId ? (
                      <button
                        type="button"
                        onClick={() => setCoverFileId(null)}
                        className="border border-rule px-3 py-1.5 text-[12px] text-accent hover:border-accent"
                      >
                        حذف تصویر شاخص
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="border border-rule bg-paper-2 px-5 py-5">
                  <p className="text-[13px] font-bold text-ink-2">وضعیت انتشار</p>
                  <p className="mt-2 text-[12px] leading-8 text-ink-soft">
                    {status === "published"
                      ? "این مطلب در وب‌سایت عمومی نمایش داده می‌شود."
                      : "این مطلب پیش‌نویس است و برای بازدیدکنندگان دیده نمی‌شود."}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void save("draft")}
                      disabled={busy === "save"}
                      className="flex-1 border border-rule px-3 py-2.5 text-[12.5px] hover:border-ink disabled:opacity-50"
                    >
                      ذخیره به‌عنوان پیش‌نویس
                    </button>
                    <button
                      type="button"
                      onClick={() => void save("published")}
                      disabled={busy === "save"}
                      className="flex-1 border border-ink bg-ink px-3 py-2.5 text-[12.5px] font-bold text-paper-2 hover:bg-ink-2 disabled:opacity-50"
                    >
                      انتشار
                    </button>
                  </div>

                  {initial?.id ? (
                    <button
                      type="button"
                      onClick={() => void remove()}
                      disabled={busy === "delete"}
                      className="mt-3 w-full border border-accent/50 px-3 py-2.5 text-[12.5px] font-bold text-accent hover:bg-accent hover:text-paper-2 disabled:opacity-50"
                    >
                      {busy === "delete" ? "در حال حذف…" : "حذف این مطلب"}
                    </button>
                  ) : null}
                </div>

                <div className="border border-rule px-5 py-5">
                  <p className="text-[12px] font-bold text-ink-2">راهنمای نشانه‌گذاری</p>
                  <ul className="mt-3 space-y-2 text-[11.5px] leading-7 text-ink-soft">
                    <li>
                      <span className="num">**متن**</span> → متن پررنگ
                    </li>
                    <li>
                      <span className="num">*متن*</span> → متن کج
                    </li>
                    <li>
                      <span className="num">`کد`</span> → کد درون‌خطی
                    </li>
                    <li>
                      <span className="num">[متن](https://…)</span> → پیوند
                    </li>
                    <li>
                      <span className="num">{"{{ltr English}}"}</span> → متن انگلیسی درون جملهٔ فارسی
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
