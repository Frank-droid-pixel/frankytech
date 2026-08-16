# FRANKY TECH — Deployment Guide (Phase 30)

This covers taking FRANKY TECH from your local machine to a real,
publicly-reachable production deployment.

## 1. Choose a host

Any Node.js + PostgreSQL host works. Recommended, roughly in order of
how little setup they require:

| Host | Notes |
|---|---|
| **Railway** | One-click Postgres + Node service, easiest end-to-end |
| **Render** | Free web service tier + managed Postgres |
| **Fly.io** | More control, still simple `fly deploy` |
| A VPS (DigitalOcean, Linode, etc.) | Full control, most manual setup |

This guide assumes a generic Node host; adjust the specific UI steps
for whichever you pick.

## 2. Environment variables checklist

Set every one of these on your host's environment/secrets panel
(never commit real values to Git):

```
NODE_ENV=production
PORT=3000                          # or whatever your host requires
APP_URL=https://your-real-domain.com
DATABASE_URL=postgresql://...      # your production database
SESSION_SECRET=<generate a new one — do NOT reuse your dev secret>
PAYMENT_WEBHOOK_SECRET=<real value once you connect a gateway, Phase 19>
WHATSAPP_NUMBER=237670113284
FACEBOOK_URL=...
TIKTOK_URL=...
INSTAGRAM_URL=...
YOUTUBE_URL=...
```

Generate a fresh `SESSION_SECRET` for production — never reuse the
one from your local `.env`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## 3. Provision the database

Create a managed PostgreSQL instance through your host (or a
dedicated provider like Neon/Supabase). Copy its connection string
into `DATABASE_URL`.

## 4. Deploy

```bash
npm install --omit=dev
npm run migrate
npm start
```

Most hosts run `npm install` and `npm start` automatically on deploy —
check whether your host supports a "release" or "pre-deploy" command
hook to run `npm run migrate` automatically before each deploy. If
not, run it manually once after each deploy that includes new
migration files.

**Never run `npm run seed` against production** — the script itself
refuses to run when `NODE_ENV=production`, but don't remove that
guard.

## 5. HTTPS

Your host almost certainly terminates HTTPS for you automatically
(Railway, Render, Fly all do). Confirm your domain resolves over
`https://` before going live — session cookies are marked `Secure` in
production (see `server/utils/cookies.js`), meaning they will
silently fail to be set over plain HTTP.

## 6. Post-deploy checklist

- [ ] Visit `https://your-domain.com/api/health` — confirm `"connected": true`
- [ ] Register a test account, complete onboarding, confirm the dashboard loads
- [ ] Create a test invoice, download its PDF, record a payment
- [ ] Confirm the WhatsApp button and social links point to the real accounts
- [ ] Set the first platform admin manually (see `migrations/0006_make_admin.sql`):
      ```sql
      UPDATE users SET is_platform_admin = true WHERE email = 'you@example.com';
      ```
- [ ] Visit `/admin/dashboard.html` and confirm it loads for that account only

## 7. Backups (Phase 97)

**Strategy:** daily automated `pg_dump`, compressed, retained 30 days
by default, stored outside the database host itself.

```bash
./scripts/backup.sh
```

Schedule it daily via cron (adjust the path):
```
0 3 * * * cd /path/to/franky-tech && ./scripts/backup.sh >> backups/backup.log 2>&1
```

For real disaster-recovery safety, also sync the `backups/` folder to
off-server storage (S3, Backblaze B2, etc.) — a backup that lives on
the same disk as the database it's backing up doesn't protect against
that disk failing.

**Restore:**
```bash
./scripts/restore.sh backups/franky-tech_2026-01-01_120000.sql.gz
```
This is destructive — it overwrites the target database. Always
double-check `DATABASE_URL` before running it.

**Retention:** 30 days by default (`RETENTION_DAYS` env var to
`backup.sh`). Adjust based on your own compliance/business needs.

## 8. Monitoring (Phase 98)

- `GET /api/health` is a ready-made uptime-check endpoint — point a
  free service (UptimeRobot, Better Uptime, Healthchecks.io) at it on
  a 1-5 minute interval. It reports both server and database health
  in one call.
- Server-side errors are already logged to stdout via the centralized
  error handler (`server/middleware/errorHandler.js`) — most hosts
  capture stdout/stderr into their own log viewer automatically.
- For anything beyond basic uptime/log-viewing (structured error
  tracking, alerting on spikes), consider adding a dedicated service
  like Sentry — not included here to avoid adding a dependency with
  no account behind it yet.

## 9. Rolling out future phases

Every future migration file in `migrations/` is additive and
idempotent-safe (`npm run migrate` skips anything already applied).
Standard deploy flow for any future change:

```bash
git pull
npm install
npm run migrate
npm start   # or your host's restart mechanism
```

## 10. Rollback

If a deploy goes wrong:
1. Redeploy the previous known-good commit through your host's
   dashboard/CLI (most hosts keep prior deploys one click away).
2. If a migration caused the issue, restore from the most recent
   backup taken **before** that migration ran (see section 7) — this
   project does not yet include automatic down-migrations, so a
   backup restore is the safety net.
