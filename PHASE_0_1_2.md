# JobTrack Frontend — Phase 0 + 1 + 2 Implementation Prompt

> Status: **Version 2 (2026-09)** — reconciled against the **completed** backend `PHASE_0_1_2` rollout.
> The backend at `job-tracker-frontend/../job-tracker-backend` now implements everything in **its** `PHASE_0_1_2.md` (pagination/filters, verify-email, forgot/reset-password, bulk status/delete, notes edit, archive/restore, export, documents list, Swagger, etc.). This file is the FE counterpart. Sections marked **[Backend gap]** mean the FE task depends on a backend endpoint that does **not** exist yet — build the UI shell around it and feature-flag / disable that part until the backend adds it (proposed contracts are given so the backend work is unambiguous).

## Context

Next.js 14 (App Router) frontend at `job-tracker-frontend/` with TanStack Query, Zustand auth, @dnd-kit Kanban, Tailwind + shadcn-style UI. Current state: core flows work but has 4 critical bugs and missing features. Full audit of backend in the conversation; this is the action plan for the FE.

Project layout (unchanged unless noted):
```
src/
  app/
    layout.tsx, page.tsx, globals.css
    login/page.tsx, register/page.tsx
    dashboard/{layout,page}.tsx
  components/
    providers.tsx
    kanban-board.tsx, kanban-column.tsx
    application-card.tsx
    application-form-dialog.tsx
    application-detail-dialog.tsx
    stats-bar.tsx
    ui/{button,input,label,textarea,card,dialog,select,tabs,badge}.tsx
  hooks/use-applications.ts
  lib/{api,utils}.ts
  store/auth.ts
  types/index.ts
```

---

## Backend API Contract (reference — already implemented)

Base URL: `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`). All API paths are prefixed by the FE axios instance with `/api` (see `src/lib/api.ts`). Every non-auth route requires `Authorization: Bearer <accessToken>`. IDs are **strings (cuid)** — never treat as numeric. Timestamps are ISO-8601 UTC strings. Error shape is always `{ statusCode, message, error }` where `message` may be a **string or string[]** (validation errors). 204 responses have no body.

Auth rate limiting matters for testing: `register`/`login` are throttled to **10/min**, every other auth endpoint to **30/min** (per IP). Over-limit returns **429**. Don't spam them in manual tests.

Current demo seed (backend): `demo@jobtrack.app` / `Demo1234` with 7 applications, notes, and documents.

### Auth — `POST /api/auth/*`
| Endpoint | Request | Success | Notes |
|---|---|---|---|
| `POST /register` | `{ email, password, name? }` | 201 `{ accessToken, refreshToken, user }` | password: ≥8 chars, lower+upper+digit |
| `POST /login` | `{ email, password }` | 200 `{ accessToken, refreshToken, user }` | unverified emails still log in (warned server-side) |
| `POST /refresh` | `{ refreshToken }` | 200 `{ accessToken, refreshToken, user }` | **rotates** — old token is revoked; every response contains a NEW refreshToken that must be persisted |
| `POST /logout` | `{ refreshToken }` | 204 (no body) | idempotent |
| `POST /verify-email` | `{ token }` | 200 `{ message }` | 400 on invalid/expired |
| `POST /forgot-password` | `{ email }` | 200 `{ message }` | same message for known/unknown (anti-enumeration) |
| `POST /reset-password` | `{ token, newPassword }` | 200 `{ message }` | same password rules as register; **revokes all the user's refreshTokens → FE should clear local tokens/localStorage after success** |
| `GET /me` | — | 200 `{ id }` | ⚠️ **only** `{ id }` today — no email/name/emailVerified. Do NOT rely on it for profile data; use the `user` object persisted from login/register |

`user` shape in register/login/refresh: `{ id, email, name, emailVerified }`.

**[Backend gap] No resend-verification endpoint** — TASK-8's "Resend" button has nothing to call. Either skip the button, or (preferred) file a backend follow-up to add `POST /api/auth/resend-verification { email }` (should regenerate a fresh emailVerifyToken, update `emailVerifyExpires`, and reply 200 `{ message }` regardless of whether the email exists).

