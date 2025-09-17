import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import EmailProvider from 'next-auth/providers/email'

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID || '',
      clientSecret: process.env.APPLE_CLIENT_SECRET || '',
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || '',
        port: Number(process.env.EMAIL_SERVER_PORT) || 587,
        auth: {
          user: process.env.EMAIL_SERVER_USER || '',
          pass: process.env.EMAIL_SERVER_PASSWORD || '',
        },
      },
      from: process.env.EMAIL_FROM || '',
    })
  ],
  session: { 
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
      if (account && profile) {
        token.accessToken = account.access_token
        token.picture = (profile as any).picture || token.picture
        token.name = profile.name || token.name
        token.email = profile.email || token.email
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.image = (token as any).picture || session.user.image || undefined
        session.user.name = (token as any).name || session.user.name || undefined
        session.user.email = (token as any).email || session.user.email || undefined
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Allow all sign-ins (Google, Apple, Email)
      return true
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  debug: true, // Enable debug for now
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
