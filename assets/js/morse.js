/* =============================================================================
   Morse — the code table, the rendered dot/dash elements, and the playback
   engine (sound + logo flashing).

   SOUND and FLASH are two independent, default-OFF channels driven by the same
   timeline, so either can be muted/unmuted mid-sequence and stay in sync with
   the other (toggling sound on while flashing just "unmutes").
   ============================================================================= */
import { $, $$, el } from './dom.js';
import { state } from './state.js';

const MORSE = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.',
  H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.',
  O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-',
  V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
};

export function morseEl(text) {
  const wrap = el('span', 'morse');
  wrap.setAttribute('aria-hidden', 'true');
  [...text.toUpperCase()].forEach((ch) => {
    if (ch === ' ') {
      wrap.append(el('span', 'm-space'));
      return;
    }
    const code = MORSE[ch];
    if (!code) return;
    const letter = el('span', 'm-letter');
    [...code].forEach((s) => letter.append(el('span', s === '.' ? 'dot' : 'dash')));
    wrap.append(letter);
  });
  return wrap;
}
export const navMorseHTML = (label) => `<span class="nav__morse">${morseEl(label).outerHTML}</span>`;

/* Fill any [data-morse] placeholders with rendered morse. */
export function fillMorse(root = document) {
  $$('[data-morse]', root).forEach((n) => n.replaceChildren(morseEl(n.dataset.morse)));
}

/* --------------------------- Engine --------------------------------------- */
const MORSE_UNIT = 68; // ms per morse "dit"
let audioCtx = null;
let masterGain = null;
let scheduledOscs = [];
let flashTimers = [];
let morseEndsAt = 0;
let pendingSound = null; // morse queued to play on the first user gesture

// The currently-playing sequence — a shared timeline both channels read off.
let run = null; // { timeline, totalMs, startMs, endTimer }

export function soundOn() {
  return localStorage.getItem('rr-sound') === 'on';
}
export function flashOn() {
  return localStorage.getItem('rr-flash') === 'on';
}

// Word played per page when arriving (the "morse on page switch").
export const PAGE_MORSE = {
  home: 'RAREROOM',
  artist: 'ARTISTS',
  studio: 'STUDIO',
  about: 'ABOUT',
  contact: 'CONTACT',
  releases: 'RELEASES',
  shop: 'SHOP',
  privacy: 'PRIVACY',
};

function morseSegments(text) {
  const U = MORSE_UNIT;
  const seg = [];
  text
    .toUpperCase()
    .trim()
    .split(/\s+/)
    .forEach((word, wi, words) => {
      [...word].forEach((ch) => {
        const code = MORSE[ch];
        if (!code) return;
        [...code].forEach((s) => {
          seg.push([true, s === '.' ? U : U * 3]);
          seg.push([false, U]);
        });
        seg.push([false, U * 2]);
      });
      if (wi < words.length - 1) seg.push([false, U * 4]);
    });
  return seg;
}

function buildTimeline(text) {
  const tl = [];
  let t = 0;
  morseSegments(text).forEach(([on, dur]) => {
    tl.push({ on, start: t, end: t + dur });
    t += dur;
  });
  return { timeline: tl, totalMs: t };
}

export function ensureAudio() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 1;
      masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch {
    /* Web Audio unavailable — sound just won't play */
  }
  return audioCtx;
}
export function audioReady() {
  return !!audioCtx && audioCtx.state === 'running';
}

/* Start / resume the SOUND channel from the run's current position.

   ONE oscillator plays the whole sequence, gated by a gain envelope (tones =
   short attack/hold/release ramps, silence between). Safari crackled badly with
   the old per-dot oscillator-churn — allocating/stopping dozens of nodes while
   the main thread was busy (decoding the incoming page's images) starved the
   audio thread. A single long-lived node + a generous scheduling lead is smooth. */