### Applications — `/api/applications*`
| Endpoint | Request | Success | Notes |
|---|---|---|---|
| `GET /applications` | query params (below) | 200 `{ items, total, page, limit }` | `_count` per item has `{ notes, documents }` |
| `GET /applications/stats` | — | 200 `{ total, byStatus, upcomingFollowUps }` | `byStatus` = `{SAVED:0,APPLIED:0,INTERVIEW:0,OFFER:0,REJECTED:0}`; counts NON-archived only |
| `GET /applications/export?format=csv\|json` | — | 200 download | CSV is `text/csv`, JSON is `application/json`; both set `Content-Disposition: attachment; filename="jobtrack-applications-YYYY-MM-DD.csv|json"`. Exports **all** rows incl. archived (no pagination) |
| `POST /applications` | `CreateApplicationDto` | 201 `ApplicationListItem` | if `status` omitted → `SAVED`; if status ≠ SAVED → `appliedDate` auto-set to now |
| `POST /applications/bulk/status` | `{ ids: string[], status }` | 200 `{ updated: ApplicationListItem[] }` | missing/foreign ids → 404 |
| `POST /applications/bulk/delete` | `{ ids: string[] }` | 200 `{ deleted: number, ids: string[] }` | |
| `GET /applications/:id` | — | 200 `ApplicationDetail` | adds `notes[]`, `activities[]`, `documents[]` (each newest-first) |
| `PATCH /applications/:id` | `UpdateApplicationDto` | 200 `ApplicationListItem` | status change also auto-sets `appliedDate` first time it leaves SAVED |
| `PATCH /applications/:id/status` | `{ status }` | 200 `ApplicationListItem` | same as changing status via PATCH `/:id` |
| `PATCH /applications/:id/archive` | — | 200 `ApplicationListItem` | `archived: true` |
| `PATCH /applications/:id/restore` | — | 200 `ApplicationListItem` | `archived: false` |
| `DELETE /applications/:id` | — | 204 | |

**List query params** (all optional): `search` (matches company, title, location, description, and tag exactly), `status` (enum only: `SAVED|APPLIED|INTERVIEW|OFFER|REJECTED` — **not** "Archived"), `page` (≥1, default 1), `limit` (≥1, default 50), `sort` (`createdAt|updatedAt|followUpDate|company`, default `updatedAt`), `order` (`asc|desc`, default `desc`), `tags` (⚠️ must be an **array**; a single plain `tags=x` → **400** — see TASK-10), `appliedFrom`, `appliedTo`, `followUpFrom`, `followUpTo` (ISO date/date-time), `salaryMin`, `salaryMax` (range overlap), `archived` (bool, show only archived), `includeArchived` (bool, show archived AND active).

`ApplicationListItem` fields: `id, company, title, url, status, location, salaryMin, salaryMax, description, followUpDate, appliedDate, tags, source, priority, currency, archived, createdAt, updatedAt, _count`. ⚠️ The FE `Application` type in `src/types/index.ts` is **missing** `appliedDate, source, priority, currency, archived` — add them (TASK-10 prerequisite).

`ApplicationDetail` = list item fields + `notes[]` (`{id, content, createdAt, user:{id,name,email}}`), `activities[]` (`{id, action, details, createdAt, user}`), `documents[]` (`{id, filename, fileSize, mimeType, createdAt}` — **no storageKey**), `_count`.

### Notes — `/api/applications/:id/notes`
| Endpoint | Request | Success | Notes |
|---|---|---|---|
| `POST /notes` | `{ content }` | 201 `{ id, content, createdAt, user }` | |
| `GET /notes?page=&limit=` | — | 200 `{ items, total, page, limit }` | newest-first; **no server sort param** — "Newest/Oldest" toggle is client-side |
| `PATCH /notes/:noteId` | `{ content }` | 200 `{ id, content, createdAt, user }` | |
| `DELETE /notes/:noteId` | — | 204 | |

