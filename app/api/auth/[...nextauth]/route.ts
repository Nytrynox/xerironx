import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import EmailProvider from 'next-auth/providers/email'

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: (process.env.GOOGLE_CLIENT_ID || '').trim(),
      clientSecret: (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          // Disable One Tap to avoid wallet extension conflicts
          disable_signup: 'false'
        }
      },
      // Additional config to prevent One Tap interference
      httpOptions: {
        timeout: 10000,
      }
    })
    // Apple and Email providers temporarily disabled until properly configured
    // ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET ? [
    //   AppleProvider({
    //     clientId: process.env.APPLE_CLIENT_ID,
    //     clientSecret: process.env.APPLE_CLIENT_SECRET,
    //   })
    // ] : []),
    // ...(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER ? [
    //   EmailProvider({
    //     server: {
    //       host: process.env.EMAIL_SERVER_HOST,
    //       port: Number(process.env.EMAIL_SERVER_PORT) || 587,
    //       auth: {
    //         user: process.env.EMAIL_SERVER_USER,
    //         pass: process.env.EMAIL_SERVER_PASSWORD || '',
    //       },
    //     },
    //     from: process.env.EMAIL_FROM || '',
    //   })
    // ] : [])
  ],
  session: { 
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  // Disable automatic One Tap to prevent wallet extension conflicts
  events: {
    async signIn({ user, account, profile }) {
      // Successful sign in - no return needed for events
    }
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
      // Normalize and always land in studio after auth unless explicitly directing elsewhere
      try {
        const target = new URL(url, baseUrl)
        // If callback is root or login, send to /studio
        if ([baseUrl+'/', baseUrl+'/login', baseUrl].includes(target.href)) {
          return baseUrl + '/studio'
        }
        // Constrain to same origin
        if (target.origin === baseUrl) return target.href
      } catch {}
      return baseUrl + '/studio'
    }
  },
  debug: true, // Enable debug for now
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
