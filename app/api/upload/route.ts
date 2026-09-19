import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET } from "@/lib/r2";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalName = file.name || "unnamed";
    const mimeType = file.type || "application/octet-stream";
    const size = file.size;

    // Detect media category
    let mediaType: "image" | "video" | "audio" | "document" = "document";
    if (mimeType.startsWith("image/")) {
      mediaType = "image";
    } else if (mimeType.startsWith("video/")) {
      mediaType = "video";
    } else if (mimeType.startsWith("audio/")) {
      mediaType = "audio";
    } else {
      mediaType = "document";
    }

    const cleanFilename = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `uploads/${folder}/${Date.now()}-${cleanFilename}`;

    let uploadedUrl = "";
    let storageEngine: "cloudflare-r2" | "supabase-storage" = "cloudflare-r2";

    // 1. Primary Attempt: Cloudflare R2
    let r2Success = false;
    if (r2Client) {
      try {
        await r2Client.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
          })
        );
        // Serve via local streaming proxy so all browsers render without CORS/permission issues
        uploadedUrl = `/api/media/${key}`;
        storageEngine = "cloudflare-r2";
        r2Success = true;
      } catch (r2Err: unknown) {
        const msg = r2Err instanceof Error ? r2Err.message : String(r2Err);
        console.warn("[Cloudflare R2] PutObject failed or token lacks write permissions:", msg);
      }
    }

    // 2. Fallback Attempt: Supabase Storage
    if (!r2Success) {
      const supabase = createAdminClient();
      const { error: sbErr } = await supabase.storage
        .from("media")
        .upload(key, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (sbErr) {
        console.error("[Supabase Storage] upload failed:", sbErr);
        throw new Error(`Upload failed: ${sbErr.message}`);
      }

      const { data: publicData } = supabase.storage.from("media").getPublicUrl(key);
      uploadedUrl = publicData.publicUrl;
      storageEngine = "supabase-storage";
    }

    return NextResponse.json({
      success: true,
      url: uploadedUrl,
      key,
      filename: originalName,
      mimeType,
      size,
      mediaType,
      storage: storageEngine,
    });
  } catch (err: unknown) {
    console.error("Upload route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to upload file" },
      { status: 500 }
    );
  }
}