Note: the application **detail** response already embeds `notes[]` — a fresh detail fetch is the simplest refetch after add/edit/delete.

### Documents — `/api/applications/:id/documents`, `/api/documents*`
| Endpoint | Request | Success | Notes |
|---|---|---|---|
| `POST /applications/:id/documents` | multipart, field **`file`** | 201 `{ id, filename, fileSize, mimeType, createdAt }` | allowed MIME: pdf, doc, docx, png, jpeg; content sniffed (magic bytes); ≤ 10 MB; 400 on wrong type |
| `GET /applications/:id/documents` | — | 200 `[{ id, filename, fileSize, mimeType, createdAt }]` | no storageKey exposed |
| `GET /documents/:id/download` | — | 200 `{ downloadUrl, expiresIn }` | local driver → `downloadUrl: "/api/documents/local/<key>"` |
| `GET /documents/local/:key` | — | 200 file stream | ⚠️ **public** (no auth) — safe to open in a new tab; that's by design |
| `DELETE /documents/:id` | — | 204 | |

---

## PHASE 0 — Fix Critical Bugs

### BUG-1: Edit functionality is dead

**File:** `src/components/application-detail-dialog.tsx`
**Problem:** The component declares an `onEdit` prop and renders an "Edit" button, but no parent in `dashboard/page.tsx` ever passes `onEdit` — so Edit does nothing.

**Fix:**
1. In `dashboard/page.tsx`, add `const [editing, setEditing] = useState<Application | null>(null);`
2. Pass `onEdit={(app) => setEditing(app)}` to `<ApplicationDetailDialog>` AND to `<KanbanBoard>` (forward through `ApplicationCard` → accept `onEdit` prop and pass to detail dialog).
3. Add `<ApplicationFormDialog editing={editing} ... />` next to the create dialog.
4. When `editing` is set, the form dialog opens with prefilled values and **PATCHes** `PATCH /api/applications/:id` on submit (200 → returns updated list item).
5. After a successful edit, invalidate both `['applications']` and `['application', id]` (mutation `onSuccess`).

**Acceptance:** Opening an app, clicking Edit, changing title, saving — title updates everywhere (card, detail, any list).

---

### BUG-2: Tags not shown in detail dialog

**File:** `src/components/application-detail-dialog.tsx`
**Fix:** In the dialog header area (near `app.location`, `app.salaryMin/Max`, etc.), add a tags row that shows `app.tags.map(t => <Badge>{t}</Badge>)` if `tags.length > 0`. (Tags are already part of the detail response — no API change needed.)

Acceptance unchanged.

---

### BUG-3: No debounce on search

**File:** `src/app/dashboard/page.tsx`
**Fix:** Replace raw `useState` with a debounced version:
```ts
import { useDebounce } from '@/hooks/use-debounce'; // create this hook
const [searchInput, setSearchInput] = useState('');
const search = useDebounce(searchInput, 300);
```
Pass `searchInput` to the input, `search` to `useApplications`.

**Create:** `src/hooks/use-debounce.ts` — 10-line hook using `useEffect` + `setTimeout`.

**Acceptance:** Typing "Acme" sends ONE request 300ms after the last keystroke, not 4.

---

### BUG-4: No error boundary

**Create:** `src/app/error.tsx` (Next.js App Router error boundary)
```tsx
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded">
        Try again
      </button>
    </div>
  );
}
```
Also create `src/app/not-found.tsx` and `src/app/dashboard/loading.tsx` (skeleton).

**Acceptance:** Throwing an error in any component shows the friendly UI instead of a blank page.

---

## PHASE 1 — Polish + Basic Tests

### TASK-1: Replace native `confirm()` with reusable ConfirmDialog

**Create:** `src/components/ui/confirm-dialog.tsx` — wraps Radix AlertDialog with title, description, confirm/cancel buttons.

