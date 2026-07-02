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
      { id: 'calendar', href: base + 'tools/calendar.html', label: 'Calendar' },
      { id: 'planner', href: base + 'tools/planner.html', label: 'Planner' },
      { id: 'contacts', href: base + 'tools/contacts.html', label: 'People' },
      { id: 'reading', href: base + 'tools/reading.html', label: 'Reading' },
      { id: 'focus', href: base + 'tools/focus.html', label: 'Focus' }
    ];
    var more = [
      { id: 'library', href: base + 'tools/library.html', label: 'Library' },
      { id: 'notes', href: base + 'tools/notes.html', label: 'Notes' },
      { id: 'tz', href: base + 'tools/timezones.html', label: 'Time Zones' },
      { id: 'tasks', href: base + 'tools/tasks.html', label: 'Tasks & Projects' },
      { id: 'writing', href: base + 'tools/writing.html', label: 'Writing Meter' },
      { id: 'countdowns', href: base + 'tools/countdowns.html', label: 'Countdowns' },
      { id: 'meeting', href: base + 'tools/meeting-cost.html', label: 'Meeting Cost' },
      { id: 'shutdown', href: base + 'tools/shutdown.html', label: 'Shutdown' },
      { id: 'backup', href: base + 'tools/backup.html', label: 'Backup & Restore' }
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
    { id: 'work', name: 'Work', color: '#3b6fe0' },
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

    // relationship upkeep: overdue people become reach-out suggestions
    CC.contactsDue().forEach(function (d) {
      if (d.overdue) out.push({ key: 'reach:' + d.c.id, type: 'reach',
        label: 'Reach out to ' + d.c.name, mins: 15, areaId: 'personal', ref: d.c.id, link: '' });
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
    } else if (cand.type === 'reach') {
      var cs = CC.load('cc.contacts', []);
      var person = cs.find(function (x) { return x.id === cand.ref; });
      if (person) {
        person.interactions = person.interactions || [];
        person.interactions.push({ id: CC.uid(), date: CC.todayStr(), type: 'note', note: 'Reached out' });
        CC.save('cc.contacts', cs);
      }
    }
    CC.markSuggested(cand.key);
  };

  /* ---- Relationship (CRM) helpers ---- */
  CC.contactLastDate = function (c) {
    if (c.interactions && c.interactions.length) {
      return c.interactions.map(function (i) { return i.date; }).sort().slice(-1)[0];
    }
    return c.last && c.last !== '1970-01-01' ? c.last : null;
  };
  CC.contactsDue = function () {
    var now = new Date(); now.setHours(0, 0, 0, 0);
    return CC.load('cc.contacts', []).map(function (c) {
      var last = CC.contactLastDate(c);
      var since = last ? Math.round((now - new Date(last + 'T00:00:00')) / 86400000) : 99999;
      var frac = c.cadence ? since / c.cadence : 0;
      return { c: c, last: last, since: since, frac: frac, overdue: c.cadence ? frac >= 1 : false };
    }).sort(function (a, b) { return b.frac - a.frac; });
  };

  /* ============================================================
     Calendar: .ics import, recurrence expansion, day auto-planning
     ============================================================ */
  function icsUnescape(s) {
    return String(s || '').replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
  }
  // Milliseconds a zone is ahead of UTC at a given instant (runtime-TZ independent).
  function icsTzOffsetMs(instantMs, tz) {
    var dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var p = {}; dtf.formatToParts(new Date(instantMs)).forEach(function (x) { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - instantMs;
  }
  // Convert a wall-clock time in zone `tz` to a real UTC instant (DST-correct).
  function icsZonedToUtc(y, mo, da, h, mi, s, tz) {
    try {
      var wall = Date.UTC(y, mo - 1, da, h, mi, s);
      var off = icsTzOffsetMs(wall, tz);
      off = icsTzOffsetMs(wall - off, tz); // second pass corrects DST boundaries
      return new Date(wall - off);
    } catch (e) { return new Date(Date.UTC(y, mo - 1, da, h, mi, s)); }
  }
  function icsParseDT(val, params) {
    params = params || {};
    if ((params.VALUE && params.VALUE.toUpperCase() === 'DATE') || /^\d{8}$/.test(val)) {
      return { date: new Date(+val.slice(0, 4), +val.slice(4, 6) - 1, +val.slice(6, 8)), allDay: true };
    }
    var m = val.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
    if (!m) { var d = new Date(val); return { date: isNaN(d) ? null : d, allDay: false }; }
    var y = +m[1], mo = +m[2], da = +m[3], h = +m[4], mi = +m[5], s = +m[6], utc = !!m[7];
    if (utc) return { date: new Date(Date.UTC(y, mo - 1, da, h, mi, s)), allDay: false };
    if (params.TZID) return { date: icsZonedToUtc(y, mo, da, h, mi, s, params.TZID), allDay: false };
    return { date: new Date(y, mo - 1, da, h, mi, s), allDay: false };
  }

  // Parse an .ics string into base events, keeping only those relevant to a window.
  CC.parseICS = function (text, opts) {
    opts = opts || {};
    var cutoff = opts.cutoff != null ? opts.cutoff : (Date.now() - 21 * 86400000);
    text = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, ''); // unfold
    var lines = text.split('\n');
    var events = [], cur = null, inTZ = false;
    for (var li = 0; li < lines.length; li++) {
      var line = lines[li];
      if (line === 'BEGIN:VTIMEZONE') { inTZ = true; continue; }
      if (line === 'END:VTIMEZONE') { inTZ = false; continue; }
      if (inTZ) continue;
      if (line === 'BEGIN:VEVENT') { cur = {}; continue; }
      if (line === 'END:VEVENT') { if (cur) events.push(cur); cur = null; continue; }
      if (!cur) continue;
      var ci = line.indexOf(':'); if (ci < 0) continue;
      var left = line.slice(0, ci), value = line.slice(ci + 1);
      var segs = left.split(';'), name = segs[0].toUpperCase(), params = {};
      for (var k = 1; k < segs.length; k++) { var kv = segs[k].split('='); params[kv[0].toUpperCase()] = kv[1]; }
      if (name === 'SUMMARY') cur.summary = icsUnescape(value);
      else if (name === 'LOCATION') cur.location = icsUnescape(value);
      else if (name === 'DTSTART') { var a = icsParseDT(value, params); cur.start = a.date; cur.allDay = a.allDay; }
      else if (name === 'DTEND') { var b = icsParseDT(value, params); cur.end = b.date; }
      else if (name === 'RRULE') cur.rrule = value;
      else if (name === 'UID') cur.uid = value;
      else if (name === 'RECURRENCE-ID') { var c = icsParseDT(value, params); cur.recurrenceId = c.date; }
    }
    var out = [];
    events.forEach(function (e) {
      if (!e.start) return;
      if (!e.end) e.end = new Date(e.start.getTime() + (e.allDay ? 86400000 : 3600000));
      var untilMs = null;
      if (e.rrule) { var um = e.rrule.match(/UNTIL=(\d{8})/); if (um) untilMs = new Date(+um[1].slice(0, 4), +um[1].slice(4, 6) - 1, +um[1].slice(6, 8)).getTime(); }
      var keep = e.rrule ? (untilMs == null || untilMs >= cutoff) : (e.end.getTime() >= cutoff);
      if (keep) out.push(e);
    });
    return out;
  };

  CC.saveCalendar = function (events) {
    var ser = events.map(function (e) {
      return { summary: e.summary || '(busy)', location: e.location || '', allDay: !!e.allDay,
        start: e.start ? e.start.toISOString() : null, end: e.end ? e.end.toISOString() : null,
        rrule: e.rrule || null, uid: e.uid || null, recurrenceId: e.recurrenceId ? e.recurrenceId.toISOString() : null };
    });
    CC.save('cc.calendar.events', ser);
    CC.save('cc.calendar.importedAt', Date.now());
  };
  CC.loadCalendar = function () {
    return CC.load('cc.calendar.events', []).map(function (e) {
      return { summary: e.summary, location: e.location, allDay: e.allDay, rrule: e.rrule, uid: e.uid,
        start: e.start ? new Date(e.start) : null, end: e.end ? new Date(e.end) : null,
        recurrenceId: e.recurrenceId ? new Date(e.recurrenceId) : null };
    });
  };

  var DOWCODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  function icsKey(d) { return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0'); }
  function icsParseRule(s) {
    var o = {}; s.split(';').forEach(function (kv) { var p = kv.split('='); o[p[0].toUpperCase()] = p[1]; });
    var r = { freq: (o.FREQ || '').toUpperCase(), interval: o.INTERVAL ? +o.INTERVAL : 1 };
    if (o.BYDAY) r.byday = o.BYDAY.split(',').map(function (x) { return x.replace(/^[+-]?\d+/, '').toUpperCase(); });
    if (o.COUNT) r.count = +o.COUNT;
    if (o.UNTIL) { var m = o.UNTIL.match(/^(\d{4})(\d{2})(\d{2})/); if (m) r.until = new Date(+m[1], +m[2] - 1, +m[3], 23, 59, 59); }
    return r;
  }
  // Does event occur on `day` (local midnight Date)? Returns the occurrence start Date or null.
  CC.eventOccursOn = function (ev, day) {
    var start = ev.start; if (!start) return null;
    var dayMid = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    var startMid = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    if (!ev.rrule) {
      var endMid = ev.end ? new Date(ev.end.getFullYear(), ev.end.getMonth(), ev.end.getDate()) : startMid;
      if (ev.allDay) endMid = new Date(endMid.getTime() - 1); // DTEND is exclusive for all-day
      return (dayMid >= startMid && dayMid <= endMid) ? start : null;
    }
    if (dayMid < startMid) return null;
    var r = icsParseRule(ev.rrule);
    if (r.until && dayMid > r.until) return null;
    var occurs = false;
    if (r.freq === 'DAILY') {
      var dd = Math.round((dayMid - startMid) / 86400000);
      if (dd % r.interval === 0 && (r.count == null || dd / r.interval < r.count)) occurs = true;
    } else if (r.freq === 'WEEKLY') {
      var byday = (r.byday && r.byday.length) ? r.byday : [DOWCODES[start.getDay()]];
      if (byday.indexOf(DOWCODES[day.getDay()]) >= 0) {
        var wd = Math.floor((dayMid - startMid) / (7 * 86400000));
        if (wd % r.interval === 0) occurs = true;
      }
    } else if (r.freq === 'MONTHLY') {
      if (day.getDate() === start.getDate()) {
        var md = (day.getFullYear() - start.getFullYear()) * 12 + (day.getMonth() - start.getMonth());
        if (md % r.interval === 0) occurs = true;
      }
    } else if (r.freq === 'YEARLY') {
      if (day.getDate() === start.getDate() && day.getMonth() === start.getMonth()) occurs = true;
    }
    if (!occurs) return null;
    return new Date(day.getFullYear(), day.getMonth(), day.getDate(), start.getHours(), start.getMinutes(), 0);
  };

  CC.eventsOnDay = function (day) {
    var evs = CC.loadCalendar();
    var overrides = {};
    evs.forEach(function (e) { if (e.recurrenceId) overrides[(e.uid || '') + '|' + icsKey(e.recurrenceId)] = true; });
    var timed = [], allday = [];
    evs.forEach(function (e) {
      var occ = CC.eventOccursOn(e, day);
      if (!occ) return;
      if (e.rrule && !e.recurrenceId && overrides[(e.uid || '') + '|' + icsKey(occ)]) return; // superseded by an edited instance
      if (e.allDay) { allday.push({ summary: e.summary, location: e.location }); }
      else {
        var dur = (e.end && e.start) ? (e.end - e.start) : 3600000;
        timed.push({ summary: e.summary, location: e.location, start: occ, end: new Date(occ.getTime() + dur) });
      }
    });
    timed.sort(function (a, b) { return a.start - b.start; });
    return { timed: timed, allday: allday };
  };

  // Merge real events with auto-suggested blocks that fill the free gaps.
  CC.buildDayPlan = function (day, opts) {
    opts = opts || {};
    var startH = opts.startH != null ? opts.startH : 8;
    var endH = opts.endH != null ? opts.endH : 21;
    var dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), startH, 0, 0);
    var dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), endH, 0, 0);
    var ev = CC.eventsOnDay(day);
    var now = new Date();
    var isToday = day.getFullYear() === now.getFullYear() && day.getMonth() === now.getMonth() && day.getDate() === now.getDate();
    var floor = isToday ? Math.max(dayStart.getTime(), now.getTime()) : dayStart.getTime();

    var busy = ev.timed.map(function (e) { return { s: Math.max(e.start.getTime(), dayStart.getTime()), e: Math.min(e.end.getTime(), dayEnd.getTime()) }; })
      .filter(function (b) { return b.e > b.s; }).sort(function (a, b) { return a.s - b.s; });
    var merged = [];
    busy.forEach(function (b) { var last = merged[merged.length - 1]; if (last && b.s <= last.e) last.e = Math.max(last.e, b.e); else merged.push({ s: b.s, e: b.e }); });

    var gaps = [], cursor = floor;
    merged.forEach(function (b) { if (b.s > cursor) gaps.push({ s: cursor, e: b.s }); cursor = Math.max(cursor, b.e); });
    if (cursor < dayEnd.getTime()) gaps.push({ s: cursor, e: dayEnd.getTime() });

    var suggestions = [];
    var usedKeys = {};
    gaps.forEach(function (g) {
      var mins = Math.round((g.e - g.s) / 60000);
      if (mins < 20) return;
      var pool = CC.buildSuggestions(Math.min(mins, 90)).filter(function (c) { return !usedKeys[c.key]; });
      var n = Math.min(2, Math.max(1, Math.floor(mins / 75)));
      var t = g.s;
      for (var i = 0; i < n && pool.length; i++) {
        var cand = pool[i]; if (!cand) break;
        var blk = Math.min(cand.mins, mins);
        suggestions.push({ suggestion: true, cand: cand, start: new Date(t), end: new Date(t + blk * 60000) });
        usedKeys[cand.key] = true;
        t += (blk + 5) * 60000;
        if (t >= g.e) break;
      }
    });
    return { allday: ev.allday, timed: ev.timed, suggestions: suggestions, dayStart: dayStart, dayEnd: dayEnd, isToday: isToday };
  };

  /* ---- One-time data migrations (safe, idempotent) ---- */
  CC.migrate = function () {
    var v = CC.load('cc.migrated', 0);
    if (v < 1) {
      var areas = CC.load('cc.planner.areas', null);
      if (areas) {
        var changed = false;
        areas.forEach(function (a) { if (a.id === 'work' && a.name === 'Work / CFR') { a.name = 'Work'; changed = true; } });
        if (changed) CC.save('cc.planner.areas', areas);
      }
      var src = CC.load('cc.sources', null);
      if (src) {
        var f = src.filter(function (s) { return !/cfr\.org/i.test(s.url || '') && s.label !== 'CFR'; });
        if (f.length !== src.length) CC.save('cc.sources', f);
      }
      CC.save('cc.migrated', 1);
    }
  };
  CC.migrate();
})();
