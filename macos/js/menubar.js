/* menubar.js — menu bar, dropdown menus, control center, clock */
"use strict";

const MenuBar = {
  left: null,
  right: null,
  openMenu: null,    // { anchor, dropdown }

  init() {
    this.left = document.getElementById("menubar-left");
    this.right = document.getElementById("menubar-right");
    this.buildRight();
    this.setAppMenus(null);

    document.addEventListener("wm-focus", (e) => this.setAppMenus(e.detail));
    document.addEventListener("pointerdown", (e) => {
      const t = e.target instanceof Element ? e.target : null;
      if (!t || (!t.closest(".menu-dropdown") && !t.closest(".mb-item") &&
          !t.closest(".mb-status") && !t.closest("#control-center"))) {
        this.closeDropdown();
      }
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeDropdown();
    });
  },

  /* ---------- left side: Apple menu + app menus ---------- */

  appleMenuItems() {
    return [
      { label: "About This Mac", action: () => openAboutWindow() },
      { sep: true },
      { label: "System Settings…", action: () => WM.open("settings") },
      { label: "App Store…", disabled: true },
      { sep: true },
      { label: "Force Quit…", shortcut: "⌥⌘⎋", action: () => {
          if (WM.focused) WM.close(WM.focused);
        } },
      { sep: true },
      { label: "Lock Screen", shortcut: "⌃⌘Q", action: () => showLockScreen() },
      { label: "Restart…", action: () => location.reload() },
      { label: "Shut Down…", action: () => showShutdown() },
      { sep: true },
      { label: "Log Out OkNguyen…", shortcut: "⇧⌘Q", action: () => showLockScreen() },
    ];
  },

  defaultFinderMenus() {
    return [
      { title: "File", items: [
        { label: "New Finder Window", shortcut: "⌘N", disabled: true },
        { label: "New Folder", shortcut: "⇧⌘N", disabled: true },
        { sep: true },
        { label: "Get Info", shortcut: "⌘I", disabled: true },
      ]},
      { title: "Edit", items: [
        { label: "Undo", shortcut: "⌘Z", disabled: true },
        { label: "Redo", shortcut: "⇧⌘Z", disabled: true },
        { sep: true },
        { label: "Cut", shortcut: "⌘X", disabled: true },
        { label: "Copy", shortcut: "⌘C", disabled: true },
        { label: "Paste", shortcut: "⌘V", disabled: true },
      ]},
      { title: "View", items: [
        { label: "as Icons", disabled: true },
        { label: "as List", disabled: true },
        { sep: true },
        { label: "Change Wallpaper…", action: () => { WM.open("settings"); document.dispatchEvent(new CustomEvent("settings-goto", { detail: "wallpaper" })); } },
      ]},
      { title: "Go", items: [
        { label: "Home", shortcut: "⇧⌘H", disabled: true },
        { label: "Applications", shortcut: "⇧⌘A", action: () => Dock.toggleLaunchpad(true) },
      ]},
      { title: "Window", items: [
        { label: "Minimize", shortcut: "⌘M", action: () => { if (WM.focused) WM.minimize(WM.focused); } },
        { label: "Zoom", action: () => { if (WM.focused) WM.toggleZoom(WM.focused); } },
      ]},
      { title: "Help", items: [
        { label: "macOS Web Help", action: () => MacOS.notify("Help", "Made by OkNguyen — everything runs in your browser.", Icons.finder) },
      ]},
    ];
  },

  setAppMenus(app) {
    this.left.innerHTML = "";

    // Apple logo
    const apple = el("div", "mb-item mb-apple", Icons.apple);
    this.attachMenu(apple, () => this.appleMenuItems());
    this.left.appendChild(apple);

    // App name (bold)
    const appName = el("div", "mb-item mb-appname");
    appName.textContent = app ? app.name : "Finder";
    const aboutLabel = app ? `About ${app.name}` : "About Finder";
    this.attachMenu(appName, () => [
      { label: aboutLabel, action: () => openAboutWindow() },
      { sep: true },
      { label: "Settings…", shortcut: "⌘,", action: () => WM.open("settings") },
      { sep: true },
      { label: app ? `Hide ${app.name}` : "Hide Finder", shortcut: "⌘H", action: () => { if (WM.focused) WM.minimize(WM.focused); } },
      { sep: true },
      { label: app ? `Quit ${app.name}` : "Quit Finder", shortcut: "⌘Q", action: () => { if (WM.focused) WM.close(WM.focused); } },
    ]);
    this.left.appendChild(appName);

    // App-specific (or Finder default) menus
    const menus = (app && app.menus) ? app.menus() : this.defaultFinderMenus();
    for (const menu of menus) {
      const item = el("div", "mb-item");
      item.textContent = menu.title;
      this.attachMenu(item, () => menu.items);
      this.left.appendChild(item);
    }
  },

  /* ---------- dropdown plumbing ---------- */

  attachMenu(anchor, getItems) {
    anchor.addEventListener("click", () => {
      if (this.openMenu && this.openMenu.anchor === anchor) this.closeDropdown();
      else this.showDropdown(anchor, getItems());
    });
    anchor.addEventListener("pointerenter", () => {
      if (this.openMenu && this.openMenu.anchor !== anchor) this.showDropdown(anchor, getItems());
    });
  },

  showDropdown(anchor, items) {
    this.closeDropdown();
    const dd = el("div", "menu-dropdown");
    for (const it of items) {
      if (it.sep) { dd.appendChild(el("div", "menu-sep")); continue; }
      const mi = el("div", "menu-item" + (it.disabled ? " disabled" : ""));
      const label = el("span"); label.textContent = it.label;
      mi.appendChild(label);
      if (it.shortcut) { const sc = el("span", "shortcut"); sc.textContent = it.shortcut; mi.appendChild(sc); }
      if (!it.disabled && it.action) {
        mi.addEventListener("click", () => { this.closeDropdown(); it.action(); });
      }
      dd.appendChild(mi);
    }
    document.body.appendChild(dd);
    const r = anchor.getBoundingClientRect();
    dd.style.top = "34px";
    dd.style.left = Math.min(r.left, window.innerWidth - dd.offsetWidth - 8) + "px";
    anchor.classList.add("open");
    this.openMenu = { anchor, dropdown: dd };
  },

  closeDropdown() {
    if (!this.openMenu) return;
    this.openMenu.dropdown.remove();
    this.openMenu.anchor.classList.remove("open");
    this.openMenu = null;
    closeControlCenter();
  },

  /* ---------- right side: status icons + clock ---------- */

  buildRight() {
    const mkStatus = (html, title) => {
      const s = el("div", "mb-status", html);
      if (title) s.title = title;
      this.right.appendChild(s);
      return s;
    };

    mkStatus(Glyphs.battery, "Battery: 100%");
    mkStatus(Glyphs.wifi, "Wi‑Fi: OkNguyen Studio");
    const search = mkStatus(Glyphs.search, "Spotlight");
    search.addEventListener("click", () => MacOS.notify("Spotlight", "Try the Terminal instead — type `help`.", Icons.terminal));
    const cc = mkStatus(Glyphs.controlCenter, "Control Center");
    cc.addEventListener("click", () => toggleControlCenter(cc));

    const clock = el("div", "mb-status mb-clock");
    this.right.appendChild(clock);
    const tick = () => {
      const now = new Date();
      const date = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const time = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      clock.textContent = `${date}  ${time}`;
    };
    tick();
    setInterval(tick, 10000);
  },
};