**Replace 3 call sites:**
- `src/app/dashboard/page.tsx:45` — delete application
- `src/components/application-detail-dialog.tsx:77` — delete note
- `src/components/application-detail-dialog.tsx:131` — delete document

Use a simple `useConfirm()` hook returning `{ confirm, ConfirmDialog }`. Mount the dialog once at app shell.

---

### TASK-2: Loading skeletons

**Create:** `src/components/skeleton.tsx` — generic animated box.
**Apply in:** `src/app/dashboard/loading.tsx` (Next.js loading file) — render skeleton matching dashboard layout (header bar + stats grid + kanban columns).
**Also:** Update `StatsBar` to render placeholder tiles instead of returning null while loading.

---

### TASK-3: Success toast on status change + delete

**File:** `src/app/dashboard/page.tsx`
**Fix:** On the mutation `onSuccess` handlers:
- Status change → `toast.success('Moved to ${STATUS_LABELS[status]}')`
- Delete → `toast.success('Application deleted')`

> Backend contract: status change via `PATCH /api/applications/:id/status { status }` (200, returns updated item); delete via `DELETE /api/applications/:id` (204, no body).

---

### TASK-4: Dark mode toggle (next-themes is already installed but unused)

**File:** `src/app/layout.tsx`
**Fix:**
1. Remove the hardcoded `dark` class on `<html>` (let theme provider control it).
2. Wrap children in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`.
3. Add a small toggle button in the dashboard header using `useTheme()`.

**Acceptance:** Clicking toggle switches between light and dark; persists across reloads.

---

### TASK-5: Basic component tests (Phase 1 requirement)

**Install:** `vitest @testing-library/react @testing-library/jest-dom jsdom`
**Create:** `vitest.config.ts` and `src/test/setup.ts`
**Create:** `src/components/__tests__/kanban-board.test.tsx`
- Render with 3 mock applications across 2 statuses
- Assert each column shows correct count
- Assert cards display company + title

**Create:** `src/hooks/__tests__/use-applications.test.tsx`
- Mock the `api` axios instance from `@/lib/api`
- Test `useApplications({ search: 'Acme' })` sends `?search=Acme` on `/applications`
- Also assert the pagination response `{ items, total, page, limit }` is consumed (total from `data.total`)

**Acceptance:** `npm run test` runs all tests green.

---

### TASK-6: Use `useMutation` instead of refetch-everywhere

**File:** `src/hooks/use-applications.ts`
**Fix:** Add `useCreateApplication`, `useUpdateApplication`, `useUpdateStatus`, `useDeleteApplication` mutations. Each calls the API, then `queryClient.invalidateQueries({ queryKey: ['applications'] })` (prefix match — v4 partial match by default, so `['applications', args]` keys are all invalidated).
Add `useCreateNote`, `useUpdateNote`, `useDeleteNote` (invalidate `['application', id]`), and `useBulkStatus`, `useBulkDelete` (see TASK-12/18).

**Update:** `dashboard/page.tsx` and `application-detail-dialog.tsx` to use the new mutations.

**Acceptance:** Status changes invalidate only `['applications']` — not the detail query (`['application', id]`).

---

### TASK-7: Fix Axios refresh-queue leak

**File:** `src/lib/api.ts`
**Current state:** the queue already drains+clears on success (lines 47–48) and localStorage is purged + redirect on failure. What's **still** wrong:

> ⚠️ **Refresh tokens now rotate server-side.** Every `POST /api/auth/refresh` returns a NEW `refreshToken` and revokes the old one. Two racing tabs (or a 401 burst) can both read the same stale `refreshToken` → the second refresh gets 401 → the user is bounced to `/login` even though they're valid.

**Fix (recommended):**
1. Convert the callback queue to promise style so waiters resolve with the *streamed* token:
```ts
type RefreshPromise = (token: string, refreshToken: string) => void;
let pendingRefresh: Promise<void> | null = null;
const queue: RefreshPromise[] = [];

