import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

/**
 * Serves files under public/uploads at request time.
 *
 * Why this exists: `next start` only serves `public/` files that existed
 * when the server booted, so anything uploaded afterwards (product photos,
 * chat attachments) 404s — including for the next/image optimizer, which
 * fetches the source through this same server. next.config.ts rewrites
 * /uploads/* here so those files resolve. (In production nginx serves
 * /uploads/ straight from disk for browsers; this route is what the
 * optimizer's internal fetch hits.)
 */
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".webm": "audio/webm",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".mp4": "audio/mp4",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const target = path.resolve(UPLOADS_ROOT, ...segments);

  // Path-traversal guard: the resolved file must stay inside uploads/.
  if (!target.startsWith(UPLOADS_ROOT + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const contentType = CONTENT_TYPES[path.extname(target).toLowerCase()];
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const file = await readFile(target);
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        // Filenames are random UUIDs, so a given URL never changes content.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
