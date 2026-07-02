"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Mail,
  ShoppingBag,
  Gamepad2,
  Disc,
  Share2,
  Headphones,
  Compass,
  ChevronRight,
  X,
} from "lucide-react";

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
const ORDER = ["listen", "explore", "create", "collect", "follow"];
const MAIN = ["listen", "explore", "create", "collect"];
const ICON = {
  listen: Headphones,
  explore: Compass,
  create: Disc,
  collect: ShoppingBag,
  follow: Mail,
};
// desktop cross positions
const DESK_POS = {
  listen: { col: 0, row: 0 },
  explore: { col: -1, row: 0 },
  create: { col: 1, row: 0 },
  collect: { col: 0, row: 1 },
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
  const node = (id, x, y) => {
    const on = active === id;
    const a = ZONES[id].accent;
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
      <line x1="29" y1="14" x2="29" y2="44" stroke="#26262b" strokeWidth="1" />
      <line x1="14" y1="29" x2="44" y2="29" stroke="#26262b" strokeWidth="1" />
      {node("follow", 29, 14)} {node("collect", 29, 44)}
      {node("explore", 14, 29)} {node("create", 44, 29)}{" "}
      {node("listen", 29, 29)}
    </svg>
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

function Listen({ onPlay, playing }) {
  const tracks = [
    "Heavy",
    "Loving Woman",
    "Engolo",
    "I Know",
    "Our City",
    "Come Home",
  ];
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
      <button
        onClick={onPlay}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 9,
          background: C.text,
          color: C.bg,
          border: "none",
          borderRadius: 999,
          padding: "12px 22px",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          marginBottom: 24,
        }}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
        {playing ? "Pause" : "Play the EP"}
      </button>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
          border: `1px solid ${C.line}`,
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: 22,
        }}
      >
        {tracks.map((t, i) => (
          <div
            key={t}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 16px",
              background: C.panel,
            }}
          >
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                color: C.sub,
                fontSize: 12,
                width: 18,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span style={{ fontSize: 15 }}>{t}</span>
          </div>
        ))}
      </div>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 26 }}
      >
        {[
          {
            label: "Spotify",
            href: "https://open.spotify.com/album/2OtQAfwSaabg4yJiWJpD5t",
          },
          {
            label: "Apple Music",
            href: "https://music.apple.com/us/album/traversal-ep/1616402193",
          },
          {
            label: "Amazon Music",
            href: "https://music.amazon.co.uk/albums/B09WM13NS3",
          },
          {
            label: "Bandcamp",
            href: "https://fonosaur.bandcamp.com/album/traversal-ep",
          },
          { label: "YouTube", href: "https://www.youtube.com/@fonosaur" },
        ].map((d) => (
          <a
            key={d.label}
            href={d.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13,
              color: C.sub,
              border: `1px solid ${C.line}`,
              borderRadius: 999,
              padding: "9px 15px",
              textDecoration: "none",
            }}
          >
            {d.label}
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

function Explore({ onGame, notes = [] }) {
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 18,
        }}
      >
        {notes.length ? (
          notes.map((n) => (
            <a
              key={n.slug}
              href={`/explore/${n.slug}`}
              style={{
                textDecoration: "none",
                background: C.panel,
                border: `1px solid ${C.line}`,
                borderRadius: 12,
                padding: "16px 18px",
                display: "block",
              }}
            >
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
                  fontSize: 16,
                  fontWeight: 600,
                  marginBottom: 6,
                  color: C.text,
                }}
              >
                {n.entry.title}
              </div>
              {n.entry.summary && (
                <div style={{ fontSize: 14, color: C.sub, lineHeight: 1.55 }}>
                  {n.entry.summary}
                </div>
              )}
            </a>
          ))
        ) : (
          <p style={{ color: C.sub, fontSize: 14 }}>
            First field notes coming soon.
          </p>
        )}
      </div>
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
    </div>
  );
}