async function refreshOnce(accessToken: string, refreshToken: string) { ... }
```
2. On refresh success, atomically persist BOTH `data.accessToken` and `data.refreshToken` before resolving the queue.
3. Unless a single-tab policy is intended, accept single-tab freshness for v1 (document it); do NOT fire two refreshes concurrently from one tab (guard with `pendingRefresh`).
4. Keep the failure path: clear `accessToken`/`refreshToken`/`user`, redirect to `/login` only when not already there.

**Acceptance:** A 401 burst resolves all waiters with the rotated token; no double-refresh with the same token from the same tab.

---

## PHASE 2 — Feature Completeness (for real personal use)

### TASK-8: Email verification UI

**Create:** `src/app/verify-email/[token]/page.tsx`
On mount, calls `POST /api/auth/verify-email { token }` → 200 `{ message }`. Shows success or error. Redirects to `/dashboard` on success, `/login` on failure.

**Banner:** In `dashboard/layout.tsx`, if `user.emailVerified === false`, show a yellow banner: "Verify your email — check your inbox". 

> **Backend facts that change this task:**
> - `emailVerified` is present on the login/register/refresh **responses** (`data.user`) and is already persisted as `localStorage.user` by `store/auth.ts`.
> - `GET /api/auth/me` returns **only** `{ id }` — it cannot refresh `emailVerified`. So extend the `User` type in `store/auth.ts` with `emailVerified: boolean` (default true if missing for older stored users) and derive the banner from the stored user.
>
> **[Backend gap] The "Resend" button** has no endpoint. Recommended: implement the banner *without* the button and leave a `// TODO(BE): POST /api/auth/resend-verification { email }` hook. If the button must ship, call that path and handle 404 gracefully (hide the button).

---

### TASK-9: Forgot/reset password pages

**Create:**
- `src/app/forgot-password/page.tsx` — email input → `POST /api/auth/forgot-password { email }` → 200 `{ message }` (same response for known/unknown — keep the UI text identical so no enumeration)
- `src/app/reset-password/[token]/page.tsx` — new password input → `POST /api/auth/reset-password { token, newPassword }` → 200 `{ message }`

Both with RHF + Zod (reuse the register password schema: ≥8, lower+upper+digit). On successful reset, **clear `accessToken`/`refreshToken`/`user` from localStorage and send the user to `/login`** — the backend revokes all of the user's refresh tokens on reset.

---

### TASK-10: Real filter UI (Status, Tags, Date Range, Sort)

**File:** `src/app/dashboard/page.tsx`
Replace the 3 dummy pills with working components wired into `useApplications({...})` (which already passes `args` as query params). ⚠️ **First**, extend `src/types/index.ts` `Application` with `appliedDate: string | null; source: string | null; priority: number | null; currency: string | null; archived: boolean;`.

- **Status filter** — `<Select>` with `All / SAVED / APPLIED / INTERVIEW / OFFER / REJECTED`. **"Archived" is NOT a status** — use the dedicated archive toggle (below) via `archived`/`includeArchived`.
- **Show archived toggle** — checkbox. Off (default): omit params (backend hides archived). On: set `includeArchived=true` (both archived+active) — and use `archived=true` only if filtering to archived-only.
- **Tags filter** — multi-select from tags present in loaded apps; send as an **array**: `params: { tags: ['remote', 'backend'] }`. ⚠️ The backend **400s** on a single plain `tags=x` string — with axios' default serializer arrays become `tags[]=a&tags[]=b` which is correct. Do NOT set a `paramsSerializer` that flattens single-element arrays to a bare string.
- **Date range** — `appliedFrom` / `appliedTo` date inputs (send `YYYY-MM-DD`). ⚠️ `appliedTo` compares with `lte` — append end-of-day (`${date}T23:59:59Z`) so the last day is included.
- **Salary** (optional) — `salaryMin` / `salaryMax` numeric inputs (backend treats them as range overlap against `[salaryMin, salaryMax]`).
- **Sort** — `<Select>` mapping: `Updated (newest)` → `sort=updatedAt&order=desc`, `Created (newest)` → `sort=createdAt&order=desc`, `Follow-up date` → `sort=followUpDate&order=asc`, `Company A-Z` → `sort=company&order=asc`.
- Add a **clear-filters** button resetting all of the above.

