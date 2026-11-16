'use client';
import { useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { GuideBlock, BlockType } from '@/lib/types';
import PlaceSearch from '@/components/PlaceSearch';
import { Icon, IconName } from '@/components/Icon';
import { IconButton } from '@/components/ui/IconButton';
import AIPopover from './AIPopover';

export const BLOCK_META: Record<BlockType, { label: string; icon: IconName }> = {
  text: { label: 'Tekst', icon: 'text' },
  heading: { label: 'Nagłówek', icon: 'heading' },
  quote: { label: 'Cytat', icon: 'quote' },
  image: { label: 'Zdjęcie', icon: 'image' },
  place: { label: 'Miejsce', icon: 'pin' },
  separator: { label: 'Separator', icon: 'minus' },
};

type Props = {
  block: GuideBlock;
  index: number;
  total: number;
  metro: string | null;
  usedPlaceIds: string[];
  onUpdate: (id: string, patch: Partial<GuideBlock>) => void;
  onRemove: (id: string) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  guideContext: { title: string; theme: string | null; isSponsored: boolean; sponsorName: string | null };
};

const inputClass = 'w-full px-3 border border-outlineVariant rounded-md bg-surfaceLowest text-base lg:text-sm text-onSurface focus:outline-none focus:ring-2 focus:ring-secondary';

export default function BlockItem({ block, index, total, metro, usedPlaceIds, onUpdate, onRemove, onMove, guideContext }: Props) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const [showAI, setShowAI] = useState(false);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const meta = BLOCK_META[block.type];

  const update = (key: string, value: string) => onUpdate(block.id, { content: { ...block.content, [key]: value } });

  // **pogrubienie** / *kursywa* wokół zaznaczenia (bez zaznaczenia — znaczniki w miejscu kursora).
  function wrapSelection(mark: string) {
    const el = bodyRef.current;
    const body = block.content.body ?? '';
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    update('body', body.slice(0, start) + mark + body.slice(start, end) + mark + body.slice(end));
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(start + mark.length, end + mark.length); });
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-surface rounded-lg p-2 flex gap-1 ${isDragging ? 'relative z-10 shadow-lg' : ''}`}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        aria-label={`Przeciągnij blok: ${meta.label}`}
        className="w-8 h-10 shrink-0 flex items-center justify-center rounded-md text-onSurfaceVariant cursor-grab active:cursor-grabbing touch-none hover:bg-cardMuted"
      >
        <Icon name="grip" size={18} />
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-2 py-1">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 font-heading font-bold text-[10px] leading-[14px] tracking-[0.8px] uppercase text-onSurfaceVariant">
            <Icon name={meta.icon} size={14} />{meta.label}
          </span>
          <div className="flex -my-1">
            {(block.type === 'text' || block.type === 'heading') && (
              <IconButton icon="sparkles" label="Popraw z AI" onClick={() => setShowAI(v => !v)} className={showAI ? 'bg-cardMuted text-onSurface' : ''} />
            )}
            <IconButton icon="up" label="Przesuń w górę" disabled={index === 0} onClick={() => onMove(index, -1)} />
            <IconButton icon="down" label="Przesuń w dół" disabled={index === total - 1} onClick={() => onMove(index, 1)} />
            <IconButton icon="trash" label={`Usuń blok: ${meta.label}`} onClick={() => onRemove(block.id)} />
          </div>
        </div>

        {showAI && (block.type === 'text' || block.type === 'heading') && (
          <div className="relative">
            <AIPopover
              block={block}
              guideContext={guideContext}
              onAccept={newText => { update(block.type === 'text' ? 'body' : 'text', newText); setShowAI(false); }}
              onClose={() => setShowAI(false)}
            />
          </div>
        )}

        {block.type === 'heading' && (
          <input
            aria-label="Nagłówek"
            value={block.content.text ?? ''}
            onChange={e => update('text', e.target.value)}
            placeholder="Nagłówek sekcji"
            className={`${inputClass} h-11 font-heading font-bold !text-lg`}
          />
        )}

        {block.type === 'text' && (
          <>
            <textarea
              ref={bodyRef}
              aria-label="Treść akapitu"
              value={block.content.body ?? ''}
              onChange={e => update('body', e.target.value)}
              placeholder="Treść akapitu"
              rows={4}
              className={`${inputClass} py-2 resize-y min-h-24`}
            />
            <div className="flex gap-1">
              <button type="button" onClick={() => wrapSelection('**')} className="min-h-9 px-3 rounded-md border border-outlineVariant text-sm font-bold hover:bg-cardMuted" aria-label="Pogrubienie zaznaczenia">B</button>
              <button type="button" onClick={() => wrapSelection('*')} className="min-h-9 px-3 rounded-md border border-outlineVariant text-sm italic hover:bg-cardMuted" aria-label="Kursywa zaznaczenia">I</button>
            </div>
          </>
        )}

        {block.type === 'quote' && (
          <>
            <textarea
              aria-label="Treść cytatu"
              value={block.content.text ?? ''}
              onChange={e => update('text', e.target.value)}
              placeholder="Treść cytatu"
              rows={2}
              className={`${inputClass} py-2 italic resize-y`}
            />
            <input
              aria-label="Autor cytatu"
              value={block.content.author ?? ''}
              onChange={e => update('author', e.target.value)}
              placeholder="Autor (opcjonalnie)"
              className={`${inputClass} h-10`}
            />
          </>
        )}

        {block.type === 'image' && (
          <>
            <input
              aria-label="Adres zdjęcia"
              value={block.content.url ?? ''}
              onChange={e => update('url', e.target.value.trim())}
              placeholder="https://… (adres zdjęcia)"
              className={`${inputClass} h-10`}
            />
            {block.content.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={block.content.url} alt="" className="w-full max-h-56 object-cover rounded-md" />
            )}
            <input
              aria-label="Podpis zdjęcia"
              value={block.content.caption ?? ''}
              onChange={e => update('caption', e.target.value)}
              placeholder="Podpis (opcjonalnie)"
              className={`${inputClass} h-10`}
            />
          </>
        )}

        {block.type === 'separator' && <hr className="my-3 border-outlineVariant" />}

        {block.type === 'place' && (
          block.content.place_id ? (
            <div className="flex items-center gap-3 rounded-md bg-cardMuted px-3 py-2.5">
              <Icon name="pin" size={18} className="text-secondary" />
              <div className="flex-1 min-w-0">
                {block.place ? (
                  <>
                    <p className="font-heading font-semibold text-[15px] leading-5 truncate">{block.place.name}</p>
                    <p className="text-xs text-onSurfaceVariant truncate">{[block.place.category, block.place.address ?? block.place.city].filter(Boolean).join(' · ')}</p>
                  </>
                ) : (
                  <p className="text-sm">Miejsca nie ma już w bazie — wybierz inne.</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onUpdate(block.id, { content: {}, place: null })}
                className="min-h-9 px-3 rounded-md text-sm font-heading font-semibold text-primary hover:bg-cardMutedDark/60"
              >
                Zmień
              </button>
            </div>
          ) : (
            <PlaceSearch
              defaultMetro={metro}
              excludeIds={usedPlaceIds}
              autoFocus
              onSelect={place => onUpdate(block.id, {
                content: { place_id: place.id },
                place: { id: place.id, name: place.name, category: place.category, city: place.city, address: place.address },
              })}
            />
          )
        )}
      </div>
    </li>
  );
}
