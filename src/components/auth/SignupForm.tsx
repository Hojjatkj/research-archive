"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signupAction } from "@/app/(auth)/actions";
import {
  EMPTY_FORM_STATE,
  hasErrors,
  normalizeEmail,
  readProfile,
  validateSignup,
} from "@/lib/validation";
import { Field, FormAlert } from "./Field";
import { PasswordField } from "./PasswordField";
import { SubmitButton } from "./SubmitButton";
import { focusField, useFieldErrors } from "./useFieldErrors";

const PREVIEW_KEYS = ["fullName", "studentNumber", "university", "className", "professorName", "classTime"];

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, EMPTY_FORM_STATE);
  const { formRef, errors, clear, setClientErrors } = useFieldErrors(state);
  const [typed, setTyped] = useState<Record<string, string>>({});
  const v = state.values;
  const preview: Record<string, string> = { ...v, ...typed };

  const previewRows: [string, string, boolean][] = [
    ["شماره دانشجویی", preview.studentNumber ?? "", true],
    ["دانشگاه", preview.university ?? "", false],
    ["کلاس / درس", preview.className ?? "", false],
    ["استاد", preview.professorName ?? "", false],
    ["زمان کلاس", preview.classTime ?? "", false],
  ];

  return (
    <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <form
        ref={formRef}
        action={formAction}
        noValidate
        onChange={(event) => {
          const target: unknown = event.target;
          if (target instanceof HTMLInputElement && PREVIEW_KEYS.includes(target.name)) {
            const { name, value } = target;
            setTyped((prev) => ({ ...prev, [name]: value }));
          }
        }}
        onSubmit={(event) => {
          const data = new FormData(event.currentTarget);
          const found = validateSignup({
            ...readProfile(data),
            email: normalizeEmail(data.get("email")),
            password: String(data.get("password") ?? ""),
          });
          if (hasErrors(found)) {
            event.preventDefault();
            setClientErrors(found);
            focusField(event.currentTarget, Object.keys(found)[0]);
            return;
          }
          setClientErrors({});
        }}
        className="border border-ink/15 bg-paper-2 shadow-[0_18px_50px_rgba(22,35,63,0.08)]"
      >
        {state.formError ? (
          <div className="px-5 pt-6 sm:px-8">
            <FormAlert>{state.formError}</FormAlert>
          </div>
        ) : null}

        <section aria-labelledby="signup-student" className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex items-baseline gap-3">
            <span className="num text-[12px] text-accent">01</span>
            <h2 id="signup-student" className="text-[17px] font-black text-ink">
              مشخصات دانشجو
            </h2>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-7 text-ink-soft">
            این موارد روی صفحهٔ «اطلاعات دانشجو» برای استاد نمایش داده می‌شود.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field id="su-name" name="fullName" label="نام و نام خانوادگی" required autoComplete="name" placeholder="مثلاً: سارا محمدی" defaultValue={v.fullName} error={errors.fullName} onChange={() => clear("fullName")} maxLength={80} />
            </div>
            <Field id="su-number" name="studentNumber" label="شماره دانشجویی" required dir="ltr" inputMode="numeric" autoComplete="off" placeholder="40123456" defaultValue={v.studentNumber} error={errors.studentNumber} onChange={() => clear("studentNumber")} hint="رقم‌های فارسی هم پذیرفته می‌شود." maxLength={20} />
            <Field id="su-university" name="university" label="نام دانشگاه" required autoComplete="organization" placeholder="مثلاً: دانشگاه تهران" defaultValue={v.university} error={errors.university} onChange={() => clear("university")} maxLength={100} />
            <Field id="su-class" name="className" label="کلاس / درس" required placeholder="مثلاً: روش تحقیق" defaultValue={v.className} error={errors.className} onChange={() => clear("className")} maxLength={100} />
            <Field id="su-professor" name="professorName" label="نام استاد" required placeholder="مثلاً: دکتر رضا کریمی" defaultValue={v.professorName} error={errors.professorName} onChange={() => clear("professorName")} maxLength={80} />
            <div className="sm:col-span-2">
              <Field id="su-time" name="classTime" label="زمان کلاس" optional placeholder="مثلاً: شنبه‌ها ۱۰ تا ۱۲" defaultValue={v.classTime} error={errors.classTime} onChange={() => clear("classTime")} maxLength={60} />
            </div>
          </div>
        </section>

        <section aria-labelledby="signup-account" className="border-t border-rule px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex items-baseline gap-3">
            <span className="num text-[12px] text-accent">02</span>
            <h2 id="signup-account" className="text-[17px] font-black text-ink">
              اطلاعات ورود
            </h2>
          </div>
          <p className="mt-1.5 text-[12.5px] leading-7 text-ink-soft">
            ایمیل و رمز عبور خصوصی‌اند و هیچ‌جا نمایش داده نمی‌شوند.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field id="su-email" name="email" type="email" label="ایمیل" required dir="ltr" inputMode="email" autoComplete="email" placeholder="name@university.ac.ir" defaultValue={v.email} error={errors.email} onChange={() => clear("email")} />
            <PasswordField id="su-password" name="password" label="رمز عبور" required autoComplete="new-password" showStrength hint="حداقل ۸ نویسه؛ ترکیب حرف و رقم امن‌تر است." error={errors.password} onChange={() => clear("password")} />
          </div>
        </section>

        <div className="flex flex-col gap-4 border-t border-rule bg-paper px-5 py-6 sm:flex-row sm:items-center sm:px-8">
          <div className="sm:w-64">
            <SubmitButton pending={pending} pendingLabel="در حال ساخت حساب…" tone="accent">
              ساخت حساب و ورود
            </SubmitButton>
          </div>
          <p className="text-[13px] text-ink-soft">
            حساب دارید؟{" "}
            <Link href="/login" className="font-bold text-ink underline decoration-accent decoration-2 underline-offset-[0.4em]">
              وارد شوید
            </Link>
          </p>
        </div>
      </form>

      <aside className="lg:sticky lg:top-8" aria-label="پیش‌نمایش کارت اطلاعات دانشجو">
        <p className="text-[12px] font-bold text-ink-soft">پیش‌نمایش کارت «اطلاعات دانشجو»</p>
        <div className="mt-3 border border-ink/25 bg-paper-2">
          <div className="bg-ink px-6 py-5 text-paper-2">
            <p className="text-[11px] text-paper-2/65">اطلاعات دانشجو</p>
            <p className={`mt-1.5 text-[20px] font-black leading-[1.5] ${preview.fullName ? "" : "text-paper-2/45"}`}>
              {preview.fullName || "نام و نام خانوادگی"}
            </p>
          </div>
          <dl className="divide-y divide-rule text-[13px]">
            {previewRows.map(([label, value, ltr]) => (
              <div key={label} className="flex items-baseline justify-between gap-4 px-6 py-3">
                <dt className="text-ink-soft">{label}</dt>
                <dd dir={ltr ? "ltr" : undefined} className={`text-left font-bold ${value ? "text-ink-2" : "text-ink-soft/40"} ${ltr ? "num" : ""}`}>
                  {value || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="mt-3 text-[12px] leading-7 text-ink-soft">
          استاد راهنما شما را این‌طور در فهرست «اطلاعات دانشجو» و کنار هر مطلب می‌بیند. بعداً از
          میز کار هم قابل ویرایش است.
        </p>
      </aside>
    </div>
  );
}
