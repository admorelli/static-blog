// +----------------------------------------------------+
// | Fetch all posts that have a specific tag              |
// +----------------------------------------------------+
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ tagName: string }> }) {
  const { tagName } = await params;
  if (!tagName) return new Response(JSON.stringify({ error: 'tag name is required' }), { status: 400 });

  // TODO: GET /api/tags/xxx returns an array of Post objects that have that tag
  return new Response(JSON.stringify([]), {
    headers: { 'Content-Type': 'application/json' },
  });
}
