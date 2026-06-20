/* wm.js — window manager: create / drag / resize / focus / minimize / zoom */
"use strict";

const WM = {
  windows: new Map(), // id -> win record
  focused: null,
  zCounter: 10,
  layer: null,

  init() {
    this.layer = document.getElementById("windows-layer");
    // clicking the bare desktop unfocuses everything (menubar falls back to Finder)
    document.getElementById("desktop").addEventListener("pointerdown", () => this.focus(null));
  },

  /* ---- public API ---- */

  open(appId) {
    const existing = this.windows.get(appId);
    if (existing) {
      if (existing.minimized) this.unminimize(existing);
      this.focus(existing);
      return existing;
    }
    const app = MacOS.apps[appId];
    if (!app) return null;
    const win = this.createWindow({
      id: appId,
      app,
      title: app.name,
      width: app.width || 600,
      height: app.height || 420,
      minWidth: app.minWidth || 320,
      minHeight: app.minHeight || 220,
      resizable: app.resizable !== false,
      chrome: app.chrome || "default",
    });
    Dock.markRunning(appId, true);
    Dock.bounce(appId);
    return win;
  },

  createWindow(opts) {
    const winEl = el("div", "window opening" + (opts.chrome === "overlay" ? " chrome-overlay" : ""));
    const offset = (this.windows.size % 5) * 28;
    const w = Math.min(opts.width, window.innerWidth - 40);
    const h = Math.min(opts.height, window.innerHeight - 110);
    winEl.style.width = w + "px";
    winEl.style.height = h + "px";
    winEl.style.left = Math.max(12, (window.innerWidth - w) / 2 + offset - 40) + "px";
    winEl.style.top = Math.max(34, (window.innerHeight - h) / 2.4 + offset) + "px";

    const titlebar = el("div", "win-titlebar", `
      <div class="traffic-lights">
        <button class="tl tl-close" aria-label="Close"><svg viewBox="0 0 8 8" stroke="#7e0508" stroke-width="1.2"><path d="M1.5 1.5 l5 5 M6.5 1.5 l-5 5"/></svg></button>
        <button class="tl tl-min" aria-label="Minimize"><svg viewBox="0 0 8 8" stroke="#985712" stroke-width="1.4"><path d="M1.2 4 h5.6"/></svg></button>
        <button class="tl tl-max" aria-label="Zoom"><svg viewBox="0 0 8 8" fill="#0b650d"><path d="M1.3 4.8 V1.3 H4.8 Z"/><path d="M6.7 3.2 V6.7 H3.2 Z"/></svg></button>
      </div>
      <span class="win-title"></span>`);
    titlebar.querySelector(".win-title").textContent = opts.title;
    winEl.appendChild(titlebar);

    const content = el("div", "win-content");
    winEl.appendChild(content);

    const win = {
      id: opts.id,
      app: opts.app || null,
      el: winEl,
      content,
      minimized: false,
      zoomed: false,
      prevRect: null,
      setTitle: (t) => { titlebar.querySelector(".win-title").textContent = t; },
      close: () => this.close(win),
    };

    /* traffic lights */
    titlebar.querySelector(".tl-close").addEventListener("click", (e) => { e.stopPropagation(); this.close(win); });
    titlebar.querySelector(".tl-min").addEventListener("click", (e) => { e.stopPropagation(); this.minimize(win); });
    titlebar.querySelector(".tl-max").addEventListener("click", (e) => { e.stopPropagation(); this.toggleZoom(win); });
    titlebar.addEventListener("dblclick", (e) => {
      if (!e.target.closest(".tl")) this.toggleZoom(win);
    });

    this.makeDraggable(win, titlebar);
    if (opts.resizable) this.makeResizable(win, opts.minWidth, opts.minHeight);

    winEl.addEventListener("pointerdown", () => this.focus(win));
    winEl.addEventListener("animationend", () => winEl.classList.remove("opening"), { once: true });

    this.layer.appendChild(winEl);
    this.windows.set(opts.id, win);
    if (opts.app && opts.app.mount) opts.app.mount(content, win);
    this.focus(win);
    return win;
  },

  close(win) {
    if (win.app && win.app.unmount) win.app.unmount(win);
    win.el.remove();
    this.windows.delete(win.id);
    Dock.markRunning(win.id, false);
    if (this.focused === win) {
      // focus the topmost remaining window, if any
      let top = null;
      for (const w of this.windows.values()) {
        if (w.minimized) continue;
        if (!top || +w.el.style.zIndex > +top.el.style.zIndex) top = w;
      }
      this.focus(top);
    }
  },

  focus(win) {
    if (win && win.minimized) return;
    if (this.focused && this.focused !== win) this.focused.el.classList.remove("active");
    this.focused = win;
    if (win) {
      win.el.classList.add("active");
      win.el.style.zIndex = ++this.zCounter;
    }
    document.dispatchEvent(new CustomEvent("wm-focus", { detail: win ? win.app : null }));
  },

  minimize(win) {
    if (win.minimized) return;
    win.minimized = true;
    const target = Dock.getIconRect(win.id);
    const rect = win.el.getBoundingClientRect();
    const dx = target.x + target.width / 2 - (rect.x + rect.width / 2);
    const dy = target.y + target.height / 2 - (rect.y + rect.height / 2);
    const anim = win.el.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: `translate(${dx * 0.5}px,${dy * 0.6}px) scale(0.4)`, opacity: 0.6, offset: 0.6 },
        { transform: `translate(${dx}px,${dy}px) scale(0.05)`, opacity: 0 },
      ],
      { duration: 380, easing: "cubic-bezier(0.4, 0, 0.6, 1)" }
    );
    anim.onfinish = () => { if (win.minimized) win.el.style.display = "none"; };
    win.minimizeAnim = anim;
    if (this.focused === win) this.focus(null);
  },

  unminimize(win) {
    win.minimized = false;
    if (win.minimizeAnim) { win.minimizeAnim.cancel(); win.minimizeAnim = null; }
    win.el.style.display = "";
    const target = Dock.getIconRect(win.id);
    const rect = win.el.getBoundingClientRect();
    const dx = target.x + target.width / 2 - (rect.x + rect.width / 2);
    const dy = target.y + target.height / 2 - (rect.y + rect.height / 2);
    win.el.animate(
      [
        { transform: `translate(${dx}px,${dy}px) scale(0.05)`, opacity: 0 },
        { transform: "translate(0,0) scale(1)", opacity: 1 },
      ],
      { duration: 330, easing: "cubic-bezier(0.2, 0.7, 0.3, 1)" }
    );
  },

  toggleZoom(win) {
    const elw = win.el;
    if (!win.zoomed) {
      win.prevRect = {
        left: elw.style.left, top: elw.style.top,
        width: elw.style.width, height: elw.style.height,
      };
      const dockTop = document.getElementById("dock-wrap").getBoundingClientRect().top;
      Object.assign(elw.style, {
        left: "8px",
        top: "34px",
        width: window.innerWidth - 16 + "px",
        height: dockTop - 42 + "px",
      });
      win.zoomed = true;
    } else {
      Object.assign(elw.style, win.prevRect);
      win.zoomed = false;
    }
  },

  /* ---- drag ---- */

  makeDraggable(win, handle) {
    let startX, startY, origX, origY, dragging = false;
    handle.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest(".tl")) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      origX = win.el.offsetLeft; origY = win.el.offsetTop;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      let nx = origX + (e.clientX - startX);
      let ny = origY + (e.clientY - startY);
      const w = win.el.offsetWidth;
      nx = Math.min(Math.max(nx, -w + 80), window.innerWidth - 80);
      ny = Math.min(Math.max(ny, 30), window.innerHeight - 40);
      win.el.style.left = nx + "px";
      win.el.style.top = ny + "px";
      if (win.zoomed) win.zoomed = false; // dragging a zoomed window "unzooms" it logically
    });
    const stop = () => { dragging = false; };
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
  },

  /* ---- resize ---- */

  makeResizable(win, minW, minH) {
    const dirs = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];
    for (const dir of dirs) {
      const grip = el("div", `rz rz-${dir}`);
      win.el.appendChild(grip);
      let sx, sy, rect, resizing = false;
      grip.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        resizing = true;
        sx = e.clientX; sy = e.clientY;
        rect = {
          x: win.el.offsetLeft, y: win.el.offsetTop,
          w: win.el.offsetWidth, h: win.el.offsetHeight,
        };
        grip.setPointerCapture(e.pointerId);
        e.stopPropagation();
        this.focus(win);
      });
      grip.addEventListener("pointermove", (e) => {
        if (!resizing) return;
        const dx = e.clientX - sx;
        const dy = e.clientY - sy;
        let { x, y, w, h } = rect;
        if (dir.includes("e")) w = Math.max(minW, rect.w + dx);
        if (dir.includes("s")) h = Math.max(minH, rect.h + dy);
        if (dir.includes("w")) {
          w = Math.max(minW, rect.w - dx);
          x = rect.x + rect.w - w;
        }
        if (dir.includes("n")) {
          h = Math.max(minH, rect.h - dy);
          y = Math.max(30, rect.y + rect.h - h);
          h = rect.y + rect.h - y;
        }
        Object.assign(win.el.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" });
      });
      const stop = () => { resizing = false; };
      grip.addEventListener("pointerup", stop);
      grip.addEventListener("pointercancel", stop);
    }
  },
};
