# JobTrack Frontend — Phase 3 Implementation Prompt (Integrations)

## Context

Next.js 14 (App Router) frontend at `job-tracker-frontend/` with TanStack Query, Zustand auth, @dnd-kit Kanban, Tailwind + shadcn-style UI. Phases 0–2 per `PHASE_0_1_2.md` complete (or in progress). Phase 3 adds the **Review Inbox**, **Integrations settings**, **source badges**, and the import-notification behavior. Product spec: `PHASE_3_SPEC.md`. Backend contract: `job-tracker-backend/PHASE_3_IMPLEMENTATION.md` (endpoints listed there).

Project layout (unchanged unless noted):
```
src/
  app/
    layout.tsx, page.tsx, globals.css
    login/page.tsx, register/page.tsx
    dashboard/{layout,page}.tsx
    dashboard/inbox/page.tsx                ← NEW
    dashboard/settings/integrations/page.tsx ← NEW
  components/
    providers.tsx
    kanban-board.tsx, kanban-column.tsx
    application-card.tsx
    application-form-dialog.tsx
    application-detail-dialog.tsx
    stats-bar.tsx
    source-badge.tsx                         ← NEW
    inbox/import-review-card.tsx             ← NEW
    integrations/{email-ingestion,telegram-setup,extraction-settings}.tsx ← NEW
    ui/{...}.tsx
  hooks/
    use-applications.ts
    use-ingest-sources.ts                    ← NEW
  lib/{api,utils}.ts
  store/auth.ts
  types/index.ts
```

All requests go through the existing axios instance in `src/lib/api.ts` (prefixes `/api`, attaches bearer token, unwraps errors). IDs are strings — never numeric.

---

## TASK-1: Types + platform metadata

**File:** `src/types/index.ts`

Extend `Application`:
```ts
source?: string | null;
sourceId?: string | null;
sourceMessageId?: string | null;
autoImported?: boolean;
importedAt?: string | null;
importStatus?: 'pending' | 'confirmed' | 'rejected' | null;
importConfidence?: number | null;
```

Add the source map (used by `<SourceBadge>`):
```ts
export const SOURCE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  manual:            { label: 'Manual',   icon: '✏️', color: 'text-gray-500' },
  'email:naukri':    { label: 'Naukri',   icon: '📧', color: 'text-blue-600' },
  'email:foundit':   { label: 'Foundit',  icon: '📧', color: 'text-purple-600' },
  'email:linkedin':  { label: 'LinkedIn', icon: '💼', color: 'text-sky-600' },
  'email:indeed':    { label: 'Indeed',   icon: '⚡', color: 'text-indigo-600' },
  'email:instahyre': { label: 'Instahyre',icon: '⚡', color: 'text-orange-600' },
  telegram:          { label: 'Telegram', icon: '💬', color: 'text-cyan-600' },
};
export function sourceMeta(source?: string | null) {
  return SOURCE_LABELS[source ?? 'manual'] ?? SOURCE_LABELS.manual;
}
```

**Add the Phase 3 API types** (mirroring the BE response shapes exactly):

```ts
export interface InboxItem {
  id: string;
  company: string;
  title: string;
  status: string;
  url: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  appliedDate: string | null;
  tags: string[];
  source: string | null;
  sourceId: string | null;
  sourceMessageId: string | null;
  importStatus: 'pending' | 'confirmed' | 'rejected' | null;
  importConfidence: number | null;
  importPayload: {
    _meta?: { path?: 'regex' | 'llm'; platform?: string };
    from?: string;
    subject?: string | null;
    text?: string | null;
  } | null;
  importedAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { notes: number; documents: number };
}

export interface IngestSource {
  id: string;
  type: 'email' | 'telegram';
  identifier: string;
  active: boolean;
  createdAt: string;
}

export interface IngestSettings {
  saveEmailBody: boolean;
  llmExtractionEnabled: boolean;
  telegramNotifyEnabled: boolean;
  emailIngestEnabled: boolean;
  telegramChatId: string | null;
}

export interface IngestSourcesResponse {
  sources: IngestSource[];
  settings: IngestSettings;
}

export interface TelegramLinkResponse {
  token: string;
  deepLink: string;
}
```

