import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { NextRequest, NextResponse } from 'next/server'

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    })
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.picture = (profile as any).picture || token.picture
        token.name = profile.name || token.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.image = (token as any).picture || session.user.image || undefined
        session.user.name = (token as any).name || session.user.name || undefined
      }
      return session
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
