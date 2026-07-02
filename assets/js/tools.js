/* ============================================================
   Command Center — shared client-side helpers
   ============================================================ */
(function () {
  // ---- Theme (persisted) ----
  var stored = localStorage.getItem('cc.theme');
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = stored || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);

  window.CC = window.CC || {};

  CC.toggleTheme = function () {
    var cur = document.documentElement.getAttribute('data-theme');
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('cc.theme', next);
    document.querySelectorAll('.theme-toggle').forEach(function (b) {
      b.textContent = next === 'dark' ? '☀️' : '\u{1F319}';
    });
  };

  // ---- localStorage-backed store ----
  CC.load = function (key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  };
  CC.save = function (key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  };

  CC.uid = function () {
    return 'x' + Math.abs(Date.now() ^ Math.floor(Math.random() * 1e9)).toString(36);
  };

  // ---- Escape HTML ----
  CC.esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  // ---- Build the top bar consistently across pages ----
  // Primary pages sit inline; the rest fold into a "More" dropdown.
  CC.buildTopbar = function (active) {
    var base = (document.body.getAttribute('data-base') || '');
    var primary = [
      { id: 'home', href: base + 'index.html', label: 'Dashboard' },
      { id: 'planner', href: base + 'tools/planner.html', label: 'Planner' },
      { id: 'reading', href: base + 'tools/reading.html', label: 'Reading' },
      { id: 'focus', href: base + 'tools/focus.html', label: 'Focus' },
      { id: 'notes', href: base + 'tools/notes.html', label: 'Notes' },
      { id: 'tz', href: base + 'tools/timezones.html', label: 'Time Zones' }
    ];
    var more = [
      { id: 'tasks', href: base + 'tools/tasks.html', label: 'Tasks & Projects' },
      { id: 'writing', href: base + 'tools/writing.html', label: 'Writing Meter' },
      { id: 'countdowns', href: base + 'tools/countdowns.html', label: 'Countdowns' },
      { id: 'contacts', href: base + 'tools/contacts.html', label: 'Contacts' },
      { id: 'meeting', href: base + 'tools/meeting-cost.html', label: 'Meeting Cost' },
      { id: 'shutdown', href: base + 'tools/shutdown.html', label: 'Shutdown' }
    ];
    function link(p) {
      return '<a href="' + p.href + '"' + (p.id === active ? ' class="active"' : '') + '>' + p.label + '</a>';
    }
    var nav = primary.map(link).join('');
    var moreActive = more.some(function (p) { return p.id === active; });
    var dropdown =
      '<div class="dropdown"><button class="drop-btn' + (moreActive ? ' active' : '') + '">More ▾</button>' +
      '<div class="drop-menu">' + more.map(link).join('') + '</div></div>';
    var cur = document.documentElement.getAttribute('data-theme');
    var icon = cur === 'dark' ? '☀️' : '\u{1F319}';
    var el = document.createElement('div');
    el.className = 'topbar';
    el.innerHTML =
      '<a class="brand" href="' + base + 'index.html" style="text-decoration:none">' +
        '<span class="dot"></span> Command Center</a>' +
      '<nav>' + nav + dropdown + '</nav>' +
      '<span class="spacer"></span>' +
      '<button class="theme-toggle" title="Toggle theme" onclick="CC.toggleTheme()">' + icon + '</button>';
    document.body.insertBefore(el, document.body.firstChild);
  };

  /* ============================================================
     Planner data + "beat the scroll" suggestion engine.
     Shared so the dashboard and the planner stay in sync.
     ============================================================ */
  var DEFAULT_AREAS = [
    { id: 'work', name: 'Work / CFR', color: '#3b6fe0' },
    { id: 'academic', name: 'Academic reading', color: '#8b4df0' },
    { id: 'chinese', name: 'Chinese', color: '#d84b44' },
    { id: 'reading', name: 'Reading queue', color: '#1f9e6b' },
    { id: 'ygo', name: 'Yu-Gi-Oh', color: '#d0912a' },
    { id: 'personal', name: 'Personal / admin', color: '#6b7684' }
  ];
  var DEFAULT_ACTS = [
    { id: 'a1', name: 'Chinese: review Anki / flashcards', areaId: 'chinese', mins: 15, link: '' },
    { id: 'a2', name: 'Chinese: read graded reader or news', areaId: 'chinese', mins: 25, link: '' },
    { id: 'a3', name: 'Yu-Gi-Oh: drill a combo line', areaId: 'ygo', mins: 20, link: '' },
    { id: 'a4', name: 'Academic reading: one focused block', areaId: 'academic', mins: 30, link: '' },
    { id: 'a5', name: 'Read one tab you left open', areaId: 'reading', mins: 10, link: '' },
    { id: 'a6', name: 'Outline / draft something for work', areaId: 'work', mins: 25, link: '' }
  ];
  var DEFAULT_HABITS = [
    { id: 'h1', text: 'Study Chinese', areaId: 'chinese', mins: 20, days: [1, 2, 3, 4, 5] },
    { id: 'h2', text: 'Academic reading block', areaId: 'academic', mins: 30, days: [2, 4, 6] }
  ];

  CC.plannerDefaults = { areas: DEFAULT_AREAS, acts: DEFAULT_ACTS, habits: DEFAULT_HABITS };

  CC.ensurePlannerDefaults = function () {
    if (CC.load('cc.planner.init', false)) return;
    if (!CC.load('cc.planner.areas', []).length) CC.save('cc.planner.areas', DEFAULT_AREAS);
    if (!CC.load('cc.planner.activities', []).length) CC.save('cc.planner.activities', DEFAULT_ACTS);
    if (!CC.load('cc.planner.habits', []).length) CC.save('cc.planner.habits', DEFAULT_HABITS);
    CC.save('cc.planner.init', true);
  };

  CC.todayStr = function (d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  CC.areaMap = function () {
    var m = {};
    CC.load('cc.planner.areas', DEFAULT_AREAS).forEach(function (a) { m[a.id] = a; });
    return m;
  };

  // Return candidate downtime activities that fit `mins`, best first.
  CC.buildSuggestions = function (mins) {
    CC.ensurePlannerDefaults();
    mins = mins || 25;
    var am = CC.areaMap();
    var out = [];

    CC.load('cc.planner.activities', []).forEach(function (a) {
      out.push({ key: 'act:' + a.id, type: 'activity', label: a.name, mins: a.mins || 15,
        link: a.link || '', areaId: a.areaId, ref: a.id });
    });

    var ds = CC.todayStr();
    var dow = new Date().getDay();
    var hdone = CC.load('cc.planner.habitDone', {});
    CC.load('cc.planner.habits', []).forEach(function (h) {
      if ((h.days || []).indexOf(dow) >= 0 && !hdone[h.id + '|' + ds]) {
        out.push({ key: 'hab:' + h.id, type: 'habit', label: h.text, mins: h.mins || 15,
          areaId: h.areaId, ref: h.id, date: ds });
      }
    });

    CC.load('cc.reading', []).forEach(function (r) {
      if (!r.done) out.push({ key: 'read:' + r.id, type: 'reading', label: 'Read: ' + r.title,
        mins: 12, link: r.url || '', areaId: 'reading', ref: r.id,
        prio: r.prio });
    });

    var fit = out.filter(function (c) { return c.mins <= mins + 5; });
    var pool = fit.length ? fit : out;

    var now = Date.now();
    var log = CC.load('cc.planner.suggestLog', {});
    pool.forEach(function (c) {
      var s = 1;
      var last = log[c.key];
      if (last) { var h = (now - last) / 3600000; if (h < 6) s -= 0.7; else if (h < 24) s -= 0.3; }
      // reward using the available time well (snug fit)
      s += 0.3 * (1 - Math.abs(mins - c.mins) / Math.max(mins, 1));
      if (c.prio === 'hi') s += 0.25;
      s += Math.random() * 0.35;
      c.score = s;
      var a = c.areaId && am[c.areaId];
      c.areaName = a ? a.name : '';
      c.color = a ? a.color : 'var(--accent)';
    });
    pool.sort(function (a, b) { return b.score - a.score; });
    return pool;
  };

  CC.markSuggested = function (key) {
    var log = CC.load('cc.planner.suggestLog', {});
    log[key] = Date.now();
    CC.save('cc.planner.suggestLog', log);
  };

  // Mark a suggestion as actually done (updates the right underlying store).
  CC.completeSuggestion = function (cand) {
    if (cand.type === 'reading') {
      var r = CC.load('cc.reading', []);
      var it = r.find(function (x) { return x.id === cand.ref; });
      if (it) { it.done = true; CC.save('cc.reading', r); }
    } else if (cand.type === 'habit') {
      var hd = CC.load('cc.planner.habitDone', {});
      hd[cand.ref + '|' + (cand.date || CC.todayStr())] = true;
      CC.save('cc.planner.habitDone', hd);
    } else if (cand.type === 'activity') {
      var cnt = CC.load('cc.planner.actCount', {});
      cnt[cand.ref] = (cnt[cand.ref] || 0) + 1;
      CC.save('cc.planner.actCount', cnt);
    }
    CC.markSuggested(cand.key);
  };
})();
