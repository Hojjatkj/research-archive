import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { saveProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 401 });
  }
  let body: { name?: string; university?: string; course?: string; email?: string; bio?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بدنهٔ نامعتبر." }, { status: 400 });
  }
  try {
    await saveProfile({
      name: body.name?.trim() ?? "",
      university: body.university?.trim() ?? "",
      course: body.course?.trim() ?? "",
      email: body.email?.trim() ?? "",
      bio: body.bio?.trim() ?? "",
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "ذخیره ناموفق بود." }, { status: 500 });
  }
}
