import { createReader } from "@keystatic/core/reader";
import keystaticConfig from "../../keystatic.config";

// The Reader API is a Node API — only call these from Server Components / route handlers.
export const reader = createReader(process.cwd(), keystaticConfig);

export async function getLatestFieldNotes(limit = 4) {
  const all = await reader.collections.fieldNotes.all();
  return all
    .filter((n) => Boolean(n.entry.publishedAt))
    .sort((a, b) =>
      (a.entry.publishedAt as string) < (b.entry.publishedAt as string) ? 1 : -1
    )
    .slice(0, limit);
}

export async function getFieldNote(slug: string) {
  return reader.collections.fieldNotes.read(slug);
}

export async function getAllFieldNoteSlugs() {
  const all = await reader.collections.fieldNotes.all();
  return all.map((n) => n.slug);
}
