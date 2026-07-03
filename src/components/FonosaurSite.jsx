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
  ChevronRight,
} from "lucide-react";
import { youtubeId } from "@/components/note-media";

/* ============================================================================
 * FONOSAUR — unified responsive site
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
    desc: "The music — and where to hear it",
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
    desc: "Play with the sounds behind the music",
  },
  play: {
    label: "Play",
    accent: C.amber,
    tag: "game",
    desc: "Dino Sling, ready when you are",
  },
  collect: {
    label: "Collect",
    accent: C.bronze,
    tag: "coming soon",
    desc: "Launching with the new EP",
  },
  follow: {
    label: "Follow",
    accent: C.green,
    tag: "updates",
    desc: "Occasional updates",
  },
};
const ORDER = ["listen", "explore", "create", "play", "collect", "follow"];
const MAIN = ["listen", "explore", "create", "play", "collect"];
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
  { g: "linear-gradient(135deg,#2a1d12,#3a2a18)", c: "market · dawn" },
  { g: "linear-gradient(135deg,#10241a,#16342a)", c: "foliage · rain" },
  { g: "linear-gradient(135deg,#1a1828,#241e3a)", c: "records · find" },
  { g: "linear-gradient(135deg,#281418,#3a1a20)", c: "tape · hiss" },
  { g: "linear-gradient(135deg,#122430,#16303a)", c: "water · field" },
  { g: "linear-gradient(135deg,#201810,#2c2414)", c: "crates · brass" },
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

/* ------------------------------------------------------- compass indicator */
function CompassMini({ active }) {
  const points = {
    follow: [29, 12],
    explore: [14, 27],
    listen: [29, 29],
    create: [44, 27],
    play: [20, 45],
    collect: [38, 45],
  };
  const node = (id) => {
    const on = active === id;
    const a = ZONES[id].accent;
    const [x, y] = points[id];
    return (
      <circle
        cx={x}
        cy={y}
        r={on ? 4.2 : 2.4}
        fill={on ? a : "#3a3a40"}
        stroke={on ? a : "none"}
        strokeWidth="1"
        opacity={on ? 1 : 0.8}
      />
    );
  };
  return (
    <svg width="54" height="54" viewBox="0 0 58 58" aria-hidden>
      <line x1="29" y1="29" x2="29" y2="12" stroke="#26262b" strokeWidth="1" />
      <line x1="29" y1="29" x2="14" y2="27" stroke="#26262b" strokeWidth="1" />
      <line x1="29" y1="29" x2="44" y2="27" stroke="#26262b" strokeWidth="1" />
      <line x1="29" y1="29" x2="20" y2="45" stroke="#26262b" strokeWidth="1" />
      <line x1="29" y1="29" x2="38" y2="45" stroke="#26262b" strokeWidth="1" />
      {node("follow")}
      {node("explore")}
      {node("listen")}
      {node("create")}
      {node("play")}
      {node("collect")}
    </svg>
  );
}

