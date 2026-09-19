import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const key = resolvedParams.key.join("/");

    if (!key) {
      return NextResponse.json({ error: "Key not provided" }, { status: 400 });
    }

    // 1. Attempt to fetch from Cloudflare R2
    if (r2Client) {
      try {
        const command = new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
        });

        const r2Response = await r2Client.send(command);

        if (r2Response.Body) {
          const stream = r2Response.Body as unknown as ReadableStream;
          return new NextResponse(stream, {
            headers: {
              "Content-Type": r2Response.ContentType || "application/octet-stream",
              "Content-Length": r2Response.ContentLength?.toString() || "",
              "Cache-Control": "public, max-age=31536000, immutable",
              "Content-Disposition": "inline",
            },
          });
        }
      } catch (r2Err: unknown) {
        // Not found in R2 or failed, try Supabase fallback
      }
    }

    // 2. Supabase Storage Fallback
    const supabase = createAdminClient();
    const { data: fileData, error: sbErr } = await supabase.storage
      .from("media")
      .download(key);

    if (sbErr || !fileData) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const buffer = await fileData.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": fileData.type || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": "inline",
      },
    });
  } catch (err: unknown) {
    console.error("Media streaming error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
