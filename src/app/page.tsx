import FonosaurSite from "@/components/FonosaurSite";
import { getLatestFieldNotes } from "@/lib/notes";

export const dynamic = "force-static";

// Server Component: read field notes at request/build time, hand them to the
// interactive (client) shell as plain serialisable data.
export default async function Home() {
  const raw = await getLatestFieldNotes(4);
  const notes = raw.map((n) => ({
    slug: n.slug,
    entry: {
      title: n.entry.title,
      publishedAt: n.entry.publishedAt,
      summary: n.entry.summary,
      tags: n.entry.tags ?? [],
      cover: n.entry.cover ?? null,
      leadMedia: (() => {
        const m = (n.entry.media as any)?.[0];
        if (!m) return null;
        if (m.discriminant === "image") {
          const src = typeof m.value === "string" ? m.value : m.value?.src;
          if (src) return { type: "image", src };
        }
        if (m.discriminant === "youtube") {
          const url = typeof m.value === "string" ? m.value : m.value?.url;
          if (url) return { type: "youtube", url };
        }
        if (m.discriminant === "video") {
          const src = typeof m.value === "string" ? m.value : m.value?.src;
          if (src) return { type: "video", src };
        }
        return null;
      })(),
    },
  }));
  return <FonosaurSite notes={notes as any} />;
}
