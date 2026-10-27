import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const url = new URL('/v2/admin', `${proto}://${host}`);

  req.nextUrl.searchParams.forEach((val, key) => {
    url.searchParams.set(key, val);
  });

  return NextResponse.redirect(url, { status: 307 });
}
