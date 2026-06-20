/* apps/terminal.js — zsh-flavored fake terminal.
   User input is always rendered via textContent / escapeHtml. */
"use strict";

MacOS.registerApp({
  id: "terminal",
  name: "Terminal",
  width: 640,
  height: 420,
  minWidth: 400,
  minHeight: 240,
  chrome: "overlay",

  menus() {
    return [
      { title: "Shell", items: [
        { label: "New Window", shortcut: "⌘N", disabled: true },
        { sep: true },
        { label: "Clear Buffer", shortcut: "⌘K", action: () => document.dispatchEvent(new CustomEvent("term-clear")) },
      ]},
      { title: "Edit", items: [
        { label: "Paste", shortcut: "⌘V", disabled: true },
      ]},
    ];
  },

  mount(root, win) {
    /* tiny fake filesystem: dirs are objects, files are strings */
    const FS = {
      Desktop: {},
      Documents: {
        "ideas.md": "# Video ideas\n- macOS clone in the browser\n- window manager deep-dive\n- dock magnification math",
        "notes.txt": "Remember: this whole OS is just HTML, CSS and vanilla JS.",
      },
      Downloads: { "wallpapers.zip": "PK ... (binary)" },
      Pictures: {},
      "README.md": "macOS Web by OkNguyen.\nType `help` to see available commands.",
    };

    let cwd = []; // path segments relative to ~
    const history = [];
    let histIdx = -1;

    root.innerHTML = `
      <div class="terminal">
        <div class="term-scroll"></div>
      </div>`;
    const scroll = root.querySelector(".term-scroll");

    const pathStr = () => "~" + (cwd.length ? "/" + cwd.join("/") : "");
    const promptHtml = () =>
      `<span class="term-prompt-user">okngu@macbook-pro</span> <span class="term-prompt-path">${escapeHtml(pathStr())}</span> <span class="term-dim">%</span> `;

    function resolve(pathArg) {
      // returns { node, segs } or null
      let segs;
      if (!pathArg) segs = [...cwd];
      else if (pathArg === "~") segs = [];
      else if (pathArg.startsWith("~/")) segs = pathArg.slice(2).split("/").filter(Boolean);
      else if (pathArg === "..") segs = cwd.slice(0, -1);
      else if (pathArg === ".") segs = [...cwd];
      else segs = [...cwd, ...pathArg.split("/").filter(Boolean)];

      // normalize ".." inside the path
      const norm = [];
      for (const s of segs) {
        if (s === "..") norm.pop();
        else if (s !== ".") norm.push(s);
      }
      let node = FS;
      for (const s of norm) {
        if (node && typeof node === "object" && s in node) node = node[s];
        else return null;
      }
      return { node, segs: norm };
    }

    function print(html) {
      const line = el("div", "term-line");
      line.innerHTML = html; // callers escape all user-derived content
      scroll.appendChild(line);
    }
    const printText = (text, cls = "") => {
      const line = el("div", "term-line" + (cls ? " " + cls : ""));
      line.textContent = text;
      scroll.appendChild(line);
    };

    function uptime() {
      const s = Math.floor((Date.now() - MacOS.bootTime) / 1000);
      const m = Math.floor(s / 60);
      return m > 0 ? `${m} min${m > 1 ? "s" : ""}` : `${s} secs`;
    }

    const COMMANDS = {
      help() {
        print(`<span class="term-dim">Available commands:</span>`);
        printText("  help          show this list");
        printText("  ls [dir]      list directory");
        printText("  cd <dir>      change directory");
        printText("  pwd           print working directory");
        printText("  cat <file>    print a file");
        printText("  echo <text>   print text");
        printText("  open <app>    open an app (calculator, notes, terminal, settings)");
        printText("  wallpaper     cycle the desktop wallpaper");
        printText("  date / whoami / hostname / uname / sw_vers / uptime");
        printText("  neofetch      system info, in style");
        printText("  clear         clear the screen");
      },
      ls(args) {
        const target = resolve(args[0]);
        if (!target) return printText(`ls: ${args[0]}: No such file or directory`, "term-err");
        const node = target.node;
        if (typeof node === "string") return printText(args[0]);
        const entries = Object.keys(node);
        if (!entries.length) return;
        print(entries
          .map((k) => (typeof node[k] === "object" ? `<span class="term-dir">${escapeHtml(k)}</span>` : escapeHtml(k)))
          .join("   "));
      },
      cd(args) {
        if (!args[0] || args[0] === "~") { cwd = []; return; }
        const target = resolve(args[0]);
        if (!target) return printText(`cd: no such file or directory: ${args[0]}`, "term-err");
        if (typeof target.node !== "object") return printText(`cd: not a directory: ${args[0]}`, "term-err");
        cwd = target.segs;
      },
      pwd() { printText("/Users/okngu" + (cwd.length ? "/" + cwd.join("/") : "")); },
      cat(args) {
        if (!args[0]) return printText("usage: cat <file>", "term-err");
        const target = resolve(args[0]);
        if (!target) return printText(`cat: ${args[0]}: No such file or directory`, "term-err");
        if (typeof target.node === "object") return printText(`cat: ${args[0]}: Is a directory`, "term-err");
        printText(target.node);
      },
      echo(args) { printText(args.join(" ")); },
      date() { printText(new Date().toString()); },
      whoami() { printText("okngu"); },
      hostname() { printText("macbook-pro.local"); },
      uname(args) { printText(args[0] === "-a" ? "Darwin macbook-pro.local 24.5.0 Darwin Kernel (web edition) arm64" : "Darwin"); },
      sw_vers() {
        printText("ProductName:    macOS Web");
        printText("ProductVersion: 15.5");
        printText("BuildVersion:   HTX2026");
      },
      uptime() { printText(` ${new Date().toLocaleTimeString("en-US", { hour12: false })}  up ${uptime()}, 1 user, load averages: 0.42 0.13 0.07`); },
      open(args) {
        const id = (args.filter((a) => a !== "-a")[0] || "").toLowerCase();
        if (MacOS.apps[id]) { WM.open(id); printText(`Opening ${MacOS.apps[id].name}…`); }
        else printText(`open: no such application: ${args.join(" ") || "(none)"}`, "term-err");
      },
      wallpaper() {
        const current = MacOS.store.get("wallpaper", Wallpapers[0].id);
        const idx = Wallpapers.findIndex((w) => w.id === current);
        const next = Wallpapers[(idx + 1) % Wallpapers.length];
        applyWallpaper(next.id);
        printText(`Wallpaper set to "${next.name}".`);
      },
      clear() { scroll.innerHTML = ""; },
      neofetch() {
        const art = [
          ["nf-g", "                 ,xNMM."],
          ["nf-g", "               .OMMMMo"],
          ["nf-g", "               lMM\""],
          ["nf-y", "     .;loddo:.  .olloddol;."],
          ["nf-y", "   cKMMMMMMMMMMNWMMMMMMMMMM0:"],
          ["nf-o", " .KMMMMMMMMMMMMMMMMMMMMMMMWd."],
          ["nf-o", " XMMMMMMMMMMMMMMMMMMMMMMMX."],
          ["nf-r", ";MMMMMMMMMMMMMMMMMMMMMMMM:"],
          ["nf-r", ":MMMMMMMMMMMMMMMMMMMMMMMM:"],
          ["nf-p", ".MMMMMMMMMMMMMMMMMMMMMMMMX."],
          ["nf-p", " kMMMMMMMMMMMMMMMMMMMMMMMMWd."],
          ["nf-b", " .XMMMMMMMMMMMMMMMMMMMMMMMMMMk"],
          ["nf-b", "  .XMMMMMMMMMMMMMMMMMMMMMMMMK."],
          ["nf-b", "    kMMMMMMMMMMMMMMMMMMMMMMd"],
          ["nf-b", "     ;KMMMMMMMWXXWMMMMMMMk."],
          ["nf-b", "       .cooc,.    .,coo:."],
        ];
        const info = [
          `<span class="nf-k">okngu</span>@<span class="nf-k">macbook-pro</span>`,
          `<span class="term-dim">-----------------------</span>`,
          `<span class="nf-k">OS:</span> macOS Web Sequoia 15.5 arm64`,
          `<span class="nf-k">Host:</span> MacBook Pro (Browser Edition)`,
          `<span class="nf-k">Kernel:</span> ${escapeHtml(navigator.userAgent.includes("Firefox") ? "Gecko" : "Blink/WebKit")}`,
          `<span class="nf-k">Uptime:</span> ${uptime()}`,
          `<span class="nf-k">Shell:</span> zsh 5.9 (simulated)`,
          `<span class="nf-k">Resolution:</span> ${window.innerWidth}x${window.innerHeight}`,
          `<span class="nf-k">DE:</span> Aqua (HTML/CSS)`,
          `<span class="nf-k">WM:</span> OkNguyen WM`,
          `<span class="nf-k">Memory:</span> ${navigator.deviceMemory || 16} GB`,
        ];
        const block = el("div", "term-line nf-apple");
        block.innerHTML = art
          .map(([cls, line], i) => {
            const left = `<span class="${cls}">${escapeHtml(line.padEnd(34))}</span>`;
            return left + (info[i] || "");
          })
          .join("\n");
        scroll.appendChild(block);
        printText("");
      },
    };

    let inputEl = null;

    function newPromptLine() {
      const row = el("div", "term-line term-input-row");
      row.innerHTML = `<span>${promptHtml()}</span>`;
      inputEl = document.createElement("input");
      inputEl.className = "term-input";
      inputEl.spellcheck = false;
      inputEl.autocapitalize = "off";
      inputEl.autocomplete = "off";
      row.appendChild(inputEl);
      scroll.appendChild(row);
      inputEl.addEventListener("keydown", onKey);
      inputEl.focus();
      scroll.scrollTop = scroll.scrollHeight;
    }

    function onKey(e) {
      if (e.key === "Enter") {
        const raw = inputEl.value;
        // freeze the line: replace input with plain text
        const row = inputEl.parentElement;
        inputEl.removeEventListener("keydown", onKey);
        const frozen = el("span"); frozen.textContent = raw;
        row.replaceChild(frozen, inputEl);

        if (raw.trim()) { history.push(raw); histIdx = history.length; run(raw.trim()); }
        newPromptLine();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (histIdx > 0) { histIdx--; inputEl.value = history[histIdx]; }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (histIdx < history.length - 1) { histIdx++; inputEl.value = history[histIdx]; }
        else { histIdx = history.length; inputEl.value = ""; }
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        COMMANDS.clear();
        newPromptLine();
      } else if (e.key === "c" && e.ctrlKey) {
        e.preventDefault();
        inputEl.value = "";
      }
    }

    function run(line) {
      const [cmd, ...args] = line.split(/\s+/);
      const fn = COMMANDS[cmd];
      if (fn) fn(args);
      else printText(`zsh: command not found: ${cmd}`, "term-err");
      scroll.scrollTop = scroll.scrollHeight;
    }

    printText(`Last login: ${new Date().toDateString()} on ttys000`);
    print(`<span class="term-dim">Welcome to macOS Web — type</span> help <span class="term-dim">to get started.</span>`);
    newPromptLine();

    /* clicking anywhere inside the terminal focuses the prompt */
    root.querySelector(".terminal").addEventListener("click", () => {
      if (!window.getSelection()?.toString()) inputEl?.focus();
    });

    win.onTermClear = () => { COMMANDS.clear(); newPromptLine(); };
    document.addEventListener("term-clear", win.onTermClear);
  },

  unmount(win) {
    document.removeEventListener("term-clear", win.onTermClear);
  },
});
