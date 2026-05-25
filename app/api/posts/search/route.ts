import { NextResponse } from 'next/server';
import { listPostsPaginated } from '@/lib/tags';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const offset = Number(url.searchParams.get('offset') ?? '0');
  const limit = Number(url.searchParams.get('limit') ?? '10');
  const search = url.searchParams.get('q') ?? undefined;
  const tagsParam = url.searchParams.getAll('tag'); // repeated tag ids
  const tagIds = tagsParam.map(Number).filter(Boolean);

  const result = await listPostsPaginated({ offset, limit, search, tags: tagIds });
  return NextResponse.json(result);
}
