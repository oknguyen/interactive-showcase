/* icons.js — hand-drawn SVG approximations of macOS app icons.
   All gradient ids are namespaced per-icon to avoid collisions. */
"use strict";

const Icons = {};

Icons.finder = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fnd_l" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#9fd8fc"/><stop offset="1" stop-color="#57a9f5"/>
    </linearGradient>
    <linearGradient id="fnd_r" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3e9df5"/><stop offset="1" stop-color="#1268d3"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="23" fill="url(#fnd_l)"/>
  <path d="M52 0 H77 Q100 0 100 23 V77 Q100 100 77 100 H52 Z" fill="url(#fnd_r)"/>
  <path d="M52 0 C40 18 36 38 38 58 C39 68 42 82 48 100" fill="none" stroke="#0f4f9e" stroke-width="3.4" opacity="0.85"/>
  <path d="M30 32 v12 M70 32 v12" stroke="#0d3f87" stroke-width="5.4" stroke-linecap="round"/>
  <path d="M26 64 Q50 82 74 64" fill="none" stroke="#0d3f87" stroke-width="5.4" stroke-linecap="round"/>
</svg>`;

Icons.launchpad = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="lp_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a3d45"/><stop offset="1" stop-color="#191b20"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="23" fill="url(#lp_bg)"/>
  <g>
    <rect x="20" y="20" width="16" height="16" rx="4.5" fill="#ff5f57"/>
    <rect x="42" y="20" width="16" height="16" rx="4.5" fill="#ffa629"/>
    <rect x="64" y="20" width="16" height="16" rx="4.5" fill="#ffd60a"/>
    <rect x="20" y="42" width="16" height="16" rx="4.5" fill="#32d74b"/>
    <rect x="42" y="42" width="16" height="16" rx="4.5" fill="#64d2ff"/>
    <rect x="64" y="42" width="16" height="16" rx="4.5" fill="#0a84ff"/>
    <rect x="20" y="64" width="16" height="16" rx="4.5" fill="#bf5af2"/>
    <rect x="42" y="64" width="16" height="16" rx="4.5" fill="#ff6482"/>
    <rect x="64" y="64" width="16" height="16" rx="4.5" fill="#98989d"/>
  </g>
</svg>`;

Icons.safari = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sf_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fdfdfe"/><stop offset="1" stop-color="#d9dce1"/>
    </linearGradient>
    <linearGradient id="sf_dial" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1fb6fd"/><stop offset="1" stop-color="#0b63e5"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="23" fill="url(#sf_bg)"/>
  <circle cx="50" cy="50" r="37" fill="url(#sf_dial)"/>
  <g stroke="#ffffff" stroke-width="2" opacity="0.9">
    <path d="M50 16 v6 M50 78 v6 M16 50 h6 M78 50 h6"/>
    <path d="M26 26 l4 4 M70 70 l4 4 M74 26 l-4 4 M30 70 l-4 4" stroke-width="1.6" opacity="0.7"/>
  </g>
  <path d="M67 33 L45 45 L55 55 Z" fill="#ff3b30"/>
  <path d="M33 67 L55 55 L45 45 Z" fill="#f5f5f7"/>
</svg>`;

Icons.messages = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="msg_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#6cea6e"/><stop offset="1" stop-color="#13bd2c"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="23" fill="url(#msg_bg)"/>
  <path d="M50 21c-17.7 0-32 11.4-32 25.4 0 8.9 5.8 16.8 14.6 21.3-.9 3.9-3.3 7.5-7 10.2 6.6-.3 12.4-2.6 16.6-6 2.5.5 5.1.8 7.8.8 17.7 0 32-11.4 32-25.4S67.7 21 50 21z" fill="#fff"/>
</svg>`;

Icons.photos = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="23" fill="#f5f5f7"/>
  <g transform="translate(50 50)">
    <ellipse rx="8.5" ry="17" cy="-16" fill="#f5c400" opacity="0.9"/>
    <ellipse rx="8.5" ry="17" cy="-16" fill="#f1a33b" opacity="0.9" transform="rotate(45)"/>
    <ellipse rx="8.5" ry="17" cy="-16" fill="#eb4b3d" opacity="0.9" transform="rotate(90)"/>
    <ellipse rx="8.5" ry="17" cy="-16" fill="#d94a8c" opacity="0.9" transform="rotate(135)"/>
    <ellipse rx="8.5" ry="17" cy="-16" fill="#8a64d6" opacity="0.9" transform="rotate(180)"/>
    <ellipse rx="8.5" ry="17" cy="-16" fill="#2f8ddd" opacity="0.9" transform="rotate(225)"/>
    <ellipse rx="8.5" ry="17" cy="-16" fill="#54b87f" opacity="0.9" transform="rotate(270)"/>
    <ellipse rx="8.5" ry="17" cy="-16" fill="#9fc54d" opacity="0.9" transform="rotate(315)"/>
  </g>
