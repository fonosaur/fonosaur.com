/**
 * Renders one Field Note "Media" item by its type.
 * `media` comes from the Reader API as an array of { discriminant, value }.
 */
import type { CSSProperties } from "react";

type MediaItem =
  | { discriminant: "image"; value: { src: string | null; alt: string } }
  | { discriminant: "video"; value: { src: string | null; poster: string | null } }
  | { discriminant: "audio"; value: { src: string | null; title: string } }
  | { discriminant: "youtube"; value: { url: string } }
  | { discriminant: "soundcloud"; value: { url: string } }
  | { discriminant: "mixcloud"; value: { url: string } };

// --- URL helpers for the embeds ---
export function youtubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m?.[1] ?? null;
}
function mixcloudPath(url: string) {
  try {
    return new URL(url).pathname; // e.g. /fonosaur/some-mix/
  } catch {
    return null;
  }
}

const frame: CSSProperties = {
  width: "100%",
  border: "1px solid #26262b",
  borderRadius: 12,
  overflow: "hidden",
  background: "#141417",
};

export function NoteMedia({ items }: { items: MediaItem[] }) {
  if (!items?.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map((item, i) => (
        <One key={i} item={item} />
      ))}
    </div>
  );
}

function One({ item }: { item: MediaItem }) {
  switch (item.discriminant) {
    case "image":
      return item.value.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.value.src} alt={item.value.alt || ""} style={{ ...frame, display: "block" }} />
      ) : null;

    case "video":
      return item.value.src ? (
        <video
          src={item.value.src}
          poster={item.value.poster || undefined}
          controls
          playsInline
          muted
          loop
          style={{ ...frame, display: "block" }}
        />
      ) : null;

    case "audio":
      return item.value.src ? (
        <div style={{ ...frame, padding: 14 }}>
          {item.value.title && (
            <div style={{ fontSize: 13, color: "#8a8a92", marginBottom: 8 }}>{item.value.title}</div>
          )}
          <audio src={item.value.src} controls style={{ width: "100%" }} />
        </div>
      ) : null;

    case "youtube": {
      const id = youtubeId(item.value.url);
      if (!id) return null;
      return (
        <div style={{ ...frame, aspectRatio: "16 / 9" }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title="YouTube"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: 0 }}
          />
        </div>
      );
    }

    case "soundcloud":
      return (
        <div style={{ ...frame }}>
          <iframe
            width="100%"
            height="166"
            scrolling="no"
            allow="autoplay"
            title="SoundCloud"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(
              item.value.url
            )}&color=%233b8bff&inverse=false&auto_play=false&show_user=true`}
            style={{ border: 0, display: "block" }}
          />
        </div>
      );

    case "mixcloud": {
      const path = mixcloudPath(item.value.url);
      if (!path) return null;
      return (
        <div style={{ ...frame }}>
          <iframe
            width="100%"
            height="120"
            title="Mixcloud"
            src={`https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(path)}`}
            style={{ border: 0, display: "block" }}
            allow="autoplay"
          />
        </div>
      );
    }

    default:
      return null;
  }
}
