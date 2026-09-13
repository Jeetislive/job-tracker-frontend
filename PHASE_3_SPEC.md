# JobTrack Frontend Phase 3 — Integrations Product Spec

> Companion to `job-tracker-backend/PHASE_3_SPEC.md`. This file covers the FE-specific UX for auto-imported jobs. Backend already implements the endpoints listed here (see the BE `PHASE_3_IMPLEMENTATION.md`); where an endpoint is still missing, build the shell and feature-flag it.

## Goal

Turn auto-captured applications (from email forwarding + Telegram) into a smooth "review → confirm" flow, so a real user who applies on Naukri/Foundit/LinkedIn sees their application inside JobTrack with zero manual typing.

## New Routes

- `/dashboard/inbox` — Review imported (pending) applications
- `/dashboard/settings/integrations` — Connect email + Telegram + extraction settings (reuse the Phase 2 settings shell if present; otherwise a new settings route)

## Review Inbox UX

```
┌─────────────────────────────────────────────┐
│ 📥 Inbox (3)                [Confirm all] [Reject all] │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ 📧 Naukri · 2 min ago                   │ │
│ │ Senior Engineer at Acme Corp            │ │
│ │ Bangalore · ₹15-20 LPA                  │ │
│ │ Applied: 2026-09-12                      │ │
│ │ Confidence: 92% (regex)                 │ │
│ │ [Edit] [✓ Confirm] [✗ Reject]          │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ 💬 Telegram · 5 min ago                  │ │
│ │ Frontend Dev at Globex                   │ │
│ │ Remote · $90k-110k                       │ │
│ │ Confidence: 95% (LLM)                   │ │
│ │ [Edit] [✓ Confirm] [✗ Reject]          │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

- **Confirm** → application becomes `confirmed`, appears in Kanban/search/stats immediately (Queries invalidated)
- **Reject** → card animates out, 5s "Undo" toast
- **Edit** → opens the existing Application form prefilled; save = confirm
- **Confirm all / Reject all** → bulk mutators (disable while pending, optimistic updates)
- Auto-refresh every 30s while the tab is open (`refetchInterval`)
- Empty state: "Nothing new! Your applications will appear here when you apply on Naukri, Foundit, LinkedIn, etc."

## Settings → Integrations UI

```
┌──────────────────────────────────────────┐
│ 📧 Email                                 │
│   Your JobTrack email:                   │
│   ┌────────────────────────────────────┐ │
│   │ auto-abc123@jobtrack.app      📋   │ │
│   └────────────────────────────────────┘ │
│   [ ] Save email body (privacy)           │
│   [x] Notify me on Telegram on new import │
│   Setup instructions (Gmail filter steps) │
│   [Disconnect email]                      │
├──────────────────────────────────────────┤
│ 💬 Telegram                               │
│   ● Connected (chat 1234567890) [Disconnect]│
│   — or —                                   │
│   Not connected? [Connect Telegram →]     │
├──────────────────────────────────────────┤
│ 🤖 Extraction                             │
│   [x] Use LLM fallback when regex unsure  │
│   Estimated cost: < $1/mo                 │
│   [Test extraction →]                     │
└──────────────────────────────────────────┘
```

### Telegram connect wizard

1. Click "Connect Telegram" → `POST /api/ingest-sources/telegram/link` → `{ token, deepLink }`
2. Show step 1: big button "Open Telegram" → `deepLink` = `https://t.me/<BOT>?start=<token>` (new tab) — clicking it sends `/start <token>` to the bot automatically
3. Show step 2: "Your one-time code: `<token>`" with copy button — if the deep link didn't autofill, paste it into the bot **as `/start <token>`** (a bare token paste is treated as job-capture and fails). The bot completes the link server-side.
4. Poll `GET /api/ingest-sources` every 5s until `settings.telegramChatId` is non-null (or a `telegram`-type source appears, same thing) → "● Connected" (max ~2min then timeout).

### Test extraction

Textarea pasted sample email + "Run test" → `POST /api/ingest/test` → renders extracted card (company/title/salary/confidence + which path: regex/LLM). Used both for debugging and for demoing to recruiters.

## Source Badges — Everywhere Applications Render

- 📧 Email · Naukri / Foundit / LinkedIn / Indeed / Instahyre
- 💬 Telegram
- ✏️ Manual (default)
- Color-coded per platform
- Locations: Kanban `application-card` (corner), List view (new "Source" column), Detail dialog (header badge)

## Inbox count in nav

- Sidebar/top-nav entry "Inbox" with red count badge when pending > 0
- Poll inbox count every 60s when on dashboard; on increase show Sonner toast:
  ```
  📥 New import from Naukri
     Senior Engineer @ Acme Corp
     [Review →]   → navigates to /dashboard/inbox
  ```

## API Surface (consumed by FE)

```
GET    /api/applications/inbox                (auth) pending imports; optional ?status=rejected
POST   /api/applications/:id/confirm          (auth)
POST   /api/applications/:id/reject           (auth)
POST   /api/applications/:id/unreject         (auth)
GET    /api/ingest-sources                    (auth) → { sources, settings }
PATCH  /api/ingest-sources                    (auth) toggles
POST   /api/ingest-sources/telegram/link      (auth) → { token, deepLink }
POST   /api/ingest-sources/telegram/link/use  (auth) exchange token
DELETE /api/ingest-sources/:id                (auth)
POST   /api/ingest/test                       (auth) dry-run extraction
```

> Feed-side note: the bot's username is not exposed by the backend — "connected" = `settings.telegramChatId` is set. The email forwarding address is the `identifier` of the `type: 'email'` source. The list endpoint accepts `?source=manual,email:naukri` (comma-valued, `manual` = rows with no source).

## Out of Scope

Browser extension, Gmail OAuth polling, real-time websockets for inbox (polling is fine for now).

---

Full task breakdown: `job-tracker-frontend/PHASE_3_IMPLEMENTATION.md`.