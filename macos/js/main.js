/* main.js — boot sequence */
"use strict";

(function boot() {
  // restore persisted preferences
  setTheme(MacOS.store.get("theme", "light"), false);
  applyWallpaper(MacOS.store.get("wallpaper", "sequoia-light"), false);
  const accent = MacOS.store.get("accent", null);
  if (accent) document.documentElement.style.setProperty("--accent", accent);

  // brightness overlay (driven by Control Center)
  const dim = el("div");
  dim.id = "brightness-overlay";
  document.body.appendChild(dim);

  WM.init();
  MenuBar.init();
  Dock.init();

  // desktop context menu
  document.getElementById("desktop").addEventListener("contextmenu", (e) => {
    e.preventDefault();
    MenuBar.showDropdown(
      { getBoundingClientRect: () => ({ left: e.clientX, top: e.clientY }), classList: { add() {}, remove() {} } },
      [
        { label: "New Folder", disabled: true },
        { label: "Get Info", disabled: true },
        { sep: true },
        { label: "Change Wallpaper…", action: () => {
            WM.open("settings");
            document.dispatchEvent(new CustomEvent("settings-goto", { detail: "wallpaper" }));
          } },
        { label: "Use Stacks", disabled: true },
      ]
    );
    const dd = MenuBar.openMenu.dropdown;
    dd.style.left = Math.min(e.clientX, window.innerWidth - dd.offsetWidth - 8) + "px";
    dd.style.top = Math.min(e.clientY, window.innerHeight - dd.offsetHeight - 8) + "px";
  });

  // a gentle hello on first visit
  if (!MacOS.store.get("welcomed", false)) {
    MacOS.store.set("welcomed", true);
    setTimeout(() => {
      MacOS.notify("Welcome to macOS Web", "Open apps from the Dock. Everything runs in your browser.", Icons.finder);
    }, 900);
    setTimeout(() => WM.open("notes"), 400);
  }
})();
