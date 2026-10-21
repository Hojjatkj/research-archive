"use server";

import { redirect } from "next/navigation";
import { adminAuthConfigured, createAdminSession, destroyAdminSession, safeNext, verifyAdminCredentials } from "@/lib/auth";
import { clearAdminLoginAttempts, consumeAdminLoginAttempt } from "@/lib/adminLoginRateLimit";
import { type FormState, hasErrors, normalizeEmail, validateLogin } from "@/lib/validation";

const BAD_CREDENTIALS = "ایمیل یا رمز عبور درست نیست. دوباره بررسی کنید.";
const DB_DOWN = "ورود انجام نشد؛ چند لحظه بعد دوباره تلاش کنید.";

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  const values = { email };

  const errors = validateLogin({ email, password });
  if (hasErrors(errors)) return { errors, values };
  if (password.length > 256) return { errors: {}, values, formError: BAD_CREDENTIALS };
  if (!adminAuthConfigured()) {
    return {
      errors: {},
      values,
      formError: "ورود مدیر هنوز پیکربندی نشده است. متغیرهای مدیر را در تنظیمات Vercel ثبت کنید.",
    };
  }

  try {
    if (!(await consumeAdminLoginAttempt())) {
      return { errors: {}, values, formError: "تعداد تلاش‌ها زیاد است؛ ۱۵ دقیقه بعد دوباره تلاش کنید." };
    }
    if (!verifyAdminCredentials(email, password)) {
      return { errors: {}, values, formError: BAD_CREDENTIALS };
    }

    await clearAdminLoginAttempts();
    await createAdminSession();
  } catch {
    return { errors: {}, values, formError: DB_DOWN };
  }

  // Next's redirect() throws intentionally, so keep it outside the try/catch.
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  await destroyAdminSession();
  redirect("/");
}
