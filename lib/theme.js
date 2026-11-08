// lib/theme.js - gemeinsame Theme-Logik für Layout und Einstellungen
// Das Theme wird im localStorage unter "themeSettings" gespeichert und beim Laden jeder Seite angewendet.
// Die Akzentfarbe aus den Einstellungen wird so angepasst, dass Text darauf mindestens 4,5:1 erreicht.

const STORAGE_KEY = 'themeSettings';
const HEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const DARK_BG = [20, 20, 21];
const LIGHT_BG = [250, 250, 250];
const INK = [20, 20, 21];
const PAPER = [255, 255, 255];

export function readTheme() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveTheme(partial) {
  try {
    const next = { ...readTheme(), ...partial };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return partial;
  }
}

function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]) {
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function mix(color, target, t) {
  return color.map((v, i) => Math.round(v + (target[i] - v) * t));
}

// Akzent so weit zum Hintergrund hin abdunkeln oder aufhellen, bis Text darauf lesbar ist
function readableAccent(hex, isLight) {
  const base = hexToRgb(hex);
  const bg = isLight ? LIGHT_BG : DARK_BG;
  const target = isLight ? [0, 0, 0] : PAPER;
  let color = base;
  for (let t = 0; t <= 1 && contrast(color, bg) < 4.5; t += 0.02) {
    color = mix(base, target, t);
  }
  return color;
}

function bestTextOn(color) {
  return contrast(INK, color) >= contrast(PAPER, color) ? INK : PAPER;
}

// Wendet Modus und Akzentfarbe auf <html> an
export function applyTheme(theme = readTheme()) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const mode = theme.colorMode || 'DARK';
  const isLight =
    mode === 'LIGHT' || (mode === 'SYSTEM' && window.matchMedia('(prefers-color-scheme: light)').matches);

  root.classList.toggle('light', isLight);
  root.classList.toggle('dark', !isLight);

  if (theme.primaryColor && HEX.test(theme.primaryColor)) {
    const accent = readableAccent(theme.primaryColor, isLight);
    root.style.setProperty('--accent', accent.join(' '));
    root.style.setProperty('--on-accent', bestTextOn(accent).join(' '));
  } else {
    root.style.removeProperty('--accent');
    root.style.removeProperty('--on-accent');
  }
}
