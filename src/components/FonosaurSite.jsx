"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Volume2,
  VolumeX,
  Mail,
  ShoppingBag,
  Gamepad2,
  Disc,
  Headphones,
  Compass,
} from "lucide-react";
import { youtubeId } from "@/components/note-media";

/* ============================================================================
 * FONOSAUR â€” unified responsive site
 * Desktop: the compass (Listen at centre, fly to rooms, visible top menu).
 * Mobile:  the World hub (atmospheric landing, full-screen zones, bottom tabs).
 * One state model, one audio engine, one warp, one set of zone content.
 * ==========================================================================*/

const C = {
  bg: "#0a0a0c",
  panel: "#141417",
  line: "#26262b",
  sub: "#8a8a92",
  text: "#e8e8ea",
  blue: "#3b8bff",
  purple: "#8b5cf6",
  amber: "#ff8a3d",
  bronze: "#a06820",
  green: "#00cc50",
};

const ZONES = {
  listen: {
    label: "Listen",
    accent: "#e8e8ea",
    tag: "releases",
    desc: "Music and where to hear it",
  },
  explore: {
    label: "Explore",
    accent: C.blue,
    tag: "field notes",
    desc: "Journal, photos, finds",
  },
  create: {
    label: "Create",
    accent: C.purple,
    tag: "play",
    desc: "Play with the sounds",
  },
  play: {
    label: "Play",
    accent: C.amber,
    tag: "game",
    desc: "Dino Sling, ready to play",
  },
  collect: {
    label: "Collect",
    accent: C.bronze,
    tag: "coming soon",
    desc: "Merch on the way",
  },
  follow: {
    label: "Follow",
    accent: C.green,
    tag: "updates",
    desc: "Email updates, occasionally",
  },
};

const ORDER = ["listen", "explore", "create", "play", "collect", "follow"];
const LANDING_NODES = [
  "listen",
  "create",
  "collect",
  "follow",
  "play",
  "explore",
];
const VALID_SCREENS = ["hub", ...ORDER];
const ICON = {
  listen: Headphones,
  explore: Compass,
  create: Disc,
  play: Gamepad2,
  collect: ShoppingBag,
  follow: Mail,
};
// desktop cross positions
const DESK_POS = {
  listen: { col: 0, row: 0 },
  explore: { col: -1, row: 0 },
  create: { col: 1, row: 0 },
  play: { col: -1, row: 1 },
  collect: { col: 1, row: 1 },
  follow: { col: 0, row: -1 },
};

const PADS = [
  { k: "A", n: "KICK", f: 55 },
  { k: "S", n: "RIM", f: 220 },
  { k: "D", n: "DUST", f: 880 },
  { k: "F", n: "SIREN", f: 0 },
  { k: "G", n: "RHODES", f: 277.2 },
  { k: "H", n: "VOX", f: 392 },
];
const GLIMPSES = [
  { g: "linear-gradient(135deg,#2a1d12,#3a2a18)", c: "market Â· dawn" },
  { g: "linear-gradient(135deg,#10241a,#16342a)", c: "foliage Â· rain" },
  { g: "linear-gradient(135deg,#1a1828,#241e3a)", c: "records Â· find" },
  { g: "linear-gradient(135deg,#281418,#3a1a20)", c: "tape Â· hiss" },
  { g: "linear-gradient(135deg,#122430,#16303a)", c: "water Â· field" },
  { g: "linear-gradient(135deg,#201810,#2c2414)", c: "crates Â· brass" },
];
const FRAME = {
  left: "50%",
  transform: "translateX(-50%)",
  width: "min(480px,100vw)",
};
const AMBIENT_TRACKS = [
  "/audio/londonstreet.mp3",
  "/audio/naijamarket.mp3",
  "/audio/naijastreet.mp3",
];
const AMBIENT_VOLUME = 0.16;
const LANDING_RING = {
  desktop: { cx: 50, cy: 57, rx: 31, ry: 31 },
  mobile: { cx: 50, cy: 57, rx: 26, ry: 24 },
};

/* --------------------------------------------------------------- ambient dust */
function Dust({ reduced }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, w, h;
    const cols = [C.blue, C.purple, C.bronze, C.green];
    const P = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.5 + 0.4,
      s: Math.random() * 0.00016 + 0.00004,
      a: Math.random() * 0.4 + 0.1,
      c: cols[(Math.random() * cols.length) | 0],
    }));
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of P) {
        if (!reduced) {
          p.y -= p.s;
          if (p.y < -0.02) {
            p.y = 1.02;
            p.x = Math.random();
          }
        }
        ctx.globalAlpha = p.a;
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, 7);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);
  return (
    <canvas
      ref={ref}
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    />
  );
}

