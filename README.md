# job-tracker-frontend

Next.js 14 frontend for the JobTrack application — a Kanban-style job application tracker.

> Paired with [job-tracker-backend](https://github.com/Jeetislive/job-tracker-backend).

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI components
- TanStack Query (server state)
- React Hook Form + Zod (forms + validation)
- Zustand (auth state)
- @dnd-kit (drag-and-drop Kanban board)

## Quick Start

### Prerequisites
- Node.js 22+
- npm

### 1. Install

```bash
cp .env.example .env
npm install
```

### 2. Make sure the backend is running

The frontend expects the API at `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`).
See the [backend repo](https://github.com/Jeetislive/job-tracker-backend) for setup.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Start production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## Environment Variables

- `NEXT_PUBLIC_API_URL` — Backend API base URL (e.g. `http://localhost:3001` in dev, `https://api.yourdomain.com` in prod)
- `NEXT_PUBLIC_APP_NAME` — Display name (default: `JobTrack`)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout + providers
│   ├── page.tsx                # Landing page
│   ├── login/page.tsx          # Login
│   ├── register/page.tsx       # Registration
│   ├── dashboard/
│   │   ├── layout.tsx          # Auth guard
│   │   └── page.tsx            # Kanban dashboard
├── components/
│   ├── ui/                     # Base UI (button, input, card, dialog, tabs)
│   ├── providers.tsx           # React Query provider
│   ├── kanban-board.tsx        # DnD board
│   ├── kanban-column.tsx
│   ├── application-card.tsx
│   ├── application-form-dialog.tsx
│   ├── application-detail-dialog.tsx   (tabs: notes, activity, documents)
│   └── stats-bar.tsx
├── hooks/
│   └── use-applications.ts
├── lib/
│   ├── api.ts                  # Axios client w/ auto-refresh
│   └── utils.ts
├── store/
│   └── auth.ts                 # Zustand auth store
└── types/
    └── index.ts
```

## Deployment

See [`DEPLOY.md`](./DEPLOY.md) for full Vercel / AWS instructions.

## License

MIT