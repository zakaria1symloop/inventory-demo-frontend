import { NextResponse, type NextRequest } from 'next/server';

// Detect locale per request so SSR renders the right language without JS.
// Paddle's compliance reviewers and other bots scan the raw HTML, so we
// can't rely on client-side locale switching alone.
//
// The detected locale is exposed two ways:
//   - As an `x-locale` request header for the current render (RootLayout
//     reads this via `headers()`)
//   - As a `locale` cookie for follow-up visits
function detectLocale(req: NextRequest): 'ar' | 'fr' | 'en' {
  // Explicit ?lang= query param wins
  const qLang = req.nextUrl.searchParams.get('lang');
  if (qLang === 'ar' || qLang === 'fr' || qLang === 'en') return qLang;

  // Stored cookie from prior visit
  const stored = req.cookies.get('locale')?.value;
  if (stored === 'ar' || stored === 'fr' || stored === 'en') return stored;

  // Default language is French (Algeria). Arabic browsers get Arabic;
  // everyone else (FR, EN, other) defaults to French.
  const accept = (req.headers.get('accept-language') || '').toLowerCase();
  if (accept.startsWith('ar')) return 'ar';
  return 'fr';
}

export function middleware(req: NextRequest) {
  const locale = detectLocale(req);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-locale', locale);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.cookies.set('locale', locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax',
  });
  return res;
}

export const config = {
  // Run on every route except Next.js internals and API.
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
