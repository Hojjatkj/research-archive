"use server";

import { redirect } from "next/navigation";
import { and, count, eq, isNull, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { items, users } from "@/db/schema";
import { SAMPLE_SLUGS } from "@/lib/seed";
import {
  adminEmails,
  createSession,
  destroySession,
  hashPassword,
  isAdminEmail,
  safeNext,
  verifyPassword,
} from "@/lib/auth";
import {
  type FormState,
  hasErrors,
  normalizeEmail,
  readProfile,
  validateLogin,
  validateSignup,
} from "@/lib/validation";

const DB_DOWN = "ارتباط با پایگاه داده برقرار نشد. چند لحظه بعد دوباره تلاش کنید.";
const BAD_CREDENTIALS = "ایمیل یا رمز عبور درست نیست. دوباره بررسی کنید.";
const EMAIL_TAKEN = "با این ایمیل قبلاً حساب ساخته شده است. وارد شوید یا ایمیل دیگری بنویسید.";

/**
 * Posts written with the old single-owner admin panel have no author. The
 * first admin account takes them over so the owner can keep editing them;
 * built-in sample posts stay authorless. Best effort — never blocks sign-up.
 */
async function claimLegacyItems(userId: number): Promise<void> {
  try {
    await db
      .update(items)
      .set({ userId })
      .where(and(isNull(items.userId), notInArray(items.slug, SAMPLE_SLUGS)));
  } catch {
    // The account itself was created successfully; nothing to undo.
  }
}

/** PostgreSQL error code — drizzle wraps the driver error, so check `cause` too. */
function pgCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const e = err as { code?: unknown; cause?: { code?: unknown } };
  if (typeof e.code === "string") return e.code;
  if (e.cause && typeof e.cause.code === "string") return e.cause.code;
  return undefined;
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  const values = { email };

  const errors = validateLogin({ email, password });
  if (hasErrors(errors)) return { errors, values };

  let signedIn = false;
  try {
    const rows = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const user = rows[0];

    if (!user) {
      // Spend the same time as a real check so emails can't be probed.
      await hashPassword(password);
      return { errors: {}, values, formError: BAD_CREDENTIALS };
    }
    if (!(await verifyPassword(password, user.passwordHash))) {
      return { errors: {}, values, formError: BAD_CREDENTIALS };
    }

    await createSession(user.id);
    signedIn = true;
  } catch {
    return { errors: {}, values, formError: DB_DOWN };
  }

  // redirect() must run outside try/catch — it works by throwing.
  if (signedIn) redirect(next);
  return { errors: {}, values };
}

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = readProfile(formData);
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const values: Record<string, string> = { ...profile, email };

  const errors = validateSignup({ ...profile, email, password });
  if (hasErrors(errors)) {
    return { errors, values, formError: "لطفاً موارد مشخص‌شده را اصلاح کنید." };
  }

  let created = false;
  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length) return { errors: { email: EMAIL_TAKEN }, values };

    const [{ n }] = await db.select({ n: count() }).from(users);
    const role =
      isAdminEmail(email) || (adminEmails().length === 0 && Number(n) === 0) ? "admin" : "student";

    const inserted = await db
      .insert(users)
      .values({ ...profile, email, passwordHash: await hashPassword(password), role })
      .returning({ id: users.id });

    await createSession(inserted[0].id);
    if (role === "admin") await claimLegacyItems(inserted[0].id);
    created = true;
  } catch (err) {
    if (pgCode(err) === "23505") return { errors: { email: EMAIL_TAKEN }, values };
    return { errors: {}, values, formError: `ساخت حساب انجام نشد. ${DB_DOWN}` };
  }

  if (created) redirect("/dashboard?welcome=1");
  return { errors: {}, values };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
