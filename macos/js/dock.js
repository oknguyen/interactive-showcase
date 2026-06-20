/* dock.js — dock with proximity magnification, bounce, running dots, launchpad */
"use strict";

const Dock = {
  el: null,
  items: new Map(), // id -> .dock-item element

  BASE: 52,
  MAX: 92,
  RANGE: 160,

  /* dock layout: working apps + decorative classics */
  layout: [
    { id: "finder", name: "Finder", icon: () => Icons.finder, decorative: true },
    { id: "launchpad", name: "Launchpad", icon: () => Icons.launchpad, special: true },
    { id: "safari", name: "Safari", icon: () => Icons.safari, decorative: true },
    { id: "messages", name: "Messages", icon: () => Icons.messages, decorative: true },
    { id: "photos", name: "Photos", icon: () => Icons.photos, decorative: true },
    { id: "calculator", name: "Calculator", icon: () => Icons.calculator },
    { id: "notes", name: "Notes", icon: () => Icons.notes },
    { id: "terminal", name: "Terminal", icon: () => Icons.terminal },
    { id: "settings", name: "System Settings", icon: () => Icons.settings },
    { sep: true },
    { id: "trash", name: "Trash", icon: () => Icons.trash, special: true },
  ],

  init() {
    this.el = document.getElementById("dock");

    for (const item of this.layout) {
      if (item.sep) { this.el.appendChild(el("div", "dock-sep")); continue; }
      const d = el("div", "dock-item", `
        ${item.icon()}
        <div class="dock-label"></div>
        <div class="dock-dot"></div>`);
      d.querySelector(".dock-label").textContent = item.name;
      d.dataset.id = item.id;
      d.addEventListener("click", () => this.onClick(item));
      this.el.appendChild(d);
      this.items.set(item.id, d);
    }
    this.items.get("finder").classList.add("running"); // Finder is always "running"

    /* proximity magnification */
    this.el.addEventListener("mousemove", (e) => this.magnify(e.clientX));
    this.el.addEventListener("mouseleave", () => this.resetMagnify());

    /* launchpad overlay */
    const lp = document.getElementById("launchpad");
    lp.addEventListener("click", (e) => { if (e.target === lp || e.target.id === "launchpad-grid") this.toggleLaunchpad(false); });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !lp.classList.contains("hidden")) this.toggleLaunchpad(false);
    });
    this.buildLaunchpad();
  },

  onClick(item) {
    if (item.id === "launchpad") { this.toggleLaunchpad(); return; }
    if (item.id === "trash") {
      this.bounce("trash");
      MacOS.notify("Trash", "Trash is empty.", Icons.trash);
      return;
    }
    if (item.decorative) {
      this.bounce(item.id);
      MacOS.notify(item.name, `${item.name} is decorative in this demo. Try Calculator, Notes, Terminal or Settings.`, Icons[item.id] || Icons.finder);
      return;
    }
    WM.open(item.id);
  },

  magnify(mouseX) {
    for (const d of this.items.values()) {
      const r = d.getBoundingClientRect();
      const dist = Math.abs(mouseX - (r.left + r.width / 2));
      let size = this.BASE;
      if (dist < this.RANGE) {
        const f = (Math.cos((dist / this.RANGE) * Math.PI) + 1) / 2; // smooth falloff 1 → 0
        size = this.BASE + (this.MAX - this.BASE) * f;
      }
      d.style.setProperty("--size", size.toFixed(1) + "px");
    }
  },

  resetMagnify() {
    for (const d of this.items.values()) d.style.setProperty("--size", this.BASE + "px");
  },

  bounce(id) {
    const d = this.items.get(id);
    if (!d) return;
    d.classList.remove("bouncing");
    void d.offsetWidth; // restart animation
    d.classList.add("bouncing");
    d.addEventListener("animationend", () => d.classList.remove("bouncing"), { once: true });
  },

  markRunning(id, running) {
    const d = this.items.get(id);
    if (d) d.classList.toggle("running", running);
  },

  getIconRect(id) {
    const d = this.items.get(id);
    if (d) return d.getBoundingClientRect();
    // windows without a dock icon (e.g. About) minimize toward the dock center
    const dock = this.el.getBoundingClientRect();
    return { x: dock.x + dock.width / 2, y: dock.y, width: 0, height: 0 };
  },

  buildLaunchpad() {
    const grid = document.getElementById("launchpad-grid");
    const apps = ["calculator", "notes", "terminal", "settings"];
    for (const id of apps) {
      const item = this.layout.find((i) => i.id === id);
      const a = el("div", "lp-app", `${item.icon()}<span></span>`);
      a.querySelector("span").textContent = item.name;
      a.addEventListener("click", () => {
        this.toggleLaunchpad(false);
        WM.open(id);
      });
      grid.appendChild(a);
    }
  },

  toggleLaunchpad(force) {
    const lp = document.getElementById("launchpad");
    const show = force !== undefined ? force : lp.classList.contains("hidden");
    lp.classList.toggle("hidden", !show);
  },
};
