/* ============================================================
   Sổ Chi Tiêu — app.js
   Store (localStorage) + render UI + biểu đồ SVG tự vẽ.
   Phụ thuộc: window.SCT (parser.js)
   ============================================================ */
(function () {
  'use strict';

  const { parse, CATEGORIES, getCategory, fmtVND, fmtCompact, isoDate } = window.SCT;
  const KEY = 'soChiTieu.v1';
  const $ = (s) => document.querySelector(s);

  /* ---------- State ---------- */
  const today = new Date();
  let state = load() || { tx: [], budget: 5000000, theme: 'dark' };
  let view = { y: today.getFullYear(), m: today.getMonth() }; // tháng đang xem
  let lastParsed = null;
  let catOverride = null;   // người dùng chọn tay danh mục ở preview
  let typeOverride = null;  // người dùng đổi tay thu/chi ở preview
  let lastDeleted = null;

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      return s && Array.isArray(s.tx) ? s : null;
    } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }

  /* ---------- Helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function viewKey() { return view.y + '-' + String(view.m + 1).padStart(2, '0'); }
  function monthTx() { return state.tx.filter((t) => t.date.slice(0, 7) === viewKey()); }
  function sumExpense(list) { return list.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0); }
  function sumIncome(list) { return list.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0); }
  function daysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
  function isViewingCurrentMonth() { return view.y === today.getFullYear() && view.m === today.getMonth(); }

  function dateLabel(iso) {
    const t = isoDate(new Date());
    const yd = new Date(); yd.setDate(yd.getDate() - 1);
    if (iso === t) return 'Hôm nay';
    if (iso === isoDate(yd)) return 'Hôm qua';
    const [y, m, d] = iso.split('-').map(Number);
    const s = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }).format(new Date(y, m - 1, d));
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* Đếm số chạy mượt cho các con số lớn */
  function countUp(el, target, fmt) {
    fmt = fmt || fmtVND;
    const from = el._v || 0;
    el._v = target;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || from === target) {
      el.textContent = fmt(target);
      return;
    }
    const t0 = performance.now(), dur = 550;
    function tick(t) {
      const p = Math.min(1, (t - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(from + (target - from) * ease);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- Toast ---------- */
  function toast(msg, kind, actLabel, actFn) {
    const box = document.createElement('div');
    box.className = 'toast' + (kind ? ' ' + kind : '');
    box.innerHTML = `<span class="msg">${msg}</span>`;
    if (actLabel) {
      const b = document.createElement('button');
      b.className = 'act';
      b.textContent = actLabel;
      b.addEventListener('click', () => { actFn && actFn(); dismiss(); });
      box.appendChild(b);
    }
    $('#toasts').appendChild(box);
    let gone = false;
    function dismiss() {
      if (gone) return; gone = true;
      box.classList.add('out');
      setTimeout(() => box.remove(), 320);
    }
    setTimeout(dismiss, kind === 'over' ? 6500 : 4800);
  }

  /* ---------- Theme ---------- */
  const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.4"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 14.2A8.5 8.5 0 1 1 9.8 3.6a7 7 0 1 0 10.6 10.6Z"/></svg>';
  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    $('#themeToggle').innerHTML = state.theme === 'dark' ? SUN : MOON;
    const mc = document.querySelector('meta[name="theme-color"]');
    if (mc) mc.content = state.theme === 'dark' ? '#11100d' : '#f5efe3';
  }
  $('#themeToggle').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    save(); applyTheme();
  });

  /* ---------- Preview ô nhập ---------- */
  const input = $('#entryInput');
  const preview = $('#preview');
  const addBtn = $('#entryAdd');
  const entryBox = $('#entryForm');

  function effectiveType() { return typeOverride || (lastParsed ? lastParsed.type : 'expense'); }
  function effectiveCatId() {
    if (catOverride) return catOverride;
    const t = effectiveType();
    if (t === 'income') return 'thu-nhap';
    return lastParsed ? lastParsed.categoryId : 'khac';
  }
  function dateChipLabel(iso) {
    const t = isoDate(new Date());
    if (iso === t) return 'Hôm nay';
    const yd = new Date(); yd.setDate(yd.getDate() - 1);
    if (iso === isoDate(yd)) return 'Hôm qua';
    const [, m, d] = iso.split('-');
    return d + '/' + m;
  }

  function renderPreview() {
    const text = input.value.trim();
    if (!text) {
      preview.hidden = true;
      addBtn.disabled = true;
      lastParsed = null;
      hideCatPicker();
      return;
    }
    lastParsed = parse(text);
    const p = lastParsed;
    const type = effectiveType();
    const cat = getCategory(effectiveCatId());
    let html = '';
    if (p.amount != null && p.amount > 0) {
      html += `<span class="chip chip-amount ${type === 'income' ? 'is-income' : 'is-expense'}">` +
        `<b>${type === 'income' ? '+' : '−'}${esc(fmtVND(p.amount))}</b>` +
        (p.assumed ? '<span class="chip-note">hiểu là nghìn</span>' : '') + '</span>';
    } else {
      html += '<span class="chip chip-empty">Chưa thấy số tiền — thêm “35k”, “80 nghìn”, “1tr2”…</span>';
    }
    html += `<button type="button" class="chip chip-btn" id="chipCat" title="Đổi danh mục">` +
      `<span class="dot" style="background:${cat.color}"></span>${cat.icon} ${esc(cat.name)} <span class="caret">▾</span></button>`;
    html += `<button type="button" class="chip chip-btn" id="chipType" title="Đổi thu / chi">` +
      `${type === 'income' ? '💰 Khoản thu' : '💸 Khoản chi'} <span class="caret">⇄</span></button>`;
    html += `<span class="chip">📅 ${esc(dateChipLabel(p.date))}</span>`;
    preview.innerHTML = html;
    preview.hidden = false;
    addBtn.disabled = !(p.amount > 0);
    $('#chipCat').addEventListener('click', openCatPicker);
    $('#chipType').addEventListener('click', () => {
      typeOverride = effectiveType() === 'income' ? 'expense' : 'income';
      catOverride = null;
      renderPreview();
    });
  }
  input.addEventListener('input', () => { catOverride = null; typeOverride = null; renderPreview(); });

  /* Bảng chọn danh mục */
  const picker = $('#catPicker');
  function openCatPicker() {
    const anchor = $('#chipCat');
    if (!anchor) return;
    picker.innerHTML = CATEGORIES.map((c) =>
      `<button type="button" data-id="${c.id}" class="${c.id === effectiveCatId() ? 'active' : ''}">` +
      `<span class="dot" style="background:${c.color};width:8px;height:8px;border-radius:50%"></span>${c.icon} ${esc(c.name)}</button>`
    ).join('');
    picker.hidden = false;
    const r = anchor.getBoundingClientRect();
    const pw = Math.min(330, window.innerWidth - 24);
    let left = Math.min(r.left, window.innerWidth - pw - 12);
    picker.style.left = Math.max(12, left) + 'px';
    picker.style.top = (r.bottom + 8) + 'px';
    picker.querySelectorAll('button').forEach((b) =>
      b.addEventListener('click', () => {
        catOverride = b.dataset.id;
        if (catOverride === 'thu-nhap') typeOverride = 'income';
        else if (effectiveType() === 'income') typeOverride = 'expense';
        hideCatPicker();
        renderPreview();
      })
    );
  }
  function hideCatPicker() { picker.hidden = true; }
  document.addEventListener('click', (e) => {
    if (!picker.hidden && !picker.contains(e.target) && e.target.id !== 'chipCat' && !e.target.closest('#chipCat')) hideCatPicker();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideCatPicker(); });

  /* ---------- Thêm giao dịch ---------- */
  entryBox.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || !lastParsed || !(lastParsed.amount > 0)) {
      entryBox.classList.remove('shake');
      void entryBox.offsetWidth;
      entryBox.classList.add('shake');
      return;
    }
    const type = effectiveType();
    const catId = effectiveCatId();
    const cat = getCategory(catId);
    const tx = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      text,
      title: lastParsed.title || cat.name,
      amount: lastParsed.amount,
      type,
      categoryId: catId,
      date: lastParsed.date,
      createdAt: Date.now()
    };
    state.tx.unshift(tx);
    save();
    checkBudgetAlerts(tx);
    const txM = tx.date.slice(0, 7);
    if (txM !== viewKey()) {
      const [y, m] = txM.split('-').map(Number);
      view = { y, m: m - 1 };
    }
    input.value = '';
    catOverride = null; typeOverride = null;
    renderPreview();
    renderAll();
  });

  /* Cảnh báo ngân sách khi giao dịch mới đẩy qua ngưỡng 80% / 100% */
  function checkBudgetAlerts(tx) {
    if (tx.type !== 'expense' || !(state.budget > 0)) return;
    const mk = tx.date.slice(0, 7);
    const after = state.tx
      .filter((t) => t.date.slice(0, 7) === mk && t.type === 'expense')
      .reduce((a, t) => a + t.amount, 0);
    const before = after - tx.amount;
    const b = state.budget;
    if (before < b && after >= b) {
      toast(`🚨 Bạn đã <b>vượt ngân sách</b> tháng (${esc(fmtVND(b))})!`, 'over');
    } else if (before < b * 0.8 && after >= b * 0.8) {
      toast(`⚠️ Đã dùng <b>${Math.round((after / b) * 100)}%</b> ngân sách tháng. Cẩn thận nhé!`, 'warn');
    }
  }

  /* Ví dụ gợi ý */
  $('#examples').addEventListener('click', (e) => {
    const b = e.target.closest('.chip-example');
    if (!b) return;
    input.value = b.textContent.trim();
    catOverride = null; typeOverride = null;
    input.focus();
    renderPreview();
  });

  /* ---------- Điều hướng tháng ---------- */
  $('#prevMonth').addEventListener('click', () => {
    view.m--; if (view.m < 0) { view.m = 11; view.y--; }
    renderAll();
  });
  $('#nextMonth').addEventListener('click', () => {
    view.m++; if (view.m > 11) { view.m = 0; view.y++; }
    renderAll();
  });

  /* ---------- Ngân sách ---------- */
  $('#budgetEdit').addEventListener('click', () => {
    const f = $('#budgetForm');
    f.hidden = !f.hidden;
    if (!f.hidden) { $('#budgetInput').value = ''; $('#budgetInput').focus(); }
  });
  $('#budgetForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const r = parse($('#budgetInput').value);
    if (r.amount > 0) {
      state.budget = r.amount;
      save();
      $('#budgetForm').hidden = true;
      renderAll();
      toast(`✅ Ngân sách tháng: <b>${esc(fmtVND(state.budget))}</b>`);
    } else {
      toast('Chưa hiểu số tiền — thử “5tr”, “8 triệu” hoặc “5000000”.', 'warn');
    }
  });
  $('.budget-presets').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    state.budget = Number(b.dataset.v);
    save();
    $('#budgetForm').hidden = true;
    renderAll();
    toast(`✅ Ngân sách tháng: <b>${esc(fmtVND(state.budget))}</b>`);
  });

  /* ---------- Render: thẻ ngân sách + thống kê ---------- */
  function renderBudget(list) {
    const spent = sumExpense(list);
    const income = sumIncome(list);
    const b = state.budget;
    const remain = b - spent;
    const pct = b > 0 ? spent / b : 0;

    const stateCls = pct >= 1 ? 'over' : pct >= 0.8 ? 'warn' : '';
    const remainEl = $('#remainValue');
    remainEl.className = 'big-number ' + stateCls;
    $('#remainLabel').textContent = remain >= 0 ? 'Còn lại trong tháng' : 'Đã vượt ngân sách';
    countUp(remainEl, Math.abs(remain), (n) => (remain < 0 ? '−' : '') + fmtVND(n));

    const fill = $('#progressFill');
    fill.className = 'progress-fill ' + stateCls;
    fill.style.width = Math.min(pct * 100, 100) + '%';
    const pb = $('#progressBar');
    pb.setAttribute('aria-valuemin', '0');
    pb.setAttribute('aria-valuemax', '100');
    pb.setAttribute('aria-valuenow', String(Math.round(pct * 100)));

    countUp($('#spentValue'), spent);
    $('#budgetValue').textContent = fmtVND(b);
    $('#budgetPct').textContent = Math.round(pct * 100) + '%';

    const over = $('#overBanner');
    over.hidden = pct < 1;
    if (pct >= 1) $('#overAmount').textContent = fmtVND(spent - b);

    countUp($('#statExpense'), spent);
    countUp($('#statIncome'), income);
    $('#statCount').textContent = String(list.length);
  }

  /* ---------- Render: biểu đồ tròn theo danh mục ---------- */
  function renderDonut(list) {
    const wrap = $('#donut');
    const legend = $('#legend');
    const expenses = list.filter((t) => t.type === 'expense');
    const total = sumExpense(list);

    const byCat = new Map();
    for (const t of expenses) byCat.set(t.categoryId, (byCat.get(t.categoryId) || 0) + t.amount);
    const items = [...byCat.entries()]
      .map(([id, v]) => ({ cat: getCategory(id), v, frac: total ? v / total : 0 }))
      .sort((a, b) => b.v - a.v);

    const size = 196, c = size / 2, r = 72, sw = 30;
    const C = 2 * Math.PI * r;
    const gap = items.length > 1 ? 2.4 : 0;

    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    svg += `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="var(--bg-soft)" stroke-width="${sw}"/>`;
    if (total > 0) {
      svg += `<g transform="rotate(-90 ${c} ${c})">`;
      let acc = 0;
      items.forEach((it, i) => {
        const len = Math.max(it.frac * C - gap, 0.5);
        svg += `<circle class="seg" cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${it.cat.color}" stroke-width="${sw}" ` +
          `stroke-dasharray="0 ${C}" data-final="${len.toFixed(2)} ${(C - len).toFixed(2)}" ` +
          `stroke-dashoffset="${(-acc * C).toFixed(2)}" style="transition-delay:${i * 70}ms">` +
          `<title>${esc(it.cat.name)}: ${esc(fmtVND(it.v))} (${Math.round(it.frac * 100)}%)</title></circle>`;
        acc += it.frac;
      });
      svg += '</g>';
    }
    svg += '</svg>';
    svg += `<div class="donut-center"><span class="lbl">Tổng chi</span><span class="val">${esc(total ? fmtCompact(total) : '0 ₫')}</span></div>`;
    wrap.innerHTML = svg;

    // kích hoạt transition vẽ vòng
    requestAnimationFrame(() => requestAnimationFrame(() => {
      wrap.querySelectorAll('circle.seg').forEach((el) => el.setAttribute('stroke-dasharray', el.dataset.final));
    }));

    legend.innerHTML = items.length
      ? items.map((it) =>
          `<li><span class="dot" style="background:${it.cat.color}"></span>` +
          `<span class="name">${it.cat.icon} ${esc(it.cat.name)}</span>` +
          `<span class="pct">${Math.round(it.frac * 100)}%</span>` +
          `<span class="amt">${esc(fmtVND(it.v))}</span></li>`
        ).join('')
      : '<li style="color:var(--muted)">Chưa có khoản chi nào trong tháng.</li>';
    $('#donutCaption').textContent = expenses.length ? expenses.length + ' khoản chi' : '';
  }

  /* ---------- Render: biểu đồ cột theo ngày ---------- */
  function renderBars(list, animate) {
    const host = $('#barChart');
    const expenses = list.filter((t) => t.type === 'expense');
    const n = daysInMonth(view.y, view.m);
    const daily = new Array(n).fill(0);
    for (const t of expenses) daily[Number(t.date.slice(8, 10)) - 1] += t.amount;
    const max = Math.max(...daily);

    $('#barCaption').textContent = max > 0 ? 'Tổng: ' + fmtVND(daily.reduce((a, b) => a + b, 0)) : '';

    if (max === 0) {
      host.innerHTML = '<p class="chart-note">Chưa có dữ liệu chi tiêu trong tháng này 🌱</p>';
      return;
    }

    const W = Math.max(host.clientWidth || 600, 300);
    const H = 215;
    const padL = 44, padR = 8, padT = 16, padB = 26;
    const iw = W - padL - padR, ih = H - padT - padB;
    const step = iw / n;
    const bw = Math.min(step * 0.62, 26);
    const todayD = isViewingCurrentMonth() ? today.getDate() : -1;

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" preserveAspectRatio="xMidYMid meet">`;
    // đường lưới + nhãn trục Y (0 / 50% / 100% của max)
    [0.5, 1].forEach((f) => {
      const y = padT + ih - ih * f;
      svg += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`;
      svg += `<text x="${padL - 7}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="var(--muted)" font-family="Archivo, sans-serif">${esc(fmtCompact(max * f))}</text>`;
    });
    svg += `<line x1="${padL}" y1="${padT + ih}" x2="${W - padR}" y2="${padT + ih}" stroke="var(--line-strong)" stroke-width="1"/>`;

    for (let d = 0; d < n; d++) {
      const v = daily[d];
      const x = padL + d * step + (step - bw) / 2;
      const h = v > 0 ? Math.max((v / max) * ih, 2.5) : 0;
      const y = padT + ih - h;
      const isToday = d + 1 === todayD;
      if (v > 0) {
        svg += `<rect class="bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="${Math.min(5, bw / 2.4).toFixed(1)}" ` +
          `fill="var(--jade)" opacity="${isToday ? 1 : 0.42}" ${isToday ? 'stroke="var(--jade)" stroke-width="1.4"' : ''} ` +
          `style="${animate ? `animation-delay:${d * 16}ms` : 'animation:none'}">` +
          `<title>${String(d + 1).padStart(2, '0')}/${String(view.m + 1).padStart(2, '0')} — ${esc(fmtVND(v))}</title></rect>`;
      }
      // nhãn ngày: 1, 5, 10, 15, 20, 25 + ngày cuối
      if (d === 0 || (d + 1) % 5 === 0 || d === n - 1) {
        svg += `<text x="${(padL + d * step + step / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="10.5" ` +
          `fill="${d + 1 === todayD ? 'var(--jade)' : 'var(--muted)'}" font-weight="${d + 1 === todayD ? '700' : '400'}" font-family="Archivo, sans-serif">${d + 1}</text>`;
      }
    }
    svg += '</svg>';
    host.innerHTML = svg;
  }

  let resizeRaf = null;
  new ResizeObserver(() => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = null;
      renderBars(monthTx(), false);
    });
  }).observe($('#barChart'));

  /* ---------- Render: danh sách giao dịch ---------- */
  function renderList(list) {
    const host = $('#txList');
    const empty = $('#emptyState');
    $('#txCount').textContent = list.length ? list.length + ' giao dịch' : '';
    if (!list.length) {
      host.innerHTML = '';
      empty.hidden = false;
      $('#seedBtn').hidden = state.tx.length > 0; // chỉ mời dữ liệu mẫu khi app hoàn toàn trống
      return;
    }
    empty.hidden = true;

    const byDate = new Map();
    for (const t of list) {
      if (!byDate.has(t.date)) byDate.set(t.date, []);
      byDate.get(t.date).push(t);
    }
    const dates = [...byDate.keys()].sort((a, b) => (a < b ? 1 : -1));
    let html = '';
    let i = 0;
    for (const d of dates) {
      html += `<p class="tx-date">${esc(dateLabel(d))}</p>`;
      const rows = byDate.get(d).sort((a, b) => b.createdAt - a.createdAt);
      for (const t of rows) {
        const cat = getCategory(t.categoryId);
        const neg = t.type === 'expense';
        html += `<div class="tx-row" style="animation-delay:${Math.min(i * 22, 380)}ms">` +
          `<span class="tx-icon" style="background:${cat.color}22">${cat.icon}</span>` +
          `<div class="tx-main"><p class="tx-title" style="margin:0">${esc(t.title)}</p>` +
          `<p class="tx-cat" style="margin:0">${esc(cat.name)}</p></div>` +
          `<span class="tx-amt ${neg ? 'neg' : 'pos'}">${neg ? '−' : '+'}${esc(fmtVND(t.amount))}</span>` +
          `<button class="tx-del" data-id="${t.id}" aria-label="Xóa giao dịch" title="Xóa">✕</button></div>`;
        i++;
      }
    }
    host.innerHTML = html;
  }

  $('#txList').addEventListener('click', (e) => {
    const b = e.target.closest('.tx-del');
    if (!b) return;
    const idx = state.tx.findIndex((t) => t.id === b.dataset.id);
    if (idx === -1) return;
    lastDeleted = state.tx[idx];
    state.tx.splice(idx, 1);
    save();
    renderAll();
    toast(`Đã xóa “${esc(lastDeleted.title)}”`, '', 'Hoàn tác', () => {
      if (!lastDeleted) return;
      state.tx.push(lastDeleted);
      lastDeleted = null;
      save();
      renderAll();
    });
  });

  /* ---------- Dữ liệu mẫu ---------- */
  const SEED_POOL = [
    ['an-uong', 'Ăn sáng', 20, 45], ['an-uong', 'Cà phê', 25, 48], ['an-uong', 'Cơm trưa văn phòng', 35, 60],
    ['an-uong', 'Bún bò', 40, 55], ['an-uong', 'Trà sữa', 45, 68], ['an-uong', 'Ăn tối', 45, 110],
    ['an-uong', 'Đi chợ', 90, 230], ['an-uong', 'Bánh mì', 15, 28], ['an-uong', 'GrabFood', 60, 140],
    ['di-chuyen', 'Đổ xăng', 50, 120], ['di-chuyen', 'Grab đi làm', 28, 70], ['di-chuyen', 'Gửi xe', 5, 12],
    ['mua-sam', 'Shopee sale', 120, 480], ['mua-sam', 'Mua áo', 150, 380],
    ['giai-tri', 'Xem phim CGV', 90, 190], ['giai-tri', 'Nạp game', 50, 180], ['giai-tri', 'Karaoke', 120, 320],
    ['suc-khoe', 'Mua thuốc', 40, 140],
    ['giao-duc', 'Mua sách', 80, 240]
  ];
  function rnd(min, max) { return Math.round(min + Math.random() * (max - min)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function seedTx(y, m, d, catId, title, amountK, type) {
    return {
      id: 'seed-' + y + m + d + '-' + Math.random().toString(36).slice(2, 7),
      text: title, title, amount: amountK * 1000,
      type: type || 'expense', categoryId: catId,
      date: isoDate(new Date(y, m, d)),
      createdAt: new Date(y, m, d, 9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60)).getTime()
    };
  }
  function seedMonth(y, m, lastDay) {
    const out = [];
    for (let d = 1; d <= lastDay; d++) {
      const nItems = 1 + Math.floor(Math.random() * 2) + (Math.random() < 0.35 ? 1 : 0);
      for (let i = 0; i < nItems; i++) {
        const [cat, title, lo, hi] = pick(SEED_POOL);
        out.push(seedTx(y, m, d, cat, title, rnd(lo, hi)));
      }
    }
    // các khoản cố định trong tháng
    if (lastDay >= 3) out.push(seedTx(y, m, 3, 'hoa-don', 'Internet FPT', 245));
    if (lastDay >= 5) out.push(seedTx(y, m, 5, 'thu-nhap', 'Lương tháng ' + (m + 1), 15000, 'income'));
    if (lastDay >= 8) out.push(seedTx(y, m, 8, 'hoa-don', 'Tiền điện', rnd(450, 800)));
    if (lastDay >= 10) out.push(seedTx(y, m, 10, 'hoa-don', 'Tiền nước', rnd(80, 160)));
    return out;
  }
  $('#seedBtn').addEventListener('click', () => {
    const y = today.getFullYear(), m = today.getMonth();
    const prev = new Date(y, m - 1, 1);
    let txs = [
      ...seedMonth(prev.getFullYear(), prev.getMonth(), daysInMonth(prev.getFullYear(), prev.getMonth())),
      ...seedMonth(y, m, today.getDate())
    ];
    // bảo đảm tháng hiện tại nhỉnh hơn ngân sách một chút để demo cảnh báo
    const curKey = viewKeyOf(y, m);
    let spent = txs.filter((t) => t.date.slice(0, 7) === curKey && t.type === 'expense').reduce((a, t) => a + t.amount, 0);
    const extras = [['mua-sam', 'Mua giày', 1200], ['giai-tri', 'Du lịch cuối tuần', 1500], ['mua-sam', 'Tai nghe mới', 890]];
    let ei = 0;
    while (spent < state.budget * 1.05 && ei < extras.length) {
      const [cat, title, k] = extras[ei++];
      const d = Math.max(1, today.getDate() - rnd(1, Math.min(9, today.getDate())));
      const t = seedTx(y, m, d, cat, title, k);
      txs.push(t);
      spent += t.amount;
    }
    state.tx = txs.concat(state.tx);
    save();
    view = { y, m };
    renderAll();
    toast('✨ Đã thêm dữ liệu mẫu — đây là ví dụ một tháng chi tiêu thật.');
  });
  function viewKeyOf(y, m) { return y + '-' + String(m + 1).padStart(2, '0'); }

  /* ---------- Render tổng ---------- */
  function renderAll() {
    $('#monthLabel').textContent = 'Tháng ' + (view.m + 1) + ', ' + view.y;
    const list = monthTx();
    renderBudget(list);
    renderDonut(list);
    renderBars(list, true);
    renderList(list);
  }

  /* ---------- Khởi động ---------- */
  applyTheme();
  renderAll();
})();
