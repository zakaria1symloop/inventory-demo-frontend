import { SITE_URL } from '@/lib/site';

// RFC 9727 API Catalog, served at /.well-known/api-catalog as
// application/linkset+json (RFC 9264). Lets AI agents discover where to find
// documentation about the service. We anchor the public site and point
// service-doc at /llms.txt (an agent/LLM-friendly guide). When a public
// OpenAPI spec is published, add a `service-desc` link to it here.
export const dynamic = 'force-static';

export function GET() {
  const linkset = {
    linkset: [
      {
        anchor: SITE_URL,
        'service-doc': [
          {
            href: `${SITE_URL}/llms.txt`,
            type: 'text/markdown',
            title: 'TrackSera — guide pour agents et LLM',
          },
        ],
        'service-meta': [
          {
            href: `${SITE_URL}/.well-known/api-catalog`,
            type: 'application/linkset+json',
          },
        ],
        describedby: [
          {
            href: `${SITE_URL}/logiciel-de-distribution`,
            type: 'text/html',
            title: 'Logiciel de gestion de la distribution',
          },
        ],
      },
    ],
  };

  return new Response(JSON.stringify(linkset, null, 2), {
    headers: {
      'Content-Type': 'application/linkset+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
