# Environment Setup

## Required Accounts

1. **Cloudflare** — hosting and edge compute
2. **Supabase** — database and auth
3. **Anthropic** — Claude API

## Environment Variables

### Cloudflare Worker Secrets (set via `wrangler secret put`)

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
ADMIN_EMAIL=your-email@example.com
```

### Local Development (create `.dev.vars` in workers/ — NOT committed to git)

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...
ADMIN_EMAIL=your-email@example.com
```

## Database Setup

Run the SQL migration scripts in `sql/` in order using the Supabase SQL Editor:

1. `sql/001_schema.sql` — Creates tables
2. `sql/002_rls.sql` — Row Level Security policies
3. `sql/003_seed.sql` — Initial admin user

## Deployment

### Frontend (Cloudflare Pages)
Connected to this GitHub repo. Pushes to `main` auto-deploy.
- Build output directory: `frontend`
- No build command needed (static files)

### Workers (Cloudflare Workers)
```bash
cd workers
npm install
npx wrangler deploy
```
