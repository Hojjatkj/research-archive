import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { adminAuthConfigured, getCurrentUser, safeNext } from "@/lib/auth";
import { LoginForm } from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "ورود مدیر | بایگانی پژوهش",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = safeNext(rawNext);
  if (await getCurrentUser()) redirect(next);

  const configured = adminAuthConfigured();

  return (
    <div className="mx-auto grid max-w-[1180px] items-start gap-12 px-5 py-12 lg:grid-cols-[minmax(0,28rem)_1fr] lg:gap-20 lg:px-8 lg:py-20">
      <section>
        <p className="text-[12px] font-bold text-accent">دسترسی خصوصی</p>
        <h1 className="mt-5 text-[clamp(1.9rem,4vw,2.5rem)] font-black leading-[1.35] text-ink">
          ورود مدیر سایت
        </h1>
        <p className="mt-3 text-[15px] leading-8 text-ink-soft">
          این ورود فقط برای مدیر است. برای خواندن مطالب و ثبت «من دیدم» نیازی به حساب کاربری نیست.
        </p>

        {!configured ? (
          <p className="mt-5 border-s-4 border-accent bg-accent/10 px-4 py-3 text-[13px] leading-7 text-accent-2">
            دسترسی مدیر هنوز در تنظیمات محیطی سایت کامل نشده است.
          </p>
        ) : null}

        {rawNext && next !== "/dashboard" ? (
          <p className="mt-4 border-s-4 border-ink/30 bg-paper-2 px-4 py-2.5 text-[13px] text-ink-2">
            برای ادامه، ابتدا با حساب مدیر وارد شوید.
          </p>
        ) : null}

        <div className="mt-7 border border-ink/15 bg-paper-2 px-5 py-6 shadow-[0_18px_50px_rgba(22,35,63,0.08)] sm:px-7 sm:py-8">
          <LoginForm next={next} />
        </div>

        <Link href="/" className="mt-6 inline-block text-[13px] font-bold text-ink underline decoration-accent decoration-2 underline-offset-4">
          بازگشت به وب‌سایت
        </Link>
      </section>

      <aside className="border border-ink/20 bg-ink px-7 py-9 text-paper-2 lg:mt-16 lg:px-10 lg:py-12">
        <p className="text-[12px] font-bold text-paper-2/65">برای بازدیدکنندگان</p>
        <h2 className="mt-4 text-[clamp(1.4rem,2.6vw,1.9rem)] font-black leading-[1.55]">
          آرشیو عمومی و فقط‌خواندنی است.
        </h2>
        <p className="mt-4 max-w-md text-[14px] leading-8 text-paper-2/75">
          همه می‌توانند مطالب منتشرشده را بخوانند. زیر هر مطلب یک دکمهٔ «من این مطلب را دیدم» هست؛
          هر مرورگر برای هر مطلب فقط یک‌بار می‌تواند آن را ثبت کند.
        </p>
        <Link
          href="/archive"
          className="mt-7 inline-block border border-paper-2/40 px-5 py-2.5 text-[14px] font-bold transition-colors hover:bg-paper-2 hover:text-ink"
        >
          دیدن آرشیو
        </Link>
      </aside>
    </div>
  );
}
