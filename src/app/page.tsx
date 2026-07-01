import FonosaurSite from "@/components/FonosaurSite";
import { getLatestFieldNotes } from "@/lib/notes";

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
    },
  }));
  return <FonosaurSite notes={notes as any} />;
}
