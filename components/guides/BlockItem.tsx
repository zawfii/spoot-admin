'use client';
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GuideBlock, BlockType } from '@/lib/types';
import AIPopover from './AIPopover';

const TYPE_ICON: Record<BlockType, string> = {
  text: 'T',
  heading: 'H',
  quote: '"',
  image: '🖼',
  place: '📍',
  separator: '—',
};

type Props = {
  block: GuideBlock;
  onChange: (id: string, content: Record<string, string>) => void;
  onRemove: (id: string) => void;
  guideContext: { title: string; theme: string | null; isSponsored: boolean; sponsorName: string | null };
};

export default function BlockItem({ block, onChange, onRemove, guideContext }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const [showAI, setShowAI] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const update = (key: string, value: string) =>
    onChange(block.id, { ...block.content, [key]: value });

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2 group">
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-2 cursor-grab text-gray-300 hover:text-gray-500 select-none px-1"
        title="Przeciągnij"
      >
        ⠿
      </button>

      {/* Type icon */}
      <span className="mt-2 text-xs text-gray-400 w-5 text-center flex-shrink-0">
        {TYPE_ICON[block.type]}
      </span>

      {/* Inline editor */}
      <div className="flex-1">
        {block.type === 'heading' && (
          <input
            value={block.content.text ?? ''}
            onChange={e => update('text', e.target.value)}
            placeholder="Nagłówek sekcji..."
            className="w-full text-lg font-bold border-b border-transparent hover:border-gray-200 focus:border-gray-400 outline-none py-1 bg-transparent"
          />
        )}

        {block.type === 'text' && (
          <div className="relative">
            <textarea
              value={block.content.body ?? ''}
              onChange={e => update('body', e.target.value)}
              placeholder="Treść akapitu... (**bold**, *italic*)"
              rows={3}
              className="w-full text-sm border border-transparent hover:border-gray-200 focus:border-gray-400 outline-none py-1 px-2 rounded-lg bg-transparent resize-none"
            />
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => update('body', (block.content.body ?? '') + '**tekst**')}
                className="text-xs px-2 py-0.5 border rounded hover:bg-gray-50 font-bold"
              >B</button>
              <button
                onClick={() => update('body', (block.content.body ?? '') + '*tekst*')}
                className="text-xs px-2 py-0.5 border rounded hover:bg-gray-50 italic"
              >I</button>
            </div>
          </div>
        )}

        {block.type === 'quote' && (
          <div className="border-l-4 border-gray-300 pl-3 space-y-1">
            <textarea
              value={block.content.text ?? ''}
              onChange={e => update('text', e.target.value)}
              placeholder="Treść cytatu..."
              rows={2}
              className="w-full text-sm italic border-transparent outline-none bg-transparent resize-none"
            />
            <input
              value={block.content.author ?? ''}
              onChange={e => update('author', e.target.value)}
              placeholder="— autor (opcjonalnie)"
              className="w-full text-xs text-gray-400 border-transparent outline-none bg-transparent"
            />
          </div>
        )}

        {block.type === 'image' && (
          <div className="space-y-1">
            <input
              value={block.content.url ?? ''}
              onChange={e => update('url', e.target.value)}
              placeholder="URL zdjęcia..."
              className="w-full text-sm border rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-black"
            />
            {block.content.url && (
              <img src={block.content.url} alt="preview" className="w-full h-32 object-cover rounded-lg" />
            )}
            <input
              value={block.content.caption ?? ''}
              onChange={e => update('caption', e.target.value)}
              placeholder="Podpis (opcjonalnie)"
              className="w-full text-xs text-gray-400 border-transparent outline-none bg-transparent"
            />
          </div>
        )}

        {block.type === 'separator' && (
          <div className="py-3">
            <hr className="border-gray-200" />
          </div>
        )}

        {block.type === 'place' && (
          <div className="flex items-center gap-2 py-1">
            <span className="text-sm">
              {block.place
                ? `${block.place.name} · ${block.place.category}`
                : block.content.place_id
                  ? <span className="text-amber-600">Nieznane miejsce: {block.content.place_id}</span>
                  : <span className="text-gray-400">Brak miejsca</span>
              }
            </span>
          </div>
        )}
      </div>

      {/* AI button (only for text + heading) */}
      {(block.type === 'text' || block.type === 'heading') && (
        <div className="relative mt-2">
          <button
            onClick={() => setShowAI(v => !v)}
            className="text-sm opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-0.5 rounded hover:bg-gray-100"
            title="AI — popraw tekst"
          >
            ✨
          </button>
          {showAI && (
            <AIPopover
              block={block}
              guideContext={guideContext}
              onAccept={newText => {
                update(block.type === 'text' ? 'body' : 'text', newText);
                setShowAI(false);
              }}
              onClose={() => setShowAI(false)}
            />
          )}
        </div>
      )}

      {/* Remove button */}
      <button
        onClick={() => onRemove(block.id)}
        className="mt-2 text-sm text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Usuń blok"
      >
        ×
      </button>
    </div>
  );
}
