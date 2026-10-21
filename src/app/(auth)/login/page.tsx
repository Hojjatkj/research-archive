import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { AuthSwitch } from "@/components/auth/AuthSwitch";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ورود | بایگانی پژوهش" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = safeNext(rawNext);
  if (await getCurrentUser()) redirect(next);

  return (
    <div className="mx-auto grid max-w-[1180px] items-start gap-12 px-5 py-12 lg:grid-cols-[minmax(0,28rem)_1fr] lg:gap-20 lg:px-8 lg:py-20">
      <section>
        <AuthSwitch active="login" />
        <h1 className="mt-8 text-[clamp(1.9rem,4vw,2.5rem)] font-black leading-[1.35] text-ink">
          ورود به میز کار
        </h1>
        <p className="mt-3 text-[15px] leading-8 text-ink-soft">
          با ایمیل و رمز عبوری که هنگام ثبت‌نام انتخاب کرده‌اید وارد شوید.
        </p>

        {rawNext && next !== "/dashboard" ? (
          <p className="mt-4 border-s-4 border-ink/30 bg-paper-2 px-4 py-2.5 text-[13px] text-ink-2">
            برای ادامه، ابتدا وارد حساب خود شوید.
          </p>
        ) : null}

        <div className="mt-7 border border-ink/15 bg-paper-2 px-5 py-6 shadow-[0_18px_50px_rgba(22,35,63,0.08)] sm:px-7 sm:py-8">
          <LoginForm next={next} />
        </div>

        <p className="mt-6 text-[14px] text-ink-soft">
          هنوز حساب ندارید؟{" "}
          <Link href="/signup" className="font-bold text-ink underline decoration-accent decoration-2 underline-offset-[0.4em]">
            ساخت حساب دانشجویی
          </Link>
        </p>
      </section>

      <aside className="border border-ink/20 bg-ink px-7 py-9 text-paper-2 lg:mt-16 lg:px-10 lg:py-12">
        <p className="text-[12px] font-bold text-paper-2/65">استاد راهنما هستید؟</p>
        <h2 className="mt-4 text-[clamp(1.4rem,2.6vw,1.9rem)] font-black leading-[1.55]">
          برای دیدن کارها نیازی به ورود نیست.
        </h2>
        <p className="mt-4 max-w-md text-[14px] leading-8 text-paper-2/75">
          فهرست دانشجویان و مطالب منتشرشدهٔ هر نفر در بخش «اطلاعات دانشجو» است. کنار هر مطلب دکمهٔ
          «ثبت مشاهده شد» قرار دارد و دانشجو می‌بیند کار دیده شده است.
        </p>
        <Link
          href="/students"
          className="mt-7 inline-block border border-paper-2/40 px-5 py-2.5 text-[14px] font-bold transition-colors hover:bg-paper-2 hover:text-ink"
        >
          رفتن به اطلاعات دانشجو
        </Link>
      </aside>
    </div>
  );
}
