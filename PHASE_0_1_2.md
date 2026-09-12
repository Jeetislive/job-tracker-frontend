# JobTrack Frontend — Phase 0 + 1 + 2 Implementation Prompt

## Context

Next.js 14 (App Router) frontend at `job-tracker-frontend/` with TanStack Query, Zustand auth, @dnd-kit Kanban, Tailwind + shadcn-style UI. Current state: core flows work but has 4 critical bugs and missing features. Full audit in this conversation; this is the action plan.

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

## PHASE 0 — Fix Critical Bugs

### BUG-1: Edit functionality is dead

**File:** `src/components/application-detail-dialog.tsx`
**Problem:** The component declares an `onEdit` prop and renders an "Edit" button, but no parent in `dashboard/page.tsx` ever passes `onEdit` — so Edit does nothing.

**Fix:**
1. In `dashboard/page.tsx`, add `const [editing, setEditing] = useState<Application | null>(null);`
2. Pass `onEdit={(app) => setEditing(app)}` to `<ApplicationDetailDialog>` AND to `<KanbanBoard>` (forward through `ApplicationCard` → accept `onEdit` prop and pass to detail dialog).
3. Add `<ApplicationFormDialog editing={editing} ... />` next to the create dialog.
4. When `editing` is set, the form dialog opens with prefilled values and PATCHes on submit.

**Acceptance:** Opening an app, clicking Edit, changing title, saving — title updates everywhere.

---

### BUG-2: Tags not shown in detail dialog

**File:** `src/components/application-detail-dialog.tsx`
**Fix:** In the dialog header area (near `app.location`, `app.salaryMin/Max`, etc.), add a tags row that shows `app.tags.map(t => <Badge>{t}</Badge>)` if `tags.length > 0`.

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
**Fix:** Wrap `handleStatusChange` and `handleDelete` in try/catch that calls `toast.success('Moved to ${STATUS_LABELS[status]}')` and `toast.success('Application deleted')`.

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
- Mock axios
- Test `useApplications({ search: 'Acme' })` sends `?search=Acme`

**Acceptance:** `npm run test` runs all tests green.

---

### TASK-6: Use `useMutation` instead of refetch-everywhere

**File:** `src/hooks/use-applications.ts`
**Fix:** Add `useCreateApplication`, `useUpdateApplication`, `useUpdateStatus`, `useDeleteApplication` mutations. Each calls the API, then `queryClient.invalidateQueries({ queryKey: ['applications'] })`.
Add `useCreateNote`, `useDeleteNote`, etc.

**Update:** `dashboard/page.tsx` and `application-detail-dialog.tsx` to use the new mutations.

**Acceptance:** Status changes invalidate only `['applications']` — not the detail query.

---

### TASK-7: Fix Axios refresh-queue leak

**File:** `src/lib/api.ts`
**Fix:** On `catch` branch of refresh, drain the queue with rejections:
```ts
refreshQueue.forEach(cb => cb(''));
refreshQueue = [];
```
Better: convert the queue to `Promise<{ token: string }>` style.

---

## PHASE 2 — Feature Completeness (for real personal use)

### TASK-8: Email verification UI

**Create:** `src/app/verify-email/[token]/page.tsx`
On mount, calls `POST /api/auth/verify-email { token }`. Shows success or error.
Redirects to `/dashboard` on success, `/login` on failure.

**Banner:** In `dashboard/layout.tsx`, if `user.emailVerified === false` (extend `User` type and `/auth/me` response), show a yellow banner: "Verify your email — check your inbox" with a "Resend" button that calls `POST /api/auth/resend-verification`.

---

### TASK-9: Forgot/reset password pages

**Create:**
- `src/app/forgot-password/page.tsx` — email input → calls `POST /auth/forgot-password`
- `src/app/reset-password/[token]/page.tsx` — new password input → calls `POST /auth/reset-password`

Both with RHF + Zod. Forgot page always shows "If an account exists, you'll get an email" to prevent enumeration.

---

### TASK-10: Real filter UI (Status, Tags, Date Range, Sort)

**File:** `src/app/dashboard/page.tsx`
Replace the 3 dummy pills with working components:
- **Status filter** — `<Select>` with `All, SAVED, APPLIED, INTERVIEW, OFFER, REJECTED, Archived`
- **Tags filter** — Multi-select using existing tags from apps
- **Date range** — Two date inputs (`appliedFrom`, `appliedTo`)
- **Sort** — `<Select>` with `Updated (newest), Created (newest), Follow-up date, Company A-Z`

Add these as params to `useApplications({...})`. Add a clear-filters button.

**Acceptance:** Selecting status=APPLIED + tag=remote shows only matching apps.

---

### TASK-11: Search results highlighting

