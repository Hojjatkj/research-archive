import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { items, reviews } from "@/db/schema";
import { createReaderToken, hashReaderToken, isReaderToken, READER_COOKIE, READER_COOKIE_MAX_AGE } from "@/lib/seen";

export const dynamic = "force-dynamic";

/** Public endpoint: records one anonymous «I saw this» stamp per browser/post. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 403 });
    }
  }

  let body: { itemId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  }

  const itemId = Number(body.itemId);
  if (!Number.isInteger(itemId) || itemId <= 0) {
    return NextResponse.json({ error: "شناسهٔ مطلب نامعتبر است." }, { status: 400 });
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

    const jar = await cookies();
    const savedToken = jar.get(READER_COOKIE)?.value;
    const token = isReaderToken(savedToken) ? savedToken : createReaderToken();
    const createdCookie = !isReaderToken(savedToken);

    const inserted = await db
      .insert(reviews)
      .values({
        itemId,
        reviewerName: "بازدیدکننده",
        note: "",
        visitorTokenHash: hashReaderToken(token),
      })
      .onConflictDoNothing({ target: [reviews.itemId, reviews.visitorTokenHash] })
      .returning({ id: reviews.id });

    const response = NextResponse.json(
      { alreadySeen: inserted.length === 0, message: inserted.length ? "ثبت شد." : "این مطلب قبلاً ثبت شده است." },
      { status: inserted.length ? 201 : 200, headers: { "Cache-Control": "no-store" } },
    );
    if (createdCookie) {
      const secure = Boolean(process.env.VERCEL) || new URL(request.url).protocol === "https:";
      response.cookies.set(READER_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure,
        path: "/",
        maxAge: READER_COOKIE_MAX_AGE,
      });
    }
    return response;
  } catch {
    return NextResponse.json({ error: "ثبت انجام نشد؛ دوباره تلاش کنید." }, { status: 500 });
  }
}
