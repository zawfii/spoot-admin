import { NextRequest, NextResponse } from 'next/server';
import { improveBlock, type ImproveBlockInput } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const body: ImproveBlockInput = await req.json();

  if (!body.currentContent || !body.instruction) {
    return NextResponse.json({ error: 'currentContent i instruction są wymagane' }, { status: 400 });
  }

  const improved = await improveBlock(body);
  return NextResponse.json({ text: improved });
}
