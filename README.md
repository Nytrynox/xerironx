# xerironx

## Getting Started

1. Install deps and run dev server

```bash
npm install
npm run dev
```

Local: http://localhost:3000
Prod:  https://xerironx.vercel.app

## Authentication (Google)

This app uses NextAuth with Google for sign-in.

1. Create OAuth credentials (Web application) in Google Cloud Console.
2. Authorized JavaScript origins:
	- http://localhost:3000
	- https://xerironx.vercel.app
3. Authorized redirect URIs:
	- http://localhost:3000/api/auth/callback/google
	- https://xerironx.vercel.app/api/auth/callback/google
4. Copy `.env.example` to `.env.local` and fill at least:
	- GOOGLE_CLIENT_ID
	- GOOGLE_CLIENT_SECRET
	- NEXTAUTH_SECRET (use `openssl rand -base64 32`)
	- NEXT_PUBLIC_SITE_URL (prod origin)
5. On Vercel set the same env vars (never commit real secrets).

If you change the production domain, update BOTH Google Console redirect URIs and the Vercel `NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL` values.

## OpenRouter Integration

Set `OPENROUTER_API_KEY` (server only) and optionally `OPENROUTER_BASE_URL` if using a proxy. Without a key the app streams deterministic mock responses so the UI still works.

HTTP Referer + X-Title headers are automatically set from `getSiteOrigin()` (env precedence: `NEXT_PUBLIC_SITE_URL`, `NEXTAUTH_URL`, fallback production domain).

## Health Endpoint

`/api/health` (edge) returns JSON:
```
{
  status: 'ok',
  siteOrigin: 'https://xerironx.vercel.app',
  googleConfigured: true|false,
  openrouterConfigured: true|false,
  nextAuthUrl: '...'
}
```
No secrets are exposed—only presence flags.

Routes:
- `/` landing page (CTA: register, login, studio)
- `/login` Google sign-in
- `/register` optional display name + Google sign-in
- `/profile` user profile
- `/studio` AI studio
 - `/api/health` config diagnostics
