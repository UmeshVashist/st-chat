import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Missing filename or contentType" }, { status: 400 });
    }

    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME || "chatconnect-media";
    const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://placeholder.r2.dev";

    const isConfigured =
      accountId &&
      accessKeyId &&
      secretAccessKey &&
      !accountId.includes("placeholder");

    if (!isConfigured) {
      // Return dev fallback mode response
      const uniqueName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      return NextResponse.json({
        uploadUrl: null,
        fileUrl: `https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?w=800&auto=format&fit=crop&q=80`,
        key: uniqueName,
        isMock: true,
        message: "Running in R2 Simulation Mode. Add Cloudflare R2 credentials to .env.local for live S3 upload.",
      });
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const key = `uploads/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    // 15-minute presigned upload URL
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
    const fileUrl = `${publicUrl}/${key}`;

    return NextResponse.json({
      uploadUrl,
      fileUrl,
      key,
      isMock: false,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate presigned upload URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
