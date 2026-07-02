import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdoc from "@markdoc/markdoc";
import { getFieldNote, getAllFieldNoteSlugs } from "@/lib/notes";
import { NoteMedia } from "@/components/note-media";

export const dynamic = "force-static";

const C = { sub: "#8a8a92", text: "#e8e8ea", blue: "#3b8bff", line: "#26262b" };

export async function generateStaticParams() {
  const slugs = await getAllFieldNoteSlugs();
  return slugs.map((slug) => ({ slug }));
}

function fmt(d?: string) {
  return d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";
}

export default async function FieldNotePage({
  params,
}: {
  params: { slug: string };
}) {
  // reader.read() returns the entry with fields at the top level,
  // and the content field (`body`) as an async function.
  const note: any = await getFieldNote(params.slug);
  if (!note) notFound();

  const { node } = await note.body();
  const errors = Markdoc.validate(node);
  if (errors.length) console.error(errors);
  const rendered = Markdoc.renderers.react(Markdoc.transform(node), React);

  return (
    <article
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "70px 22px 120px",
        color: C.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <Link
        href="/"
        style={{ color: C.sub, fontSize: 13, textDecoration: "none" }}
      >
        ← Back
      </Link>

      <div
        style={{
          fontFamily: "monospace",
          fontSize: 11,
          color: C.blue,
          letterSpacing: "0.12em",
          margin: "22px 0 8px",
        }}
      >
        {fmt(note.publishedAt)}
        {note.tags?.length ? ` · ${note.tags.join(" · ")}` : ""}
      </div>
      <h1
        style={{
          fontWeight: 300,
          fontSize: "clamp(28px,6vw,44px)",
          margin: "0 0 20px",
          lineHeight: 1.1,
        }}
      >
        {note.title}
      </h1>

      {note.cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={note.cover}
          alt=""
          style={{
            width: "100%",
            borderRadius: 14,
            border: `1px solid ${C.line}`,
            marginBottom: 22,
          }}
        />
      )}

      {note.summary && (
        <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 26 }}>
          {note.summary}
        </p>
      )}

      <div style={{ marginBottom: 26 }}>
        <NoteMedia items={note.media as any} />
      </div>

      <div style={{ fontSize: 16, lineHeight: 1.7 }}>{rendered}</div>
    </article>
  );
}
