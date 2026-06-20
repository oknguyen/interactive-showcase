/* wallpapers.js — macOS-style wallpapers generated as inline SVG data URIs */
"use strict";

function svgWall(inner, w = 1600, h = 1000) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const BLUR = `<filter id="b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="110"/></filter>`;

const Wallpapers = [
  {
    id: "sequoia-light",
    name: "Sequoia Sunrise",
    css: svgWall(`
      <defs>${BLUR}
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1c4f9c"/><stop offset="0.55" stop-color="#6c5fc4"/><stop offset="1" stop-color="#d77fb0"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#g)"/>
      <g filter="url(#b)">
        <circle cx="280" cy="220" r="330" fill="#67c4f7" opacity="0.75"/>
        <circle cx="1330" cy="300" r="300" fill="#8f7df0" opacity="0.7"/>
        <circle cx="900" cy="820" r="400" fill="#ffb27a" opacity="0.78"/>
        <circle cx="240" cy="900" r="300" fill="#ff8fb6" opacity="0.6"/>
        <circle cx="1500" cy="950" r="280" fill="#ffd29b" opacity="0.7"/>
      </g>`),
  },
  {
    id: "sequoia-dark",
    name: "Sequoia Night",
    dark: true,
    css: svgWall(`
      <defs>${BLUR}
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#070d22"/><stop offset="0.6" stop-color="#1b1f4b"/><stop offset="1" stop-color="#3c2a63"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#g)"/>
      <g filter="url(#b)">
        <circle cx="320" cy="260" r="320" fill="#16336e" opacity="0.85"/>
        <circle cx="1300" cy="280" r="300" fill="#3b2d7a" opacity="0.8"/>
        <circle cx="880" cy="850" r="400" fill="#6b3e8f" opacity="0.65"/>
        <circle cx="1480" cy="920" r="260" fill="#8a4d6e" opacity="0.5"/>
      </g>`),
  },
  {
    id: "sonoma",
    name: "Sonoma Horizon",
    css: svgWall(`
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8ec9e8"/><stop offset="0.55" stop-color="#f6d8a8"/><stop offset="0.75" stop-color="#ef9d6b"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#sky)"/>
      <circle cx="800" cy="700" r="120" fill="#fff3d6" opacity="0.95"/>
      <path d="M0 760 Q300 660 620 740 T1600 720 V1000 H0 Z" fill="#7e6a8e" opacity="0.85"/>
      <path d="M0 830 Q420 740 860 820 T1600 810 V1000 H0 Z" fill="#574a6e"/>
      <path d="M0 910 Q500 840 1000 900 T1600 890 V1000 H0 Z" fill="#352c47"/>`),
  },
  {
    id: "ventura",
    name: "Ventura Swirl",
    css: svgWall(`
      <defs>${BLUR}
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#e8472c"/><stop offset="1" stop-color="#8f1f53"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#g)"/>
      <g filter="url(#b)">
        <ellipse cx="380" cy="780" rx="520" ry="340" fill="#ff8a3c" opacity="0.85"/>
        <ellipse cx="1250" cy="230" rx="460" ry="320" fill="#ff5e62" opacity="0.7"/>
        <ellipse cx="1100" cy="900" rx="380" ry="260" fill="#5b2a86" opacity="0.65"/>
      </g>
      <path d="M-100 620 C400 420 700 880 1100 640 S1700 480 1750 560" fill="none" stroke="#ffc46b" stroke-width="130" stroke-linecap="round" opacity="0.35"/>`),
  },
  {
    id: "monterey",
    name: "Monterey Flow",
    css: svgWall(`
      <defs>${BLUR}
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0b2a6b"/><stop offset="1" stop-color="#2a1158"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#g)"/>
      <g filter="url(#b)">
        <ellipse cx="450" cy="300" rx="430" ry="280" fill="#0a84ff" opacity="0.7"/>
        <ellipse cx="1250" cy="700" rx="470" ry="320" fill="#bf5af2" opacity="0.65"/>
        <ellipse cx="900" cy="180" rx="320" ry="220" fill="#64d2ff" opacity="0.5"/>
        <ellipse cx="300" cy="880" rx="340" ry="240" fill="#ff6482" opacity="0.45"/>
      </g>`),
  },
  {
    id: "graphite",
    name: "Graphite",
    dark: true,
    css: svgWall(`
      <defs>
        <radialGradient id="g" cx="0.5" cy="0.32" r="0.95">
          <stop offset="0" stop-color="#494b52"/><stop offset="0.6" stop-color="#2a2b30"/><stop offset="1" stop-color="#121317"/>
        </radialGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#g)"/>`),
  },
];

function getWallpaper(id) {
  return Wallpapers.find((w) => w.id === id) || Wallpapers[0];
}

function applyWallpaper(id, persist = true) {
  const w = getWallpaper(id);
  document.getElementById("desktop").style.backgroundImage = w.css;
  if (persist) MacOS.store.set("wallpaper", w.id);
  document.dispatchEvent(new CustomEvent("wallpaper-changed", { detail: w }));
}
