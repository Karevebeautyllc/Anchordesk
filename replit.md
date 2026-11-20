# Anchor Desk

AI-assisted customer service dashboard for KarEve Beauty Group.  
Five brand mailboxes (Carol's Daughter, Dermablend, Baxter of California, Ambi, AcneFree) unified into one queue. Drafts replies; humans send them. A Bridge Systems LLC product.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 · Vite · React Router v7 |
| Backend | Node.js · Express · tsx (hot reload) |
| Database | PostgreSQL (Replit-managed) · Drizzle ORM |
| Email | Microsoft Graph API (Exchange mailboxes) |
| Auth | Microsoft Entra ID (Azure AD) — SSO wired on Day 18 |

---

## How to run

### Frontend only (demo dataset — no secrets needed)

The **Frontend** workflow starts automatically. It serves the React app on port 5000 with the bundled mock dataset. All screens are functional against demo data.

### Full stack (live mailboxes)

1. **Add the required secrets** (Settings → Secrets):

   | Secret | Description |
   |---|---|
   | `AZURE_TENANT_ID` | KarEve Entra tenant ID |
   | `AZURE_CLIENT_ID` | Anchor Desk app registration client ID |
   | `AZURE_CLIENT_SECRET` | App registration client secret |
   | `GRAPH_CLIENT_STATE_SECRET` | Random 32-char hex (`openssl rand -hex 32`). Kept stable — rotating it invalidates all webhook subscriptions. |
   | `API_AUTH_TOKEN` | Random 32-char hex. Guards the ticket read API. Required in production. |
   | `VITE_API_TOKEN` | Same value as `API_AUTH_TOKEN`. Included in the Vite bundle so the browser can authenticate against the API. |

2. **Switch the frontend to live mode**: add the env var `VITE_API_URL` and set its value to `""` (an empty string — not the text "empty", literally nothing). The Vite dev server proxies any `/api/*` request to the backend on port 8000, so no absolute URL is needed. Leaving `VITE_API_URL` unset keeps the frontend in demo mode.

3. **Start the Backend workflow** — it runs migrations automatically on boot, syncs the mailbox registry, then begins listening for Graph webhooks.

4. **Restart the Frontend workflow** so Vite picks up `VITE_API_URL`.

---

## Entra app registration requirements

The app registration needs **application** (not delegated) permissions with admin consent:

- `Mail.ReadWrite`
- `Mail.Send`
- `User.Read.All`

Scope access to only the five brand mailboxes via an Exchange application access policy:

```powershell
New-ApplicationAccessPolicy -AppId <client-id> \
  -PolicyScopeGroupId anchor-desk-mailboxes@kareve.com \
  -AccessRight RestrictAccess \
  -Description "Anchor Desk — brand support mailboxes only"
```

Graph webhook callbacks arrive at `PUBLIC_BASE_URL` (currently set to the Replit dev domain). For production set this to `https://anchor.kareve.com`.

---

## Project structure

```
src/                 React frontend
  components/        AppShell · CommandPalette · Modal · EscalateModal · LogCallModal · UI primitives
  screens/           Login · Queue · TicketView · Calls · Sheets · Insights · Settings
  data/              view.ts · source.ts · fromApi.ts · fromMock.ts · brands.ts · mock.ts · types.ts
  hooks/             useResource.ts (fetch + abort + poll)
  lib/               api.ts · theme.tsx · surface.ts · utils.ts
  styles/            tokens.css · app.css

server/              Express backend
  db/                schema.ts · migrations/ · migrate.ts · client.ts
  graph/             auth · client · subscriptions · mail · types
  ingest/            normalize · triage · html · store · outbound · delta · pipeline · mailboxes
  routes/            notifications (Graph webhook) · health · tickets
  jobs/              scheduler (subscription renewal + delta reconciliation)
  scripts/           backfill.ts · seed-dev.ts
```

**Config is data, not constants.** Mailbox addresses, escalation routing, and Excel bindings live in `src/data/brands.ts` and the Settings screen — never in component code.

---

## Key scripts

```bash
npm run dev              # Vite frontend dev server (port 5000)
npm run server:dev       # Express backend with hot reload (port 8000)
npm run db:migrate       # Run pending migrations
npm run db:seed          # Seed development data
npm run test             # Vitest unit tests
npm run typecheck        # Full TypeScript check (frontend + server)
```

---

## User preferences

- Keep mailbox config, escalation routing, and Excel bindings in `src/data/brands.ts` / Settings screen — never hardcoded in components.
- `surface.ts` detects standalone vs. Teams tab — surface-agnostic code lives below the shell.
- Autonomy stays at L1–L2 permanently: the Desk drafts, a human sends.