</svg>`;

Icons.calculator = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="calc_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3c3e42"/><stop offset="1" stop-color="#1e2024"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="23" fill="url(#calc_bg)"/>
  <rect x="18" y="15" width="64" height="15" rx="4" fill="#c2c8ce"/>
  <g fill="#7d8086">
    <rect x="18" y="38" width="16" height="13" rx="4"/><rect x="42" y="38" width="16" height="13" rx="4"/>
    <rect x="18" y="55" width="16" height="13" rx="4"/><rect x="42" y="55" width="16" height="13" rx="4"/>
    <rect x="18" y="72" width="16" height="13" rx="4"/><rect x="42" y="72" width="16" height="13" rx="4"/>
  </g>
  <g fill="#ff9f0a">
    <rect x="66" y="38" width="16" height="13" rx="4"/>
    <rect x="66" y="55" width="16" height="13" rx="4"/>
    <rect x="66" y="72" width="16" height="13" rx="4"/>
  </g>
</svg>`;

Icons.notes = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <clipPath id="nts_clip"><rect width="100" height="100" rx="23"/></clipPath>
    <linearGradient id="nts_top" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fad428"/><stop offset="1" stop-color="#f6c211"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#nts_clip)">
    <rect width="100" height="100" fill="#fbfbfd"/>
    <rect width="100" height="27" fill="url(#nts_top)"/>
    <rect y="27" width="100" height="2.5" fill="#e0a30b"/>
    <g stroke-linecap="round">
      <path d="M18 47 H62" stroke="#3c3c43" stroke-width="4.5"/>
      <path d="M18 62 H82" stroke="#c7c7cc" stroke-width="4.5"/>
      <path d="M18 77 H82" stroke="#c7c7cc" stroke-width="4.5"/>
    </g>
  </g>
</svg>`;

Icons.terminal = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="trm_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#33363c"/><stop offset="1" stop-color="#101114"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="23" fill="url(#trm_bg)"/>
  <rect x="2" y="2" width="96" height="20" rx="20" fill="#ffffff" opacity="0.07"/>
  <path d="M22 30 l17 15 -17 15" fill="none" stroke="#f5f5f7" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M48 62 h22" stroke="#f5f5f7" stroke-width="7" stroke-linecap="round"/>
</svg>`;

Icons.settings = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="set_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#d4d7dc"/><stop offset="1" stop-color="#8f959e"/>
    </linearGradient>
    <linearGradient id="set_gear" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbfbfd"/><stop offset="1" stop-color="#b9bec6"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="23" fill="url(#set_bg)"/>
  <g transform="translate(50 50)">
    <g fill="url(#set_gear)" stroke="#6f757e" stroke-width="1">
      <g id="set_teeth">
        <rect x="-5" y="-34" width="10" height="13" rx="3"/>
        <rect x="-5" y="-34" width="10" height="13" rx="3" transform="rotate(45)"/>
        <rect x="-5" y="-34" width="10" height="13" rx="3" transform="rotate(90)"/>
        <rect x="-5" y="-34" width="10" height="13" rx="3" transform="rotate(135)"/>
        <rect x="-5" y="-34" width="10" height="13" rx="3" transform="rotate(180)"/>
        <rect x="-5" y="-34" width="10" height="13" rx="3" transform="rotate(225)"/>
        <rect x="-5" y="-34" width="10" height="13" rx="3" transform="rotate(270)"/>
        <rect x="-5" y="-34" width="10" height="13" rx="3" transform="rotate(315)"/>
      </g>
      <circle r="25"/>
    </g>
    <circle r="10.5" fill="#7b818a"/>
    <circle r="10.5" fill="#000" opacity="0.15"/>
  </g>
</svg>`;

Icons.trash = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="trs_body" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#c9ccd2"/><stop offset="0.5" stop-color="#eceef1"/><stop offset="1" stop-color="#b4b8bf"/>
    </linearGradient>
  </defs>
  <rect x="24" y="18" width="52" height="8" rx="4" fill="#d6d9de"/>
  <rect x="44" y="12" width="12" height="8" rx="4" fill="#c2c6cc"/>
  <path d="M28 30 L34 88 Q34.5 92 39 92 H61 Q65.5 92 66 88 L72 30 Z" fill="url(#trs_body)" opacity="0.92"/>
  <g stroke="#8f949c" stroke-width="2" opacity="0.65">
    <path d="M37 34 L40 88"/><path d="M45.5 34 L47 88"/><path d="M54.5 34 L53 88"/><path d="M63 34 L60 88"/>
  </g>
</svg>`;

