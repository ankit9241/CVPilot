# CVPilot

Monorepo containing two independent applications.

```
cvpilot/
├── frontend/   # TanStack Start SaaS UI (Vite + React 19 + Tailwind v4)
└── backend/    # Node.js + Express + TypeScript + Prisma + PostgreSQL
```

Frontend and backend are fully independent. They communicate over REST.

## Frontend
```bash
cd frontend
bun install
bun run dev
```

## Backend
```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run dev
```
