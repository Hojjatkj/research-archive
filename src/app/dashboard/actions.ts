"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { items, type NewItem } from "@/db/schema";
import { readSessionUser } from "@/lib/auth";
import { blocksToPlain, type Block } from "@/lib/blocks";
export type ActionResult = { ok: boolean; error?: string };

export type ItemInput = {
  id?: number;
  title: string;
  slug: string;
  type: string;
  course: string;
  summary: string;
  tags: string[];
  status: "draft" | "published";
  content: Block[];
  coverFileId: number | null;
};

export type SaveResult =
  | { ok: true; id: number; slug: string; status: string }
  | { ok: false; error: string };

const ALLOWED_TYPES = ["assignment", "research", "presentation", "notes"];
const ADMIN_REQUIRED = "برای این کار باید با حساب مدیر وارد شوید.";

/** PostgreSQL error code — drizzle may expose the driver error through `cause`. */
function pgCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const value = err as { code?: unknown; cause?: { code?: unknown } };
  if (typeof value.code === "string") return value.code;
  if (value.cause && typeof value.cause.code === "string") return value.cause.code;
  return undefined;
}

function makeSlug(title: string, fallback: string): string {
  const base = title
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70)
    .toLowerCase();
  return base || fallback;
}

/** A slug nobody else uses — duplicate titles get «-2», «-3», … instead of failing. */
async function uniqueSlug(base: string, exceptId?: number): Promise<string> {
  const match = or(eq(items.slug, base), sql`${items.slug} LIKE ${`${base}-%`}`);
  const rows = await db
    .select({ slug: items.slug })
    .from(items)
    .where(exceptId ? and(match, ne(items.id, exceptId)) : match);
  const taken = new Set(rows.map((row) => row.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

async function isAdmin(): Promise<boolean> {
  return (await readSessionUser())?.isAdmin === true;
}

/* ── Archive content: every write is restricted to the one admin session. ── */

export async function saveItemAction(input: ItemInput): Promise<SaveResult> {
  if (!(await isAdmin())) return { ok: false, error: ADMIN_REQUIRED };

  const title = typeof input?.title === "string" ? input.title.trim() : "";
  if (title.length < 3) return { ok: false, error: "عنوان مطلب باید دست‌کم ۳ نویسه باشد." };
  if (title.length > 200) return { ok: false, error: "عنوان مطلب حداکثر ۲۰۰ نویسه است." };
  if (!ALLOWED_TYPES.includes(input.type)) {
    return { ok: false, error: "بخش مطلب (تکلیف، پژوهش، ارائه یا جزوه) را انتخاب کنید." };
  }

  const blocks = (Array.isArray(input.content) ? input.content : []).filter(
    (block) => block && typeof block === "object" && "type" in block,
  ) as Block[];
  const hasContent = blocks.some((block) => {
    if (block.type === "paragraph" || block.type === "heading" || block.type === "quote") {
      return block.text.trim().length > 0;
    }
    if (block.type === "code") return block.code.trim().length > 0;
    return true;
  });
  if (!hasContent) return { ok: false, error: "مطلب حداقل به یک بلوک متنی نیاز دارد." };

  const tags = (Array.isArray(input.tags) ? input.tags : [])
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
  const publish = input.status === "published";
  const now = new Date();
  const fields = {
    title,
    type: input.type,
    course: typeof input.course === "string" ? input.course.trim().slice(0, 200) : "",
    summary: typeof input.summary === "string" ? input.summary.trim().slice(0, 1000) : "",
    content: blocks,
    plain: blocksToPlain(blocks),
    tags,
    status: publish ? "published" : "draft",
    coverFileId: Number.isInteger(input.coverFileId) && Number(input.coverFileId) > 0 ? input.coverFileId : null,
    updatedAt: now,
  };

  try {
    if (Number.isInteger(input.id) && Number(input.id) > 0) {
      const [current] = await db
        .select({ id: items.id, slug: items.slug, publishedAt: items.publishedAt })
        .from(items)
        .where(eq(items.id, Number(input.id)))
        .limit(1);
      if (!current) return { ok: false, error: "این مطلب پیدا نشد؛ ممکن است حذف شده باشد." };

      const wanted = typeof input.slug === "string" ? input.slug.trim() : "";
      const slug =
        !wanted || wanted === current.slug
          ? current.slug
          : await uniqueSlug(makeSlug(wanted, current.slug), current.id);

      const [updated] = await db
        .update(items)
        .set({ ...fields, slug, publishedAt: publish ? (current.publishedAt ?? now) : null })
        .where(eq(items.id, current.id))
        .returning({ id: items.id, slug: items.slug, status: items.status });
      revalidatePath("/", "layout");
      return { ok: true, ...updated };
    }

    const values: NewItem = {
      ...fields,
      userId: null,
      slug: await uniqueSlug(makeSlug((input.slug ?? "").trim() || title, `m-${Date.now()}`)),
      publishedAt: publish ? now : null,
    };
    const [inserted] = await db
      .insert(items)
      .values(values)
      .returning({ id: items.id, slug: items.slug, status: items.status });
    revalidatePath("/", "layout");
    return { ok: true, ...inserted };
  } catch (err) {
    const code = pgCode(err);
    if (code === "23505") {
      return { ok: false, error: "نشانی این مطلب تکراری است؛ نشانی دیگری بنویسید یا آن را خالی بگذارید." };
    }
    if (code === "23503") {
      return { ok: false, error: "تصویر یا فایل انتخاب‌شده پیدا نشد؛ آن را دوباره بارگذاری کنید." };
    }
    return { ok: false, error: "ذخیرهٔ مطلب انجام نشد. اتصال را بررسی کنید و دوباره تلاش کنید." };
  }
}

export async function setPublishAction(id: number, publish: boolean): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, error: ADMIN_REQUIRED };
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "شناسهٔ مطلب نامعتبر است." };

  try {
    const [current] = await db
      .select({ publishedAt: items.publishedAt })
      .from(items)
      .where(eq(items.id, id))
      .limit(1);
    if (!current) return { ok: false, error: "این مطلب پیدا نشد." };
    await db
      .update(items)
      .set({
        status: publish ? "published" : "draft",
        publishedAt: publish ? (current.publishedAt ?? new Date()) : null,
        updatedAt: new Date(),
      })
      .where(eq(items.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "تغییر وضعیت انجام نشد؛ دوباره تلاش کنید." };
  }
}

export async function deleteItemAction(id: number): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, error: ADMIN_REQUIRED };
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "شناسهٔ مطلب نامعتبر است." };

  try {
    const deleted = await db.delete(items).where(eq(items.id, id)).returning({ id: items.id });
    if (!deleted.length) return { ok: false, error: "این مطلب پیدا نشد؛ ممکن است قبلاً حذف شده باشد." };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "حذف انجام نشد؛ دوباره تلاش کنید." };
  }
}

export async function moderateItemAction(id: number, hide: boolean, note: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, error: ADMIN_REQUIRED };
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "شناسهٔ مطلب نامعتبر است." };

  try {
    const updated = await db
      .update(items)
      .set({ hiddenByAdmin: hide, moderationNote: hide ? (note ?? "").trim().slice(0, 300) : "" })
      .where(eq(items.id, id))
      .returning({ id: items.id });
    if (!updated.length) return { ok: false, error: "این مطلب پیدا نشد." };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "تغییر وضعیت انجام نشد؛ دوباره تلاش کنید." };
  }
}
