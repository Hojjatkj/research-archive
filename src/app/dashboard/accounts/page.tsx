import type { Metadata } from "next";
import { asc, count, sql } from "drizzle-orm";
import { db } from "@/db";
import { items, users } from "@/db/schema";
import { isAdminEmail, requireAdmin } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { AccountsManager, type AccountDTO } from "@/components/AccountsManager";
import { FormAlert } from "@/components/auth/Field";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "حساب‌ها | مدیریت سایت" };

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function positiveInt(value: string): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireAdmin("/dashboard/accounts");
  const params = await searchParams;
  const removedUsers = positiveInt(first(params.removed));
  const removedItems = positiveInt(first(params.items));
  const doneMessage =
    removedUsers > 0
      ? `${removedUsers} حساب${removedItems > 0 ? ` و ${removedItems} مطلب` : ""} حذف شد.`
      : "";

  const [rows, stats] = await Promise.all([
    db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        studentNumber: users.studentNumber,
        university: users.university,
        className: users.className,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.createdAt), asc(users.id)),
    db
      .select({
        userId: items.userId,
        total: count(),
        published: sql<number>`count(*) filter (where ${items.status} = 'published')`,
      })
      .from(items)
      .groupBy(items.userId),
  ]);

  const statsByUser = new Map(stats.map((row) => [row.userId, row]));
  const accounts: AccountDTO[] = rows.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    studentNumber: row.studentNumber,
    university: row.university,
    className: row.className,
    createdAt: row.createdAt.toISOString(),
    items: Number(statsByUser.get(row.id)?.total ?? 0),
    published: Number(statsByUser.get(row.id)?.published ?? 0),
    isAdmin: isAdminEmail(row.email),
    isSelf: row.id === user.id,
  }));

  return (
    <DashboardShell user={user} active="accounts">
      <h1 className="text-[clamp(1.6rem,3.4vw,2.1rem)] font-black text-ink">حساب‌ها</h1>
      <p className="mt-2 max-w-3xl text-[14px] leading-8 text-ink-soft">
        همهٔ حساب‌های ساخته‌شده در سایت. این بخش فقط برای ایمیل مدیر سایت باز می‌شود و ایمیل‌ها فقط
        همین‌جا دیده می‌شوند.
      </p>

      {doneMessage ? (
        <div className="mt-5">
          <FormAlert tone="success">{doneMessage}</FormAlert>
        </div>
      ) : null}

      <div className="mt-8">
        <AccountsManager accounts={accounts} />
      </div>
    </DashboardShell>
  );
}
