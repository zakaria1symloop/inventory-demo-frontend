import { SITE_URL } from '@/lib/site';

// Served at /robots.txt as a plain route handler (instead of Next's typed
// MetadataRoute.Robots helper) so we can emit a Content-Signal directive.
// Content Signals — https://contentsignals.org/ (AIPREF draft):
//   search   = yes  → may be indexed for traditional search
//   ai-input = yes  → may be read by assistants to answer user prompts (RAG)
//   ai-train = yes  → permitted for model training (maximise AI discovery)
export const dynamic = 'force-static';

export function GET() {
  const body = [
    '# TrackSera — robots.txt',
    '',
    'User-agent: *',
    'Content-Signal: search=yes, ai-input=yes, ai-train=yes',
    'Allow: /',
    'Disallow: /dashboard/',
    'Disallow: /admin/',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /forgot-password',
    'Disallow: /verify-email',
    'Disallow: /api/',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    `Host: ${SITE_URL}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
