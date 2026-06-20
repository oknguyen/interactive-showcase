/* core.js — shared namespace, app registry, storage, notifications */
"use strict";

const MacOS = {
  apps: {},          // id -> app definition
  bootTime: Date.now(),

  registerApp(app) {
    this.apps[app.id] = app;
  },

  store: {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem("macos." + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem("macos." + key, JSON.stringify(value));
      } catch { /* storage unavailable (private mode) — run without persistence */ }
    },
  },

  notify(title, body, iconSvg) {
    const host = document.getElementById("notifications");
    const el = document.createElement("div");
    el.className = "notification";
    el.innerHTML = `
      ${iconSvg ? `<div class="n-icon">${iconSvg}</div>` : ""}
      <div>
        <div class="n-title"></div>
        <div class="n-body"></div>
      </div>`;
    el.querySelector(".n-title").textContent = title;
    el.querySelector(".n-body").textContent = body;
    host.appendChild(el);
    setTimeout(() => {
      el.classList.add("out");
      el.addEventListener("animationend", () => el.remove(), { once: true });
    }, 4000);
  },
};

/* tiny DOM helper */
function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
