/* ============================================================
   Sổ Chi Tiêu — parser.js
   Logic thuần: phân tích câu nhập tiếng Việt tự nhiên
   ("ăn sáng 35k", "đổ xăng 80 nghìn", "lương tháng 6 15 triệu")
   thành { amount, type, categoryId, date, title }.
   Chạy được cả trong browser (window.SCT) lẫn Node (để test).
   ============================================================ */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.SCT = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Danh mục ---------- */
  const CATEGORIES = [
    {
      id: 'an-uong', name: 'Ăn uống', icon: '🍜', color: '#FFB454',
      kws: ['ăn', 'ăn sáng', 'ăn trưa', 'ăn tối', 'ăn vặt', 'ăn uống', 'cơm', 'phở', 'bún',
        'miến', 'cháo', 'xôi', 'bánh mì', 'bánh', 'cà phê', 'cafe', 'coffee', 'trà sữa',
        'trà đá', 'trà chanh', 'nước mía', 'sinh tố', 'chè', 'kem', 'lẩu', 'nướng', 'nhậu',
        'bia', 'rượu', 'gà rán', 'gà', 'kfc', 'pizza', 'mì', 'hủ tiếu', 'ốc', 'hải sản',
        'buffet', 'đi chợ', 'chợ', 'siêu thị', 'thực phẩm', 'đồ ăn', 'grabfood', 'shopeefood',
        'highlands', 'phúc long', 'tàu hủ', 'tào phớ', 'bữa']
    },
    {
      id: 'di-chuyen', name: 'Di chuyển', icon: '🛵', color: '#2DD4BF',
      kws: ['xăng', 'đổ xăng', 'grab', 'grabbike', 'taxi', 'xe ôm', 'gojek', 'xanh sm', 'bus',
        'xe buýt', 'xe khách', 'tàu', 'vé tàu', 'máy bay', 'vé máy bay', 'gửi xe', 'giữ xe',
        'rửa xe', 'sửa xe', 'vá xe', 'thay nhớt', 'nhớt', 'cầu đường', 'bến xe', 'xe', 'đi lại']
    },
    {
      id: 'mua-sam', name: 'Mua sắm', icon: '🛍️', color: '#FF7EB6',
      kws: ['mua', 'mua sắm', 'quần', 'áo', 'giày', 'dép', 'túi', 'balo', 'shopee', 'lazada',
        'tiki', 'sendo', 'mỹ phẩm', 'son', 'kem chống nắng', 'nước hoa', 'phụ kiện', 'đồng hồ',
        'mua điện thoại', 'laptop', 'tai nghe', 'quà', 'quà tặng']
    },
    {
      id: 'hoa-don', name: 'Hóa đơn & Nhà', icon: '🧾', color: '#9D8CFF',
      kws: ['hóa đơn', 'tiền điện', 'tiền nước', 'điện', 'nước máy', 'internet', 'wifi', 'mạng',
        'cáp', 'truyền hình', 'tiền nhà', 'thuê nhà', 'nhà trọ', 'trọ', 'gas', 'phí quản lý',
        'chung cư', 'điện thoại', 'nạp điện thoại', 'nạp card', 'card điện thoại', 'tiền rác']
    },
    {
      id: 'giai-tri', name: 'Giải trí', icon: '🎬', color: '#FF6B6B',
      kws: ['phim', 'xem phim', 'rạp', 'cgv', 'netflix', 'spotify', 'youtube', 'game', 'nạp game',
        'steam', 'karaoke', 'du lịch', 'concert', 'nhạc', 'bida', 'bowling', 'cắm trại',
        'khách sạn', 'homestay', 'giải trí']
    },
    {
      id: 'suc-khoe', name: 'Sức khỏe', icon: '💊', color: '#4ADE80',
      kws: ['thuốc', 'khám', 'bệnh viện', 'phòng khám', 'nha khoa', 'răng', 'gym', 'yoga',
        'thể hình', 'bảo hiểm', 'vitamin', 'xét nghiệm', 'tiêm', 'spa', 'massage']
    },
    {
      id: 'giao-duc', name: 'Giáo dục', icon: '📚', color: '#5CC8FF',
      kws: ['học', 'học phí', 'khóa học', 'sách', 'vở', 'tiếng anh', 'ielts', 'toeic', 'udemy',
        'coursera', 'lớp học', 'gia sư']
    },
    {
      id: 'thu-nhap', name: 'Thu nhập', icon: '💰', color: '#A3E635',
      kws: ['lương', 'thưởng', 'thu nhập', 'hoàn tiền', 'bán đồ', 'bán hàng', 'trợ cấp', 'học bổng', 'freelance']
    },
    {
      id: 'khac', name: 'Khác', icon: '📦', color: '#94A3B8',
      kws: ['từ thiện', 'biếu', 'cho vay', 'trả nợ']
    }
  ];

  const INCOME_KWS = ['lương', 'thưởng', 'thu nhập', 'nhận tiền', 'hoàn tiền', 'được tặng',
    'trợ cấp', 'học bổng', 'bán được', 'bán đồ', 'bán hàng', 'bán xe', 'tiền bán', 'tiền về', 'freelance'];

  /* ---------- Chuẩn hóa: bỏ dấu, giữ nguyên độ dài UTF-16 để map index ---------- */
  function normalize(str) {
    let out = '';
    for (let i = 0; i < str.length;) {
      const cp = str.codePointAt(i);
      const ch = String.fromCodePoint(cp);
      const w = ch.length; // 1 hoặc 2 đơn vị UTF-16
      let n = ch.toLowerCase();
      if (n === 'đ') n = 'd';
      n = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      n = n.length ? n[0] : ' ';
      if (!/[a-z0-9.,+]/.test(n)) n = ' ';
      out += n.padEnd(w, ' ');
      i += w;
    }
    return out;
  }

  function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  function kwRegex(kwNorm) { return new RegExp('(?<![a-z0-9])' + escapeRe(kwNorm) + '(?![a-z0-9])'); }

  // Chuẩn hóa sẵn từ khóa lúc khởi tạo
  const CAT_KWS = CATEGORIES.map(c => ({
    id: c.id,
    kws: c.kws.map(k => normalize(k).trim()).sort((a, b) => b.length - a.length)
  }));
  const INCOME_KWS_N = INCOME_KWS.map(k => normalize(k).trim());

  /* ---------- Phân tích số tiền ----------
     Ưu tiên: triệu/tr/củ → nghìn/ngàn/k → trăm → đồng/đ/vnd
     → số có dấu phân tách (25.000) → số trần (heuristic: <1000 hiểu là nghìn) */
  function parseAmount(norm) {
    let m;

    // 1) triệu: "15 triệu", "1tr2" (=1.2tr), "2,5tr", "3 củ", "1 triệu rưỡi"
    m = /(\d+(?:[.,]\d+)?)\s*(?:trieu|tr|cu)(?:\s*(ruoi)|(\d{1,3}))?(?![a-z0-9])/.exec(norm);
    if (m) {
      let v = parseFloat(m[1].replace(',', '.')) * 1e6;
      if (m[2]) v += 5e5;
      else if (m[3]) v += parseInt(m[3], 10) * Math.pow(10, 6 - m[3].length);
      return { value: Math.round(v), index: m.index, raw: m[0], assumed: false };
    }

    // 2) nghìn: "80 nghìn", "35k", "40k5" (=40.500), "1,5k"
    m = /(\d+(?:[.,]\d+)?)\s*(?:nghin|ngan|k)(\d{1,3})?(?![a-z0-9])/.exec(norm);
    if (m) {
      let v = parseFloat(m[1].replace(',', '.')) * 1e3;
      if (m[2]) v += parseInt(m[2], 10) * Math.pow(10, 3 - m[2].length);
      return { value: Math.round(v), index: m.index, raw: m[0], assumed: false };
    }

    // 3) trăm (ngữ cảnh tiền: "3 trăm" = 300.000, "3 trăm rưỡi" = 350.000)
    m = /(\d+(?:[.,]\d+)?)\s*tram(?:\s*(ruoi))?(?![a-z0-9])/.exec(norm);
    if (m) {
      let v = parseFloat(m[1].replace(',', '.')) * 1e5;
      if (m[2]) v += 5e4;
      return { value: Math.round(v), index: m.index, raw: m[0], assumed: false };
    }

    // 4) đồng: "25.000đ", "300 đồng", "150000 vnd"
    m = /(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(?:vnd|dong|d)(?![a-z0-9])/.exec(norm);
    if (m) {
      const v = parseInt(m[1].replace(/[.,]/g, ''), 10);
      return { value: v, index: m.index, raw: m[0], assumed: false };
    }

    // 5) số có dấu phân tách nghìn: "25.000", "1.250.000"
    m = /(?<![\d.,])(\d{1,3}(?:[.,]\d{3})+)(?!\d)/.exec(norm);
    if (m) {
      const v = parseInt(m[1].replace(/[.,]/g, ''), 10);
      return { value: v, index: m.index, raw: m[0], assumed: false };
    }

    // 6) số trần — lấy số CUỐI, bỏ qua số đi sau "tháng/ngày/thứ/lần/số"
    const bare = [];
    const reBare = /(\d+(?:[.,]\d+)?)/g;
    while ((m = reBare.exec(norm)) !== null) {
      const before = norm.slice(0, m.index);
      if (/(?:^|[^a-z])(?:thang|ngay|thu|lan|so)\s*$/.test(before)) continue;
      bare.push({ index: m.index, raw: m[0] });
    }
    if (bare.length) {
      const b = bare[bare.length - 1];
      let v = parseFloat(b.raw.replace(',', '.'));
      let assumed = false;
      if (v > 0 && v < 1000) { v *= 1000; assumed = true; } // "ăn trưa 45" → 45.000
      return { value: Math.round(v), index: b.index, raw: b.raw, assumed };
    }
    return null;
  }

  /* ---------- Phân loại danh mục: từ khóa khớp DÀI nhất thắng ---------- */
  function matchCategory(norm, isIncome) {
    if (isIncome) return 'thu-nhap';
    let best = { len: 0, id: 'khac' };
    for (const cat of CAT_KWS) {
      if (cat.id === 'thu-nhap') continue;
      for (const kw of cat.kws) {
        if (kw.length <= best.len) break; // kws đã sort giảm dần theo độ dài
        if (kwRegex(kw).test(norm)) { best = { len: kw.length, id: cat.id }; break; }
      }
    }
    return best.id;
  }

  /* ---------- Ngày ---------- */
  function isoDate(d) {
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  /* ---------- Tiêu đề: bỏ phần số tiền + cụm ngày, viết hoa chữ đầu ---------- */
  function buildTitle(orig, norm, amt) {
    const ranges = [];
    if (amt) ranges.push([amt.index, amt.index + amt.raw.length]);
    const reDate = /\bhom (?:qua|kia)\b/g;
    let dm;
    while ((dm = reDate.exec(norm)) !== null) ranges.push([dm.index, dm.index + dm[0].length]);
    const plus = orig.indexOf('+');
    if (plus !== -1 && orig.slice(0, plus).trim() === '') ranges.push([plus, plus + 1]);
    let t = orig;
    ranges.sort((a, b) => b[0] - a[0]).forEach(([s, e]) => { t = t.slice(0, s) + ' ' + t.slice(e); });
    t = t.replace(/\s+/g, ' ').replace(/^[\s\-–—,.:;+]+|[\s\-–—,.:;+]+$/g, '').trim();
    return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
  }

  /* ---------- Hàm chính ---------- */
  function parse(text, now) {
    now = now || new Date();
    const norm = normalize(text);
    const amt = parseAmount(norm);

    let dayOffset = 0;
    if (/\bhom qua\b/.test(norm)) dayOffset = -1;
    else if (/\bhom kia\b/.test(norm)) dayOffset = -2;

    // "bình thường" chứa "thường" — loại trước khi dò từ khóa thu nhập
    const incomeScan = norm.replace(/\bbinh thuong\b/g, s => ' '.repeat(s.length));
    const isIncome = text.trim().startsWith('+') ||
      INCOME_KWS_N.some(k => kwRegex(k).test(incomeScan));

    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
    return {
      amount: amt ? amt.value : null,
      assumed: amt ? amt.assumed : false,
      raw: amt ? amt.raw.trim() : null,
      type: isIncome ? 'income' : 'expense',
      categoryId: matchCategory(norm, isIncome),
      date: isoDate(d),
      title: buildTitle(text, norm, amt)
    };
  }

  /* ---------- Định dạng tiền VND ---------- */
  const nfVN = new Intl.NumberFormat('vi-VN');
  function fmtVND(n) { return nfVN.format(Math.round(n)) + ' ₫'; }
  function fmtCompact(n) {
    const abs = Math.abs(n);
    if (abs >= 1e6) {
      const v = n / 1e6;
      return (Number.isInteger(v) ? v : v.toFixed(1).replace('.', ',')) + 'tr';
    }
    if (abs >= 1e3) return Math.round(n / 1e3) + 'k';
    return String(Math.round(n));
  }

  function getCategory(id) { return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]; }

  return { parse, normalize, CATEGORIES, getCategory, fmtVND, fmtCompact, isoDate };
});
