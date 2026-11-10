/* Communication Design Lab. — site behaviour
 * 1. header curve + pictograms (+ speech bubble for the red one)
 * 2. mobile menu drawer
 * 3. show/hide toggles (Publications)
 * 4. spam-safe mail link
 * 5. Activities category filter
 * 6. Publications search
 */
(function () {
  'use strict';

  var ACCENT = '#C8321E';

  // ---- 1. header curve -------------------------------------------------
  var CURVES = [
    "M0 40 C 140 -10, 280 -10, 400 30 S 640 60, 760 25 S 960 -5, 1100 25",
    "M0 30 C 200 3, 380 3, 550 30 S 900 57, 1100 20",
    "M0 46 C 120 46, 180 8, 320 10 S 520 52, 660 47 S 880 6, 1100 22",
    "M0 52 C 200 60, 380 8, 580 24 S 880 50, 1100 6",
    "M0 18 C 160 18, 260 54, 420 50 S 640 6, 800 14 S 1000 42, 1100 34",
    "M0 30 C 280 58, 500 0, 760 30 S 1000 54, 1100 38",
    "M0 38 C 90 6, 190 6, 280 36 S 470 64, 560 34 S 760 2, 850 30 S 1030 58, 1100 26"
  ];

  // Walk along the path and pick 2-3 standing points on gentle slopes.
  function figs(d) {
    var W = window.innerWidth || 1440;
    var Wi = Math.max(W, 1000), S = Wi / 1100;
    var n = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
    var p0 = [n[0], n[1]], P = [p0], c2, e = p0;
    function seg(a, b, c, f) {
      for (var t = 0.02; t <= 1.0001; t += 0.02) {
        var u = 1 - t;
        P.push([
          u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * f[0],
          u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * f[1]
        ]);
      }
    }
    c2 = [n[4], n[5]];
    seg(p0, [n[2], n[3]], c2, [n[6], n[7]]);
    e = [n[6], n[7]];
    for (var j = 8; j + 3 < n.length; j += 4) {
      var c1 = [2 * e[0] - c2[0], 2 * e[1] - c2[1]];
      c2 = [n[j], n[j + 1]];
      var f = [n[j + 2], n[j + 3]];
      seg(e, c1, c2, f);
      e = f;
    }
    var ok = [];
    for (var i = 1; i < P.length - 1; i++) {
      var x = P[i][0], yp = P[i][1] * 44 / 60;
      var s = Math.abs((P[i + 1][1] - P[i - 1][1]) * 0.733 / ((P[i + 1][0] - P[i - 1][0]) * S));
      if (Math.abs(x * S - Wi / 2) <= Math.min(560, W / 2 - 40) && yp >= 18 && s < 0.4) ok.push([x, yp]);
    }
    var want = 2 + Math.floor(Math.random() * 2), out = [];
    for (var k = 0; k < 60 && out.length < want && ok.length; k++) {
      var c = ok[Math.floor(Math.random() * ok.length)];
      if (out.every(function (o) { return Math.abs(o[0] - c[0]) * S > Math.min(200, W * 0.4); })) out.push(c);
    }
    // left in %, top in px of the figure (24px tall, feet on the line)
    return out.map(function (c) { return { left: c[0] / 11, top: c[1] - 24 + 0.6 }; });
  }

  function initCurve() {
    var path = document.getElementById('hd-curve');
    if (!path) return;
    var d = CURVES[Math.floor(Math.random() * CURVES.length)];
    path.setAttribute('d', d);

    var slots = document.querySelectorAll('.hd-fig');
    var bubble = document.querySelector('.hd-bubble');
    var pts = figs(d);

    // the speech bubble needs ~15px of room above the figure's head
    var eligible = [];
    pts.forEach(function (p, i) { if (p.top >= 1.2) eligible.push(i); });
    var red = (Math.random() < 0.35 && eligible.length) ? eligible[Math.floor(Math.random() * eligible.length)] : -1;

    for (var i = 0; i < slots.length; i++) {
      var el = slots[i], p = pts[i];
      if (!p) { el.style.display = 'none'; continue; }
      el.style.cssText = 'position:absolute;display:block;left:' + p.left.toFixed(2) + '%;top:' + p.top.toFixed(1) +
        'px;transform:translateX(-50%);pointer-events:none;color:' + (i === red ? ACCENT : '#111111');
    }
    if (bubble) {
      if (red >= 0) {
        bubble.style.cssText = 'position:absolute;display:block;left:' + pts[red].left.toFixed(2) +
          '%;margin-left:-17.3px;top:' + (pts[red].top - 15.2).toFixed(1) + 'px;pointer-events:none;color:' + ACCENT;
      } else {
        bubble.style.display = 'none';
      }
    }
  }

  // ---- 2. mobile menu ----------------------------------------------------
  function initMenu() {
    var root = document.getElementById('menu-root');
    var openBtn = document.querySelector('[data-menu="open"]');
    if (!root) return;
    function setOpen(v) {
      root.hidden = !v;
      if (openBtn) openBtn.setAttribute('aria-expanded', v ? 'true' : 'false');
      if (v) {
        var close = root.querySelector('button[data-menu="close"]');
        if (close) close.focus();
      } else if (openBtn) {
        openBtn.focus();
      }
    }
    document.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('[data-menu]') : null;
      if (!t) return;
      var mode = t.getAttribute('data-menu');
      if (mode === 'open') setOpen(true);
      if (mode === 'close' && t.tagName !== 'A') setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !root.hidden) setOpen(false);
    });
  }

  // ---- 3. show / hide toggles --------------------------------------------
  function initToggles() {
    var btns = document.querySelectorAll('[data-toggle]');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        var target = document.getElementById(btn.getAttribute('data-toggle'));
        if (!target) return;
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', function () {
          target.hidden = !target.hidden;
          btn.setAttribute('aria-expanded', target.hidden ? 'false' : 'true');
        });
      })(btns[i]);
    }
  }

  // ---- 4. spam-safe mail link --------------------------------------------
  function initMail() {
    var links = document.querySelectorAll('[data-mail]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        var parts = this.getAttribute('data-mail').split('|');
        e.preventDefault();
        window.location.href = 'mailto:' + parts[0] + '@' + parts[1];
      });
    }
  }

  // ---- 5. Activities category filter ---------------------------------------
  function initFilter() {
    var chips = document.querySelectorAll('[data-filter]');
    if (!chips.length) return;
    var rows = document.querySelectorAll('[data-cat]');
    var groups = document.querySelectorAll('.act-year');
    var empty = document.getElementById('act-empty');
    var known = {};
    for (var i = 0; i < chips.length; i++) known[chips[i].getAttribute('data-filter')] = true;

    function apply(cat, push) {
      for (var i = 0; i < chips.length; i++) {
        var on = chips[i].getAttribute('data-filter') === cat;
        chips[i].classList.toggle('fl-on', on);
        chips[i].setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      for (var j = 0; j < rows.length; j++) {
        var show = cat === 'all' || rows[j].getAttribute('data-cat') === cat;
        rows[j].classList.toggle('act-hide', !show);
      }
      var total = 0;
      for (var g = 0; g < groups.length; g++) {
        var n = groups[g].querySelectorAll('[data-cat]:not(.act-hide)').length;
        groups[g].classList.toggle('act-hide', n === 0);
        total += n;
      }
      if (empty) empty.classList.toggle('act-hide', total !== 0);
      if (push && window.history && history.replaceState) {
        history.replaceState(null, '', cat === 'all' ? location.pathname + location.search : '#' + cat);
      }
    }
    for (var c = 0; c < chips.length; c++) {
      chips[c].addEventListener('click', function () { apply(this.getAttribute('data-filter'), true); });
    }
    var h = (location.hash || '').replace('#', '').toLowerCase();
    apply(known[h] ? h : 'all', false);
  }

  // ---- 6. Publications search ----------------------------------------------
  function initSearch() {
    var input = document.querySelector('input[type="search"]');
    var sections = document.querySelectorAll('#papers, #masters, #bachelors');
    if (!input || !sections.length) return;

    var st = document.createElement('style');
    st.textContent = '.js-hide{display:none !important}';
    document.head.appendChild(st);

    var status = document.createElement('p');
    status.setAttribute('aria-live', 'polite');
    status.style.cssText = 'margin:10px 0 0;font-size:12px;color:#5E5E5E;min-height:18px';
    input.parentNode.appendChild(status);

    function norm(t) { return (t || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim(); }

    // collect searchable items once
    var data = [];
    sections.forEach(function (sec) {
      var items = [];
      sec.querySelectorAll('details').forEach(function (d) {
        var entries = d.querySelectorAll(':scope > div, :scope > ul > li');
        var countEl = d.querySelectorAll(':scope > summary > span')[2];
        var rec = { d: d, open0: d.open, count0: countEl ? countEl.textContent : '', countEl: countEl, entries: [] };
        entries.forEach(function (e) { rec.entries.push({ el: e, text: norm(e.textContent) }); });
        items.push(rec);
      });
      var holders = sec.querySelectorAll('[id^="more"]');
      var h = [];
      holders.forEach(function (x) { h.push({ el: x, hidden0: x.hidden }); });
      data.push({ sec: sec, years: items, holders: h });
    });

    function run() {
      var q = norm(input.value);
      var total = 0;
      data.forEach(function (S) {
        var secCount = 0;
        S.years.forEach(function (Y) {
          var n = 0;
          Y.entries.forEach(function (E) {
            var show = !q || E.text.indexOf(q) !== -1;
            E.el.classList.toggle('js-hide', !show);
            if (show) n++;
          });
          Y.d.classList.toggle('js-hide', !!q && n === 0);
          if (q) { Y.d.open = n > 0; if (Y.countEl) Y.countEl.textContent = String(n); }
          else { Y.d.open = Y.open0; if (Y.countEl) Y.countEl.textContent = Y.count0; }
          secCount += n;
        });
        S.holders.forEach(function (H) { H.el.hidden = q ? false : H.hidden0; });
        S.sec.classList.toggle('js-hide', !!q && secCount === 0);
        total += secCount;
      });
      status.textContent = q ? (total ? total + ' 件 / ' + total + (total === 1 ? ' result' : ' results') : '該当なし / No results') : '';
    }

    // remember a user's own open/close of years while not searching
    document.addEventListener('toggle', function (e) {
      if (e.target && e.target.tagName === 'DETAILS' && !norm(input.value)) {
        data.forEach(function (S) { S.years.forEach(function (Y) { if (Y.d === e.target) Y.open0 = Y.d.open; }); });
      }
    }, true);
    // keep the toggle buttons ("earlier years") from fighting an active search
    var t = null;
    input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(run, 120); });
    input.addEventListener('search', run);
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { input.value = ''; run(); } });
  }

  function init() {
    initCurve();
    initMenu();
    initToggles();
    initMail();
    initFilter();
    initSearch();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
