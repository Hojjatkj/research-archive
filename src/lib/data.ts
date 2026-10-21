import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  isNull,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import { items, reviews, users, type Item } from "@/db/schema";

export const TYPES = [
  { id: "assignment", label: "تکالیف و گزارش‌ها", short: "تکلیف" },
  { id: "research", label: "متن‌ها و مقاله‌های پژوهشی", short: "پژوهش" },
  { id: "presentation", label: "ارائه‌ها", short: "ارائه" },
  { id: "notes", label: "جزوه‌ها", short: "جزوه" },
] as const;

export type TypeId = (typeof TYPES)[number]["id"];

export function typeLabel(id: string): string {
  return TYPES.find((t) => t.id === id)?.label ?? id;
}

export function typeShort(id: string): string {
  return TYPES.find((t) => t.id === id)?.short ?? id;
}

export function sectionHref(type: string): string {
  return type === "presentation" ? "/presentations" : type === "notes" ? "/notes" : "/archive";
}

/** Publicly visible = published by the author AND not taken down by the class admin. */
export function visibleFilter(): SQL {
  return and(eq(items.status, "published"), eq(items.hiddenByAdmin, false)) as SQL;
}

export type ListedItem = Item & { authorName: string | null };

const listedColumns = { ...getTableColumns(items), authorName: users.fullName };

export type PublicUser = {
  id: number;
  fullName: string;
  studentNumber: string;
  university: string;
  className: string;
  professorName: string;
  classTime: string;
  bio: string;
  createdAt: Date;
};

const publicUserColumns = {
  id: users.id,
  fullName: users.fullName,
  studentNumber: users.studentNumber,
  university: users.university,
  className: users.className,
  professorName: users.professorName,
  classTime: users.classTime,
  bio: users.bio,
  createdAt: users.createdAt,
};