**File:** `src/components/application-card.tsx`
**Fix:** When `search` is active, highlight matched substring in company/title with `<mark className="bg-yellow-200 dark:bg-yellow-900">` using a tiny `highlight(text, q)` helper.

---

### TASK-12: Multi-select + bulk actions bar

**File:** `src/app/dashboard/page.tsx`
**Fix:**
1. Add a selection state (`Set<string>` of selected app IDs).
2. On long-press or `Shift+click` on a card, toggle selection.
3. When ≥1 selected, show a sticky bottom action bar:
   - "X selected — Move to [status dropdown] / Delete / Archive / Clear"
4. Wire to `useBulkUpdateStatus` and `useBulkDelete` mutations.

**Acceptance:** Selecting 3 cards and clicking "Move to Rejected" updates all 3 in one call.

---

### TASK-13: Note edit + better list

**File:** `src/components/application-detail-dialog.tsx`
**Fix:**
1. Add edit button per note → switches the note to a `<Textarea>` with Save/Cancel.
2. After edit, refetch the application detail.
3. Add "Sort: Newest first / Oldest first" toggle.

---

### TASK-14: Optimistic updates on Kanban drag

**File:** `src/components/kanban-board.tsx` + `src/app/dashboard/page.tsx`
**Fix:**
1. Use `useMutation` with `onMutate` that optimistically moves the card in the cache.
2. On error, rollback + toast.
3. The card no longer snaps back during the round-trip.

**Acceptance:** Drag a card across columns — it stays in the new column even before the API responds.

---

### TASK-15: Settings page

**Create:** `src/app/dashboard/settings/page.tsx`
Sections:
- **Profile** — change name (PUT `/auth/profile`), change password
- **Notifications** — toggle "Email me reminders" (stored on User)
- **Danger zone** — Delete account (DELETE `/auth/me`) with confirm dialog

Add nav link in dashboard header.

---

### TASK-16: CSV/JSON export buttons

**File:** `src/app/dashboard/page.tsx`
**Fix:** Add an "Export" dropdown in the header with "Download CSV" / "Download JSON". Each triggers a fetch with `responseType: 'blob'` from the backend export endpoint and saves the file via a generated anchor element.

---

### TASK-17: Archive UI

**File:** `src/app/dashboard/page.tsx`
**Fix:**
1. Add "Show archived" toggle in filters.
2. When viewing archived apps, render with reduced opacity + "Archived" badge.
3. Card menu gets "Archive" / "Restore" actions.

**Acceptance:** Archived apps disappear by default but reappear when "Show archived" is on.

---

### TASK-18: Bulk operations (matches BE TASK-11)

Use `useBulkUpdateStatus`, `useBulkDelete`, `useBulkArchive` hooks calling the new bulk endpoints.

---

### TASK-19: Pagination on list view

**File:** `src/app/dashboard/page.tsx` (ListView inline component)
**Fix:** Use TanStack Query's `useInfiniteQuery` for `/applications?page=N`. Add "Load more" button at the bottom. Each page appends.

---

### TASK-20: Better empty states + onboarding

**File:** `src/app/dashboard/page.tsx`
**Fix:**
- Empty Kanban (no apps at all) — show illustration + "Add your first application" CTA + "Take the tour" link.
- Empty Kanban (filtered to no matches) — show "No applications match your filters" + "Clear filters" button.
- Onboarding tooltip overlay on first login (use a simple 3-step tour with localStorage flag).

---

### TASK-21: Document upload UI improvements

**File:** `src/components/application-detail-dialog.tsx`
**Fix:**
1. Add drag-and-drop zone (not just button) for documents tab.
2. Show file size + MIME on hover.
3. Preview PDF in new tab (already partially works via downloadUrl).

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

---

## Final Acceptance Criteria

- [ ] Edit flow works end-to-end (BUG-1)
- [ ] Tags visible in detail dialog (BUG-2)
- [ ] Search debounced (BUG-3)
- [ ] Error boundary catches errors (BUG-4)
- [ ] All Phase 1 polish tasks done
- [ ] Dark mode toggle works and persists
- [ ] `npm run test` green, ≥60% coverage on tested files
- [ ] `npm run lint && npm run typecheck` clean
- [ ] `npm run build` succeeds
- [ ] Forgot/reset password flow works end-to-end with backend
- [ ] Filters actually filter
- [ ] Bulk ops work (3 cards moved in one action)
- [ ] Kanban drag is instant (optimistic)
- [ ] Settings page loads, profile updates save
- [ ] CSV export downloads valid file
- [ ] Archive/restore works

## Out of Scope (Phase 3+)

- Sentry error reporting
- Bundle analyzer
- Playwright E2E tests
- Storybook
- WebSocket real-time updates
- PWA / offline mode
- Internationalization