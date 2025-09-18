import { NextResponse } from 'next/server';
import { getSiteOrigin } from '@/lib/utils';

export const runtime = 'edge';

export async function GET() {
  const siteOrigin = getSiteOrigin();
  const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const openrouterConfigured = Boolean(process.env.OPENROUTER_API_KEY);
  const nextAuthUrl = process.env.NEXTAUTH_URL || null;

  return NextResponse.json({
    status: 'ok',
    siteOrigin,
    googleConfigured,
    openrouterConfigured,
    nextAuthUrl,
    timestamp: new Date().toISOString()
  });
}
