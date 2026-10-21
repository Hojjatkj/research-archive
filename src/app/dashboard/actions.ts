"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { files, items, reviews, sessions, users, type NewItem } from "@/db/schema";
import { readSessionUser } from "@/lib/auth";
import { blocksToPlain, type Block } from "@/lib/blocks";
import { type FormState, hasErrors, readProfile, validateProfile } from "@/lib/validation";

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

export type ActionResult = { ok: boolean; error?: string };

const ALLOWED_TYPES = ["assignment", "research", "presentation", "notes"];
const SESSION_EXPIRED = "نشست شما به پایان رسیده است؛ لطفاً دوباره وارد شوید.";

/** PostgreSQL error code — drizzle wraps the driver error, so check `cause` too. */
function pgCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const e = err as { code?: unknown; cause?: { code?: unknown } };
  if (typeof e.code === "string") return e.code;
  if (e.cause && typeof e.cause.code === "string") return e.cause.code;
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

/* ── items: only the author can write; nobody else can delete ── */

export async function saveItemAction(input: ItemInput): Promise<SaveResult> {
  const user = await readSessionUser();
  if (!user) return { ok: false, error: SESSION_EXPIRED };

  const title = (input.title ?? "").trim();
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

  const tags = (input.tags ?? []).map((tag) => tag.trim()).filter(Boolean).slice(0, 12);
  const publish = input.status === "published";
  const now = new Date();
  const fields = {
    title,
    type: input.type,
    course: (input.course ?? "").trim(),
    summary: (input.summary ?? "").trim(),
    content: blocks,
    plain: blocksToPlain(blocks),
    tags,
    status: publish ? "published" : "draft",
    coverFileId: input.coverFileId ?? null,
    updatedAt: now,
  };

  try {
    if (input.id) {
      const [current] = await db
        .select({ id: items.id, slug: items.slug, userId: items.userId, publishedAt: items.publishedAt })
        .from(items)
        .where(eq(items.id, input.id))
        .limit(1);
      if (!current) return { ok: false, error: "این مطلب پیدا نشد؛ ممکن است حذف شده باشد." };
      if (current.userId !== user.id) {
        return { ok: false, error: "فقط نویسندهٔ مطلب می‌تواند آن را ویرایش کند." };
      }

      const wanted = (input.slug ?? "").trim();
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
      userId: user.id,
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
  const user = await readSessionUser();
  if (!user) return { ok: false, error: SESSION_EXPIRED };
  try {
    const [current] = await db
      .select({ userId: items.userId, publishedAt: items.publishedAt })
      .from(items)
      .where(eq(items.id, id))
      .limit(1);
    if (!current) return { ok: false, error: "این مطلب پیدا نشد." };
    if (current.userId !== user.id) {
      return { ok: false, error: "فقط نویسندهٔ مطلب می‌تواند وضعیت انتشار آن را تغییر دهد." };
    }
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
  const user = await readSessionUser();
  if (!user) return { ok: false, error: SESSION_EXPIRED };
  try {
    const [current] = await db
      .select({ userId: items.userId })
      .from(items)
      .where(eq(items.id, id))
      .limit(1);
    if (!current) return { ok: false, error: "این مطلب پیدا نشد؛ ممکن است قبلاً حذف شده باشد." };

    const isAuthor = current.userId === user.id;
    const isSampleCleanup = current.userId === null && user.isAdmin;
    if (!isAuthor && !isSampleCleanup) {
      return {
        ok: false,
        error: "مدیر سایت نمی‌تواند مطلب دانشجو را حذف کند؛ فقط می‌تواند آن را از انتشار خارج کند.",
      };
    }

    await db.delete(items).where(eq(items.id, id));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch {
    return { ok: false, error: "حذف انجام نشد؛ دوباره تلاش کنید." };
  }
}

/* ── class admin: take down / restore — never delete ─────────── */

export async function moderateItemAction(id: number, hide: boolean, note: string): Promise<ActionResult> {
  const user = await readSessionUser();
  if (!user) return { ok: false, error: SESSION_EXPIRED };
  if (!user.isAdmin) return { ok: false, error: "این کار فقط برای مدیر سایت مجاز است." };

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

/* ── profile («اطلاعات دانشجو») ───────────────────────────────── */

export async function saveProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = readProfile(formData);
  const values: Record<string, string> = { ...profile };
  const user = await readSessionUser();
  if (!user) return { errors: {}, values, formError: SESSION_EXPIRED };

  const errors = validateProfile(profile);
  if (hasErrors(errors)) return { errors, values, formError: "لطفاً موارد مشخص‌شده را اصلاح کنید." };

  try {
    await db
      .update(users)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(users.id, user.id));
    revalidatePath("/", "layout");
    return { ok: true, message: "اطلاعات دانشجو ذخیره شد.", errors: {}, values };
  } catch {
    return { errors: {}, values, formError: "ذخیره انجام نشد؛ ارتباط با پایگاه داده برقرار نشد." };
  }
}

/* ── owner: accounts ───────────────────────────────────────────
 * Deleting an account removes everything it owns (posts, their «مشاهده شد»
 * stamps, uploaded files and sessions) in one transaction. Leaving the posts
 * behind would orphan them — they would show up as sample content or be
 * attributed to someone else — so the confirmation UI states this explicitly.
 */

export type AccountFormState = { error?: string };

const OWNER_ONLY = "این کار فقط برای مدیر سایت مجاز است.";

async function purgeAccounts(ids: number[]): Promise<{ users: number; items: number }> {
  if (!ids.length) return { users: 0, items: 0 };
  return db.transaction(async (tx) => {
    const owned = tx.select({ id: items.id }).from(items).where(inArray(items.userId, ids));
    await tx.delete(reviews).where(inArray(reviews.itemId, owned));
    const removedItems = await tx
      .delete(items)
      .where(inArray(items.userId, ids))
      .returning({ id: items.id });
    await tx
      .delete(files)
      .where(
        and(
          inArray(files.userId, ids),
          sql`NOT EXISTS (SELECT 1 FROM ${items} WHERE ${items.coverFileId} = ${files.id})`,
        ),
      );
    await tx.delete(sessions).where(inArray(sessions.userId, ids));
    const removedUsers = await tx
      .delete(users)
      .where(inArray(users.id, ids))
      .returning({ id: users.id });
    return { users: removedUsers.length, items: removedItems.length };
  });
}

export async function deleteAccountAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const admin = await readSessionUser();
  if (!admin) return { error: SESSION_EXPIRED };
  if (!admin.isAdmin) return { error: OWNER_ONLY };

  const id = Number(formData.get("userId"));
  if (!Number.isInteger(id) || id <= 0) return { error: "حساب انتخاب‌شده نامعتبر است." };
  if (id === admin.id) return { error: "حساب خودتان را نمی‌توانید حذف کنید." };

  let removed = { users: 0, items: 0 };
  try {
    const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    if (!target) return { error: "این حساب پیدا نشد؛ ممکن است قبلاً حذف شده باشد." };
    removed = await purgeAccounts([id]);
  } catch {
    return { error: "حذف حساب انجام نشد؛ دوباره تلاش کنید." };
  }

  revalidatePath("/", "layout");
  redirect(`/dashboard/accounts?removed=${removed.users}&items=${removed.items}`);
}

export async function deleteOtherAccountsAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const admin = await readSessionUser();
  if (!admin) return { error: SESSION_EXPIRED };
  if (!admin.isAdmin) return { error: OWNER_ONLY };

  const typed = String(formData.get("confirm") ?? "")
    .normalize("NFKC")
    .replace(/[\s\u200c\u200f\u200e]+/g, "");
  if (typed !== "حذف") {
    return { error: "برای تأیید، کلمهٔ «حذف» را دقیقاً در کادر بنویسید." };
  }

  let removed = { users: 0, items: 0 };
  try {
    const others = await db.select({ id: users.id }).from(users).where(ne(users.id, admin.id));
    if (!others.length) return { error: "حساب دیگری برای حذف وجود ندارد." };
    removed = await purgeAccounts(others.map((row) => row.id));
  } catch {
    return { error: "حذف حساب‌ها انجام نشد؛ دوباره تلاش کنید." };
  }

  revalidatePath("/", "layout");
  redirect(`/dashboard/accounts?removed=${removed.users}&items=${removed.items}`);
}
