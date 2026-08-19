import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { requireBrandAccess } from "@/lib/access";

export const runtime = "nodejs";

/**
 * Client-side upload handshake for Vercel Blob. The browser calls this
 * endpoint twice: once to get a signed upload URL, once (via the platform)
 * to notify us the upload completed.
 *
 * Requires BLOB_READ_WRITE_TOKEN on the deploy. Without it, calls fail
 * with a friendly 501 so the client can show a clear "not configured"
 * message.
 */
export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "File uploads aren't configured on this deploy (BLOB_READ_WRITE_TOKEN not set)." },
      { status: 501 }
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // pathname is `${brandSlug}/${taskId}/${filename}` — verify access.
        const [brandSlug] = pathname.split("/");
        await requireBrandAccess(brandSlug);
        return {
          allowedContentTypes: [
            "image/*",
            "application/pdf",
            "text/plain",
            "text/csv",
            "application/zip",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          ],
          maximumSizeInBytes: 25 * 1024 * 1024,
        };
      },
      onUploadCompleted: async () => {
        // We save the attachment record from the client after upload.
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 }
    );
  }
}