**Acceptance:** Selecting status=APPLIED + tag=remote shows only matching apps.

---

### TASK-11: Search results highlighting

**File:** `src/components/application-card.tsx`
**Fix:** When `search` is active, highlight matched substring in company/title with `<mark className="bg-yellow-200 dark:bg-yellow-900">` using a tiny `highlight(text, q)` helper. (Backend `search` also matches location/description/tags — highlight those too if displayed.)

---

### TASK-12: Multi-select + bulk actions bar

**File:** `src/app/dashboard/page.tsx`
**Fix:**
1. Add a selection state (`Set<string>` of selected app IDs).
2. On long-press or `Shift+click` on a card, toggle selection.
3. When ≥1 selected, show a sticky bottom action bar:
   - "X selected — Move to [status dropdown] / Delete / Archive / Clear"
4. Wire to `useBulkStatus` (`POST /api/applications/bulk/status { ids, status }` → 200 `{ updated }`) and `useBulkDelete` (`POST /api/applications/bulk/delete { ids }` → 200 `{ deleted, ids }`).

> **Archive has no bulk endpoint** (`[Backend gap]` — backend only has per-app `PATCH /:id/archive`). Two options: (a) implement "Archive" as `Promise.all(ids.map(id => PATCH /applications/:id/archive))`; (b) drop Archive from the bulk bar. Delete is safer via the bulk endpoint (avoids N requests).

**Acceptance:** Selecting 3 cards and clicking "Move to Rejected" updates all 3 in one request (`{ updated: 3 items }`).

---

### TASK-13: Note edit + better list

**File:** `src/components/application-detail-dialog.tsx`
**Fix:**
1. Add edit button per note → switches the note to a `<Textarea>` with Save/Cancel → `PATCH /api/applications/:id/notes/:noteId { content }` (200).
2. After add/edit/delete, refetch the application detail (`['application', id]`) — the detail response already includes `notes[]`, so no separate list endpoint needed.
3. Add "Sort: Newest first / Oldest first" — **client-side only** (the backend notes endpoint has no sort param; its `GET /notes` is newest-first).
4. Delete note → `DELETE /api/applications/:id/notes/:noteId` → 204.

---

### TASK-14: Optimistic updates on Kanban drag

**File:** `src/components/kanban-board.tsx` + `src/app/dashboard/page.tsx`
**Fix:**
1. Use `useMutation` (→ `PATCH /api/applications/:id/status { status }`) with `onMutate` that optimistically moves the card in the cache (`['applications']`).
2. On error, rollback + toast.
3. The card no longer snaps back during the round-trip.

**Acceptance:** Drag a card across columns — it stays in the new column even before the API responds.

---

### TASK-15: Settings page — ⚠️ PARTIALLY BLOCKED by backend gaps

**Create:** `src/app/dashboard/settings/page.tsx` with these sections:

- **Profile** — show `name`/`email` from the auth store. Edit name → **proposed** `PATCH /api/auth/profile { name }` `[Backend gap — does not exist]`. Until it exists: feature-flag the form (disabled with a "coming soon" note) or POST it and handle 404.
- **Change password** — **proposed** `POST /api/auth/change-password { currentPassword, newPassword }` `[Backend gap — does not exist]`. Same feature-flag approach. On success (if the backend eventually revokes tokens) → force re-login.
- **Notifications** — "Email me reminders (email is derived from your account / follow-up reminders are sent automatically when a follow-up date is set)". There is **no per-user opt-out in the backend schema** `[Backend gap]`; render the toggle as informational + "coming soon".
- **Danger zone** — Delete account: **proposed** `DELETE /api/auth/me` `[Backend gap — does not exist]`. Feature-flag with ConfirmDialog; on success clear localStorage → `/login`.

Add nav link in dashboard header.