/* ----------------------------------------- hyperspace warp between screens */
function Warp({ trigger, color, reduced }) {
  const ref = useRef(null);
  const [glimpses, setGlimpses] = useState([]);
  useEffect(() => {
    if (!trigger || reduced) {
      setGlimpses([]);
      return;
    }
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = (canvas.width = window.innerWidth),
      h = (canvas.height = window.innerHeight);
    const cx = w / 2,
      cy = h / 2;
    const stars = Array.from({ length: 120 }, () => ({
      ang: Math.random() * 6.283,
      dist: Math.random() * 26,
      speed: Math.random() * 5.5 + 2,
    }));
    const DUR = 1250;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = (now - start) / DUR;
      if (t >= 1) {
        ctx.clearRect(0, 0, w, h);
        return;
      }
      ctx.fillStyle = "rgba(10,10,12,0.16)";
      ctx.fillRect(0, 0, w, h);
      const fade = t < 0.16 ? t / 0.16 : 1 - (t - 0.16) / 0.84;
      ctx.globalAlpha = Math.max(0, fade) * 0.5;
      ctx.strokeStyle = color;
      ctx.lineCap = "round";
      for (const s of stars) {
        s.dist += s.speed * (1 + t * 5.5);
        const c = Math.cos(s.ang),
          si = Math.sin(s.ang);
        const trail = s.speed * (5 + t * 46);
        ctx.lineWidth = 0.5 + t * 1.3;
        ctx.beginPath();
        ctx.moveTo(cx + c * (s.dist - trail), cy + si * (s.dist - trail));
        ctx.lineTo(cx + c * s.dist, cy + si * s.dist);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const n = 3 + Math.floor(Math.random() * 3);
    setGlimpses(
      [...GLIMPSES]
        .sort(() => Math.random() - 0.5)
        .slice(0, n)
        .map((gl) => ({
          ...gl,
          x: 4 + Math.random() * 60,
          y: 10 + Math.random() * 56,
          rot: Math.random() * 16 - 8,
          size: 120 + Math.random() * 70,
          delay: Math.random() * 0.5,
        })),
    );
    const clr = setTimeout(() => setGlimpses([]), 2200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(clr);
    };
  }, [trigger, color, reduced]);
  return (
    <>
      <canvas
        ref={ref}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 30,
          pointerEvents: "none",
        }}
      />
      {glimpses.length > 0 && (
        <div
          key={trigger}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 30,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {glimpses.map((gl, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${gl.x}%`,
                top: `${gl.y}%`,
                transform: `rotate(${gl.rot}deg)`,
              }}
            >
              <div
                style={{
                  width: gl.size,
                  aspectRatio: "4 / 3",
                  borderRadius: 12,
                  background: gl.g,
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 24px 70px rgba(0,0,0,0.55)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: 10,
                  boxSizing: "border-box",
                  animation: `glimpse 1.5s ease ${gl.delay}s both`,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 9,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.62)",
                  }}
                >
                  {gl.c}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function AmbientToggle({ active, onToggle, compact = false, iconOnly = false }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? "Ambient on" : "Ambient off"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: iconOnly ? 0 : compact ? 6 : 8,
        background: active ? "rgba(0,204,80,0.14)" : "rgba(20,20,23,0.7)",
        border: `1px solid ${active ? C.green : C.line}`,
        borderRadius: 999,
        padding: iconOnly ? "8px" : compact ? "8px 11px" : "9px 14px",
        color: active ? C.green : C.sub,
        cursor: "pointer",
        fontFamily: "'Space Mono', monospace",
        fontSize: compact ? 10 : 11,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {active ? (
        <Volume2 size={compact ? 14 : 15} />
      ) : (
        <VolumeX size={compact ? 14 : 15} />
      )}
      {!iconOnly && <span>{active ? "Ambient On" : "Ambient Off"}</span>}
    </button>
  );
}

/* ------------------------------------------------------------ zone content */
const Eyebrow = ({ color, children }) => (
  <div
    style={{
      fontFamily: "'Space Mono', monospace",
      fontSize: 11,
      letterSpacing: "0.26em",
      textTransform: "uppercase",
      color: color || C.sub,
      marginBottom: 16,
    }}
  >
    {children}
  </div>
);

function Listen({ isMobile = false }) {
  const dspAccent = {
    Spotify: "rgba(29,185,84,0.34)",
    "Apple Music": "rgba(250,57,87,0.34)",
    "Amazon Music": "rgba(0,199,255,0.28)",
    Bandcamp: "rgba(99,181,213,0.28)",
    YouTube: "rgba(255,0,0,0.28)",
  };
  return (
    <div>
      <Eyebrow color={C.sub}>Traversal EP / 2022 / 6 tracks</Eyebrow>
      <h2
        style={{
          fontFamily: "'Unbounded', sans-serif",
          fontWeight: 200,
          fontSize: "clamp(30px,9vw,46px)",
          margin: "0 0 18px",
          lineHeight: 1,
        }}
      >
        Traversal
      </h2>
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 22,
          border: `1px solid ${C.line}`,
        }}
      >
        <iframe
          title="Traversal EP on Bandcamp"
          style={{ border: 0, width: "100%", height: isMobile ? 680 : 820 }}
          src="https://bandcamp.com/EmbeddedPlayer/album=2601440823/size=large/bgcol=333333/linkcol=ffffff/artwork=big/tracklist=true/transparent=true/"
          seamless
        >
          <a href="https://fonosaur.bandcamp.com/album/traversal-ep">
            Traversal - EP by Fonosaur
          </a>
        </iframe>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 26,
          justifyContent: "center",
        }}
      >
        {[
          ["Spotify", "https://open.spotify.com/album/2OtQAfwSaabg4yJiWJpD5t"],
          [
            "Apple Music",
            "https://music.apple.com/us/album/traversal-ep/1616402193",
          ],
          ["Amazon Music", "https://music.amazon.co.uk/albums/B09WM13NS3"],
          ["Bandcamp", "https://fonosaur.bandcamp.com/album/traversal-ep"],
          ["YouTube", "https://www.youtube.com/@fonosaur"],
        ].map(([label, href]) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="dspbtn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 38,
              padding: "0 14px",
              color: C.text,
              border: "1px solid rgba(232,232,234,0.16)",
              borderRadius: 999,
              textDecoration: "none",
              fontSize: 13,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(20,20,23,0.96))",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 18px rgba(0,0,0,0.16)",
              transition:
                "transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease",
              ["--dsp-accent"]: dspAccent[label] || "rgba(255,255,255,0.18)",
            }}
          >
            {label}
          </a>
        ))}
      </div>
      <div
        style={{
          background: "rgba(59,139,255,0.06)",
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          padding: "16px 18px",
        }}
      >
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 10,
            color: C.blue,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: 7,
          }}
        >
          Next release
        </div>
        <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.6 }}>
          New music is on the way. Join the list for first word.
        </div>
      </div>
    </div>
  );
}
function Explore({ notes = [] }) {
  const fmt = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";
  return (
    <div>
      <Eyebrow color={C.blue}>Explore / field notes</Eyebrow>
      <h2
        style={{
          fontFamily: "'Unbounded', sans-serif",
          fontWeight: 200,
          fontSize: "clamp(28px,8vw,42px)",
          margin: "0 0 22px",
          lineHeight: 1.05,
        }}
      >
        Field notes
      </h2>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          marginBottom: 24,
        }}
      >
        {notes.length ? (
          notes.map((n) => {
            const leadYouTubeId =
              n.entry.leadMedia?.type === "youtube"
                ? youtubeId(n.entry.leadMedia.url)
                : null;
            return (
              <article key={n.slug}>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    color: C.blue,
                    letterSpacing: "0.12em",
                    marginBottom: 7,
                  }}
                >
                  {fmt(n.entry.publishedAt)}
                  {n.entry.tags && n.entry.tags.length
                    ? " / " + n.entry.tags.join(" / ")
                    : ""}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 8,
                    color: C.text,
                  }}
                >
                  {n.entry.title}
                </div>
                {(n.entry.cover || n.entry.leadMedia) && (
                  <div
                    style={{
                      marginBottom: 12,
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    {n.entry.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.entry.cover}
                        alt=""
                        style={{
                          width: "100%",
                          display: "block",
                          borderRadius: 10,
                        }}
                      />
                    ) : n.entry.leadMedia?.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.entry.leadMedia.src}
                        alt=""
                        style={{
                          width: "100%",
                          display: "block",
                          borderRadius: 10,
                        }}
                      />
                    ) : leadYouTubeId ? (
                      <iframe
                        title={n.entry.title}
                        src={`https://www.youtube-nocookie.com/embed/${leadYouTubeId}`}
                        style={{
                          width: "100%",
                          aspectRatio: "16/9",
                          border: 0,
                          borderRadius: 10,
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : n.entry.leadMedia?.type === "video" ? (
                      <video
                        src={n.entry.leadMedia.src}
                        controls
                        style={{ width: "100%", borderRadius: 10 }}
                      />
                    ) : null}
                  </div>
                )}
                {n.entry.summary && (
                  <div
                    style={{
                      fontSize: 15,
                      color: C.sub,
                      lineHeight: 1.6,
                      marginBottom: 8,
                    }}
                  >
                    {n.entry.summary}
                  </div>
                )}
                <a
                  href={`/explore/${n.slug}`}
                  style={{
                    fontSize: 13,
                    color: C.blue,
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Read more {"->"}
                </a>
                <div
                  style={{ borderBottom: `1px solid ${C.line}`, marginTop: 20 }}
                />
              </article>
            );
          })
        ) : (
          <p style={{ color: C.sub, fontSize: 14 }}>First notes soon.</p>
        )}
      </div>
    </div>
  );
}
function Create() {
  return (
    <div>
      <Eyebrow color={C.purple}>Create / instrument</Eyebrow>
      <h2
        style={{
          fontFamily: "'Unbounded', sans-serif",
          fontWeight: 200,
          fontSize: "clamp(28px,8vw,42px)",
          margin: "0 0 10px",
          lineHeight: 1.05,
        }}
      >
        Fonosaur pad deck
      </h2>
      <p
        style={{
          color: C.sub,
          fontSize: 15,
          lineHeight: 1.6,
          margin: "0 0 20px",
          maxWidth: 420,
        }}
      >
        Build a quick loop from the sounds around the record.
      </p>
      <div
        style={{
          width: "100%",
          height: "min(72vh, 720px)",
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${C.line}`,
          background: C.bg,
        }}
      >
        <iframe
          title="Create"
          src="/create.html"
          sandbox="allow-scripts allow-same-origin allow-clipboard-write"
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            display: "block",
            background: C.bg,
          }}
        />
      </div>
    </div>
  );
}
function PlayZone() {
  return (
    <div>
      <Eyebrow color={C.amber}>Play / Dino Sling</Eyebrow>
      <h2
        style={{
          fontFamily: "'Unbounded', sans-serif",
          fontWeight: 200,
          fontSize: "clamp(28px,8vw,42px)",
          margin: "0 0 10px",
          lineHeight: 1.05,
        }}
      >
        Dino Sling
      </h2>
      <p
        style={{
          color: C.sub,
          fontSize: 15,
          lineHeight: 1.6,
          margin: "0 0 20px",
          maxWidth: 420,
        }}
      >
        Launch Dino Sling and take on the computer.
      </p>
      <div
        style={{
          width: "100%",
          height: "min(72vh, 720px)",
          borderRadius: 16,
          overflow: "hidden",
          border: `1px solid ${C.line}`,
          background: C.bg,
        }}
      >
        <iframe
          title="Dino Sling"
          src="/dino-sling.html"
          sandbox="allow-scripts allow-same-origin"
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            display: "block",
            background: "#000",
          }}
        />
      </div>
    </div>
  );
}
function Collect() {
  return (
    <div style={{ textAlign: "center", paddingTop: 8 }}>
      <Eyebrow color={C.bronze}>Collect</Eyebrow>
      <h2
        style={{
          fontFamily: "'Unbounded', sans-serif",
          fontWeight: 200,
          fontSize: "clamp(28px,8vw,42px)",
          margin: "0 0 16px",
          lineHeight: 1.05,
        }}
      >
        Merch soon
      </h2>
      <div
        style={{
          width: 84,
          height: 84,
          margin: "0 auto 22px",
          borderRadius: 18,
          background: "linear-gradient(135deg,#1c1c20,#101013)",
          border: `1px solid ${C.line}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ShoppingBag size={30} color={C.bronze} style={{ opacity: 0.6 }} />
      </div>
      <p
        style={{
          color: C.sub,
          fontSize: 15,
          lineHeight: 1.6,
          maxWidth: 380,
          margin: "0 auto",
        }}
      >
        Prints, shirts, and other bits are on the way.
      </p>
    </div>
  );
}
function Follow({ isMobile = false }) {
  return (
    <div style={{ textAlign: "center", paddingTop: 8 }}>
      <Eyebrow color={C.green}>Follow</Eyebrow>
      <h2
        style={{
          fontFamily: "'Unbounded', sans-serif",
          fontWeight: 200,
          fontSize: "clamp(26px,7.5vw,40px)",
          margin: "0 0 14px",
          lineHeight: 1.1,
        }}
      >
        Join the list
      </h2>
      <p
        style={{
          color: C.sub,
          fontSize: 15,
          lineHeight: 1.6,
          marginBottom: 26,
          maxWidth: 420,
          marginInline: "auto",
        }}
      >
        Emails for new music, field notes, and the occasional useful update.
      </p>
      <form
        action="https://buttondown.com/api/emails/embed-subscribe/fonosaur"
        method="post"
        target="_blank"
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          flexWrap: "wrap",
          alignItems: "stretch",
          gap: 8,
          maxWidth: 440,
          margin: "0 auto",
          justifyContent: "center",
        }}
      >
        <input
          type="email"
          name="email"
          placeholder="you@email.com"
          required
          style={{
            flex: isMobile ? "none" : "1 1 240px",
            minWidth: 0,
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            padding: "14px 15px",
            color: C.text,
            fontSize: 15,
            outline: "none",
            width: isMobile ? "100%" : "auto",
            boxSizing: "border-box",
          }}
        />
        <button
          type="submit"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            minHeight: 48,
            background: C.green,
            color: C.bg,
            border: "none",
            borderRadius: 10,
            padding: "0 18px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            width: isMobile ? "100%" : "auto",
          }}
        >
          <Mail size={16} /> Join
        </button>
      </form>
    </div>
  );
}
function BrandMark({ onClick, size = "clamp(34px,12vw,54px)", style = {} }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 0,
        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,
        color: C.text,
        cursor: onClick ? "pointer" : "default",
        fontFamily: "'Unbounded', sans-serif",
        fontSize: size,
        letterSpacing: "0",
        whiteSpace: "nowrap",
        lineHeight: 0.92,
        ...style,
      }}
    >
      <span style={{ fontWeight: 200 }}>FONO</span>
      <span className="saur">SAUR</span>
    </Tag>
  );
}

