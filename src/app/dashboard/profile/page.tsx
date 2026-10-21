import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { CopyLink } from "@/components/CopyLink";
import { ProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "اطلاعات دانشجو | میز کار" };

export default async function ProfilePage() {
  const user = await requireUser("/dashboard/profile");
  const [profile] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!profile) redirect("/login");

  const initial: Record<string, string> = {
    fullName: profile.fullName,
    studentNumber: profile.studentNumber,
    university: profile.university,
    className: profile.className,
    professorName: profile.professorName,
    classTime: profile.classTime,
    bio: profile.bio,
  };

  return (
    <DashboardShell user={user} active="profile">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <h1 className="text-[clamp(1.6rem,3.4vw,2.1rem)] font-black text-ink">اطلاعات دانشجو</h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-8 text-ink-soft">
            این اطلاعات روی صفحهٔ عمومی شما و کنار هر مطلب نمایش داده می‌شود تا استاد راهنما شما را
            راحت پیدا کند.
          </p>
          <div className="mt-6">
            <ProfileForm initial={initial} email={profile.email} userId={user.id} />
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-8">
          <div className="border border-ink/20 bg-paper-2 px-5 py-5">
            <p className="text-[13px] font-bold text-ink-2">لینک صفحهٔ عمومی شما</p>
            <div className="mt-3">
              <CopyLink path={`/students/${user.id}`} />
            </div>
          </div>
          <div className="border border-rule px-5 py-5">
            <p className="text-[13px] font-bold text-ink-2">چه چیزی عمومی است؟</p>
            <ul className="mt-3 space-y-2 text-[12.5px] leading-7 text-ink-soft">
              <li>
                <strong className="text-ink-2">عمومی:</strong> نام، شماره دانشجویی، دانشگاه، کلاس، استاد،
                زمان کلاس و معرفی کوتاه.
              </li>
              <li>
                <strong className="text-ink-2">خصوصی:</strong> ایمیل، رمز عبور و پیش‌نویس‌ها.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
