import fs from 'fs';
import path from 'path';

export type ReferenceImage = { base64: string; mimeType: string };
export type IconGenInput = {
  categoryName: string;
  categoryId: string;
  referenceImages: ReferenceImage[];
};
export type IconGenResult = { flatPng: Buffer; topPng: Buffer };

const REFERENCE_ICON_FILES = ['burger.png', 'pizza.png', 'sushi.png'];

export function loadReferenceIcons(): ReferenceImage[] {
  const dir = path.join(process.cwd(), 'lib', 'reference-icons');
  return REFERENCE_ICON_FILES.map(file => ({
    base64: fs.readFileSync(path.join(dir, file)).toString('base64'),
    mimeType: 'image/png',
  }));
}

function buildPrompt(categoryName: string, variant: 'flat' | 'top'): string {
  const shape = variant === 'flat'
    ? 'Kwadratowa, płaska ikona (flat design), wypełniająca cały kadr, jak w załączonych przykładach.'
    : 'Ta sama płaska stylistyka, ale kompozycja wycentrowana pod okrągłe kadrowanie (obiekt w centrum, marginesy po bokach), bo ikona zostanie docięta do koła.';

  return `Wygeneruj nową ikonę kategorii dania "${categoryName}" w DOKŁADNIE tym samym stylu graficznym co załączone przykładowe ikony (burger, pizza, sushi): płaski, kolorowy, uproszczony ilustracyjny styl, spójna paleta barw, brak tekstu, brak cieni fotorealistycznych, format kwadratowy 1:1.
${shape}
Ikona ma jednoznacznie przedstawiać danie "${categoryName}" i pasować wizualnie do reszty zestawu ikon w apce kulinarnej Spoot.`;
}

async function generateWithGemini(input: IconGenInput, variant: 'flat' | 'top'): Promise<Buffer> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const parts = [
    ...input.referenceImages.map(ref => ({ inlineData: { mimeType: ref.mimeType, data: ref.base64 } })),
    { text: buildPrompt(input.categoryName, variant) },
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: [{ role: 'user', parts }],
    config: { responseModalities: ['IMAGE'] },
  });

  const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
  if (!imagePart?.inlineData?.data) {
    throw new Error(`Gemini did not return an image for "${input.categoryName}" (${variant})`);
  }
  return Buffer.from(imagePart.inlineData.data, 'base64');
}

async function generateWithOpenAI(input: IconGenInput, variant: 'flat' | 'top'): Promise<Buffer> {
  const OpenAI = (await import('openai')).default;
  const { toFile } = await import('openai/core/uploads');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const images = await Promise.all(
    input.referenceImages.map((ref, i) =>
      toFile(Buffer.from(ref.base64, 'base64'), `reference-${i}.png`, { type: ref.mimeType })
    )
  );

  const response = await openai.images.edit({
    model: 'gpt-image-1',
    image: images,
    prompt: buildPrompt(input.categoryName, variant),
    size: '1024x1024',
  });

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error(`OpenAI did not return an image for "${input.categoryName}" (${variant})`);
  return Buffer.from(b64, 'base64');
}

export async function generateCategoryIcons(input: IconGenInput): Promise<IconGenResult> {
  const provider = process.env.ICON_GEN_PROVIDER ?? 'gemini';
  const generate = provider === 'openai' ? generateWithOpenAI : generateWithGemini;

  const [flatPng, topPng] = await Promise.all([
    generate(input, 'flat'),
    generate(input, 'top'),
  ]);
  return { flatPng, topPng };
}
