# xerironx

## Getting Started

1. Install deps and run dev server

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Authentication (Google)

This app uses NextAuth with Google for sign-in.

- Create OAuth credentials in Google Cloud Console.
- Set redirect URL: http://localhost:3000/api/auth/callback/google
- Copy `.env.example` to `.env.local` and fill:
	- GOOGLE_CLIENT_ID
	- GOOGLE_CLIENT_SECRET
	- NEXTAUTH_SECRET

Routes:
- `/` landing page (CTA: register, login, studio)
- `/login` Google sign-in
- `/register` optional display name + Google sign-in
- `/profile` user profile
- `/studio` AI studio
