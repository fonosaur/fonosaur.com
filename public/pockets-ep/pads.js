// FS86 EP player, Stage 2: audio-reactive pads.
//
// Listens to the player's single audio graph through ONE AnalyserNode hung
// off FS86EP.engine.output as a side branch (output -> destination is left
// exactly as it is). Per-band spectral flux against an adaptive threshold
// fires discrete "taps" on pads; each tap flashes and decays.
//
// Visual only: no audio, transport or LCD changes. Everything is derived
// live from the audio; there is no per-track data.
(() => {
  "use strict";

  // ======================= TUNING =======================
  const TUNING = {
    // Analyser
    FFT_SIZE: 512,
    SMOOTHING: 0.6, // analyser smoothingTimeConstant (0..0.99)

    // Bands, bottom row first. Hz edges; `row` is the grid row (0 = top).
    // Colours are the FS86 palette.
    BANDS: [
      { name: "low", lo: 40, hi: 160, row: 3, color: "#a06820" }, // kick / bass
      { name: "lowmid", lo: 160, hi: 600, row: 2, color: "#8b5cf6" }, // snare body / low vox
      { name: "mid", lo: 600, hi: 3500, row: 1, color: "#00cc50" }, // snare crack / vox / keys
      { name: "high", lo: 5000, hi: 15000, row: 0, color: "#3b8bff" }, // hats / shakers
    ],

    // Onset detection
    SENSITIVITY: 1.5, // threshold = rolling mean flux * SENSITIVITY + MIN_FLUX. Lower = more hits.
    MIN_FLUX: 0.012, // absolute floor so near-silence never triggers (0..1 energy units)
    THRESHOLD_WINDOW_S: 0.5, // time constant of the rolling flux average
    BAND_COOLDOWN_MS: 90, // min gap between onsets in one band

    // Hits
    HIT_MIN_LEVEL: 0.55, // weakest onset still flashes to this; strongest = 1
    DECAY_MS: 200, // time for a flash to fade to ~5%
    MAX_ACTIVE_HITS: 6, // max pads above half brightness at once
    MAX_FLASHES_PER_SEC_PER_PAD: 3, // photosensitivity cap (hard limit)
    PRESS_PX: 2, // pads dip like they were tapped (0 to disable)

    // Idle glow on recently active pads
    IDLE_LEVEL: 0.09, // kept well below HIT_MIN_LEVEL
    IDLE_HOLD_S: 2.5, // how long a pad stays "alive" after its last hit

    // prefers-reduced-motion overrides
    REDUCED: {
      MAX_LEVEL: 0.4,
      ATTACK_MS: 140, // fade in instead of flashing
      DECAY_MS: 700,
      MAX_FLASHES_PER_SEC_PER_PAD: 1,
      PRESS_PX: 0,
    },
  };
  // =====================================================

  const P = window.FS86EP;
  if (!P || !P.engine || !P.pads) return;
  const { engine, pads } = P;
  const audio = engine.audio;
  const grid = pads[0] && pads[0].parentElement;

  const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = reducedMq.matches;
  const onReducedChange = (e) => (reduced = e.matches);
  if (reducedMq.addEventListener) reducedMq.addEventListener("change", onReducedChange);
  else if (reducedMq.addListener) reducedMq.addListener(onReducedChange);

  // ---------- pads -> bands ----------
  const COLS = 4;
  const padState = pads.map((el, i) => ({
    el,
    glow: el.querySelector(".glow"),
    band: -1,
    level: 0, // current hit brightness
    target: 0, // reduced-motion attack target
    activity: 0, // idle "alive" amount 0..1
    lastFlash: -Infinity,
    shownLevel: -1, // last values written to the DOM
    shownPress: -1,
  }));

  const bands = TUNING.BANDS.map((b, bi) => {
    const group = [];
    for (let c = 0; c < COLS; c++) {
      const p = padState[b.row * COLS + c];
      if (!p) continue;
      p.band = bi;
      group.push(p);
    }
    return {
      ...b,
      group,
      order: [],
      lastPad: null,
      binLo: 0,
      binHi: 0,
      energy: 0,
      prevEnergy: -1,
      fluxMean: 0,
      lastOnset: -Infinity,
      onsets: 0,
    };
  });

  // Recolour each glow to its band colour (static, set once).
  padState.forEach((p) => {
    if (p.band < 0 || !p.glow) return;
    const col = bands[p.band].color;
    p.glow.style.boxShadow = "inset 0 0 22px " + col + ", 0 0 16px " + col;
    p.glow.style.border = "1px solid " + col;
  });

  function shuffledOrder(band) {
    const a = band.group.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    // never repeat the same pad across a reshuffle boundary
    if (a.length > 1 && a[0] === band.lastPad) a.push(a.shift());
    return a;
  }

  // ---------- analyser (exactly one, created lazily) ----------
  let analyser = null;
  let freq = null;

  function ensureAnalyser() {
    if (analyser) return true;
    const ctx = engine.context;
    if (!ctx || !engine.output) return false; // no Web Audio: pads stay static
    analyser = ctx.createAnalyser();
    analyser.fftSize = TUNING.FFT_SIZE;
    analyser.smoothingTimeConstant = TUNING.SMOOTHING;
    engine.output.connect(analyser); // side branch only; nothing connects out of it
    freq = new Uint8Array(analyser.frequencyBinCount);
    const binHz = ctx.sampleRate / analyser.fftSize;
    const maxBin = analyser.frequencyBinCount - 1;
    // Nearest-bin edges; bands never share a bin (skip bin 0 = DC).
    let floor = 1;
    bands.forEach((b) => {
      b.binLo = Math.min(maxBin, Math.max(floor, Math.round(b.lo / binHz)));
      b.binHi = Math.min(maxBin, Math.max(b.binLo, Math.round(b.hi / binHz) - 1));
      floor = b.binHi + 1;
    });
    return true;
  }

  function resetDetection() {
    bands.forEach((b) => {
      b.prevEnergy = -1;
      b.fluxMean = 0;
      b.lastOnset = -Infinity;
    });
  }

  // ---------- frame loop (only while playing AND visible) ----------
  let raf = 0;
  let lastT = 0;
  const stats = { frames: 0, hits: 0, blockedByRate: 0, blockedByMax: 0 };
  const hitLog = []; // recent [padIndex, timeMs, peak], capped, for inspection

  const settings = () =>
    reduced
      ? {
          maxLevel: TUNING.REDUCED.MAX_LEVEL,
          decayMs: TUNING.REDUCED.DECAY_MS,
          attackMs: TUNING.REDUCED.ATTACK_MS,
          minFlashGap: 1000 / TUNING.REDUCED.MAX_FLASHES_PER_SEC_PER_PAD,
          press: TUNING.REDUCED.PRESS_PX,
        }
      : {
          maxLevel: 1,
          decayMs: TUNING.DECAY_MS,
          attackMs: 0,
          minFlashGap: 1000 / TUNING.MAX_FLASHES_PER_SEC_PER_PAD,
          press: TUNING.PRESS_PX,
        };

  function trigger(band, strength, now, s) {
    let active = 0;
    for (const p of padState) if (p.level > 0.5 || p.target > 0.5) active++;
    if (active >= TUNING.MAX_ACTIVE_HITS) {
      stats.blockedByMax++;
      return;
    }
    if (!band.order.length) band.order = shuffledOrder(band);
    // first pad in the shuffled queue that is allowed to flash again
    const idx = band.order.findIndex((p) => now - p.lastFlash >= s.minFlashGap);
    if (idx < 0) {
      stats.blockedByRate++;
      return;
    }
    const pad = band.order.splice(idx, 1)[0];
    band.lastPad = pad;
    const peak = (TUNING.HIT_MIN_LEVEL + (1 - TUNING.HIT_MIN_LEVEL) * strength) * s.maxLevel;
    if (s.attackMs > 0) pad.target = Math.max(pad.target, peak);
    else pad.level = Math.max(pad.level, peak);
    pad.lastFlash = now;
    pad.activity = 1;
    stats.hits++;
    hitLog.push([padState.indexOf(pad), Math.round(now), +peak.toFixed(3)]);
    if (hitLog.length > 200) hitLog.shift();
  }

  function frame(now) {
    raf = 0;
    if (!isLive()) return;
    const dt = Math.min(0.1, lastT ? (now - lastT) / 1000 : 1 / 60);
    lastT = now;
    stats.frames++;
    const s = settings();

    // ---- read: one analyser pull per frame ----
    analyser.getByteFrequencyData(freq);

    // ---- detect ----
    const meanAlpha = 1 - Math.exp(-dt / TUNING.THRESHOLD_WINDOW_S);
    for (const b of bands) {
      let sum = 0;
      for (let k = b.binLo; k <= b.binHi; k++) sum += freq[k];
      const e = sum / ((b.binHi - b.binLo + 1) * 255);
      b.energy = e;
      if (b.prevEnergy < 0) {
        b.prevEnergy = e; // first frame after a reset: no flux
        continue;
      }
      const flux = Math.max(0, e - b.prevEnergy);
      b.prevEnergy = e;
      const threshold = b.fluxMean * TUNING.SENSITIVITY + TUNING.MIN_FLUX;
      if (flux > threshold && now - b.lastOnset >= TUNING.BAND_COOLDOWN_MS) {
        b.lastOnset = now;
        b.onsets++;
        const strength = Math.min(1, (flux - threshold) / (threshold * 2));
        trigger(b, strength, now, s);
      }
      b.fluxMean += (flux - b.fluxMean) * meanAlpha; // update after testing
    }

    // ---- animate ----
    const decay = Math.exp((-dt * 1000 * 3) / s.decayMs); // ~5% after decayMs
    const attack = s.attackMs > 0 ? 1 - Math.exp((-dt * 1000 * 3) / s.attackMs) : 1;
    const idleDecay = Math.exp((-dt * 3) / TUNING.IDLE_HOLD_S);
    for (const p of padState) {
      if (p.target > 0) {
        p.level += (p.target - p.level) * attack;
        if (p.level >= p.target - 0.01) p.target = 0; // reached peak; start decaying
      } else {
        p.level *= decay;
      }
      if (p.level < 0.002) p.level = 0;
      p.activity *= idleDecay;
      if (p.activity < 0.01) p.activity = 0;
    }

    // ---- write: only changed values, all in one pass ----
    for (const p of padState) {
      const bandE = p.band >= 0 ? bands[p.band].energy : 0;
      const idle = TUNING.IDLE_LEVEL * p.activity * (0.6 + 0.4 * bandE) * s.maxLevel;
      const lvl = Math.round(Math.max(p.level, idle) * 1000) / 1000;
      if (Math.abs(lvl - p.shownLevel) >= 0.004 || (lvl === 0 && p.shownLevel !== 0)) {
        p.el.style.setProperty("--pad-level", String(lvl));
        p.shownLevel = lvl;
      }
      const press = Math.round(p.level * s.press * 10) / 10;
      if (press !== p.shownPress) {
        p.el.style.setProperty("--pad-press", press + "px");
        p.shownPress = press;
      }
    }

    raf = requestAnimationFrame(frame);
  }

  const isLive = () =>
    !audio.paused && !audio.ended && document.visibilityState === "visible";

  function start() {
    if (raf || !isLive() || !ensureAnalyser()) return;
    if (grid) grid.classList.add("is-reactive");
    lastT = 0;
    raf = requestAnimationFrame(frame);
  }

  // Stop the loop and let CSS fade every pad to off (no rAF after stopping).
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (grid) grid.classList.remove("is-reactive"); // restores the CSS fade transition
    for (const p of padState) {
      p.level = p.target = p.activity = 0;
      if (p.shownLevel !== 0) p.el.style.setProperty("--pad-level", "0");
      if (p.shownPress !== 0) p.el.style.setProperty("--pad-press", "0px");
      p.shownLevel = p.shownPress = 0;
    }
    // After a gap the previous frame is stale; don't read it as a jump.
    bands.forEach((b) => (b.prevEnergy = -1));
  }

  audio.addEventListener("playing", start);
  audio.addEventListener("pause", stop);
  audio.addEventListener("ended", stop);
  // New track: forget the last track's loudness so it can't skew this one.
  audio.addEventListener("loadstart", () => {
    resetDetection();
    bands.forEach((b) => (b.order = []));
  });
  audio.addEventListener("seeking", () => bands.forEach((b) => (b.prevEnergy = -1)));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") start();
    else stop();
  });

  // Inspection / tuning handle (read-only use).
  P.reactive = {
    TUNING,
    stats,
    hitLog,
    get running() {
      return raf !== 0;
    },
    get reduced() {
      return reduced;
    },
    get analyser() {
      return analyser;
    },
    get bands() {
      return bands.map((b) => ({ name: b.name, bins: [b.binLo, b.binHi], onsets: b.onsets, energy: +b.energy.toFixed(3), fluxMean: +b.fluxMean.toFixed(4) }));
    },
    get levels() {
      return padState.map((p) => +p.level.toFixed(3));
    },
  };
})();
