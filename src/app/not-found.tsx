import Link from "next/link";
import { EmptySheet } from "@/components/Brand";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <EmptySheet className="h-20 w-20 text-ink/30" />
      <p className="num mt-8 text-[12px] text-ink-soft">ERROR 404</p>
      <h1 className="mt-4 text-[clamp(2rem,6vw,3rem)] font-black text-ink">
        این صفحه در بایگانی نیست
      </h1>
      <p className="mt-5 text-[15px] leading-9 text-ink-soft">
        ممکن است مطلب منتشر نشده باشد یا نشانی را اشتباه وارد کرده باشید. از فهرست بخش‌ها
        می‌توانید به مطالب دسترسی داشته باشید.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="border border-ink bg-ink px-5 py-2.5 text-[14px] font-bold text-paper-2 hover:bg-ink-2"
        >
          بازگشت به خانه
        </Link>
        <Link
          href="/search"
          className="border border-rule px-5 py-2.5 text-[14px] text-ink hover:border-ink"
        >
          جست‌وجو در بایگانی
        </Link>
      </div>
    </main>
  );
}
