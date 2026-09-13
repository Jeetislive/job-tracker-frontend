# JobTrack Frontend — Phase 4: Email Verification UX

## Context

Next.js 14 (App Router) FE at `job-tracker-frontend/` — TanStack Query, Zustand auth, Tailwind + shadcn-style UI. This phase makes email verification a real, user-facing flow.

**What already exists (don't rebuild):**
- `src/app/verify-email/[token]/page.tsx` — already calls `POST /api/auth/verify-email` and shows verifying/success/error states. Needs polish (see TASK-3).
- `src/app/forgot-password/page.tsx`, `src/app/reset-password/[token]/page.tsx` — exist.
- Auth store (`src/store/auth.ts`) already has `User.emailVerified?: boolean`, `register()` auto-saves tokens + user and keeps the user **logged in**.
- Register page (`src/app/register/page.tsx`) — on success currently toasts "Account created!" and pushes straight to `/dashboard`.

**What the backend now provides (this is the contract to integrate):**

| Endpoint | Method/Body | Response | Notes |
|---|---|---|---|
| `/api/auth/verify-email` | `POST` `{ token: string }` | `200 { message: 'Email verified' }` · `400 { message: 'Invalid or expired verification token' }` | Public, no auth header. Link-click target. |
| `/api/auth/resend-verification` | `POST` `{ email: string }` | `200 { message: 'If the email exists, a verification link has been sent.' }` | Public. Always 200 (no user-enumeration). Throttled to 10/min per IP — respect it; do not hammer. |

- Verification/reset emails now link to the FE pages directly: `${FRONTEND_URL}/verify-email/<token>` and `${FRONTEND_URL}/reset-password/<token>` (backend reads `FRONTEND_URL`, default `http://localhost:3000`). Do not change these routes.
- The link token is a one-time, 1-hour-expiry token. Clicking it hits the verify-email page, which calls the API.

All requests use the existing axios instance `src/lib/api.ts` (prefixes `/api`, attaches bearer, rotates refresh tokens).

---

## TASK-1: "Check your email" screen after register

**File:** `src/app/register/page.tsx`

After `registerUser(...)` succeeds, **do not** immediately bounce to `/dashboard` as today. Instead swap the card body for a success state ("Check your email"):

- Heading: "Verify your email"
- Body: `We sent a link to <email>. Click it to activate your account.` (show the email the user registered with)
- Buttons:
  - **Open email client** → `mailto:` link or just informs them (keep simple)
  - **Resend email** → `POST /api/auth/resend-verification { email }`, disable for 30s with a countdown, toast "Verification email sent"
  - **Continue to dashboard** → `router.push('/dashboard')` (the user is already logged in via the store — `user.emailVerified` is `false`, the banner from TASK-2 will guide them)
- Keep them logged in (do NOT log them out). This matches the current store behavior.

## TASK-2: Unverified banner (dashboard)

**File:** `src/app/dashboard/layout.tsx` (or a small `src/components/verify-email-banner.tsx` used there)

When the logged-in `user.emailVerified === false`, render a dismissible banner near the top:

- Text: "Verify your email to keep your account safe."
- Action: **Resend verification email** → `POST /api/auth/resend-verification { email: user.email }` (uses `user.email` from `useAuthStore`), 30s resend cooldown, success toast.
- Dismiss: persistent "X" hiding it for the session (e.g. `sessionStorage` key).
- Do not show for verified users; hide immediately after TASK-3 refreshes the store.

## TASK-3: Verify-email page polish

**File:** `src/app/verify-email/[token]/page.tsx`

- **On success:** if a user is logged in, update the store — `useAuthStore.getState().setUser({ ...user, emailVerified: true })` — so the banner disappears without a reload. Then show the success card + auto-redirect to `/dashboard` (already does).
- **On error:** the existing error card is fine; add a secondary action "Resend email" that calls `POST /api/auth/resend-verification` with the logged-in `user.email` if available, otherwise a small email input (or a link to the resend flow on /login). Keep the `Sign in` / `Back to dashboard` buttons.
- Edge case: token already consumed → API returns `400`; render the error state (a second click of an old email link lands here — normal).
- Keep the loading spinner state as-is.

## TASK-4: Unverified soft-reminder on login

Optional (nice-to-have): after `login()`, if `user.emailVerified === false`, fire the TASK-2 banner / toast once. Do not block login — the backend allows unverified users to use the app.

## TASK-5: Tests

Using the existing vitest + RTL + jsdom setup (`jsdom@24.1.3`, `@/lib/api` mocked — see `src/components/__tests__/kanban-board.test.tsx` for the mock pattern):

- `src/components/__tests__/verify-email-banner.test.tsx`
  - hidden when `emailVerified === true` or no user
  - visible when `emailVerified === false`
  - "Resend" click → `POST /auth/resend-verification` called with `user.email`; button disabled during 30s cooldown
- Register flow (if easy to isolate): after submit, "Verify your email" screen shows instead of dashboard redirect (mock `register`/router).

**Acceptance:** `npm run lint`, `npm run build`, `npm run test` green. Manual E2E: with the backend running + SMTP configured (`.env` `SMTP_USER=jobtrack365@gmail.com` etc.), register with a real inbox → receive the email → click the `FRONTEND_URL/verify-email/<token>` link → dashboard banner disappears and `emailVerified` becomes `true` after verification. Without SMTP, the backend logs the link/token to the server console — paste it into the browser to test the verify page locally.

---

## Task order + Definition of Done

1. TASK-1 register success screen → 2. TASK-2 banner → 3. TASK-3 verify page polish → 4. TASK-4 login reminder (optional) → 5. TASK-5 tests.
2. Done when: lint/build/test pass; the full loop works against the real backend — register → email link → verify → banner clears; resend is throttled client-side and never hard-fails.