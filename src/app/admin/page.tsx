import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { items, reviews } from "@/db/schema";
import { isAdmin, ownerName } from "@/lib/auth";
import { Grain } from "@/components/Grain";
import { logoutAction } from "./actions";
import { AdminTable, type AdminItemDTO } from "@/components/AdminTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const rows = await db.select().from(items).orderBy(desc(items.updatedAt));
  const reviewRows = await db
    .select({ itemId: reviews.itemId, n: sql<number>`count(*)` })
    .from(reviews)
    .groupBy(reviews.itemId);
  const reviewCount = new Map(reviewRows.map((r) => [r.itemId, Number(r.n)]));

  const published = rows.filter((r) => r.status === "published").length;
  const drafts = rows.length - published;
  const reviewedItems = rows.filter((r) => (reviewCount.get(r.id) ?? 0) > 0).length;

  const dto: AdminItemDTO[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    type: r.type,
    course: r.course,
    status: r.status === "published" ? "published" : "draft",
    updatedAt: r.updatedAt.toISOString(),
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    reviews: reviewCount.get(r.id) ?? 0,
  }));

  return (
    <div className="relative min-h-screen">
      <Grain />

      <div className="relative z-10">
        <header className="no-print border-b border-ink/25 bg-ink text-paper-2">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-4 px-5 py-4 lg:px-8">
            <div>
              <p className="num text-[10px] text-paper-2/55">ADMIN AREA</p>
              <h1 className="mt-1 text-[19px] font-black">ناحیهٔ مدیریت بایگانی</h1>
              <p className="mt-0.5 text-[12px] text-paper-2/70">{ownerName()}</p>
            </div>

            <div className="ms-auto flex flex-wrap items-center gap-2.5">
              <Link
                href="/admin/edit"
                className="border border-accent bg-accent px-4 py-2 text-[13px] font-bold text-paper-2 hover:bg-accent-2"
              >
                + مطلب جدید
              </Link>
              <Link
                href="/admin/profile"
                className="border border-paper-2/30 px-4 py-2 text-[13px] text-paper-2 hover:border-paper-2"
              >
                ویرایش پروفایل
              </Link>
              <Link
                href="/"
                className="border border-paper-2/30 px-4 py-2 text-[13px] text-paper-2 hover:border-paper-2"
              >
                مشاهدهٔ وب‌سایت
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="border border-paper-2/20 px-4 py-2 text-[13px] text-paper-2/75 hover:border-paper-2/50"
                >
                  خروج
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1180px] px-5 py-10 lg:px-8">
          <div className="grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["همهٔ مطالب", rows.length],
              ["منتشرشده", published],
              ["پیش‌نویس", drafts],
              ["مطالب بازبینی‌شده", reviewedItems],
            ].map(([label, value]) => (
              <div key={String(label)} className="bg-paper-2 px-6 py-6">
                <p className="num text-[38px] font-semibold leading-none text-ink">
                  {String(value).padStart(2, "0")}
                </p>
                <p className="mt-3 text-[13px] font-bold text-ink-2">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-ink pb-4">
              <h2 className="text-[22px] font-black text-ink">فهرست مطالب</h2>
              <p className="text-[12px] text-ink-soft">
                پیش‌نویس‌ها در وب‌سایت عمومی نمایش داده نمی‌شوند
              </p>
            </div>

            <AdminTable items={dto} />
          </div>
        </div>
      </div>
    </div>
  );
}


