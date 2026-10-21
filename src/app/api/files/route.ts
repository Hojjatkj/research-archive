import { NextResponse } from "next/server";
import { db } from "@/db";
import { files } from "@/db/schema";
import { readSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Vercel caps request bodies at ~4.5 MB, so stay safely below that everywhere. */
const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const user = await readSessionUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "بارگذاری فایل فقط برای مدیر سایت مجاز است." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "فایلی دریافت نشد. اگر حجم فایل زیاد است، فایل کوچک‌تری (حداکثر ۴ مگابایت) انتخاب کنید." },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "فایلی انتخاب نشده است." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "فایل انتخاب‌شده خالی است." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "حجم فایل بیش از ۴ مگابایت است." }, { status: 413 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const inserted = await db
      .insert(files)
      .values({
        userId: null,
        name: file.name || "upload.bin",
        mime: file.type || "application/octet-stream",
        size: buffer.length,
        alt: String(form.get("alt") ?? "").trim(),
        caption: String(form.get("caption") ?? "").trim(),
        data: buffer,
      })
      .returning({ id: files.id, name: files.name, mime: files.mime, size: files.size });

    return NextResponse.json({ file: inserted[0], url: `/api/files/${inserted[0].id}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "بارگذاری فایل انجام نشد؛ دوباره تلاش کنید." }, { status: 500 });
  }
}
