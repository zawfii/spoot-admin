import { NextRequest, NextResponse } from 'next/server';
import { getGuideStats } from '@/lib/queries';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const stats = await getGuideStats(params.id);
  return NextResponse.json(stats);
}