/* ---------------------------------------------------------- landing world */
function ConstellationLanding({ go, ambientOn, onAmbientToggle, isMobile }) {
  const ring = isMobile ? LANDING_RING.mobile : LANDING_RING.desktop;
  const orbitCenterY = `${ring.cy}%`;
  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        padding: isMobile ? "24px 18px 18px" : "22px 32px 24px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <BrandMark
          size={
            isMobile
              ? "clamp(24px,9vw,34px)"
              : "clamp(40px, min(6vw, 8.2vh), 74px)"
          }
        />
      </div>

      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: isMobile ? 430 : "clamp(430px, 58vh, 600px)",
          marginTop: isMobile ? 8 : 10,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: orbitCenterY,
            width: isMobile ? 218 : 336,
            height: isMobile ? 218 : 336,
            transform: "translate(-50%,-50%)",
            borderRadius: "50%",
            border: `1px solid ${ambientOn ? "rgba(0,204,80,0.16)" : "rgba(255,255,255,0.06)"}`,
            background:
              "radial-gradient(circle, rgba(232,232,234,0.03), rgba(10,10,12,0) 68%)",
            boxShadow: ambientOn
              ? "0 0 96px rgba(0,204,80,0.07)"
              : "0 0 62px rgba(59,139,255,0.05)",
            animation: ambientOn
              ? "spinSlow 26s linear infinite"
              : "spinSlow 34s linear infinite",
            transition:
              "border-color .35s ease, box-shadow .35s ease, width .35s ease, height .35s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: orbitCenterY,
            width: isMobile ? 154 : 238,
            height: isMobile ? 154 : 238,
            transform: "translate(-50%,-50%)",
            borderRadius: "50%",
            border: `1px solid ${ambientOn ? "rgba(0,204,80,0.12)" : "rgba(232,232,234,0.05)"}`,
            opacity: ambientOn ? 0.72 : 0.5,
            animation: ambientOn
              ? "spinReverse 18s linear infinite"
              : "spinReverse 24s linear infinite",
            transition:
              "border-color .35s ease, opacity .35s ease, width .35s ease, height .35s ease",
          }}
        />
        {LANDING_NODES.map((id, index) => {
          const z = ZONES[id];
          const Ic = ICON[id];
          const angle = ((-90 + index * 60) * Math.PI) / 180;
          const x = ring.cx + Math.cos(angle) * ring.rx;
          const y = ring.cy + Math.sin(angle) * ring.ry;
          return (
            <button
              key={id}
              onClick={() => go(id)}
              className="constellation-node"
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%,-50%)",
                width: isMobile ? 70 : 96,
                border: "none",
                background: "transparent",
                padding: 0,
                margin: 0,
                cursor: "pointer",
                color: C.text,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: isMobile ? 7 : 9,
                animation: `nodeFloat ${8 + index * 1.2}s ease-in-out infinite`,
                animationDelay: `${index * -0.9}s`,
              }}
            >
              <span
                style={{
                  width: isMobile ? 46 : 56,
                  height: isMobile ? 46 : 56,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${z.accent}66`,
                  background: `radial-gradient(circle at 30% 30%, ${z.accent}33, rgba(20,20,23,0.92) 70%)`,
                  boxShadow: `0 0 28px ${z.accent}22`,
                  transition:
                    "transform .22s ease, border-color .22s ease, box-shadow .22s ease",
                }}
              >
                <Ic size={isMobile ? 17 : 19} color={z.accent} />
              </span>
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: isMobile ? 9 : 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: z.accent,
                  whiteSpace: "nowrap",
                }}
              >
                {z.label}
              </span>
            </button>
          );
        })}
        <button
          onClick={onAmbientToggle}
          style={{
            position: "absolute",
            left: "50%",
            top: orbitCenterY,
            transform: "translate(-50%,-50%)",
            width: isMobile ? 84 : 92,
            height: isMobile ? 84 : 92,
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            zIndex: 2,
            color: ambientOn ? C.green : C.text,
          }}
          aria-pressed={ambientOn}
          aria-label={ambientOn ? "Turn ambient audio off" : "Turn ambient audio on"}
        >
          <span
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: isMobile ? 34 : 40,
              height: isMobile ? 34 : 40,
              borderRadius: "50%",
              background: ambientOn
                ? "radial-gradient(circle, rgba(0,204,80,0.38), rgba(0,204,80,0.08) 62%, rgba(20,20,23,0.96) 100%)"
                : "radial-gradient(circle, rgba(255,255,255,0.16), rgba(255,255,255,0.05) 58%, rgba(20,20,23,0.94) 100%)",
              boxShadow: ambientOn
                ? "0 0 26px rgba(0,204,80,0.26)"
                : "0 0 18px rgba(255,255,255,0.08)",
              transform: ambientOn ? "scale(1.08)" : "scale(1)",
              transition:
                "transform .24s ease, box-shadow .3s ease, background .3s ease",
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: isMobile ? -6 : -8,
                borderRadius: "50%",
                border: `1px solid ${ambientOn ? "rgba(0,204,80,0.28)" : "rgba(255,255,255,0.09)"}`,
                opacity: ambientOn ? 0.9 : 0.45,
                animation: ambientOn ? "ambientPulse 2.8s ease-in-out infinite" : "none",
                transition: "opacity .3s ease, border-color .3s ease",
              }}
            />
            <span
              style={{
                width: isMobile ? 10 : 12,
                height: isMobile ? 10 : 12,
                borderRadius: "50%",
                background: ambientOn ? C.green : "rgba(232,232,234,0.72)",
                boxShadow: ambientOn
                  ? "0 0 14px rgba(0,204,80,0.36)"
                  : "0 0 10px rgba(255,255,255,0.12)",
                transition: "background .3s ease, box-shadow .3s ease",
              }}
            />
          </span>
        </button>
      </div>
    </div>
  );
}
/* ------------------------------------------------------------------- app */
const isMobileNow = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width:768px)").matches;
const screenFromHash = () => {
  if (typeof window === "undefined") return "hub";
  const hash = window.location.hash.replace(/^#/, "").toLowerCase();
  return VALID_SCREENS.includes(hash) ? hash : "hub";
};

export default function FonosaurSite({ notes = [] }) {
  const [isMobile, setIsMobile] = useState(isMobileNow);
  const [screen, setScreen] = useState(screenFromHash);
  const [ambientOn, setAmbientOn] = useState(false);
  const [warpKey, setWarpKey] = useState(0);
  const [activeKey, setActiveKey] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [size, setSize] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1200,
    h: typeof window !== "undefined" ? window.innerHeight : 800,
  }));
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ambient = useRef({
    el: null,
    fade: 0,
  });
  const lastAmbientSrc = useRef(null);
  const audio = useRef({
    ctx: null,
    master: null,
  });
  const scrollRef = useRef(null);

  useEffect(() => {
    const onResize = () => {
      setSize({ w: window.innerWidth, h: window.innerHeight });
      const m = isMobileNow();
      setIsMobile(m);
    };
    const onHashChange = () => setScreen(screenFromHash());
    window.addEventListener("resize", onResize);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [screen]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextHash = screen === "hub" ? "" : `#${screen}`;
    if (window.location.hash === nextHash) return;
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [screen]);

  const ensure = () => {
    const a = audio.current;
    if (a.ctx) return a;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return a;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    a.ctx = ctx;
    a.master = master;
    return a;
  };
  const pad = (freq) => {
    const a = ensure();
    if (!a.ctx) return;
    const t = a.ctx.currentTime;
    const o = a.ctx.createOscillator();
    const g = a.ctx.createGain();
    o.type = "triangle";
    o.frequency.value = freq;
    o.connect(g);
    g.connect(a.master);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.start(t);
    o.stop(t + 0.55);
  };
  const stopAmbientFade = () => {
    if (ambient.current.fade) {
      cancelAnimationFrame(ambient.current.fade);
      ambient.current.fade = 0;
    }
  };
  const fadeAmbient = (target, done) => {
    const el = ambient.current.el;
    if (!el) {
      if (done) done();
      return;
    }
    stopAmbientFade();
    const startVolume = el.volume;
    const startedAt = performance.now();
    const duration = 420;
    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      el.volume = startVolume + (target - startVolume) * progress;
      if (progress < 1) {
        ambient.current.fade = requestAnimationFrame(tick);
        return;
      }
      ambient.current.fade = 0;
      if (done) done();
    };
    ambient.current.fade = requestAnimationFrame(tick);
  };
  const teardownAmbient = () => {
    const el = ambient.current.el;
    if (!el) return;
    stopAmbientFade();
    try {
      el.pause();
      el.removeAttribute("src");
      el.load();
    } catch (e) {}
    ambient.current.el = null;
  };
  const chooseAmbientTrack = () => {
    if (!AMBIENT_TRACKS.length) return null;
    if (AMBIENT_TRACKS.length === 1) return AMBIENT_TRACKS[0];
    const options = AMBIENT_TRACKS.filter(
      (src) => src !== lastAmbientSrc.current,
    );
    return options[(Math.random() * options.length) | 0] || AMBIENT_TRACKS[0];
  };
  const stopAmbient = () => {
    setAmbientOn(false);
    if (!ambient.current.el) return;
    fadeAmbient(0, teardownAmbient);
  };
  const startAmbient = () => {
    const src = chooseAmbientTrack();
    if (!src) return;
    teardownAmbient();
    const el = new window.Audio();
    el.preload = "none";
    el.loop = true;
    el.volume = 0;
    el.src = src;
    ambient.current.el = el;
    lastAmbientSrc.current = src;
    setAmbientOn(true);
    const fail = () => {
      if (ambient.current.el === el) {
        teardownAmbient();
        setAmbientOn(false);
      }
    };
    el.addEventListener("error", fail, { once: true });
    const started = el.play();
    if (started && typeof started.then === "function") {
      started.then(() => fadeAmbient(AMBIENT_VOLUME)).catch(fail);
      return;
    }
    fadeAmbient(AMBIENT_VOLUME);
  };
  const toggleAmbient = () => {
    if (ambientOn) {
      stopAmbient();
      return;
    }
    startAmbient();
  };

  const go = (target) => {
    if (target === screen) return;
    setWarpKey((k) => k + 1);
    setScreen(target);
  };

  const renderZone = (id) => {
    if (id === "listen") return <Listen isMobile={isMobile} />;
    if (id === "explore") return <Explore notes={notes} />;
    if (id === "create") return <Create />;
    if (id === "play") return <PlayZone />;
    if (id === "collect") return <Collect />;
    if (id === "follow") return <Follow isMobile={isMobile} />;
    return null;
  };

  const accent = ZONES[screen]?.accent || "#e8e8ea";
  const compactMobileTabs = size.w < 410;

  useEffect(() => () => teardownAmbient(), []);

  /* --------------------------- desktop compass --------------------------- */
  const EASE = "cubic-bezier(.66,0,.2,1)";
  const renderDesktop = () => {
    if (screen === "hub") {
      return (
        <ConstellationLanding
          go={go}
          ambientOn={ambientOn}
          onAmbientToggle={toggleAmbient}
          isMobile={false}
        />
      );
    }
    const cur = DESK_POS[screen] || DESK_POS.listen;
    const world = {
      position: "absolute",
      inset: 0,
      zIndex: 1,
      willChange: "transform",
      transform: `translate3d(${-cur.col * size.w}px, ${-cur.row * size.h}px, 0)`,
      transition: reduced ? "none" : `transform 1.05s ${EASE}`,
    };
    const roomStyle = (id) => {
      const pos = DESK_POS[id];
      const on = id === screen;
      return {
        position: "absolute",
        left: `${pos.col * size.w}px`,
        top: `${pos.row * size.h}px`,
        width: `${size.w}px`,
        height: `${size.h}px`,
        opacity: on ? 1 : 0.25,
        transform: on ? "scale(1)" : "scale(0.93)",
        transition: reduced
          ? "none"
          : `opacity .5s ease, transform 1.05s ${EASE}`,
      };
    };
    return (
      <>
        <div style={world}>
          {ORDER.map((id) => (
            <div key={id} style={roomStyle(id)}>
              <div style={{ height: "100%", overflowY: "auto" }}>
                <div
                  style={{
                    minHeight: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "80px 24px 100px",
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      maxWidth: id === "create" || id === "play" ? 960 : 620,
                    }}
                  >
                    {renderZone(id)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <header
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 20px",
            background: "rgba(10,10,12,0.82)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <BrandMark
            onClick={() => go("hub")}
            size="15px"
            style={{ flexShrink: 0, letterSpacing: "0.14em" }}
          />
          <nav
            className="navwrap"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {ORDER.map((id) => {
              const on = id === screen;
              const a = ZONES[id].accent;
              return (
                <button
                  key={id}
                  className="navbtn"
                  onClick={() => go(id)}
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    background: on ? `${a}22` : "transparent",
                    color: on ? a : C.sub,
                    border: `1px solid ${on ? a : C.line}`,
                    borderRadius: 999,
                    padding: "7px 13px",
                    cursor: "pointer",
                  }}
                >
                  {ZONES[id].label}
                </button>
              );
            })}
          </nav>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <AmbientToggle active={ambientOn} onToggle={toggleAmbient} />
          </div>
        </header>
      </>
    );
  };

  /* ---------------------------- mobile world ----------------------------- */
  const renderMobile = () => {
    const inZone = screen !== "hub";
    const z = ZONES[screen] || ZONES.listen;
    const compactMobileHeader = size.w < 410;
    return (
      <>
        {inZone && (
          <div
            style={{
              position: "fixed",
              top: 0,
              zIndex: 20,
              ...FRAME,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              background: "rgba(10,10,12,0.82)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {compactMobileHeader ? (
              <>
                <BrandMark
                  onClick={() => go("hub")}
                  size="13px"
                  style={{ lineHeight: 1, letterSpacing: "0.12em", flexShrink: 0 }}
                />
                <span
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    color: z.accent,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {z.label}
                </span>
                <AmbientToggle
                  active={ambientOn}
                  onToggle={toggleAmbient}
                  compact
                  iconOnly
                />
              </>
            ) : (
              <>
                <BrandMark
                  onClick={() => go("hub")}
                  size="14px"
                  style={{ lineHeight: 1, letterSpacing: "0.12em" }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 11,
                      color: z.accent,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                    }}
                  >
                    {z.label}
                  </span>
                  <AmbientToggle
                    active={ambientOn}
                    onToggle={toggleAmbient}
                    compact
                  />
                </div>
              </>
            )}
          </div>
        )}
        <div
          ref={scrollRef}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div
            className="screen"
            key={screen}
            style={{
              animation: reduced ? "none" : "screenIn .5s ease both",
              minHeight: "100%",
            }}
          >
            {screen === "hub" ? (
              <div
                style={{ ...FRAME, position: "relative", minHeight: "100dvh" }}
              >
                <ConstellationLanding
                  go={go}
                  ambientOn={ambientOn}
                  onAmbientToggle={toggleAmbient}
                  isMobile
                />
              </div>
            ) : (
              <div
                style={{
                  ...FRAME,
                  position: "relative",
                  padding: "70px 22px 150px",
                  boxSizing: "border-box",
                }}
              >
                {renderZone(screen)}
              </div>
            )}
          </div>
        </div>
        {inZone && (
          <div style={{ position: "fixed", bottom: 0, zIndex: 20, ...FRAME }}>
            <div
              style={{
                display: "flex",
                background: "rgba(14,14,17,0.97)",
                borderTop: `1px solid ${C.line}`,
                padding: "8px 6px calc(8px + env(safe-area-inset-bottom))",
              }}
            >
              {ORDER.map((id) => {
                const on = id === screen;
                const a = ZONES[id].accent;
                const Ic = ICON[id];
                return (
                  <button
                    key={id}
                    onClick={() => go(id)}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: compactMobileTabs ? 0 : 4,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: compactMobileTabs ? "6px 0" : "4px 0",
                      color: on ? a : C.sub,
                    }}
                    aria-label={ZONES[id].label}
                  >
                    <Ic size={20} />
                    {!compactMobileTabs && (
                      <span
                        style={{
                          fontFamily: "'Space Mono', monospace",
                          fontSize: 8.5,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        {ZONES[id].label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  };

  if (!mounted)
    return <div style={{ position: "fixed", inset: 0, background: C.bg }} />;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: C.bg,
        color: C.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@200;400;700&family=Space+Mono:wght@400;700&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        .saur { font-weight:700; position:relative; display:inline-block; animation: drift 10s ease infinite; }
        .saur::before{ content:'SAUR'; position:absolute; left:0; top:0; color:rgba(59,139,255,.5); opacity:0; pointer-events:none; mix-blend-mode:screen; animation:bSp 4s ease infinite; }
        .saur::after{ content:'SAUR'; position:absolute; left:0; top:0; color:#fff; text-shadow:0 0 4px #fff,0 0 15px rgba(0,204,80,.6),0 0 40px rgba(59,139,255,.3); opacity:0; pointer-events:none; animation:bSh 4s ease infinite; }
        @keyframes drift { 0%,100%{color:#3b8bff;text-shadow:0 0 20px rgba(59,139,255,.15)} 25%{color:#8b5cf6;text-shadow:0 0 20px rgba(139,92,246,.15)} 50%{color:#a06820;text-shadow:0 0 20px rgba(160,104,32,.2)} 75%{color:#00cc50;text-shadow:0 0 22px rgba(0,204,80,.18)} }
        @keyframes bSh{0%,100%{opacity:0;transform:translate(0,0)}8%{opacity:0}8.1%{opacity:1;transform:translate(3px,-2px)}8.2%{opacity:0;transform:translate(-2px,1px)}8.3%{opacity:1;transform:translate(-3px,-1px)}8.5%{opacity:1;transform:translate(1px,-2px)}8.7%{opacity:.8;transform:translate(-2px,0)}9%{opacity:.5}9.2%{opacity:0;transform:translate(0,0)}32%{opacity:0}32.1%{opacity:1;transform:translate(-3px,1px)}32.3%{opacity:1;transform:translate(3px,1px)}32.5%{opacity:.9;transform:translate(1px,-1px)}32.6%{opacity:0}58%{opacity:0}58.1%{opacity:1;transform:translate(2px,-1px)}58.25%{opacity:0;transform:translate(-3px,2px)}58.4%{opacity:.7}58.5%{opacity:0}80%{opacity:0}80.1%{opacity:1;transform:translate(-2px,-2px)}80.3%{opacity:1;transform:translate(-1px,2px)}80.5%{opacity:.6}80.9%{opacity:0;transform:translate(0,0)}}
        @keyframes bSp{0%,100%{opacity:0;transform:translate(0,0)}8.1%{opacity:.7;transform:translate(-4px,0);color:rgba(0,204,80,.6)}8.4%{opacity:.5;transform:translate(4px,1px);color:rgba(139,92,246,.5)}9%{opacity:0}32.1%{opacity:.6;transform:translate(3px,-1px);color:rgba(0,204,80,.5)}32.4%{opacity:0}58.1%{opacity:.5;transform:translate(-3px,1px);color:rgba(160,104,32,.5)}58.4%{opacity:0}80.1%{opacity:.7;transform:translate(-4px,0);color:rgba(139,92,246,.5)}80.9%{opacity:0}}
        @keyframes glimpse { 0%{opacity:0;transform:scale(.72) translateY(12px);filter:blur(9px)} 28%{opacity:.85;filter:blur(2px)} 62%{opacity:.7;filter:blur(2px)} 100%{opacity:0;transform:scale(1.16) translateY(-16px);filter:blur(11px)} }
        @keyframes screenIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spinSlow { from{transform:translate(-50%,-50%) rotate(0)} to{transform:translate(-50%,-50%) rotate(360deg)} }
        @keyframes spinReverse { from{transform:translate(-50%,-50%) rotate(360deg)} to{transform:translate(-50%,-50%) rotate(0)} }
        @keyframes nodeFloat { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-10px)} }
        @keyframes ambientPulse { 0%,100%{transform:scale(1);opacity:.85} 50%{transform:scale(1.12);opacity:.42} }
        .constellation-node:hover span:first-child,
        .constellation-node:focus-visible span:first-child { transform:scale(1.06); box-shadow:0 0 34px rgba(255,255,255,.14) }
        .dspbtn:hover,
        .dspbtn:focus-visible { transform:translateY(-1px); border-color:rgba(232,232,234,0.3)!important; box-shadow:inset 0 1px 0 rgba(255,255,255,.05), 0 12px 26px rgba(0,0,0,.24), 0 0 0 1px var(--dsp-accent) }
        .dspbtn:active { transform:translateY(0); background:linear-gradient(180deg, rgba(255,255,255,0.08), rgba(20,20,23,1)) }
        button:focus-visible, input:focus-visible { outline:2px solid ${C.green}; outline-offset:2px; }
        @media (prefers-reduced-motion: reduce){ .saur{animation:none;color:#00cc50} .saur::before,.saur::after{animation:none;opacity:0} .screen{animation:none!important} }
        @media (max-width:560px){ .navbtn{ font-size:9px!important; letter-spacing:0.07em!important; padding:6px 9px!important } }
      `}</style>

      <Dust reduced={reduced} />
      <Warp trigger={warpKey} color={accent} reduced={reduced} />

      {isMobile ? renderMobile() : renderDesktop()}
    </div>
  );
}
