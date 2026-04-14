'use client';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import type { GuideBlock, BlockType } from '@/lib/types';
import BlockItem from './BlockItem';

const ADD_BUTTONS: Array<{ type: BlockType; label: string }> = [
  { type: 'text', label: 'T Tekst' },
  { type: 'heading', label: 'H Nagłówek' },
  { type: 'quote', label: '" Cytat' },
  { type: 'image', label: '🖼 Zdjęcie' },
  { type: 'place', label: '📍 Miejsce' },
  { type: 'separator', label: '— Separator' },
];

type Props = {
  blocks: GuideBlock[];
  guideId: string;
  guideContext: { title: string; theme: string | null; isSponsored: boolean; sponsorName: string | null };
  onChange: (blocks: GuideBlock[]) => void;
  onGenerateAI: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
};

export default function BlockEditor({ blocks, guideId, guideContext, onChange, onGenerateAI, isGenerating, canGenerate }: Props) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex(b => b.id === active.id);
    const newIndex = blocks.findIndex(b => b.id === over.id);
    onChange(arrayMove(blocks, oldIndex, newIndex));
  }

  function addBlock(type: BlockType) {
    const newBlock: GuideBlock = {
      id: crypto.randomUUID(),
      guide_id: guideId,
      position: blocks.length,
      type,
      content: {},
    };
    onChange([...blocks, newBlock]);
  }

  function updateBlock(id: string, content: Record<string, string>) {
    onChange(blocks.map(b => b.id === id ? { ...b, content } : b));
  }

  function removeBlock(id: string) {
    onChange(blocks.filter(b => b.id !== id));
  }

  return (
    <div className="space-y-2">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1">
            {blocks.map(block => (
              <BlockItem
                key={block.id}
                block={block}
                onChange={updateBlock}
                onRemove={removeBlock}
                guideContext={guideContext}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {blocks.length === 0 && (
        <p className="text-sm text-gray-400 py-4 text-center">
          Dodaj bloki poniżej lub wygeneruj artykuł z AI.
        </p>
      )}

      <div className="border-t pt-3 mt-4">
        <p className="text-xs text-gray-400 mb-2">+ Dodaj blok</p>
        <div className="flex flex-wrap gap-2">
          {ADD_BUTTONS.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => addBlock(type)}
              className="text-xs px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t pt-3 mt-2">
        <button
          onClick={onGenerateAI}
          disabled={!canGenerate || isGenerating}
          className="w-full py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-black hover:text-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generowanie artykułu...' : '✨ Wygeneruj artykuł z AI'}
        </button>
        {!canGenerate && (
          <p className="text-xs text-gray-400 mt-1 text-center">
            Dodaj tytuł i co najmniej 2 bloki miejsc, żeby wygenerować artykuł.
          </p>
        )}
      </div>
    </div>
  );
}
