# Command Center — a personal efficiency toolkit

A set of lightweight, private tools built into this GitHub Pages site. Everything
runs **entirely in your browser** — no servers, no accounts, no data leaves your
machine (state is kept in `localStorage`). That means it's free to host, works
offline once loaded, and there's nothing to leak.

Open `index.html` (your site root) for the dashboard hub.

---

## What's built

| Tool | File | What it does |
|------|------|--------------|
| **Dashboard** | `index.html` | A preview of **today's plan** (your calendar events + auto-suggested blocks), "Today's Top 3," world clocks, and a tool launcher. |
| **Calendar** | `tools/calendar.html` | Import a `.ics` export from Apple/Google/Outlook (drag-and-drop). Shows your real events on a day timeline and **auto-fills the free gaps** with suggested productive/social blocks (habits, reading, overdue-contact reach-outs). DST-correct across time zones; handles recurrence and all-day events. Re-import to refresh. |
| **People (CRM)** | `tools/contacts.html` | Add connections with their digital channels (email, LinkedIn, Signal…), log every interaction (coffee, call, email, event…), and set an upkeep cadence. Overdue people automatically surface as reach-out blocks on the Calendar and dashboard. |
| **Planner** | `tools/planner.html` | A digital assignment book. Plan the week in a grid of *areas* (Work, Chinese, Academic reading, Reading queue, Yu-Gi-Oh, Personal) × days; run a daily agenda; and use the **downtime coach** for open time. Recurring habits auto-populate the grid and feed the Calendar's suggested blocks. |
| **Time-Zone Planner** | `tools/timezones.html` | Pick an anchor zone + date, and read an hour-by-hour overlap grid across capitals. It flags the hour with the most cities in working hours — the answer to "when can DC, London, and Delhi all take a call?" |
| **Reading Queue** | `tools/reading.html` | Capture articles/books with a link, priority, and topic tags. Filter by tag or read/unread. Export to JSON. |
| **Tasks & Projects** | `tools/tasks.html` | Task lists grouped by project/portfolio, with due dates; overdue items turn red. |
| **Deep-Work Timer** | `tools/focus.html` | Pomodoro-style focus blocks (25/5, 50/10, 90/15, or custom) with a chime, desktop notification, and a daily session/minute count. |
| **Scratchpad** | `tools/notes.html` | Autosaving Markdown notes with live split-preview and one-click `.md` export — good for call prep, meeting minutes, memo drafts. |
| **Writing Meter** | `tools/writing.html` | Paste a draft for word count, reading/speaking time, Flesch–Kincaid readability, and a list of over-long sentences to tighten. |
| **Countdowns** | `tools/countdowns.html` | Days-until board for summits, elections, deadlines, and travel; near-term dates flag red. |
| **Contact Cadence** | `tools/contacts.html` | Set how often to reach each person; overdue contacts rise to the top with a progress bar. |
| **Meeting Cost** | `tools/meeting-cost.html` | Attendees × loaded hourly rate × duration, annualized — a reality check on standing meetings. |
| **Slovak Citizenship** | `tools/citizenship.html` | Document-retrieval tracker for the descent claim (§7(2)(j)): what's in hand vs. the remaining gaps, the four retrieval tasks broken into checkable steps with per-step notes, an editable descent-chain builder, key contacts/links, and an overall progress bar. |
| **Shutdown Routine** | `tools/shutdown.html` | An editable end-of-day checklist that resets each morning. |
| **Backup &amp; Restore** | `tools/backup.html` | Export every tool's data to one JSON file (or clipboard) and restore it on any device, with merge/replace. Shows a live storage breakdown. |

Design notes:
- Shared look-and-feel via `assets/css/tools.css`; shared helpers in `assets/js/tools.js`.
- Light/dark theme toggle (persisted), tuned for reading.
- No build step, no dependencies — plain HTML/CSS/JS. Edit and refresh.

---

## Why these, for your line of work

Foreign-policy / research work tends to be **read-heavy, write-heavy, meeting-heavy,
and time-zone-heavy**. The suite targets exactly those frictions: a fast place to
stash the 20 things you'll "read later," a scheduler that answers the time-zone
question in one glance, protected writing blocks, and a scratchpad that never makes
you think about where a file goes.

---

## Further ideas (roadmap)

Still on the client-side list (not yet built):
- **Decision log** — timestamped record of decisions + rationale, searchable.
- **Per-diem / expense scratch** for trips, with quick currency math against a stored rate.

Things that would need an API key or a small backend (worth it if you want them):
- **Live currency & FX** (exchangerate.host / ECB) instead of a manually stored rate.
- **News aggregator** — pull headlines from RSS feeds you choose (Foreign Affairs, FT,
  War on the Rocks, etc.) into one river. Needs a CORS-friendly RSS proxy or a tiny worker.
- **Calendar overlay** — surface today's events on the dashboard (Google/Microsoft Graph).
- **Flight/time-zone briefing** — paste an itinerary, get local arrival times + jet-lag plan.

Off-the-shelf, no code:
- **Text expander** (Espanso / built-in OS) for boilerplate you retype — bios, disclaimers, scheduling lines.
- **Read-it-later** (Readwise Reader / Instapaper) if you want cross-device sync and highlights.
- **Reference manager** (Zotero) if citation volume grows.

---

## Data & privacy

All state is stored under `cc.*` keys in your browser's `localStorage`. To move to a
new machine, use each tool's export where available, or clear data via your browser's
site-settings. Nothing here phones home.