**Required backend follow-ups for full TASK-15** (propose in the backend repo, keep FE calls shape-compatible):
1. `PATCH /api/auth/profile` `{ name }` → 200 `{ id, email, name, emailVerified }`
2. `POST /api/auth/change-password` `{ currentPassword, newPassword }` (newPassword must satisfy register rules; revoke other refresh tokens) → 200 `{ message }`
3. `DELETE /api/auth/me` (auth required; cascade delete) → 204

**Acceptance (interim):** Settings page loads, profile/name and password/cancel/delete controls all gracefully report "not available yet" (no crashes, no blank sections).

---

### TASK-16: CSV/JSON export buttons

**File:** `src/app/dashboard/page.tsx`
**Fix:** Add an "Export" dropdown in the header with "Download CSV" / "Download JSON".

- URL: `GET /api/applications/export?format=csv` (CSV) or `?format=json`.
- Fetch with `responseType: 'blob'`.
- Filename: parse from `Content-Disposition` header (`attachment; filename="jobtrack-applications-YYYY-MM-DD.csv"`) — use `attachment` with `;` fallback `jobtrack-applications.<ext>`.
- Save via an anchor element with `URL.createObjectURL(blob)` + `a.click()` + `URL.revokeObjectURL`.
- CSV content type is `text/csv; charset=utf-8`. Export includes archived rows.

**Acceptance:** CSV downloads a valid multi-row file; Excel/LibreOffice open it.

---

### TASK-17: Archive UI

**File:** `src/app/dashboard/page.tsx`
**Fix:**
1. Add "Show archived" toggle in filters → sets `includeArchived=true` (see TASK-10).
2. When viewing archived apps, render with reduced opacity + "Archived" badge (check `app.archived`).
3. Card menu gets "Archive" / "Restore" actions → `PATCH /api/applications/:id/archive` / `PATCH /api/applications/:id/restore` (200, returns updated item). Invalidate `['applications']`.

**Acceptance:** Archived apps disappear by default but reappear when "Show archived" is on; restoring pulls them back into the default view.

---

### TASK-18: Bulk operations (matches BE) — ✓ superseded by TASK-12

Use `useBulkStatus` + `useBulkDelete` (TASK-12). There is **no bulk archive endpoint** — do not implement `useBulkArchive`.

---

### TASK-19: Pagination on list view

**File:** `src/app/dashboard/page.tsx` (ListView inline component)
**Fix:** Use TanStack Query's `useInfiniteQuery` for `GET /applications?page=N&limit=50`. Response `{ items, total, page, limit }` → `getNextPageParam: (last) => last.items.length < last.limit ? undefined : last.page + 1`. Add "Load more" button at the bottom; each page appends. Pass the current filters/sort (TASK-10) through.

---

### TASK-20: Better empty states + onboarding

**File:** `src/app/dashboard/page.tsx`
**Fix:**
- Empty Kanban (no apps at all, `total === 0` and no filters) — show illustration + "Add your first application" CTA + "Take the tour" link.
- Empty Kanban (filters active, no matches) — show "No applications match your filters" + "Clear filters" button.
- Onboarding tooltip overlay on first login (3-step tour, `localStorage` flag).

---

### TASK-21: Document upload UI improvements

**File:** `src/components/application-detail-dialog.tsx`
**Fix:**
1. Add drag-and-drop zone (not just button) for documents tab → `POST /api/applications/:id/documents` multipart field named **`file`**. ⚠️ Allowed MIME: pdf/doc/docx/png/jpeg (≤10MB); backend rejects wrong content with a magic-byte check — surface the 400 message.
2. Show file size + MIME on hover (from `fileSize`/`mimeType` in the documents list).
3. Preview: doc list item gives `id` → `GET /api/documents/:id/download` → 200 `{ downloadUrl, expiresIn }` → open `downloadUrl` (**public route, works in a new tab**). "Preview PDF in new tab" = `window.open(downloadUrl, '_blank')` or an `<a target="_blank">`.
4. Delete doc → `DELETE /api/documents/:id` → 204, then refetch detail.