function AmbientToggle({ active, onToggle, compact = false }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={active}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? 6 : 8,
        background: active ? "rgba(0,204,80,0.14)" : "rgba(20,20,23,0.7)",
        border: `1px solid ${active ? C.green : C.line}`,
        borderRadius: 999,
        padding: compact ? "8px 11px" : "9px 14px",
        color: active ? C.green : C.sub,
        cursor: "pointer",
        fontFamily: "'Space Mono', monospace",
        fontSize: compact ? 10 : 11,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {active ? <Volume2 size={compact ? 14 : 15} /> : <VolumeX size={compact ? 14 : 15} />}
      <span>{active ? "Ambient On" : "Ambient Off"}</span>
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

function Listen() {
  return (
    <div>
      <Eyebrow color={C.sub}>Traversal EP · 2022 · 6 tracks</Eyebrow>
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
          style={{ border: 0, width: "100%", height: 740 }}
          src="https://bandcamp.com/EmbeddedPlayer/album=2601440823/size=large/bgcol=333333/linkcol=ffffff/artwork=big/tracklist=true/transparent=true/"
          seamless
        >
          <a href="https://fonosaur.bandcamp.com/album/traversal-ep">
            Traversal - EP by Fonosaur
          </a>
        </iframe>
      </div>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 26, justifyContent: "center" }}
      >
        {[
          {
            label: "Spotify",
            href: "https://open.spotify.com/album/2OtQAfwSaabg4yJiWJpD5t",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 17.3c-.2.3-.6.4-1 .2-2.7-1.6-6-2-10-1.1-.4.1-.7-.1-.8-.5-.1-.4.1-.7.5-.8 4.3-1 8-.6 11 1.2.4.2.5.6.3 1zm1.5-3.3c-.3.4-.8.5-1.2.3-3-1.9-7.7-2.4-11.3-1.3-.5.1-1-.1-1.1-.6-.1-.5.1-1 .6-1.1 4.1-1.3 9.2-.7 12.7 1.5.3.2.5.7.3 1.2zm.1-3.4c-3.7-2.2-9.7-2.4-13.2-1.3-.5.2-1.1-.1-1.3-.6-.2-.5.1-1.1.6-1.3 4-1.2 10.6-1 14.8 1.5.5.3.6.9.4 1.4-.3.5-.9.6-1.3.3z"/></svg>,
          },
          {
            label: "Apple Music",
            href: "https://music.apple.com/us/album/traversal-ep/1616402193",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.99 6.07c0-.87-.06-1.74-.24-2.6a5.4 5.4 0 00-1.27-2.24A5.27 5.27 0 0020.24.05C19.4-.06 18.54 0 17.68 0H6.3c-.87 0-1.73.01-2.58.22A5.28 5.28 0 001.5 1.5 5.28 5.28 0 00.22 3.72C.01 4.57 0 5.43 0 6.3v11.4c0 .85.04 1.71.24 2.55a5.35 5.35 0 001.27 2.24c.65.66 1.4 1.1 2.24 1.27.86.2 1.72.24 2.6.24h11.3c.87 0 1.74-.03 2.58-.24a5.35 5.35 0 002.24-1.27c.66-.65 1.1-1.4 1.27-2.24.21-.84.25-1.7.25-2.55V6.07zM17.5 17.97c0 .62-.2 1.17-.56 1.63a2.83 2.83 0 01-1.42.99c-.44.14-.9.2-1.35.16a2.3 2.3 0 01-1.24-.44 2.27 2.27 0 01-.82-1.64c-.04-.6.12-1.15.45-1.62.33-.47.78-.8 1.32-1l1.12-.4V10.5l-5.5 1.7v6.43c0 .63-.19 1.19-.55 1.65a2.84 2.84 0 01-1.43 1c-.44.14-.9.19-1.35.15a2.3 2.3 0 01-1.24-.44A2.3 2.3 0 014.7 19.4c-.04-.6.12-1.16.45-1.63.34-.47.79-.8 1.33-1l1.12-.42V8.82c0-.4.1-.76.33-1.07.22-.3.52-.5.87-.58l6.7-1.94c.2-.06.4-.06.58 0 .19.04.35.14.46.29a.8.8 0 01.17.5l-.01 11.95z"/></svg>,
          },
          {
            label: "Amazon Music",
            href: "https://music.amazon.co.uk/albums/B09WM13NS3",
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.045 18.02c.07-.116.196-.048.283.003 2.66 1.55 5.57 2.37 8.674 2.37 2.518 0 5.208-.6 7.592-1.74.122-.054.284-.116.384.013.1.13.012.303-.09.4-1.506 1.15-3.841 2.09-6.104 2.667-2.264.577-4.378.67-6.382.296C2.59 21.69 1.12 21.12.05 20.51c-.12-.07-.133-.3-.005-.49zm14.19-1.2c-.18-.22-.424-.17-.625-.088-.67.27-1.386.42-1.96.42-.756 0-1.14-.35-1.14-.95 0-1.29 1.44-1.59 2.89-1.59h.37v-.38c0-.44-.01-.88-.16-1.2-.15-.33-.49-.54-.95-.54-.14 0-.3.01-.45.05-.39.09-.4.45-.56.45-.14 0-.53-.35-.53-.65 0-.54.93-1.08 2.04-1.08 1.63 0 2.24.87 2.24 2.29v2.52c0 .36.2.53.2.76 0 .18-.63.66-.88.66-.18 0-.33-.13-.43-.32l-.07-.17zm-1.33-2.2h-.26c-.84 0-1.68.2-1.68.96 0 .44.27.68.7.68.45 0 .88-.27 1.15-.64l.09-.14v-.86zm5.72 2.93c-.25-.03-.46-.16-.58-.39l-1.86-3.55.02-.05 1.7-2.83c.1-.17.26-.3.49-.3.28 0 .6.22.6.47 0 .08-.03.16-.08.25l-1.36 2.16 1.6 3.14c.04.08.06.15.06.22 0 .26-.3.55-.55.55-.02 0-.03 0-.04 0z"/><path d="M21.7 19.56c-1.89 1.4-4.63 2.15-6.99 2.15-3.31 0-6.29-1.22-8.54-3.26-.18-.16-.02-.38.19-.26 2.43 1.42 5.44 2.27 8.55 2.27 2.1 0 4.4-.43 6.52-1.33.32-.14.59.21.27.43z"/><path d="M22.58 18.54c-.24-.31-1.6-.15-2.2-.07-.19.02-.21-.14-.05-.26 1.08-.76 2.86-.54 3.06-.28.21.25-.05 2.01-.81 2.85-.15.13-.29.06-.22-.11.22-.54.71-1.75.22-2.13z"/></svg>,
          },
          {
            label: "Bandcamp",
            href: "https://fonosaur.bandcamp.com/album/traversal-ep",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M0 18.75l7.44-13.5H24l-7.44 13.5z"/></svg>,
          },
          {
            label: "YouTube",
            href: "https://www.youtube.com/@fonosaur",
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.3 31.3 0 000 12a31.3 31.3 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1c.4-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>,
          },
        ].map((d) => (
          <a
            key={d.label}
            href={d.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={d.label}
            title={d.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 38,
              height: 38,
              color: C.sub,
              border: `1px solid ${C.line}`,
              borderRadius: 999,
              textDecoration: "none",
            }}
          >
            {d.icon}
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
          New music is on the way. Follow to hear it first.
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
      <Eyebrow color={C.blue}>Explore · field notes</Eyebrow>
      <h2
        style={{
          fontFamily: "'Unbounded', sans-serif",
          fontWeight: 200,
          fontSize: "clamp(28px,8vw,42px)",
          margin: "0 0 22px",
          lineHeight: 1.05,
        }}
      >
        Things I've been exploring
      </h2>
      {false && (
      <button
        onClick={onGame}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          textAlign: "left",
          cursor: "pointer",
          background: "rgba(59,139,255,0.08)",
          border: `1px solid ${C.blue}`,
          borderRadius: 12,
          padding: "16px 18px",
          marginBottom: 24,
        }}
      >
        <Gamepad2 size={22} color={C.blue} />
        <span style={{ flex: 1 }}>
          <span
            style={{
              display: "block",
              fontSize: 15,
              fontWeight: 600,
              color: C.text,
            }}
          >
            Dino Sling
          </span>
          <span style={{ display: "block", fontSize: 13, color: C.sub }}>
            A quick game — you against the computer.
          </span>
        </span>
        <span style={{ fontSize: 13, color: C.blue, fontWeight: 600 }}>
          Play
        </span>
      </button>
      )}
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
                  ? " · " + n.entry.tags.join(" · ")
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
                <div style={{ marginBottom: 12, borderRadius: 10, overflow: "hidden" }}>
                  {n.entry.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={n.entry.cover} alt="" style={{ width: "100%", display: "block", borderRadius: 10 }} />
                  ) : n.entry.leadMedia?.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={n.entry.leadMedia.src} alt="" style={{ width: "100%", display: "block", borderRadius: 10 }} />
                  ) : leadYouTubeId ? (
                    <iframe
                      title={n.entry.title}
                      src={`https://www.youtube-nocookie.com/embed/${leadYouTubeId}`}
                      style={{ width: "100%", aspectRatio: "16/9", border: 0, borderRadius: 10 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : n.entry.leadMedia?.type === "video" ? (
                    <video src={n.entry.leadMedia.src} controls style={{ width: "100%", borderRadius: 10 }} />
                  ) : null}
                </div>
              )}
              {n.entry.summary && (
                <div style={{ fontSize: 15, color: C.sub, lineHeight: 1.6, marginBottom: 8 }}>
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
                Read more →
              </a>
              <div style={{ borderBottom: `1px solid ${C.line}`, marginTop: 20 }} />
            </article>
          );
          })
        ) : (
          <p style={{ color: C.sub, fontSize: 14 }}>
            First field notes coming soon.
          </p>
        )}
      </div>
    </div>
  );
}

