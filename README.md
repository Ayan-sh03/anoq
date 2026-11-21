# Anoq

Anoq is a feedback form builder. The Next.js frontend and Go HTTP API deploy together on Vercel. PostgreSQL stores accounts, sessions, forms, and replies. The repository includes one schema for local PostgreSQL and managed Neon databases.

## Run locally

Use Node.js 24, Go 1.26.11 or newer, Docker, and the PostgreSQL command-line client.

1. Copy `.env.example` to `.env.local`. Its database settings match Docker Compose.
2. Run `docker compose up -d postgres`. A new volume initializes from `server/migrations/schema.sql`. Run `npm run db:migrate` to apply schema updates to an existing database.
3. Run `npm ci`.
4. In one terminal, run `node --env-file=.env.local --run api`. In another, run `npm run dev`.
5. Open `http://localhost:3000`. Next.js forwards local `/api` requests to the Go process on port 8000.

Set `GOOGLE_GENERATIVE_AI_API_KEY` to enable AI-assisted form creation. To select a particular Gemini model, set `GEMINI_MODEL`. Manual forms work independently.

## Deploy

Link the repository to the Vercel project and connect a Neon PostgreSQL database in the project's function region. Use the pooled `DATABASE_URL` at runtime and `DATABASE_URL_UNPOOLED` for schema changes. Run migrations before promoting a release that needs them.

```sh
vercel env run -e production -- node scripts/migrate.mjs
vercel deploy --prod
```

The root Go module is shared by the local server in `cmd/server` and the Vercel Function in `api/dispatch.go`. The routing rules in `vercel.json` send `/api/*` to that function. The database persists across deployments.

## Checks

```sh
go test ./...
npm run lint
npm run build
```