/* ---------- Control Center ---------- */

let ccPanel = null;

function closeControlCenter() {
  if (ccPanel) { ccPanel.remove(); ccPanel = null; }
}

function toggleControlCenter(anchor) {
  if (ccPanel) { closeControlCenter(); return; }
  MenuBar.closeDropdown();

  ccPanel = el("div", "", "");
  ccPanel.id = "control-center";
  ccPanel.innerHTML = `
    <div class="cc-row cc-toggles">
      <div class="cc-toggle on" data-t="wifi"><div class="cc-dot">${Glyphs.wifi}</div><span>Wi‑Fi</span></div>
      <div class="cc-toggle on" data-t="airdrop"><div class="cc-dot">${Glyphs.airdrop}</div><span>AirDrop</span></div>
      <div class="cc-toggle" data-t="dark"><div class="cc-dot">${Glyphs.moon}</div><span>Dark Mode</span></div>
    </div>
    <div class="cc-row">
      <div class="cc-label">Display</div>
      <div class="cc-slider-wrap" data-s="brightness">${Glyphs.sun}<div class="cc-slider-fill" style="width:100%"></div></div>
    </div>
    <div class="cc-row">
      <div class="cc-label">Sound</div>
      <div class="cc-slider-wrap" data-s="volume">${Glyphs.speaker}<div class="cc-slider-fill" style="width:65%"></div></div>
    </div>`;
  document.body.appendChild(ccPanel);

  const darkToggle = ccPanel.querySelector('[data-t="dark"]');
  if (document.body.dataset.theme === "dark") darkToggle.classList.add("on");
  darkToggle.addEventListener("click", () => {
    const dark = document.body.dataset.theme !== "dark";
    setTheme(dark ? "dark" : "light");
    darkToggle.classList.toggle("on", dark);
  });
  for (const t of ccPanel.querySelectorAll('[data-t="wifi"],[data-t="airdrop"]')) {
    t.addEventListener("click", () => t.classList.toggle("on"));
  }

  for (const slider of ccPanel.querySelectorAll(".cc-slider-wrap")) {
    const fill = slider.querySelector(".cc-slider-fill");
    const onDrag = (e) => {
      const r = slider.getBoundingClientRect();
      const pct = Math.min(1, Math.max(0.05, (e.clientX - r.left) / r.width));
      fill.style.width = pct * 100 + "%";
      if (slider.dataset.s === "brightness") {
        document.getElementById("brightness-overlay").style.opacity = (1 - pct) * 0.55;
      }
    };
    slider.addEventListener("pointerdown", (e) => {
      slider.setPointerCapture(e.pointerId);
      onDrag(e);
      const move = (ev) => onDrag(ev);
      slider.addEventListener("pointermove", move);
      slider.addEventListener("pointerup", () => slider.removeEventListener("pointermove", move), { once: true });
    });
  }
}