- The inbox list endpoint wraps results: it returns `{ items: InboxItem[] }`, **not** a bare `Application[]` — always read `.data.items`.
- Body text (`text`/`from`/`subject` inside `importPayload`) is only present when `saveEmailBody` is on; `_meta` is always present.

---

## TASK-2: Inbox + confirm/reject hooks

**File:** `src/hooks/use-applications.ts`

```ts
export function useInbox() {
  return useQuery({
    queryKey: ['applications', 'inbox'],
    queryFn: async () => (await api.get<{ items: InboxItem[] }>('/applications/inbox')).data.items,
  });
}

export function useConfirmImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/applications/${id}/confirm`),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['applications', 'inbox'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });
}

export function useRejectImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/applications/${id}/reject`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications', 'inbox'] }),
  });
}

export function useUnrejectImport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/applications/${id}/unreject`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications', 'inbox'] }),
  });
}

export function useBulkImportAction(action: 'confirm' | 'reject') {
  // loops useConfirmImport / useRejectImport with Promise.all + progress state
}
```

---

## TASK-3: Source badge component

**Create:** `src/components/source-badge.tsx`

```tsx
export function SourceBadge({ source, className }: { source?: string | null; className?: string }) {
  const meta = sourceMeta(source);
  return (
    <Badge variant="outline" className={cn('gap-1 text-xs', meta.color, className)}>
      <span aria-hidden>{meta.icon}</span>
      <span>{meta.label}</span>
    </Badge>
  );
}
```

Apply it:
- `src/components/application-card.tsx` — absolute corner badge (top-right), hidden in Kanban density "compact" if needed
- `src/components/application-detail-dialog.tsx` — header row next to the title
- List view (TASK-8)

---

## TASK-4: Inbox page + review card

**Create:** `src/app/dashboard/inbox/page.tsx`
- `'use client'`
- Header: `📥 Inbox` + pending count + bulk buttons (`Confirm all`, `Reject all`, confirm-before-bulk)
- `useInbox({ refetchInterval: 30_000 })` → list of `<ImportReviewCard>` or empty state
- Empty state: "Nothing new! Applications you apply to on Naukri, Foundit, LinkedIn, etc. will appear here automatically."

**Create:** `src/components/inbox/import-review-card.tsx`
- Source badge + time-ago (`importedAt`)
- Title / company / location / salary — read directly from the item (`location`, `salaryMin`, `salaryMax`, `currency`); render `—` when null (regex often leaves salary/location blank)
- Applied date = `appliedDate ?? importedAt` (fall back to the payload's "Applied on …" line if both null)
- Confidence chip: `92% (regex)` / `95% (ml)` — path from `importPayload?._meta?.path ?? (importConfidence >= 0.95 ? 'ml' : 'regex')`; NEVER derive path from the confidence threshold alone (regex with a full field match also caps at 0.95) — prefer `_meta.path` when present
- Optional: a "Rejected" tab listing history via `GET /applications/inbox?status=rejected` (cards re-confirmable)
- Actions: `Edit` (opens `ApplicationFormDialog` prefilled; on save PATCH then auto-confirm), `✓ Confirm`, `✗ Reject`
- Reject → optimistic removal + Sonner toast with `Undo` (5s) calling `useUnrejectImport`
- Show route/render exit animation before removal

---

## TASK-5: Nav entry + count badge + background toast

**File:** `src/app/dashboard/layout.tsx`
- Add `Inbox` nav item with a red count badge = `useInbox().data?.items.length ?? 0`
- If a `useInbox` subscription exists, keep a lightweight 60s poll for the toast only when on dashboard:
  - Track previous count in a ref; on increase → Sonner toast with `[Review →]` action navigating to `/dashboard/inbox`
- Guard against double-toast and firing while already on the inbox page

---

## TASK-6: Integrations settings page

**Create:** `src/app/dashboard/settings/integrations/page.tsx` (+ nav link if settings exist already; otherwise add the route)

Sections (lazy components to keep the page client-lite):

**Create:** `src/components/integrations/email-ingestion.tsx`
- Fetches `GET /api/ingest-sources` → the user's forwarding address is `sources.find(s => s.type === 'email')?.identifier` (`auto-{short}@jobtrack.app`) with copy button (navigator.clipboard + toast)
- Gmail filter setup steps in a collapsible `<Details>`
- Toggles → `PATCH /api/ingest-sources` with `{ saveEmailBody, telegramNotifyEnabled }`
- `Disconnect email` dialog → `DELETE /api/ingest-sources/:id` (the email source id)

**Create:** `src/components/integrations/telegram-setup.tsx`
- Connected if `settings.telegramChatId != null` (the backend does NOT expose the bot username — show `● Connected` + the chat id / or just "Connected"). Disconnect = delete the telegram source (also clears `telegramChatId` server-side).
- Else: wizard per spec — `POST /api/ingest-sources/telegram/link` → show `Open Telegram` deep-link button + a copyable one-time code labeled "send it to the bot as `/start <code>`" → poll `GET /api/ingest-sources` every 5s (max ~2min) until `settings.telegramChatId` is non-null → success state
- Keep `POST /api/ingest-sources/telegram/link/use { token }` available **only** if a manual code-exchange UX is added later (the current bot flow completes linking server-side via the `/start` deep link, so `link/use` is not normally called by this page)

**Create:** `src/components/integrations/extraction-settings.tsx`
- Toggle `Use LLM fallback` → `PATCH /api/ingest-sources` with `{ llmExtractionEnabled }`
- "Estimated cost: < $1/mo" hint
- "Test extraction" → textarea + `POST /api/ingest/test` → render extracted card (reuse a simplified card layout) showing confidence + path from the response (`result.path` = `regex` | `llm`); error state on failure

---

## TASK-7: Edit-before-confirm

- Reuse the existing `ApplicationFormDialog` (Phase 0–2). Add an `initialData` prop path so Inbox cards can prefill edit.
- On dialog submit: `PATCH /applications/:id` with the form payload, then auto-confirm (`POST /applications/:id/confirm`), then invalidate Inbox + Kanban + stats.
- If the backend `PATCH` rejects required fields the import omitted (e.g. missing `description`), surface validation messages as usual.

---

## TASK-8: List view source column + source filter

- **File:** `src/app/dashboard/page.tsx` (or wherever the List table lives):
  - Add `Source` column rendering `<SourceBadge source={row.source} />`
  - Add a multi-select "Source" filter to the existing filter bar (Phase 2 TASK-10): options with values `manual`, `telegram`, `email:naukri`, `email:foundit`, `email:linkedin`, `email:indeed`, `email:instahyre` (labels Manual, Telegram, Naukri, … — the supported platforms match the backend regex extractor). Serialize selection to `?source=opt1,opt2` — the BE accepts the comma-list and treats `manual` as rows with no source (verified live).
- Kanban page: no new column (badge on card suffices), but ensure `confirmation/restore` flows preserve `source`.

---

## TASK-9: Tests (Jest + React Testing Library)

**Create:**
- `src/components/__tests__/source-badge.test.tsx`
  - returns the right label for `email:naukri`, `telegram`, `manual`, and unknown (`undefined` → Manual)
- `src/components/inbox/__tests__/import-review-card.test.tsx`
  - renders company/title/confidence
  - Confirm click → `POST /applications/:id/confirm` called
  - Reject click → `POST /applications/:id/reject` called + Undo toast shown
- `src/hooks/__tests__/use-inbox.test.tsx` (if a test wrapper exists) — else skip, covered by e2e smoke

**Acceptance:** `npm run lint`, `npm run build`, `npm run test` all green. Manual: seed backend TASK-9 → open `/dashboard/inbox` → confirm two items → see them in Kanban with badges → reject one → undo restores it.

---

## Task Order + Definition of Done

1. TASK-1 types → TASK-2 hooks → TASK-3 badge → TASK-4 inbox → TASK-5 nav/toast → TASK-6 settings → TASK-7 edit → TASK-8 list/filter → TASK-9 tests
2. Done when: lint/build/test pass; with backend seeded, the Inbox renders pending items, confirm moves them to Kanban, reject + undo works, badges show on cards/list/dialog, and the Telegram connect wizard completes end-to-end against a local bot token.