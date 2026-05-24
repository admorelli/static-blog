// +----------------------------------------------------+
// | Create a new post                                  |
// +----------------------------------------------------+
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  if (!body.title || !body.content) return new Response(JSON.stringify({ error: 'title and content are required' }), { status: 400 });

  // TODO: POST /api/posts with body { title, content, date } and tags parsed from tagsStr;
  //       save to SQLite via PostsDAO.create(); return { id, slug } in JSON response.
  return new Response(JSON.stringify({ error: 'POST not yet wired to real DAO — add the fetch call' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