export function startSound() {
  if (!run) return;
  const ctx = ensureAudio();
  if (!ctx) return;
  stopSound();
  const offset = performance.now() - run.startMs;
  const base = ctx.currentTime + 0.14; // lead buffer to ride out main-thread jank
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 620;
  gain.gain.setValueAtTime(0, base);
  osc.connect(gain).connect(masterGain);

  const R = 0.006; // attack / release ramp — long enough to avoid click edges
  let lastEnd = base;
  run.timeline.forEach((s) => {
    if (!s.on || s.end <= offset) return;
    const from = Math.max(s.start, offset); // if mid-tone, start from "now"
    const at = base + (from - offset) / 1000;
    const dur = (s.end - from) / 1000;
    if (dur <= 0) return;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.14, at + R);
    gain.gain.setValueAtTime(0.14, at + Math.max(R, dur - R));
    gain.gain.linearRampToValueAtTime(0, at + dur);
    lastEnd = at + dur;
  });
  osc.start(base);
  osc.stop(lastEnd + 0.05);
  scheduledOscs.push(osc, gain);
}
export function stopSound() {
  scheduledOscs.forEach((n) => {
    try {
      n.stop?.();
      n.disconnect();
    } catch {
      /* already stopped */
    }
  });
  scheduledOscs = [];
}

/* Start / resume the FLASH channel from the run's current position. */
export function startFlash() {
  if (!run) return;
  const els = $$('.js-flash');
  if (!els.length) return;
  stopFlash(false);
  els.forEach((e) => e.classList.add('flashing'));
  const offset = performance.now() - run.startMs;
  const cur = run.timeline.find((s) => offset >= s.start && offset < s.end);
  els.forEach((e) => e.classList.toggle('lit', !!(cur && cur.on)));
  run.timeline.forEach((s) => {
    if (s.end <= offset) return;
    flashTimers.push(
      setTimeout(
        () => els.forEach((e) => e.classList.toggle('lit', s.on)),
        Math.max(0, s.start - offset)
      )
    );
  });
}
export function stopFlash(clearFlashing = true) {
  flashTimers.forEach(clearTimeout);
  flashTimers = [];
  $$('.js-flash').forEach((e) => {
    e.classList.remove('lit');
    if (clearFlashing) e.classList.remove('flashing');
  });
}

/* Stop any in-flight morse immediately — both channels + the shared run. */
export function stopMorse() {
  if (run && run.endTimer) clearTimeout(run.endTimer);
  run = null;
  stopFlash();
  stopSound();
  morseEndsAt = 0;
}

export function isMorseActive() {
  return performance.now() < morseEndsAt;
}

/**
 * Start a fresh sequence at offset 0. Each channel plays only if its flag is on.
 * @param {string} text
 * @param {{sound?:boolean, flash?:boolean, gesture?:boolean}} opts
 */
export function runMorse(text, { sound = false, flash = false, gesture = false } = {}) {
  stopMorse(); // never let two sequences overlap
  if (!sound && !flash) return;
  const { timeline, totalMs } = buildTimeline(text);
  run = { timeline, totalMs, startMs: performance.now(), endTimer: null };
  morseEndsAt = performance.now() + totalMs + 120;
  run.endTimer = setTimeout(stopMorse, totalMs + 160);
  if (flash) startFlash();
  if (sound) {
    if (gesture || audioReady()) startSound();
    else pendingSound = text; // autoplay-blocked → play on first user gesture
  }
}

/* --------------------------- Toggle actions -------------------------------
   Called by the header switches. Kept here so `pendingSound`/`run` stay private. */
export function muteChannel(channel) {
  if (channel === 'sound') {
    stopSound();
    pendingSound = null;
  } else {
    stopFlash();
  }
}
export function unmuteChannel(channel) {
  if (channel === 'sound') ensureAudio();
  if (isMorseActive()) {
    // Unmute this channel mid-sequence, synced to where the run already is.
    channel === 'sound' ? startSound() : startFlash();
    return;
  }
  // Nothing playing → start a fresh sequence reflecting both toggles.
  runMorse(PAGE_MORSE[state.currentPageKey] || 'RR', {
    sound: soundOn(),
    flash: flashOn(),
    gesture: true,
  });
}

/* Browsers block audio until the user interacts. Unlock on the first gesture
   and flush any morse that was waiting to be heard. Once unlocked the context
   stays live for the whole SPA session, so later page-switches play sound. */
export function primeAudioOnGesture() {
  const events = ['pointerdown', 'touchstart', 'keydown'];
  const handler = () => {
    ensureAudio();
    if (pendingSound && soundOn()) {
      if (run) startSound(); // sync to the sequence already in flight
      else runMorse(pendingSound, { sound: true, flash: false, gesture: true });
    }
    pendingSound = null;
    events.forEach((ev) => window.removeEventListener(ev, handler));
  };
  events.forEach((ev) => window.addEventListener(ev, handler, { passive: true }));
}
