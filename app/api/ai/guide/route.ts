import { NextRequest, NextResponse } from 'next/server';
import { generateGuideBlocks, type GenerateGuideInput } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const body: GenerateGuideInput & { placeMap: Record<string, string> } = await req.json();
  const { placeMap, ...input } = body;

  if (!input.title || input.places.length === 0) {
    return NextResponse.json({ error: 'title i places są wymagane' }, { status: 400 });
  }

  const blocks = await generateGuideBlocks(input);

  // Replace PLACEHOLDER_<name> with real place_id from placeMap
  const resolved = blocks.map(block => {
    if (block.type === 'place' && block.content?.place_id?.startsWith('PLACEHOLDER_')) {
      const placeName = block.content.place_id.replace('PLACEHOLDER_', '');
      const realId = placeMap[placeName];
      if (realId) return { ...block, content: { place_id: realId } };
    }
    return block;
  });

  return NextResponse.json({ blocks: resolved });
}