---

### TASK-22: Keyboard shortcuts

**File:** `src/app/dashboard/page.tsx`
Add shortcuts (using a small `useKeyboardShortcuts` hook):
- `N` → open new application dialog
- `/` → focus search
- `Esc` → close any open dialog
- `?` → open shortcut help

---

## Tests for Phase 2 (extend TASK-5)

Add `src/components/__tests__/kanban-board.test.tsx` cases:
- Test drag-and-drop moves the card between columns
- Test selecting a card triggers bulk action bar

Add `src/components/__tests__/application-detail-dialog.test.tsx`:
- Test "Add note" submits and shows new note
- Test "Delete note" calls API with correct ID

Add `src/hooks/__tests__/use-applications.test.tsx` cases:
- `status` alone → `?status=APPLIED`
- `tags: ['remote']` → serialized as array (assert the URL contains `tags%5B%5D=remote` or repeated `tags=remote&tags=...`, never a bare `tags=remote`)

---

## Final Acceptance Criteria

- [ ] Edit flow works end-to-end (BUG-1)
- [ ] Tags visible in detail dialog (BUG-2)
- [ ] Search debounced — 1 request per input burst (BUG-3)
- [ ] Error boundary + not-found + loading skeletons render (BUG-4)
- [ ] All Phase 1 polish tasks done
- [ ] Dark mode toggle works and persists
- [ ] `npm run test` green, ≥60% coverage on tested files
- [ ] `npm run lint && npm run typecheck` clean
- [ ] `npm run build` succeeds
- [ ] Verify-email flow works (`/verify-email/[token]`); banner shows for unverified users
- [ ] Forgot/reset password flow works end-to-end (reset clears tokens → login)
- [ ] Filters actually filter: status, tags (array), date range incl. `appliedTo` end-of-day, sort, archived toggle
- [ ] `types/index.ts` Application gained `appliedDate/source/priority/currency/archived`
- [ ] Bulk status + bulk delete work (3 cards in one action); archive is per-app
- [ ] Kanban drag is instant (optimistic) and rolls back on error
- [ ] Settings page loads; unavailable backend sections degrade gracefully (no 404 crashes)
- [ ] CSV + JSON export download valid files
- [ ] Archive/restore + "Show archived" toggle work
- [ ] Document upload (drag-drop), preview in new tab, delete work with 10MB/MIME limits
- [ ] Refresh rotation: after 401, the interceptor retries with the NEW token; localStorage stores the rotated refreshToken

## Required backend follow-ups (track, do NOT block FE merge)

1. `POST /api/auth/resend-verification { email }` — powers TASK-8 "Resend".
2. `PATCH /api/auth/profile { name }` — TASK-15 profile edit.
3. `POST /api/auth/change-password { currentPassword, newPassword }` — TASK-15 password.
4. `DELETE /api/auth/me` — TASK-15 danger zone.
5. (optional) bulk archive; (optional) User `notificationsEnabled` toggle + respecting it in the reminder worker.
6. (optional) `GET /api/auth/me` → return full user `{ id, email, name, emailVerified }` so hydrated sessions can re-sync `emailVerified` (currently only `{ id }`).

## Dev/Test Notes

- Run the backend first: `npm run start:dev` (or `node dist/src/main.js`) on `:3001`; Postgres `job_tracker_test` already migrated + seeded (`demo@jobtrack.app` / `Demo1234`).
- Backend `.env`: `CORS_ORIGIN=http://localhost:3000` — the FE dev server origin default.
- No Redis locally → follow-up reminder worker is disabled; email endpoints log to console instead of SMTP (fine for UI testing).
- Auth endpoints are rate-limited (login/register 10/min, others 30/min) — throttle-aware tests only.
- Swagger docs for reference: `http://localhost:3001/api/docs`.

## Out of Scope (Phase 3+)

- Sentry error reporting
- Bundle analyzer
- Playwright E2E tests
- Storybook
- WebSocket real-time updates
- PWA / offline mode
- Internationalization