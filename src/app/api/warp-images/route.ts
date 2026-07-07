import { readdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const IMAGE_EXTENSIONS = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

export const dynamic = "force-dynamic";

export async function GET() {
  const warpDir = path.join(process.cwd(), "public", "warp");

  try {
    const entries = await readdir(warpDir, { withFileTypes: true });
    const images = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => IMAGE_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => `/warp/${encodeURIComponent(name)}`);

    return NextResponse.json(
      { images },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json({ images: [] }, { status: 200 });
  }
}
