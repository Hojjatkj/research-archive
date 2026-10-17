import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { items, reviews, type Item } from "@/db/schema";

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

const published = () => eq(items.status, "published");

export async function listPublished(params: {
  type?: string | string[];
  course?: string;
  tag?: string;
  page?: number;
  perPage?: number;
}): Promise<{ rows: Item[]; total: number; page: number; pages: number }> {
  const perPage = params.perPage ?? 8;
  const page = Math.max(1, params.page ?? 1);
  const filters: SQL[] = [published()];
  if (params.type) {
    filters.push(
      Array.isArray(params.type)
        ? inArray(items.type, params.type)
        : eq(items.type, params.type),
    );
  }
  if (params.course) filters.push(eq(items.course, params.course));
  if (params.tag) filters.push(sql`${params.tag} = ANY(${items.tags})`);

  const where = and(...filters);
  const totalRow = await db.select({ n: sql<number>`count(*)` }).from(items).where(where);
  const total = Number(totalRow[0]?.n ?? 0);
  const rows = await db
    .select()
    .from(items)
    .where(where)
    .orderBy(desc(items.publishedAt), desc(items.id))
    .limit(perPage)
    .offset((page - 1) * perPage);

  return { rows, total, page, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function searchPublished(q: string, limit = 30): Promise<Item[]> {
  const term = `%${q.trim()}%`;
  if (!q.trim()) return [];
  return db
    .select()
    .from(items)
    .where(
      and(
        published(),
        or(
          ilike(items.title, term),
          ilike(items.summary, term),
          ilike(items.plain, term),
          ilike(items.course, term),
          ilike(sql`array_to_string(${items.tags}, ' ')`, term),
        ),
      ),
    )
    .orderBy(desc(items.publishedAt))
    .limit(limit);
}

export async function getPublishedItem(slug: string): Promise<Item | null> {
  const rows = await db
    .select()
    .from(items)
    .where(and(eq(items.slug, slug), published()))
    .limit(1);
  return rows[0] ?? null;
}

export async function getItemById(id: number): Promise<Item | null> {
  const rows = await db.select().from(items).where(eq(items.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function neighbors(item: Item) {
  const list = await db
    .select({ id: items.id, slug: items.slug, title: items.title })
    .from(items)
    .where(and(published(), eq(items.type, item.type)))
    .orderBy(asc(items.publishedAt), asc(items.id));
  const index = list.findIndex((row) => row.id === item.id);
  return {
    prev: index > 0 ? list[index - 1] : null,
    next: index >= 0 && index < list.length - 1 ? list[index + 1] : null,
  };
}

export async function reviewMap(): Promise<Map<number, number>> {
  const rows = await db
    .select({ itemId: reviews.itemId, n: sql<number>`count(*)` })
    .from(reviews)
    .groupBy(reviews.itemId);
  return new Map(rows.map((r) => [r.itemId, Number(r.n)]));
}

export async function reviewsFor(itemId: number) {
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.itemId, itemId))
    .orderBy(desc(reviews.createdAt));
}

export async function allCourses(): Promise<string[]> {
  const rows = await db
    .select({ course: items.course })
    .from(items)
    .where(and(published(), sql`${items.course} <> ''`))
    .groupBy(items.course)
    .orderBy(asc(items.course));
  return rows.map((r) => r.course);
}

export async function countsByType(): Promise<Record<string, number>> {
  const rows = await db
    .select({ type: items.type, n: sql<number>`count(*)` })
    .from(items)
    .where(published())
    .groupBy(items.type);
  return Object.fromEntries(rows.map((r) => [r.type, Number(r.n)]));
}
