import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin, ownerName } from "@/lib/auth";

import { Seal } from "@/components/Brand";
import { loginAndRedirect } from "../actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (await isAdmin()) redirect("/admin");

  const params = await searchParams;
  const failed = params.error === "1";

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5 py-16">
      <div
        aria-hidden="true"
        className="grain pointer-events-none absolute inset-0"
        style={{ backgroundImage: "url(/images/paper.jpg)" }}
      />
      <div className="relative w-full max-w-md border border-ink/20 bg-paper-2 shadow-[0_24px_70px_rgba(22,35,63,0.14)]">
        <div className="border-b border-rule bg-ink px-8 py-7 text-paper-2">
          <Seal className="h-11 w-11 text-paper-2/90" />
          <h1 className="mt-4 text-[22px] font-black">ورود مدیر بایگانی</h1>
          <p className="mt-1.5 text-[12px] text-paper-2/70">
            {ownerName()} — ناحیهٔ خصوصی نگارش و انتشار مطالب
          </p>
        </div>

        <form action={loginAndRedirect} className="space-y-5 px-8 py-8">
          <div>
            <label htmlFor="password" className="mb-2 block text-[13px] font-bold text-ink-2">
              رمز عبور
            </label>
            <div className="flex gap-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="flex-1 border border-rule bg-white px-4 py-3 text-[15px] focus:border-ink focus:outline-none"
              />
              <button
                type="button"
                onClick={(e) => { const pw = document.getElementById('password') as HTMLInputElement; if (pw) pw.type = pw.type === 'password' ? 'text' : 'password'; e.preventDefault(); }}
                className="border border-rule px-3 py-2 text-[14px] text-ink-2 hover:border-ink"
                aria-label="نمایش رمز"
                title="نمایش رمز"
              >
                👁
              </button>
            </div>
          </div>

          {failed ? (
            <p
              role="alert"
              className="border-e-4 border-accent bg-accent/10 px-3.5 py-2.5 text-[13px] text-accent-2"
            >
              رمز عبور درست نیست. دوباره تلاش کنید.
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full border border-ink bg-ink px-4 py-3 text-[15px] font-bold text-paper-2 transition-colors hover:bg-ink-2"
          >
            ورود
          </button>

          <p className="text-[12px] leading-8 text-ink-soft">
            بازدیدکنندگان و استاد راهنما برای خواندن مطالب به حساب کاربری نیاز ندارند؛ این
            صفحه فقط برای نگارش و انتشار مطالب است.
          </p>
        </form>

        <div className="border-t border-rule px-8 py-5 text-center">
          <Link href="/" className="text-[13px] text-ink-soft hover:text-ink">
            ← بازگشت به وب‌سایت
          </Link>
        </div>
      </div>
    </main>
  );
}
