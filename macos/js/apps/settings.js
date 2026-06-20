/* apps/settings.js — System Settings: wallpaper, appearance, accent color */
"use strict";

MacOS.registerApp({
  id: "settings",
  name: "System Settings",
  width: 760,
  height: 520,
  minWidth: 620,
  minHeight: 380,

  menus() {
    return [
      { title: "View", items: [
        { label: "Wallpaper", action: () => document.dispatchEvent(new CustomEvent("settings-goto", { detail: "wallpaper" })) },
        { label: "Appearance", action: () => document.dispatchEvent(new CustomEvent("settings-goto", { detail: "appearance" })) },
      ]},
    ];
  },

  mount(root, win) {
    const ACCENTS = [
      ["#0a84ff", "Blue"], ["#bf5af2", "Purple"], ["#ff2d55", "Pink"],
      ["#ff3b30", "Red"], ["#ff9f0a", "Orange"], ["#ffd60a", "Yellow"],
      ["#32d74b", "Green"], ["#98989d", "Graphite"],
    ];

    const SIDEBAR = [
      { id: "wifi", name: "Wi‑Fi", color: "#0a84ff", glyph: Glyphs.wifi },
      { id: "bluetooth", name: "Bluetooth", color: "#0a84ff", glyph: Glyphs.airdrop },
      { id: "network", name: "Network", color: "#5e5ce6", glyph: Glyphs.controlCenter },
      { sep: true },
      { id: "appearance", name: "Appearance", color: "#1d1d1f", glyph: Glyphs.moon },
      { id: "wallpaper", name: "Wallpaper", color: "#28c7fa", glyph: Glyphs.sun },
      { id: "displays", name: "Displays", color: "#0a84ff", glyph: Glyphs.sun },
      { sep: true },
      { id: "battery", name: "Battery", color: "#32d74b", glyph: Glyphs.battery },
      { id: "sound", name: "Sound", color: "#ff2d55", glyph: Glyphs.speaker },
    ];

    let current = "wallpaper";

    root.innerHTML = `
      <div class="settings">
        <div class="settings-sidebar">
          <div class="settings-profile">
            <div class="settings-avatar">H</div>
            <div>
              <div class="settings-profile-name">OkNguyen</div>
              <div class="settings-profile-sub">Apple Account</div>
            </div>
          </div>
          <div class="settings-nav"></div>
        </div>
        <div class="settings-main"></div>
      </div>`;

    const nav = root.querySelector(".settings-nav");
    const main = root.querySelector(".settings-main");

    for (const item of SIDEBAR) {
      if (item.sep) { nav.appendChild(el("div", "settings-group-sep")); continue; }
      const row = el("div", "settings-item",
        `<div class="settings-icon" style="background:${item.color}">${item.glyph}</div><span></span>`);
      row.querySelector("span").textContent = item.name;
      row.dataset.id = item.id;
      row.addEventListener("click", () => show(item.id));
      nav.appendChild(row);
    }

    function show(id) {
      current = id;
      nav.querySelectorAll(".settings-item").forEach((r) => r.classList.toggle("selected", r.dataset.id === id));
      main.innerHTML = "";
      if (id === "wallpaper") renderWallpaper();
      else if (id === "appearance") renderAppearance();
      else renderPlaceholder(id);
    }

    /* ---- Wallpaper pane ---- */
    function renderWallpaper() {
      const h1 = el("div", "settings-h1", "Wallpaper");
      const section = el("div", "settings-section");
      section.appendChild(el("div", "settings-section-title", "macOS Wallpapers"));
      const grid = el("div", "wallpaper-grid");
      const selected = MacOS.store.get("wallpaper", Wallpapers[0].id);

      for (const w of Wallpapers) {
        const cell = el("div");
        const thumb = el("div", "wallpaper-thumb" + (w.id === selected ? " selected" : ""));
        thumb.style.backgroundImage = w.css;
        thumb.addEventListener("click", () => {
          applyWallpaper(w.id);
          grid.querySelectorAll(".wallpaper-thumb").forEach((t) => t.classList.remove("selected"));
          thumb.classList.add("selected");
        });
        const name = el("div", "wallpaper-name");
        name.textContent = w.name;
        cell.append(thumb, name);
        grid.appendChild(cell);
      }
      section.appendChild(grid);
      main.append(h1, section);
    }

    /* ---- Appearance pane ---- */
    function renderAppearance() {
      const h1 = el("div", "settings-h1", "Appearance");

      const section = el("div", "settings-section");
      section.appendChild(el("div", "settings-section-title", "Appearance"));
      const row = el("div", "appearance-row");
      const themes = [
        ["light", "Light", "#eceff4", "#ffffff"],
        ["dark", "Dark", "#2c2c30", "#1f1f23"],
      ];
      for (const [id, label, bar, body] of themes) {
        const opt = el("div", "appearance-opt" + (document.body.dataset.theme === id ? " selected" : ""), `
          <div class="ap-preview" style="background:${body}">
            <div style="height:16px;background:${bar};border-bottom:1px solid rgba(0,0,0,0.1)"></div>
            <div style="margin:10px;width:60%;height:8px;border-radius:4px;background:${id === "dark" ? "#48484c" : "#d6d9de"}"></div>
            <div style="margin:10px;width:40%;height:8px;border-radius:4px;background:${id === "dark" ? "#48484c" : "#d6d9de"}"></div>
          </div>
          <div class="ap-label">${label}</div>`);
        opt.addEventListener("click", () => {
          setTheme(id);
          row.querySelectorAll(".appearance-opt").forEach((o) => o.classList.remove("selected"));
          opt.classList.add("selected");
        });
        row.appendChild(opt);
      }
      section.appendChild(row);

      const accentSection = el("div", "settings-section");
      accentSection.appendChild(el("div", "settings-section-title", "Accent color"));
      const accentRow = el("div", "accent-row");
      const savedAccent = MacOS.store.get("accent", "#0a84ff");
      for (const [color, name] of ACCENTS) {
        const dot = el("div", "accent-dot" + (color === savedAccent ? " selected" : ""));
        dot.style.background = color;
        dot.style.color = color;
        dot.title = name;
        dot.addEventListener("click", () => {
          document.documentElement.style.setProperty("--accent", color);
          MacOS.store.set("accent", color);
          accentRow.querySelectorAll(".accent-dot").forEach((d) => d.classList.remove("selected"));
          dot.classList.add("selected");
        });
        accentRow.appendChild(dot);
      }
      accentSection.appendChild(accentRow);

      main.append(h1, section, accentSection);
    }

    /* ---- everything else ---- */
    function renderPlaceholder(id) {
      const item = SIDEBAR.find((s) => s.id === id);
      const ph = el("div", "settings-placeholder", `
        <div class="ph-icon" style="background:${item.color}">${item.glyph}</div>
        <div>${item.name} isn't wired up in this demo.</div>
        <div style="font-size:12.5px">Wallpaper and Appearance are fully functional.</div>`);
      main.appendChild(ph);
    }

    win.onGoto = (e) => show(e.detail);
    document.addEventListener("settings-goto", win.onGoto);
    show(current);
  },

  unmount(win) {
    document.removeEventListener("settings-goto", win.onGoto);
  },
});
