import { eq } from "drizzle-orm";
import { db } from "@/db";
import { files } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return new Response("bad request", { status: 400 });
  }

  const rows = await db.select().from(files).where(eq(files.id, numericId)).limit(1);
  const file = rows[0];
  if (!file) {
    return new Response("not found", { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download") === "1";

  return new Response(new Uint8Array(file.data), {
    status: 200,
    headers: {
      "Content-Type": file.mime,
      "Content-Length": String(file.size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
