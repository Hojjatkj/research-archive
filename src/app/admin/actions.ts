"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { items, type NewItem } from "@/db/schema";
import { checkPassword, createSession, destroySession, isAdmin } from "@/lib/auth";
import { blocksToPlain, type Block } from "@/lib/blocks";

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

/** PostgreSQL unique-violation code — the real signal lives on `cause.code`. */
const UNIQUE_VIOLATION = "23505";

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: unknown; cause?: { code?: unknown; message?: unknown }; message?: unknown };
  if (e.code === UNIQUE_VIOLATION) return true;
  if (e.cause?.code === UNIQUE_VIOLATION) return true;
  const causeMsg = typeof e.cause?.message === "string" ? e.cause.message : "";
  const msg = typeof e.message === "string" ? e.message : "";
  return (
    causeMsg.includes("duplicate key") ||
    causeMsg.includes("unique constraint") ||
    msg.includes("duplicate key") ||
    msg.includes("unique constraint")
  );
}

function isForeignKeyViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: unknown; cause?: { code?: unknown } };
  return e.code === "23503" || e.cause?.code === "23503";
}

function makeSlug(title: string, fallback: string): string {
  const base = title
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 70)
    .toLowerCase();
  return base || fallback;
}

/**
 * Guarantees a slug that is not already taken, so saving a title that
 * duplicates an existing one never fails — it simply gets a suffix.
 */
async function uniqueSlug(base: string): Promise<string> {
  const rows = await db
    .select({ slug: items.slug })
    .from(items)
    .where(sql`${items.slug} = ${base} OR ${items.slug} LIKE ${`${base}-%`}`);
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; i < 500; i += 1) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

export async function loginAction(password: string): Promise<{ ok: boolean; error?: string }> {
  if (!checkPassword(password)) {
    return { ok: false, error: "رمز عبور درست نیست." };
  }
  await createSession();
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

export async function loginAndRedirect(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");
  if (checkPassword(password)) {
    await createSession();
    redirect("/admin");
  }
  redirect("/admin/login?error=1");
}

export async function saveItemAction(input: ItemInput): Promise<SaveResult> {
  if (!(await isAdmin())) {
    return { ok: false, error: "نشست شما منقضی شده است؛ دوباره وارد شوید." };
  }

  const title = input.title?.trim() ?? "";
  if (title.length < 3) {
    return { ok: false, error: "عنوان مطلب باید دست‌کم ۳ نویسه باشد." };
  }
  if (!ALLOWED_TYPES.includes(input.type)) {
    return { ok: false, error: "نوع مطلب انتخاب نشده است." };
  }

  const blocks = (Array.isArray(input.content) ? input.content : []).filter(
    (block) => block && typeof block === "object" && "type" in block,
  ) as Block[];

  const hasContent = blocks.some((block) => {
    if (block.type === "paragraph" || block.type === "heading" || block.type === "quote")
      return block.text.trim().length > 0;
    if (block.type === "code") return block.code.trim().length > 0;
    return true;
  });

  if (!hasContent) {
    return { ok: false, error: "مطلب حداقل به یک بلوک متنی نیاز دارد." };
  }

  const tags = (input.tags ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);

  const now = new Date();
  const baseSlug = makeSlug(input.slug?.trim() || title, `m-${Date.now()}`);

  try {
    if (input.id) {
      const existing = await db.select({ id: items.id }).from(items).where(eq(items.id, input.id)).limit(1);
      if (!existing.length) return { ok: false, error: "مطلب یافت نشد." };

      // Keep the current slug unless the owner typed a different one, and make
      // sure the new one is free before touching the row.
      const current = await db
        .select({ slug: items.slug })
        .from(items)
        .where(eq(items.id, input.id))
        .limit(1);
      const wanted = input.slug?.trim();
      const slug =
        !wanted || wanted === current[0]?.slug
          ? (current[0]?.slug ?? baseSlug)
          : await uniqueSlug(makeSlug(wanted, baseSlug));

      const values: NewItem = {
        title,
        slug,
        type: input.type,
        course: input.course?.trim() ?? "",
        summary: input.summary?.trim() ?? "",
        content: blocks,
        plain: blocksToPlain(blocks),
        tags,
        status: input.status === "published" ? "published" : "draft",
        coverFileId: input.coverFileId ?? null,
        updatedAt: now,
        publishedAt: input.status === "published" ? now : null,
      };

      const updated = await db
        .update(items)
        .set(values)
        .where(eq(items.id, input.id))
        .returning({ id: items.id, slug: items.slug, status: items.status });
      revalidatePath("/", "layout");
      return { ok: true, ...updated[0] };
    }

    const values: NewItem = {
      title,
      slug: await uniqueSlug(baseSlug),
      type: input.type,
      course: input.course?.trim() ?? "",
      summary: input.summary?.trim() ?? "",
      content: blocks,
      plain: blocksToPlain(blocks),
      tags,
      status: input.status === "published" ? "published" : "draft",
      coverFileId: input.coverFileId ?? null,
      updatedAt: now,
      publishedAt: input.status === "published" ? now : null,
    };

    const inserted = await db.insert(items).values(values).returning({
      id: items.id,
      slug: items.slug,
      status: items.status,
    });
    revalidatePath("/", "layout");
    return { ok: true, ...inserted[0] };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return {
        ok: false,
        error: "عنوان یا نشانی این مطلب با یک مطلب دیگر تکراری است. لطفاً عنوان دیگری امتحان کنید.",
      };
    }
    if (isForeignKeyViolation(err)) {
      return { ok: false, error: "فایل پیوست انتخاب‌شده پیدا نشد. دوباره بارگذاری کنید." };
    }
    return { ok: false, error: "ذخیرهٔ مطلب ناموفق بود. لطفاً دوباره تلاش کنید." };
  }
}

export async function setPublishAction(
  id: number,
  publish: boolean,
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "دسترسی غیرمجاز." };
  try {
    const now = new Date();
    await db
      .update(items)
      .set({
        status: publish ? "published" : "draft",
        publishedAt: publish ? now : null,
        updatedAt: now,
      })
      .where(eq(items.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    if (isUniqueViolation(err)) {
      return { ok: false, error: "این نشانی قبلاً استفاده شده است." };
    }
    return { ok: false, error: "تغییر وضعیت انجام نشد. دوباره تلاش کنید." };
  }
}

export async function deleteItemAction(id: number): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "دسترسی غیرمجاز." };
  try {
    await db.delete(items).where(eq(items.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    if (isForeignKeyViolation(err)) {
      return { ok: false, error: "این مطلب به فایل‌هایی گره خورده است. ابتدا تصویر شاخص را حذف کنید." };
    }
    return { ok: false, error: "حذف انجام نشد. دوباره تلاش کنید." };
  }
}