function Create() {
  return (
    <div>
      <Eyebrow color={C.purple}>Create Â· instrument</Eyebrow>
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
        Tap through the textures and build a quick loop from the sounds behind
        the record.
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
      <Eyebrow color={C.amber}>Play Â· Dino Sling</Eyebrow>
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
        A quick sling-shot duel against the computer. Easy to start, hard to
        stop.
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
        Coming soon
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
        Merch soon come.
      </p>
    </div>
  );
}

function Follow() {
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
        Stay in touch
      </h2>
      <p
        style={{
          color: C.sub,
          fontSize: 15,
          lineHeight: 1.6,
          marginBottom: 26,
        }}
      >
        I'll only email when there's new music, Field Notes, or something worth
        sharing.
      </p>
      <form
        action="https://buttondown.com/api/emails/embed-subscribe/fonosaur"
        method="post"
        target="_blank"
        style={{
          display: "flex",
          gap: 8,
          maxWidth: 440,
          margin: "0 auto",
        }}
      >
        <input
          type="email"
          name="email"
          placeholder="you@email.com"
          required
          style={{
            flex: 1,
            background: C.panel,
            border: `1px solid ${C.line}`,
            borderRadius: 10,
            padding: "14px 15px",
            color: C.text,
            fontSize: 15,
            outline: "none",
          }}
        />
        <button
          type="submit"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: C.green,
            color: C.bg,
            border: "none",
            borderRadius: 10,
            padding: "0 18px",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Mail size={16} /> Join
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------- mobile hub */
function Hub({ go }) {
  return (
    <div
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "70px 22px 40px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 34 }}>
        <h1
          style={{
            fontFamily: "'Unbounded', sans-serif",
            fontSize: "clamp(40px,15vw,68px)",
            margin: 0,
            lineHeight: 0.92,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontWeight: 200 }}>FONO</span>
          <span className="saur">SAUR</span>
        </h1>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {MAIN.map((id) => {
          const z = ZONES[id];
          const Ic = ICON[id];
          return (
            <button
              key={id}
              onClick={() => go(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                textAlign: "left",
                cursor: "pointer",
                background: C.panel,
                border: `1px solid ${C.line}`,
                borderLeft: `2px solid ${z.accent}`,
                borderRadius: 14,
                padding: "16px",
              }}
            >
              <span
                style={{
                  display: "flex",
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  background: `${z.accent}1c`,
                  color: z.accent,
                  flexShrink: 0,
                }}
              >
                <Ic size={19} />
              </span>
              <span style={{ flex: 1 }}>
                <span
                  style={{
                    display: "block",
                    fontFamily: "'Unbounded', sans-serif",
                    fontWeight: 400,
                    fontSize: 19,
                    color: C.text,
                  }}
                >
                  {z.label}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: 13,
                    color: C.sub,
                    marginTop: 2,
                  }}
                >
                  {z.desc}
                </span>
              </span>
              <ChevronRight size={18} color={C.sub} />
            </button>
          );
        })}
      </div>
      <button
        onClick={() => go("follow")}
        style={{
          marginTop: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          cursor: "pointer",
          background: "rgba(0,204,80,0.08)",
          border: `1px solid ${C.green}`,
          color: C.green,
          borderRadius: 14,
          padding: "14px",
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "'Space Mono', monospace",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        <Mail size={15} /> Follow
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------- app */
const isMobileNow = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width:768px)").matches;

export default function FonosaurSite({ notes = [] }) {
  const [isMobile, setIsMobile] = useState(isMobileNow);
  const [screen, setScreen] = useState(() =>
    isMobileNow() ? "hub" : "listen",
  );
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
      setScreen((s) => (m ? s : s === "hub" ? "listen" : s));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
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
    const options = AMBIENT_TRACKS.filter((src) => src !== lastAmbientSrc.current);
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
      started.then(() => fadeAmbient(0.34)).catch(fail);
      return;
    }
    fadeAmbient(0.34);
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
    if (id === "listen") return <Listen />;
    if (id === "explore") return <Explore notes={notes} />;
    if (id === "create") return <Create />;
    if (id === "play") return <PlayZone />;
    if (id === "collect") return <Collect />;
    if (id === "follow") return <Follow />;
    return null;
  };

  const accent = ZONES[screen]?.accent || "#e8e8ea";
  const compactMobileTabs = size.w < 410;

  useEffect(() => () => teardownAmbient(), []);

  /* --------------------------- desktop compass --------------------------- */
  const EASE = "cubic-bezier(.66,0,.2,1)";
  const renderDesktop = () => {
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
          }}
        >
          <span
            style={{
              fontFamily: "'Unbounded', sans-serif",
              fontSize: 15,
              letterSpacing: "0.14em",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span style={{ fontWeight: 200 }}>FONO</span>
            <span style={{ fontWeight: 700 }}>SAUR</span>
          </span>
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
              gap: 12,
              flexShrink: 0,
            }}
          >
            <CompassMini active={screen} />
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
              background:
                "linear-gradient(180deg,rgba(10,10,12,0.92),rgba(10,10,12,0))",
            }}
          >
            <button
              onClick={() => go("hub")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                fontFamily: "'Unbounded', sans-serif",
                fontSize: 14,
                letterSpacing: "0.12em",
                color: C.text,
                whiteSpace: "nowrap",
                lineHeight: 1,
              }}
            >
              <span style={{ fontWeight: 200 }}>FONO</span>
              <span style={{ fontWeight: 700 }}>SAUR</span>
            </button>
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
                <Hub go={go} />
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
        {!inZone && (
          <div
            style={{
              position: "fixed",
              top: 16,
              zIndex: 20,
              right: "max(16px, calc(50% - 240px + 16px))",
            }}
          >
            <AmbientToggle active={ambientOn} onToggle={toggleAmbient} compact />
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