function Create() {
  return (
    <div
      style={{
        width: "100%",
        height: "min(82vh, 780px)",
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
        Tees, hoodies, football shirts, caps, prints, notebooks, mugs and totes
        — launching with the new EP. Follow to hear when it lands.
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
          marginBottom: 16,
          maxWidth: 440,
          margin: "0 auto 16px",
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
      <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
        {[
          {
            label: "Spotify",
            href: "https://open.spotify.com/album/2OtQAfwSaabg4yJiWJpD5t",
          },
          { label: "Bandcamp", href: "https://fonosaur.bandcamp.com" },
          { label: "Instagram", href: "#" },
        ].map((s) => (
          <a
            key={s.label}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13,
              color: C.sub,
              border: `1px solid ${C.line}`,
              borderRadius: 999,
              padding: "9px 15px",
              textDecoration: "none",
            }}
          >
            {s.label}
          </a>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- mobile hub */
function Hub({ go, onPlay, playing }) {
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
        <button
          onClick={onPlay}
          style={{
            marginTop: 22,
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            background: C.text,
            color: C.bg,
            border: "none",
            borderRadius: 999,
            padding: "11px 22px",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}{" "}
          {playing ? "Pause" : "Enter the world"}
        </button>
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
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0.18);
  const [warpKey, setWarpKey] = useState(0);
  const [activeKey, setActiveKey] = useState(null);
  const [gameOpen, setGameOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [size, setSize] = useState(() => ({
    w: typeof window !== "undefined" ? window.innerWidth : 1200,
    h: typeof window !== "undefined" ? window.innerHeight : 800,
  }));
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const audio = useRef({
    ctx: null,
    master: null,
    drone: [],
    droneGain: null,
    on: false,
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
  useEffect(() => {
    const id = setInterval(
      () => setProgress((p) => (playing ? (p + 0.0016) % 1 : p)),
      120,
    );
    return () => clearInterval(id);
  }, [playing]);
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
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);
    a.ctx = ctx;
    a.master = master;
    return a;
  };
  const startDrone = () => {
    const a = ensure();
    if (!a.ctx || a.on) return;
    try {
      a.ctx.resume();
    } catch (e) {}
    const g = a.ctx.createGain();
    g.gain.value = 0;
    g.connect(a.master);
    const lp = a.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 620;
    lp.connect(g);
    a.drone = [55, 82.4, 110].map((f, i) => {
      const o = a.ctx.createOscillator();
      o.type = i === 0 ? "sine" : "triangle";
      o.frequency.value = f;
      o.detune.value = (i - 1) * 5;
      o.connect(lp);
      o.start();
      return o;
    });
    const lfo = a.ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lg = a.ctx.createGain();
    lg.gain.value = 0.025;
    lfo.connect(lg);
    lg.connect(g.gain);
    lfo.start();
    g.gain.setTargetAtTime(0.07, a.ctx.currentTime, 1.6);
    a.droneGain = g;
    a.on = true;
  };
  const duck = (on) => {
    const a = audio.current;
    if (a.droneGain && a.ctx)
      a.droneGain.gain.setTargetAtTime(
        on ? 0.015 : 0.07,
        a.ctx.currentTime,
        0.2,
      );
  };
  const siren = () => {
    const a = ensure();
    if (!a.ctx) return;
    const t = a.ctx.currentTime;
    const o = a.ctx.createOscillator();
    const bp = a.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 760;
    bp.Q.value = 7;
    const g = a.ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(820, t);
    o.frequency.exponentialRampToValueAtTime(280, t + 0.5);
    o.connect(bp);
    bp.connect(g);
    g.connect(a.master);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.start(t);
    o.stop(t + 0.65);
  };
  const travel = () => {
    const a = ensure();
    if (!a.ctx) return;
    const t = a.ctx.currentTime;
    const dur = 1.2;
    const buf = a.ctx.createBuffer(
      1,
      Math.floor(a.ctx.sampleRate * dur),
      a.ctx.sampleRate,
    );
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = a.ctx.createBufferSource();
    src.buffer = buf;
    const bp = a.ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.1;
    bp.frequency.setValueAtTime(280, t);
    bp.frequency.exponentialRampToValueAtTime(2200, t + 0.55);
    bp.frequency.exponentialRampToValueAtTime(360, t + dur);
    const ng = a.ctx.createGain();
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(0.1, t + 0.18);
    ng.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(bp);
    bp.connect(ng);
    ng.connect(a.master);
    src.start(t);
    src.stop(t + dur);
    const vo = a.ctx.createOscillator();
    const vg = a.ctx.createGain();
    vo.type = "sine";
    vo.frequency.setValueAtTime(196, t);
    vo.frequency.linearRampToValueAtTime(262, t + dur * 0.7);
    vg.gain.setValueAtTime(0, t);
    vg.gain.linearRampToValueAtTime(0.04, t + 0.25);
    vg.gain.exponentialRampToValueAtTime(0.001, t + dur);
    vo.connect(vg);
    vg.connect(a.master);
    vo.start(t);
    vo.stop(t + dur);
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
  const togglePlay = () => {
    startDrone();
    setPlaying((p) => !p);
    if (audio.current.droneGain)
      audio.current.droneGain.gain.setTargetAtTime(
        playing ? 0 : 0.07,
        audio.current.ctx.currentTime,
        0.3,
      );
  };
  const toggleMute = () => {
    setMuted((m) => {
      const nm = !m;
      if (audio.current.master)
        audio.current.master.gain.setTargetAtTime(
          nm ? 0 : 0.5,
          audio.current.ctx.currentTime,
          0.1,
        );
      return nm;
    });
  };

  const go = (target) => {
    if (target === screen) return;
    startDrone();
    if (!playing) setPlaying(true);
    siren();
    travel();
    setWarpKey((k) => k + 1);
    setScreen(target);
  };
  const openGame = () => {
    setGameOpen(true);
    duck(true);
  };
  const closeGame = () => {
    setGameOpen(false);
    duck(false);
  };

  const renderZone = (id) => {
    if (id === "listen")
      return <Listen onPlay={togglePlay} playing={playing} />;
    if (id === "explore") return <Explore onGame={openGame} notes={notes} />;
    if (id === "create") return <Create />;
    if (id === "collect") return <Collect />;
    if (id === "follow") return <Follow />;
    return null;
  };

  const accent = ZONES[screen]?.accent || "#e8e8ea";
  const mm = String(Math.floor((progress * 210) / 60)).padStart(2, "0");
  const ss = String(Math.floor((progress * 210) % 60)).padStart(2, "0");

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
                      maxWidth: id === "create" ? 960 : 620,
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
              gap: 10,
              flexShrink: 0,
            }}
          >
            <CompassMini active={screen} />
            <button
              onClick={toggleMute}
              style={{
                display: "flex",
                background: "rgba(20,20,23,0.7)",
                border: `1px solid ${C.line}`,
                borderRadius: 10,
                padding: 9,
                color: C.sub,
                cursor: "pointer",
              }}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </header>
        <div
          style={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 8,
            width: "min(440px, calc(100vw - 32px))",
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(18,18,21,0.94)",
            border: `1px solid ${C.line}`,
            borderRadius: 14,
            padding: "10px 14px",
          }}
        >
          <button
            onClick={togglePlay}
            style={{
              display: "flex",
              background: C.text,
              color: C.bg,
              border: "none",
              borderRadius: 999,
              padding: 8,
              cursor: "pointer",
            }}
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 5,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Engolo — FONOSAUR
              </span>
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  color: C.sub,
                  marginLeft: 8,
                }}
              >
                {mm}:{ss}
              </span>
            </div>
            <div
              style={{
                height: 3,
                background: C.line,
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress * 100}%`,
                  background: accent,
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        </div>
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
                fontFamily: "'Unbounded', sans-serif",
                fontSize: 14,
                letterSpacing: "0.12em",
                color: C.text,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontWeight: 200 }}>FONO</span>
              <span style={{ fontWeight: 700 }}>SAUR</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
              <button
                onClick={toggleMute}
                style={{
                  display: "flex",
                  background: "transparent",
                  border: "none",
                  color: C.sub,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
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
                <Hub go={go} onPlay={togglePlay} playing={playing} />
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
            {playing && (
              <div
                style={{
                  margin: "0 12px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  background: "rgba(18,18,21,0.96)",
                  border: `1px solid ${C.line}`,
                  borderRadius: 12,
                  padding: "9px 12px",
                }}
              >
                <button
                  onClick={togglePlay}
                  style={{
                    display: "flex",
                    background: C.text,
                    color: C.bg,
                    border: "none",
                    borderRadius: 999,
                    padding: 7,
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  {playing ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      Engolo — FONOSAUR
                    </span>
                    <span
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 10,
                        color: C.sub,
                        marginLeft: 8,
                      }}
                    >
                      {mm}:{ss}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 2.5,
                      background: C.line,
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${progress * 100}%`,
                        background: z.accent,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
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
                      gap: 4,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px 0",
                      color: on ? a : C.sub,
                    }}
                  >
                    <Ic size={20} />
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
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {!inZone && (
          <button
            onClick={toggleMute}
            style={{
              position: "fixed",
              top: 16,
              zIndex: 20,
              right: "max(16px, calc(50% - 240px + 16px))",
              display: "flex",
              background: "rgba(20,20,23,0.7)",
              border: `1px solid ${C.line}`,
              borderRadius: 10,
              padding: 9,
              color: C.sub,
              cursor: "pointer",
            }}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
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

      {gameOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: C.bg,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              borderBottom: `1px solid ${C.line}`,
            }}
          >
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 12,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: C.blue,
              }}
            >
              Dino Sling
            </span>
            <button
              onClick={closeGame}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: `1px solid ${C.line}`,
                color: C.text,
                borderRadius: 999,
                padding: "7px 13px",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              <X size={15} /> Close
            </button>
          </div>
          <iframe
            title="Dino Sling"
            src="/dino-sling.html"
            sandbox="allow-scripts allow-same-origin"
            style={{ flex: 1, width: "100%", border: 0, background: "#000" }}
          />
        </div>
      )}
    </div>
  );
}
