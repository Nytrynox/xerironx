# xerironx

## Getting Started

1. Install deps and run dev server

```bash
npm install
npm run dev
```

Open https://xerironx.vercel.app

## Authentication (Google)

This app uses NextAuth with Google for sign-in.

- Create OAuth credentials in Google Cloud Console.
- Set redirect URL: https://xerironx.vercel.app/api/auth/callback/google
- Add environment variables:
	- GOOGLE_CLIENT_ID
	- GOOGLE_CLIENT_SECRET
	- NEXTAUTH_SECRET
	- NEXTAUTH_URL=https://xerironx.vercel.app
	- OPENROUTER_API_KEY (for AI features)

Routes:
- `/` landing page (CTA: register, login, studio)
- `/login` Google sign-in
- `/register` optional display name + Google sign-in
- `/profile` user profile
- `/studio` AI studio
