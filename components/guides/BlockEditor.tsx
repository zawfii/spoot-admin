'use client';
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { GuideBlock, BlockType } from '@/lib/types';
import { Icon } from '@/components/Icon';
import BlockItem, { BLOCK_META } from './BlockItem';

const ADD_ORDER: BlockType[] = ['place', 'text', 'heading', 'image', 'quote', 'separator'];

type Props = {
  blocks: GuideBlock[];
  guideId: string;
  metro: string | null;
  guideContext: { title: string; theme: string | null; isSponsored: boolean; sponsorName: string | null };
  onChange: (blocks: GuideBlock[]) => void;
  onGenerateAI: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
};

export default function BlockEditor({ blocks, guideId, metro, guideContext, onChange, onGenerateAI, isGenerating, canGenerate }: Props) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const usedPlaceIds = blocks.filter(b => b.type === 'place' && b.content.place_id).map(b => b.content.place_id);

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    onChange(arrayMove(blocks, blocks.findIndex(b => b.id === active.id), blocks.findIndex(b => b.id === over.id)));
  }

  function addBlock(type: BlockType) {
    onChange([...blocks, { id: crypto.randomUUID(), guide_id: guideId, position: blocks.length, type, content: {} }]);
  }

  return (
    <div className="flex flex-col gap-3">
      {blocks.length === 0 ? (
        <p className="text-sm text-onSurfaceVariant py-6 text-center">
          Zacznij od miejsc — dodaj 2 lub więcej, a AI napisze szkic artykułu. Albo pisz od zera.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col gap-2">
              {blocks.map((block, i) => (
                <BlockItem
                  key={block.id}
                  block={block}
                  index={i}
                  total={blocks.length}
                  metro={metro}
                  usedPlaceIds={usedPlaceIds}
                  guideContext={guideContext}
                  onUpdate={(id, patch) => onChange(blocks.map(b => (b.id === id ? { ...b, ...patch } : b)))}
                  onRemove={id => onChange(blocks.filter(b => b.id !== id))}
                  onMove={(index, dir) => onChange(arrayMove(blocks, index, index + dir))}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex flex-col gap-2 pt-1">
        <p className="font-heading font-bold text-[10px] leading-[14px] tracking-[0.8px] uppercase text-onSurfaceVariant">Dodaj blok</p>
        <div className="flex flex-wrap gap-2">
          {ADD_ORDER.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => addBlock(type)}
              className="inline-flex items-center gap-1.5 min-h-10 px-3.5 rounded-full bg-surface text-sm font-heading font-semibold hover:bg-cardMutedDark/60"
            >
              <Icon name={BLOCK_META[type].icon} size={16} />{BLOCK_META[type].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1 pt-2 border-t border-outlineVariant">
        <button
          type="button"
          onClick={onGenerateAI}
          disabled={!canGenerate || isGenerating}
          className="inline-flex items-center justify-center gap-2 min-h-11 rounded-lg border border-dashed border-primary/30 text-sm font-heading font-semibold text-primary hover:bg-surface disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name="sparkles" size={18} />
          {isGenerating ? 'AI pisze artykuł…' : 'Napisz artykuł z AI (na bazie miejsc)'}
        </button>
        {!canGenerate && (
          <p className="text-xs text-onSurfaceVariant text-center">Potrzebny tytuł i co najmniej 2 miejsca.</p>
        )}
      </div>
    </div>
  );
}