function setTheme(theme, persist = true) {
  document.body.dataset.theme = theme;
  if (persist) MacOS.store.set("theme", theme);
  document.dispatchEvent(new CustomEvent("theme-changed", { detail: theme }));
}

/* ---------- About This Mac ---------- */

function openAboutWindow() {
  if (WM.windows.has("about")) { WM.open("about"); return; }
  const win = WM.createWindow({
    id: "about",
    title: "About This Mac",
    width: 300,
    height: 360,
    resizable: false,
  });
  const mem = navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "16 GB";
  win.content.innerHTML = `
    <div class="about">
      <div class="about-logo">${Icons.apple}</div>
      <h1>MacBook Pro</h1>
      <div class="about-ver">macOS Web · Sequoia 15.5</div>
      <table>
        <tr><td>Chip</td><td>OkNguyen W1 Max</td></tr>
        <tr><td>Memory</td><td>${mem}</td></tr>
        <tr><td>Display</td><td>${window.screen.width} × ${window.screen.height}</td></tr>
        <tr><td>Serial</td><td>HTX2026DEMO</td></tr>
      </table>
    </div>`;
  win.content.querySelector(".about-logo svg").setAttribute("width", "72");
  win.content.querySelector(".about-logo svg").setAttribute("height", "72");
}

/* ---------- Lock screen / shutdown ---------- */

function showLockScreen() {
  MenuBar.closeDropdown();
  const lock = document.getElementById("lockscreen");
  lock.style.backgroundImage = document.getElementById("desktop").style.backgroundImage;
  lock.innerHTML = `
    <div class="lock-date"></div>
    <div class="lock-time"></div>
    <div class="lock-avatar">H</div>
    <div class="lock-name">OkNguyen</div>
    <div class="lock-hint">Click anywhere to unlock</div>`;
  const now = new Date();
  lock.querySelector(".lock-date").textContent =
    now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  lock.querySelector(".lock-time").textContent =
    now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(/ (AM|PM)/, "");
  lock.classList.remove("hidden");
  lock.addEventListener("click", () => lock.classList.add("hidden"), { once: true });
}

function showShutdown() {
  MenuBar.closeDropdown();
  const sd = document.getElementById("shutdown");
  sd.innerHTML = `<button title="Power on">⏻</button>`;
  sd.classList.remove("hidden");
  sd.querySelector("button").addEventListener("click", () => location.reload());
}
