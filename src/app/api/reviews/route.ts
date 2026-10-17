import { NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { items, reviews } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { itemId?: unknown; reviewerName?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بدنهٔ درخواست نامعتبر است." }, { status: 400 });
  }

  const itemId = Number(body.itemId);
  const reviewerName = typeof body.reviewerName === "string" ? body.reviewerName.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!Number.isInteger(itemId) || itemId <= 0) {
    return NextResponse.json({ error: "شناسهٔ مطلب نامعتبر است." }, { status: 400 });
  }
  if (!reviewerName || reviewerName.length > 80) {
    return NextResponse.json({ error: "نام بیننده را وارد کنید (حداکثر ۸۰ نویسه)." }, { status: 400 });
  }
  if (note.length > 500) {
    return NextResponse.json({ error: "یادداشت بیش از حد مجاز است." }, { status: 400 });
  }

  const item = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.id, itemId), eq(items.status, "published"), gt(items.publishedAt, new Date(0))))
    .limit(1);

  if (!item.length) {
    return NextResponse.json({ error: "مطلب منتشرشده‌ای با این شناسه یافت نشد." }, { status: 404 });
  }

  try {
    const inserted = await db
      .insert(reviews)
      .values({ itemId, reviewerName, note })
      .returning();

    return NextResponse.json({ review: inserted[0] }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "ثبت مهر انجام نشد. لطفاً دوباره تلاش کنید." },
      { status: 500 },
    );
  }
}
