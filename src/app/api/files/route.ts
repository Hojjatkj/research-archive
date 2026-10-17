import { NextResponse } from "next/server";
import { db } from "@/db";
import { files } from "@/db/schema";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "فایلی ارسال نشده است." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "فایلی انتخاب نشده است." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "فایل خالی است." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "حجم فایل بیش از ۸ مگابایت است." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const alt = String(form.get("alt") ?? "").trim();
  const caption = String(form.get("caption") ?? "").trim();

  try {
    const inserted = await db
      .insert(files)
      .values({
        name: file.name || "upload.bin",
        mime: file.type || "application/octet-stream",
        size: buffer.length,
        alt,
        caption,
        data: buffer,
      })
      .returning({ id: files.id, name: files.name, mime: files.mime, size: files.size });

    return NextResponse.json(
      { file: inserted[0], url: `/api/files/${inserted[0].id}` },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "بارگذاری فایل انجام نشد. لطفاً دوباره تلاش کنید." },
      { status: 500 },
    );
  }
}
