/* apps/calculator.js — a working macOS-style calculator */
"use strict";

MacOS.registerApp({
  id: "calculator",
  name: "Calculator",
  width: 252,
  height: 396,
  resizable: false,
  chrome: "overlay",

  menus() {
    return [
      { title: "View", items: [
        { label: "Basic", shortcut: "⌘1", action: () => {} },
        { label: "Scientific", shortcut: "⌘2", disabled: true },
        { label: "Programmer", shortcut: "⌘3", disabled: true },
      ]},
      { title: "Edit", items: [
        { label: "Copy Result", shortcut: "⌘C", action: () => {
          const w = WM.windows.get("calculator");
          if (w) navigator.clipboard?.writeText(w.content.querySelector(".calc-display").textContent);
        }},
      ]},
    ];
  },

  mount(root, win) {
    const state = {
      current: "0",
      previous: null,
      op: null,
      fresh: true, // next digit starts a new number
    };

    root.innerHTML = `
      <div class="calc">
        <div class="calc-display">0</div>
        <div class="calc-grid"></div>
      </div>`;
    const display = root.querySelector(".calc-display");
    const grid = root.querySelector(".calc-grid");

    const BUTTONS = [
      ["AC", "fn"], ["±", "fn"], ["%", "fn"], ["÷", "op"],
      ["7", ""], ["8", ""], ["9", ""], ["×", "op"],
      ["4", ""], ["5", ""], ["6", ""], ["−", "op"],
      ["1", ""], ["2", ""], ["3", ""], ["+", "op"],
      ["0", "zero"], [".", ""], ["=", "op"],
    ];

    for (const [label, cls] of BUTTONS) {
      const b = el("button", `calc-btn ${cls}`.trim());
      b.textContent = label;
      b.dataset.key = label;
      b.addEventListener("click", () => press(label));
      grid.appendChild(b);
    }

    function fmt(numStr) {
      if (numStr === "Error") return numStr;
      const n = Number(numStr);
      if (!isFinite(n)) return "Error";
      if (Math.abs(n) >= 1e12 || (Math.abs(n) < 1e-9 && n !== 0)) return n.toExponential(6);
      // keep what the user is typing (trailing dot / zeros), format finished numbers
      if (/\.\d*0$|\.$/.test(numStr)) return numStr;
      const [int, dec] = numStr.split(".");
      const intFmt = Number(int).toLocaleString("en-US", { maximumFractionDigits: 0 });
      return dec !== undefined ? `${intFmt}.${dec}` : intFmt;
    }

    function render() {
      display.textContent = fmt(state.current);
      const len = display.textContent.length;
      display.style.fontSize = (len > 9 ? Math.max(22, 52 - (len - 9) * 3.4) : 52) + "px";
      grid.querySelectorAll(".op").forEach((b) => {
        b.classList.toggle("held", state.op !== null && b.dataset.key === state.op && state.fresh);
      });
      grid.querySelector('[data-key="AC"]').textContent = state.current === "0" && state.fresh ? "AC" : "C";
    }

    function compute(a, op, b) {
      a = Number(a); b = Number(b);
      let r;
      switch (op) {
        case "+": r = a + b; break;
        case "−": r = a - b; break;
        case "×": r = a * b; break;
        case "÷": r = b === 0 ? NaN : a / b; break;
        default: r = b;
      }
      if (!isFinite(r)) return "Error";
      // trim float noise (0.1 + 0.2)
      return String(Math.round(r * 1e10) / 1e10);
    }

    function press(key) {
      if (/^\d$/.test(key)) {
        if (state.fresh) { state.current = key; state.fresh = false; }
        else if (state.current.replace(/[-.]/g, "").length < 12) state.current += key;
      } else if (key === ".") {
        if (state.fresh) { state.current = "0."; state.fresh = false; }
        else if (!state.current.includes(".")) state.current += ".";
      } else if (key === "AC") {
        if (state.current !== "0" || !state.fresh) { state.current = "0"; state.fresh = true; }
        else { state.previous = null; state.op = null; }
        if (display.textContent === "Error") { state.previous = null; state.op = null; }
      } else if (key === "±") {
        if (state.current !== "0") state.current = state.current.startsWith("-") ? state.current.slice(1) : "-" + state.current;
      } else if (key === "%") {
        state.current = String(Number(state.current) / 100);
      } else if (key === "=") {
        if (state.op && state.previous !== null) {
          state.current = compute(state.previous, state.op, state.current);
          state.previous = null;
          state.op = null;
          state.fresh = true;
        }
      } else { // + − × ÷
        if (state.op && state.previous !== null && !state.fresh) {
          state.current = compute(state.previous, state.op, state.current);
        }
        state.previous = state.current === "Error" ? null : state.current;
        state.op = state.current === "Error" ? null : key;
        state.fresh = true;
      }
      render();
    }

    /* keyboard input while the calculator window is focused */
    const KEYMAP = { "*": "×", x: "×", "/": "÷", "-": "−", "+": "+", Enter: "=", "=": "=", "%": "%", Escape: "AC", Backspace: "AC", c: "AC" };
    win.keyHandler = (e) => {
      if (WM.focused !== win) return;
      const key = /^\d$/.test(e.key) || e.key === "." ? e.key : KEYMAP[e.key];
      if (!key) return;
      e.preventDefault();
      press(key);
      const btn = grid.querySelector(`[data-key="${key}"]`);
      if (btn) { btn.style.filter = "brightness(1.45)"; setTimeout(() => (btn.style.filter = ""), 90); }
    };
    window.addEventListener("keydown", win.keyHandler);
    render();
  },

  unmount(win) {
    window.removeEventListener("keydown", win.keyHandler);
  },
});