/* Apple logo (menu bar, about, lock screen) */
Icons.apple = `
<svg viewBox="0 0 17 17" width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
  <path d="M13.0729 8.8632c-.0145-1.6231 1.3252-2.4019 1.3856-2.4399-.7544-1.1032-1.9287-1.2543-2.3463-1.2715-.999-.1013-1.9498.5882-2.4567.5882-.5046 0-1.288-.5735-2.1158-.5587-1.0884.0161-2.0921.6328-2.6524 1.6076-1.1305 1.9617-.2892 4.8683.8126 6.4609.539.7796 1.1816 1.6552 2.0254 1.6232.8126-.0322 1.1199-.5253 2.1024-.5253.9825 0 1.2582.5253 2.1183.5092.8748-.0161 1.4291-.7945 1.9651-1.5765.6195-.9046.8744-1.7806.8893-1.8255-.0198-.009-1.706-.6542-1.7275-2.5917zM11.4583 3.7969c.4479-.5425.75-1.2966.6676-2.0469-.6451.0261-1.4266.4297-1.8893.9722-.4149.4805-.7782 1.2483-.6803 1.9846.7195.0558 1.4541-.3656 1.902-.9099z"/>
</svg>`;

/* small glyphs (stroke = currentColor) */
const Glyphs = {
  search: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="6.8" cy="6.8" r="4.6"/><path d="M10.4 10.4 L14 14" stroke-linecap="round"/></svg>`,
  wifi: `<svg width="16" height="13" viewBox="0 0 16 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M1.5 4.5 C5.2 1 10.8 1 14.5 4.5"/><path d="M3.8 7.2 C6.2 5 9.8 5 12.2 7.2"/><path d="M6.1 9.9 C7.2 8.9 8.8 8.9 9.9 9.9"/><circle cx="8" cy="12" r="0.9" fill="currentColor" stroke="none"/></svg>`,
  battery: `<svg width="24" height="12" viewBox="0 0 26 12" fill="none"><rect x="0.7" y="0.7" width="21" height="10.6" rx="3" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.1"/><rect x="2.4" y="2.4" width="14" height="7.2" rx="1.8" fill="currentColor"/><path d="M23.5 4 a2.2 2.2 0 0 1 0 4" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.1"/></svg>`,
  controlCenter: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1" y="2" width="14" height="5" rx="2.5"/><circle cx="4.5" cy="4.5" r="1.4" fill="currentColor" stroke="none"/><rect x="1" y="9" width="14" height="5" rx="2.5"/><circle cx="11.5" cy="11.5" r="1.4" fill="currentColor" stroke="none"/></svg>`,
  sun: `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="8" cy="8" r="3.2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6 13 13M13 3l-1.4 1.4M4.4 11.6 3 13"/></svg>`,
  speaker: `<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M2 6 H5 L9 2.5 V13.5 L5 10 H2 Z"/><path d="M11 5.5 C12 6.5 12 9.5 11 10.5" stroke="currentColor" fill="none" stroke-width="1.3" stroke-linecap="round"/><path d="M12.7 3.8 C14.5 5.6 14.5 10.4 12.7 12.2" stroke="currentColor" fill="none" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  moon: `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 9.8 A6.3 6.3 0 1 1 6.2 2.5 A5 5 0 0 0 13.5 9.8z"/></svg>`,
  airdrop: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none"/><path d="M5.2 10.8a4 4 0 0 1 0-5.6M10.8 5.2a4 4 0 0 1 0 5.6"/><path d="M3.2 12.8a6.8 6.8 0 0 1 0-9.6M12.8 3.2a6.8 6.8 0 0 1 0 9.6"/></svg>`,
  plus: `<svg width="14" height="14" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M8 2.5 v11 M2.5 8 h11"/></svg>`,
  trash: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M2.5 4 h11 M6.5 4 V2.8 a0.8 0.8 0 0 1 0.8-0.8 h1.4 a0.8 0.8 0 0 1 0.8.8 V4"/><path d="M3.8 4 l0.7 9 a1.2 1.2 0 0 0 1.2 1.1 h4.6 a1.2 1.2 0 0 0 1.2-1.1 l0.7-9"/><path d="M6.5 7 v4.5 M9.5 7 v4.5"/></svg>`,
  compose: `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3.5" width="10.5" height="10.5" rx="2"/><path d="M12.6 2.2 a 1.4 1.4 0 0 1 2 2 L9 9.8 6.5 10.4 7.1 7.9 Z" fill="var(--pane-bg)"/></svg>`,
  chevronRight: `<svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5.5 2.5 L11 8 l-5.5 5.5"/></svg>`,
};
