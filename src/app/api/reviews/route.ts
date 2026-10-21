import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { items, reviews } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Public endpoint: the professor stamps «مشاهده شد» without an account. */
export async function POST(request: Request) {
  let body: { itemId?: unknown; reviewerName?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
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
    return NextResponse.json({ error: "یادداشت بیش از ۵۰۰ نویسه است." }, { status: 400 });
  }

  try {
    const visible = await db
      .select({ id: items.id })
      .from(items)
      .where(and(eq(items.id, itemId), eq(items.status, "published"), eq(items.hiddenByAdmin, false)))
      .limit(1);
    if (!visible.length) {
      return NextResponse.json({ error: "این مطلب در دسترس نیست." }, { status: 404 });
    }

    const inserted = await db.insert(reviews).values({ itemId, reviewerName, note }).returning();
    return NextResponse.json({ review: inserted[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "ثبت مهر انجام نشد؛ دوباره تلاش کنید." }, { status: 500 });
  }
}
