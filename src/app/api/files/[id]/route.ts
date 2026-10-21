import { and, eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { files, items } from "@/db/schema";
import { readSessionUser } from "@/lib/auth";
import { visibleFilter } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return new Response("not found", { status: 404 });
  }

  const user = await readSessionUser();
  if (!user?.isAdmin) {
    const visibleUse = await db
      .select({ id: items.id })
      .from(items)
      .where(
        and(
          visibleFilter(),
          or(
            eq(items.coverFileId, numericId),
            sql`EXISTS (
              SELECT 1
              FROM jsonb_array_elements(
                CASE WHEN jsonb_typeof(${items.content}) = 'array' THEN ${items.content} ELSE '[]'::jsonb END
              ) AS block(value)
              WHERE block.value->>'fileId' = ${String(numericId)}
            )`,
          ),
        ),
      )
      .limit(1);
    if (!visibleUse.length) return new Response("not found", { status: 404 });
  }

  const rows = await db.select().from(files).where(eq(files.id, numericId)).limit(1);
  const file = rows[0];
  if (!file) return new Response("not found", { status: 404 });

  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download") === "1";

  return new Response(new Uint8Array(file.data), {
    status: 200,
    headers: {
      "Content-Type": file.mime,
      "Content-Length": String(file.size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
