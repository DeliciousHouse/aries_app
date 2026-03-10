# Aries AI

Aries AI is a social media SaaS workflow for small business owners:

Prompt -> AI generate -> review queue -> approve/reject -> schedule -> publish.

For platform onboarding, use the in-app wizard at `/platforms/connect` (Meta OAuth) so end users do not need to edit env variables.

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy env template:
   ```bash
   cp .env.example .env
   ```
3. Ensure PostgreSQL is running and `DATABASE_URL` is set.
4. Sync schema:
   ```bash
   npm run db:push
   ```
5. Start app:
   ```bash
   npm run dev
   ```

## Auth defaults

If no auth env vars are set, default credentials are:

- Email: `owner@example.com`
- Password: `change-me`

Set real values in `.env` for production:

- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `AUTH_TRUST_HOST=true`

## Docker compose runbook

Use the containerized version in `/root/docker-nvr/aries_ai`.

### Build and start

```bash
docker compose up -d --build
```

### Run migrations/schema sync

```bash
docker compose up -d migrate
docker compose logs migrate --tail=100
```

### Health checks

```bash
docker compose ps -a
curl -I http://127.0.0.1:3060/login
curl -I http://127.0.0.1:3060/api/posts
```

Expected:

- `/login` -> `200`
- `/api/posts` -> `401` when unauthenticated

### Alternate ports (when 3060/5433 are already used)

```bash
APP_PORT=13060 POSTGRES_PORT=55433 docker compose up -d --build
```

### Stop and cleanup

```bash
docker compose down
```

Or remove volume data too:

```bash
docker compose down -v
```

## Secrets checklist

- Never commit populated `.env` files.
- Rotate `NEXTAUTH_SECRET`, `ADMIN_PASSWORD`, and `META_ACCESS_TOKEN` regularly.
- Keep production secrets in your secret manager (not in compose files).
- Restrict Meta tokens to least required scopes.

## Production notes

- App uses `next build` standalone output for container runtime.
- Prisma schema sync is handled by the `migrate` service.
- Platform publishing currently supports Facebook and Instagram with structured per-platform results in `Post.platformResults`.