export async function listPublished(params: {
  type?: string | string[];
  course?: string;
  tag?: string;
  userId?: number;
  page?: number;
  perPage?: number;
}): Promise<{ rows: ListedItem[]; total: number; page: number; pages: number }> {
  const perPage = params.perPage ?? 8;
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const filters: SQL[] = [visibleFilter()];
  if (params.type) {
    filters.push(Array.isArray(params.type) ? inArray(items.type, params.type) : eq(items.type, params.type));
  }
  if (params.course) filters.push(eq(items.course, params.course));
  if (params.tag) filters.push(sql`${params.tag} = ANY(${items.tags})`);
  if (params.userId) filters.push(eq(items.userId, params.userId));

  const where = and(...filters);
  const [{ n }] = await db.select({ n: count() }).from(items).where(where);
  const total = Number(n);
  const rows = await db
    .select(listedColumns)
    .from(items)
    .leftJoin(users, eq(items.userId, users.id))
    .where(where)
    .orderBy(desc(items.publishedAt), desc(items.id))
    .limit(perPage)
    .offset((page - 1) * perPage);

  return { rows, total, page, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function searchPublished(q: string, limit = 30): Promise<ListedItem[]> {
  const query = q.trim();
  if (!query) return [];
  const term = `%${query}%`;
  return db
    .select(listedColumns)
    .from(items)
    .leftJoin(users, eq(items.userId, users.id))
    .where(
      and(
        visibleFilter(),
        or(
          ilike(items.title, term),
          ilike(items.summary, term),
          ilike(items.plain, term),
          ilike(items.course, term),
          ilike(sql`array_to_string(${items.tags}, ' ')`, term),
          ilike(users.fullName, term),
        ),
      ),
    )
    .orderBy(desc(items.publishedAt))
    .limit(limit);
}

export async function getVisibleItem(slug: string): Promise<ListedItem | null> {
  const rows = await db
    .select(listedColumns)
    .from(items)
    .leftJoin(users, eq(items.userId, users.id))
    .where(and(eq(items.slug, slug), visibleFilter()))
    .limit(1);
  return rows[0] ?? null;
}

export async function getItemById(id: number): Promise<Item | null> {
  const rows = await db.select().from(items).where(eq(items.id, id)).limit(1);
  return rows[0] ?? null;
}

/** Previous / next within the same author and section. */
export async function neighbors(item: Item) {
  const sameAuthor = item.userId === null ? isNull(items.userId) : eq(items.userId, item.userId);
  const list = await db
    .select({ id: items.id, slug: items.slug, title: items.title })
    .from(items)
    .where(and(visibleFilter(), eq(items.type, item.type), sameAuthor))
    .orderBy(asc(items.publishedAt), asc(items.id));
  const index = list.findIndex((row) => row.id === item.id);
  return {
    prev: index > 0 ? list[index - 1] : null,
    next: index >= 0 && index < list.length - 1 ? list[index + 1] : null,
  };
}

export async function reviewMap(): Promise<Map<number, number>> {
  const rows = await db
    .select({ itemId: reviews.itemId, n: count() })
    .from(reviews)
    .groupBy(reviews.itemId);
  return new Map(rows.map((r) => [r.itemId, Number(r.n)]));
}

export async function reviewsFor(itemId: number) {
  return db.select().from(reviews).where(eq(reviews.itemId, itemId)).orderBy(desc(reviews.createdAt));
}

export async function latestStamps(): Promise<
  Map<number, { reviewerName: string; note: string; createdAt: Date; count: number }>
> {
  const rows = await db
    .select({ itemId: reviews.itemId, reviewerName: reviews.reviewerName, note: reviews.note, createdAt: reviews.createdAt })
    .from(reviews)
    .orderBy(desc(reviews.createdAt));
  const map = new Map<number, { reviewerName: string; note: string; createdAt: Date; count: number }>();
  for (const row of rows) {
    const existing = map.get(row.itemId);
    if (existing) existing.count += 1;
    else map.set(row.itemId, { reviewerName: row.reviewerName, note: row.note, createdAt: row.createdAt, count: 1 });
  }
  return map;
}

export async function allCourses(): Promise<string[]> {
  const rows = await db
    .select({ course: items.course })
    .from(items)
    .where(and(visibleFilter(), sql`${items.course} <> ''`))
    .groupBy(items.course)
    .orderBy(asc(items.course));
  return rows.map((r) => r.course);
}

export async function countsByType(userId?: number): Promise<Record<string, number>> {
  const rows = await db
    .select({ type: items.type, n: count() })
    .from(items)
    .where(userId ? and(visibleFilter(), eq(items.userId, userId)) : visibleFilter())
    .groupBy(items.type);
  return Object.fromEntries(rows.map((r) => [r.type, Number(r.n)]));
}

export async function getStudent(id: number): Promise<PublicUser | null> {
  if (!Number.isInteger(id) || id <= 0) return null;
  const rows = await db.select(publicUserColumns).from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listStudents(): Promise<Array<PublicUser & { published: number; seen: number }>> {
  const rows = await db.select(publicUserColumns).from(users).orderBy(asc(users.fullName));
  if (!rows.length) return [];

  const [published, seen] = await Promise.all([
    db.select({ userId: items.userId, n: count() }).from(items).where(visibleFilter()).groupBy(items.userId),
    db
      .select({ userId: items.userId, n: sql<number>`count(distinct ${items.id})` })
      .from(reviews)
      .innerJoin(items, eq(reviews.itemId, items.id))
      .where(visibleFilter())
      .groupBy(items.userId),
  ]);
  const publishedMap = new Map(published.map((r) => [r.userId, Number(r.n)]));
  const seenMap = new Map(seen.map((r) => [r.userId, Number(r.n)]));

  return rows.map((row) => ({
    ...row,
    published: publishedMap.get(row.id) ?? 0,
    seen: seenMap.get(row.id) ?? 0,
  }));
}

export async function siteStats(): Promise<{ students: number; published: number; seen: number }> {
  const [[s], [p], [r]] = await Promise.all([
    db.select({ n: count() }).from(users),
    db.select({ n: count() }).from(items).where(visibleFilter()),
    db
      .select({ n: sql<number>`count(distinct ${reviews.itemId})` })
      .from(reviews)
      .innerJoin(items, eq(reviews.itemId, items.id))
      .where(visibleFilter()),
  ]);
  return { students: Number(s?.n ?? 0), published: Number(p?.n ?? 0), seen: Number(r?.n ?? 0) };
}
