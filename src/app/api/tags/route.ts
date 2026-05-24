import { NextResponse } from 'next/server';
import { listAllTags } from '@/lib/tags';

export async function GET() {
  const tags = await listAllTags();
  return NextResponse.json(tags);
}
