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
  // pages: array of {href, label, id}; active = id of current page
  CC.buildTopbar = function (active) {
    var base = (document.body.getAttribute('data-base') || '');
    var pages = [
      { id: 'home', href: base + 'index.html', label: 'Dashboard' },
      { id: 'tz', href: base + 'tools/timezones.html', label: 'Time Zones' },
      { id: 'reading', href: base + 'tools/reading.html', label: 'Reading' },
      { id: 'tasks', href: base + 'tools/tasks.html', label: 'Tasks' },
      { id: 'focus', href: base + 'tools/focus.html', label: 'Focus' },
      { id: 'notes', href: base + 'tools/notes.html', label: 'Notes' }
    ];
    var nav = pages.map(function (p) {
      return '<a href="' + p.href + '"' + (p.id === active ? ' class="active"' : '') + '>' + p.label + '</a>';
    }).join('');
    var cur = document.documentElement.getAttribute('data-theme');
    var icon = cur === 'dark' ? '☀️' : '\u{1F319}';
    var el = document.createElement('div');
    el.className = 'topbar';
    el.innerHTML =
      '<a class="brand" href="' + base + 'index.html" style="text-decoration:none">' +
        '<span class="dot"></span> Command Center</a>' +
      '<nav>' + nav + '</nav>' +
      '<span class="spacer"></span>' +
      '<button class="theme-toggle" title="Toggle theme" onclick="CC.toggleTheme()">' + icon + '</button>';
    document.body.insertBefore(el, document.body.firstChild);
  };
})();
