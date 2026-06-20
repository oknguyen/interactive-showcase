/* apps/notes.js — Notes with localStorage persistence */
"use strict";

MacOS.registerApp({
  id: "notes",
  name: "Notes",
  width: 760,
  height: 500,
  minWidth: 540,
  minHeight: 320,

  menus() {
    return [
      { title: "File", items: [
        { label: "New Note", shortcut: "⌘N", action: () => document.dispatchEvent(new CustomEvent("notes-new")) },
        { sep: true },
        { label: "Delete Note", action: () => document.dispatchEvent(new CustomEvent("notes-delete")) },
      ]},
      { title: "Edit", items: [
        { label: "Select All", shortcut: "⌘A", action: () => {
          const ta = document.querySelector(".notes-editor");
          if (ta) ta.select();
        }},
      ]},
      { title: "View", items: [
        { label: "Show Folders", disabled: true },
        { label: "Show Note Count", disabled: true },
      ]},
    ];
  },

  mount(root, win) {
    const KEY = "notes.v1";
    let notes = MacOS.store.get(KEY, null);
    if (!notes) {
      notes = [
        {
          id: crypto.randomUUID(),
          text: "Welcome to Notes 👋\nEverything you type here is saved to your browser's localStorage — close the window, reload the page, your notes survive.\n\nTry:\n• Create a note with the ✎ button\n• Delete one with the 🗑 button\n• Search in the sidebar",
          updated: Date.now(),
        },
        {
          id: crypto.randomUUID(),
          text: "Ideas for the video\n- Show the dock magnification slow-mo\n- Calculator: 0.1 + 0.2 actually equals 0.3 here\n- Terminal: run neofetch\n- Change wallpaper live from Settings",
          updated: Date.now() - 3600_000,
        },
      ];
      MacOS.store.set(KEY, notes);
    }

    let selectedId = notes[0]?.id || null;
    let filter = "";
    let saveTimer = null;

    root.innerHTML = `
      <div class="notes">
        <div class="notes-sidebar">
          <div class="notes-search-wrap">
            ${Glyphs.search}
            <input class="notes-search" type="text" placeholder="Search" spellcheck="false">
          </div>
          <div class="notes-list"></div>
        </div>
        <div class="notes-main">
          <div class="notes-toolbar">
            <button class="tool-btn" data-act="delete" title="Delete note">${Glyphs.trash}</button>
            <div class="spacer"></div>
            <button class="tool-btn" data-act="new" title="New note">${Glyphs.compose}</button>
          </div>
          <div class="notes-body"></div>
        </div>
      </div>`;

    const listEl = root.querySelector(".notes-list");
    const bodyEl = root.querySelector(".notes-body");
    bodyEl.style.cssText = "flex:1;display:flex;flex-direction:column;min-height:0;";
    const searchEl = root.querySelector(".notes-search");

    const persist = () => MacOS.store.set(KEY, notes);

    const titleOf = (n) => (n.text.split("\n")[0] || "New Note").slice(0, 60) || "New Note";
    const snippetOf = (n) => (n.text.split("\n").slice(1).find((l) => l.trim()) || "No additional text").slice(0, 60);

    function fmtDate(ts) {
      const d = new Date(ts);
      const today = new Date();
      const sameDay = d.toDateString() === today.toDateString();
      return sameDay
        ? d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        : d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" });
    }

    function visibleNotes() {
      const sorted = [...notes].sort((a, b) => b.updated - a.updated);
      if (!filter) return sorted;
      const q = filter.toLowerCase();
      return sorted.filter((n) => n.text.toLowerCase().includes(q));
    }

    function renderList() {
      listEl.innerHTML = "";
      for (const n of visibleNotes()) {
        const row = el("div", "note-row" + (n.id === selectedId ? " selected" : ""));
        const title = el("div", "note-row-title"); title.textContent = titleOf(n);
        const meta = el("div", "note-row-meta"); meta.textContent = `${fmtDate(n.updated)}  ${snippetOf(n)}`;
        row.append(title, meta);
        row.addEventListener("click", () => { selectNote(n.id); });
        listEl.appendChild(row);
      }
    }

    function renderEditor() {
      const note = notes.find((n) => n.id === selectedId);
      bodyEl.innerHTML = "";
      if (!note) {
        bodyEl.appendChild(el("div", "notes-empty", "No Note Selected"));
        return;
      }
      const date = el("div", "notes-date");
      date.textContent = new Date(note.updated).toLocaleString("en-US", {
        month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
      });
      const ta = document.createElement("textarea");
      ta.className = "notes-editor";
      ta.spellcheck = false;
      ta.value = note.text;
      ta.addEventListener("input", () => {
        note.text = ta.value;
        note.updated = Date.now();
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => { persist(); renderList(); }, 400);
      });
      bodyEl.append(date, ta);
    }

    function selectNote(id) {
      clearTimeout(saveTimer); persist();
      selectedId = id;
      renderList();
      renderEditor();
    }

    function newNote() {
      const n = { id: crypto.randomUUID(), text: "", updated: Date.now() };
      notes.push(n);
      persist();
      filter = ""; searchEl.value = "";
      selectNote(n.id);
      bodyEl.querySelector("textarea")?.focus();
    }

    function deleteNote() {
      if (!selectedId) return;
      notes = notes.filter((n) => n.id !== selectedId);
      persist();
      selectedId = visibleNotes()[0]?.id || null;
      renderList();
      renderEditor();
    }

    root.querySelector('[data-act="new"]').addEventListener("click", newNote);
    root.querySelector('[data-act="delete"]').addEventListener("click", deleteNote);
    searchEl.addEventListener("input", () => { filter = searchEl.value; renderList(); });

    /* menu bar bridges */
    win.onNewNote = () => newNote();
    win.onDeleteNote = () => deleteNote();
    document.addEventListener("notes-new", win.onNewNote);
    document.addEventListener("notes-delete", win.onDeleteNote);

    renderList();
    renderEditor();
  },

  unmount(win) {
    document.removeEventListener("notes-new", win.onNewNote);
    document.removeEventListener("notes-delete", win.onDeleteNote);
  },
});
