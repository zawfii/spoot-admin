import Anthropic from '@anthropic-ai/sdk';

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type GenerateGuideInput = {
  title: string;
  theme: string | null;
  city: string | null;
  isSponsored: boolean;
  sponsorName: string | null;
  places: Array<{ name: string; category: string; district: string | null }>;
};

export type BlockInstruction = 'popraw' | 'rozwin' | 'skróć' | 'formalny' | 'luźny' | 'magazynowy';

export type ImproveBlockInput = {
  blockType: 'text' | 'heading';
  currentContent: string;
  instruction: BlockInstruction;
  guideContext: {
    title: string;
    theme: string | null;
    isSponsored: boolean;
    sponsorName: string | null;
  };
};

function buildGuideSystemPrompt(input: GenerateGuideInput): string {
  const sponsorNote = input.isSponsored && input.sponsorName
    ? `Ten przewodnik jest materiałem sponsorowanym przez markę "${input.sponsorName}". Zachowaj profesjonalny, ale ciepły ton pasujący do brand voice.`
    : 'Ten przewodnik jest redakcyjny — pisz autentycznie, jak ekspert od jedzenia i miejscówek.';

  const placesList = input.places
    .map(p => `- ${p.name} (${p.category}${p.district ? `, ${p.district}` : ''})`)
    .join('\n');

  return `Jesteś redaktorem kulinarnego magazynu miejskiego Spoot (podobnego do Vogue Living, ale o jedzeniu w polskich miastach).
Piszesz przewodniki po restauracjach i kawiarniach. Używasz żywego, angażującego języka po polsku.
${sponsorNote}

Tytuł przewodnika: "${input.title}"
Tematyka: ${input.theme ?? 'ogólna'}
Miasto: ${input.city ?? 'nieokreślone'}

Miejsca w przewodniku:
${placesList}`;
}

export async function generateGuideBlocks(input: GenerateGuideInput): Promise<Array<{ type: string; content: Record<string, string> }>> {
  const systemPrompt = buildGuideSystemPrompt(input);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: [
      {
        type: 'text',
        text: systemPrompt,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Wygeneruj artykuł jako tablicę bloków JSON. Każdy blok to obiekt z polami "type" i "content".

Typy bloków:
- {"type": "heading", "content": {"text": "..."}}
- {"type": "text", "content": {"body": "..."}}  (można używać **bold** i *italic*)
- {"type": "quote", "content": {"text": "...", "author": "..."}}
- {"type": "place", "content": {"place_id": "PLACEHOLDER_PLACE_NAME"}}
- {"type": "separator", "content": {}}

WAŻNE: Dla bloków "place", w polu place_id wstaw DOKŁADNĄ nazwę miejsca (np. "PLACEHOLDER_Kawiarnia Między Słowami") — podmienię je na prawdziwe ID.

Wygeneruj naturalny artykuł z co najmniej:
- 1 nagłówkiem otwierającym
- 2-3 akapitami tekstu
- Blokami miejsc przeplecionymi z tekstem
- 1 cytatem (wymyślonym, pasującym do tematu)
- Separatorem między sekcjami

Odpowiedz TYLKO tablicą JSON, bez żadnego dodatkowego tekstu.`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

export async function improveBlock(input: ImproveBlockInput): Promise<string> {
  const instructionMap: Record<BlockInstruction, string> = {
    popraw: 'Popraw gramatykę i styl, zachowaj sens i długość.',
    rozwin: 'Rozwiń tekst — dodaj szczegóły, uczyń bardziej opisowym. Maksymalnie 2x dłuższy.',
    'skróć': 'Skróć tekst o połowę zachowując główną myśl.',
    formalny: 'Przepisz w bardziej formalnym, profesjonalnym tonie.',
    luźny: 'Przepisz w luźnym, konwersacyjnym tonie.',
    magazynowy: 'Przepisz w stylu artykułu z magazynu lifestyle — angażujący, zmysłowy, konkretny.',
  };

  const guideNote = input.guideContext.isSponsored && input.guideContext.sponsorName
    ? `Kontekst: materiał sponsorowany przez "${input.guideContext.sponsorName}".`
    : `Kontekst: redakcyjny przewodnik Spoot.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: `Jesteś redaktorem przewodnika "${input.guideContext.title}" (${input.guideContext.theme ?? 'ogólny'}). ${guideNote} Odpowiadasz tylko zmodyfikowanym tekstem, bez wyjaśnień.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Instrukcja: ${instructionMap[input.instruction]}\n\nTekst do modyfikacji:\n${input.currentContent}`,
      },
    ],
  });

  return response.content[0].type === 'text' ? response.content[0].text.trim() : input.currentContent;
}
