import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthSwitch } from "@/components/auth/AuthSwitch";
import { SignupForm } from "@/components/auth/SignupForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ثبت‌نام دانشجو | بایگانی پژوهش" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-[1180px] px-5 py-12 lg:px-8 lg:py-16">
      <AuthSwitch active="signup" />
      <h1 className="mt-8 text-[clamp(1.9rem,4vw,2.5rem)] font-black leading-[1.35] text-ink">
        ساخت حساب دانشجویی
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-8 text-ink-soft">
        با یک حساب، تکالیف، گزارش‌ها، ارائه‌ها و جزوه‌هایتان را منتشر می‌کنید. استاد راهنما با لینک
        صفحهٔ شما کارها را می‌بیند و «مشاهده شد» ثبت می‌کند. پر کردن فرم کمتر از یک دقیقه طول می‌کشد.
      </p>
      <SignupForm />
    </div>
  );
}
