# Anoq

Anoq is a feedback form builder. The Next.js frontend and Go HTTP API deploy together on Vercel. PostgreSQL stores accounts, sessions, forms, and replies. The repository includes one schema for local PostgreSQL and managed Neon databases.

## Run locally

With Docker Compose installed, run `docker compose up -d --build` and open `http://localhost:3000`. This starts Next.js, the Go API, and PostgreSQL. The migration service applies the schema before the API starts. The local database lives in the Compose volume across restarts.

Frontend source changes reload in the container. After Go changes, run `docker compose up -d --build api`. To enable AI generation, put your development `GOOGLE_GENERATIVE_AI_API_KEY` in `.env.local` and run `docker compose --env-file .env.local up -d`. The stack always uses its local PostgreSQL service. `WEB_PORT`, `API_PORT`, and `POSTGRES_PORT` change the host ports if needed.

### Run the app processes on the host

Use Node.js 24, Go 1.26.11 or newer, Docker, and the PostgreSQL command-line client. The following commands use Compose for PostgreSQL only.

1. Copy `.env.example` to `.env.local`. Its database settings match Docker Compose.
2. Run `docker compose up -d postgres`. A new volume initializes from `server/migrations/schema.sql`. Run `npm run db:migrate` to apply schema updates to an existing database.
3. Run `npm ci`.
4. In one terminal, run `node --env-file=.env.local --run api`. In another, run `npm run dev`.
5. Open `http://localhost:3000`. Next.js forwards local `/api` requests to the Go process on port 8000.

Set `GOOGLE_GENERATIVE_AI_API_KEY` to enable AI-assisted form creation. To select a particular Gemini model, set `GEMINI_MODEL`. Manual forms work independently.

## Response reporting and event collection

The dashboard shows how many responses each form has. Open a form’s responses for counts per choice, including options with zero votes. Changed questions have separate results for each version that received answers. **Export CSV** downloads the complete form’s responses, including the recorded question wording, question ID, submission time in UTC and any contact details the respondent supplied. Each answer has its own row. Spreadsheet formula-like text is prefixed with an apostrophe.

Select **Show event QR** in the owner’s report or dashboard menu. Leave the public display open on the event tablet. Its QR opens the ordinary feedback form on each attendee’s phone, where the usual receipt and retry rules apply.

For a local Wi-Fi event, set `WEB_BIND_ADDRESS` in `.env.local` to the host computer’s Wi-Fi IPv4 address. Run `docker compose --env-file .env.local up -d --build` and open the event display using that IP and the web port on the tablet. Phones must be able to reach the host on that port. The default address is loopback for single-computer development. A deployed HTTPS display automatically uses its own public origin.

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

With the full local Compose stack running, `npm run test:local` exercises conflicting edits, submission retries, per-form receipts, mid-response question changes, historical reporting and CSV exports, and consecutive attendees at a QR event. It creates and removes its own test account and forms. The original findings are in the [workflow field test](docs/workflow-testing.md).
