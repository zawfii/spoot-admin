'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DndContext, closestCenter, DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createClient } from '@/lib/supabase/client';
import PlaceSearch, { type PlaceResult } from '@/components/PlaceSearch';
import { AppCardPreview } from '@/components/AppCardPreview';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Icon } from '@/components/Icon';
import { METROS } from '@/lib/metros';
import { plural } from '@/lib/plural';
import type { SpootList, SpootListPlace } from '@/lib/types';

const PLACE_COLS = 'id, list_id, place_id, position, note, place:places(id, name, city, category, address)';
const EMOJI = ['🍜', '🍕', '🍣', '🍔', '🥟', '☕', '🍷', '🥐', '🌮', '🥗', '🍰', '🔥'];
const NOTE_MAX = 120;

type Settings = Pick<SpootList, 'title' | 'emoji' | 'city' | 'cover_url'>;
const settingsOf = (l: SpootList): Settings => ({ title: l.title, emoji: l.emoji, city: l.city, cover_url: l.cover_url });

const fieldClass = 'w-full h-11 px-3.5 border border-outlineVariant rounded-md bg-surfaceLowest text-base lg:text-sm text-onSurface focus:outline-none focus:ring-2 focus:ring-secondary';
const labelClass = 'font-heading font-bold text-[10px] leading-[14px] tracking-[0.8px] uppercase text-onSurfaceVariant';

function PlaceRow({ item, index, total, onMove, onRemove, onNote }: {
  item: SpootListPlace;
  index: number;
  total: number;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (placeId: string) => void;
  onNote: (placeId: string, note: string) => Promise<boolean>;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.place_id });
  const [note, setNote] = useState(item.note ?? '');
  const [noteSaved, setNoteSaved] = useState(false);
  const name = item.place?.name ?? 'Nieznane miejsce';

  async function commitNote() {
    if ((item.note ?? '') === note.trim()) return;
    if (await onNote(item.place_id, note.trim())) {
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 1500);
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`bg-surface rounded-lg p-2 pr-1 flex gap-1 ${isDragging ? 'relative z-10 shadow-lg' : ''}`}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        aria-label={`Przeciągnij: ${name}`}
        className="w-8 h-10 shrink-0 flex items-center justify-center rounded-md text-onSurfaceVariant cursor-grab active:cursor-grabbing touch-none hover:bg-cardMuted"
      >
        <Icon name="grip" size={18} />
      </button>
      <div className="flex-1 min-w-0 flex flex-col gap-2 py-1">
        <div className="flex items-start gap-2">
          <span className="font-heading font-bold text-sm text-onSurfaceVariant w-6 shrink-0 pt-0.5">{index + 1}.</span>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-[15px] leading-5 truncate">{name}</p>
            <p className="text-xs text-onSurfaceVariant truncate">
              {[item.place?.category, item.place?.address ?? item.place?.city].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex -mt-1">
            <IconButton icon="up" label="Przesuń w górę" disabled={index === 0} onClick={() => onMove(index, -1)} />
            <IconButton icon="down" label="Przesuń w dół" disabled={index === total - 1} onClick={() => onMove(index, 1)} />
            <IconButton icon="trash" label={`Usuń z listy: ${name}`} onClick={() => onRemove(item.place_id)} />
          </div>
        </div>
        <label className="flex flex-col gap-1 pr-2">
          <span className="sr-only">Notka do: {name}</span>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={commitNote}
            maxLength={NOTE_MAX}
            rows={2}
            placeholder="Notka redakcji (opcjonalnie) — dlaczego to miejsce?"
            className="w-full px-3 py-2 border border-outlineVariant rounded-md bg-surfaceLowest text-base lg:text-sm resize-none focus:outline-none focus:ring-2 focus:ring-secondary"
          />
          <span className="text-[11px] text-onSurfaceVariant text-right">{noteSaved ? 'Zapisano · ' : ''}{note.length}/{NOTE_MAX}</span>
        </label>
      </div>
    </li>
  );
}

export default function SpootListEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [list, setList] = useState<SpootList | null>(null);
  const [saved, setSaved] = useState<Settings | null>(null);
  const [places, setPlaces] = useState<SpootListPlace[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const flash = (tone: 'ok' | 'error', text: string) => {
    setMessage({ tone, text });
    if (tone === 'ok') setTimeout(() => setMessage(null), 2500);
  };

  const load = useCallback(async () => {
    const [listRes, placesRes] = await Promise.all([
      supabase.from('spoot_lists').select('*').eq('id', id).single(),
      supabase.from('spoot_list_places').select(PLACE_COLS).eq('list_id', id).order('position'),
    ]);
    if (listRes.data) { setList(listRes.data); setSaved(settingsOf(listRes.data)); }
    setPlaces((placesRes.data ?? []) as unknown as SpootListPlace[]);
  }, [id, supabase]);

  useEffect(() => { load(); }, [load]);

  const dirty = !!list && !!saved && JSON.stringify(settingsOf(list)) !== JSON.stringify(saved);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!list) return <p className="text-onSurfaceVariant">Ładowanie…</p>;

  const set = (patch: Partial<Settings>) => setList(l => (l ? { ...l, ...patch } : l));

  async function save(extra: Partial<SpootList> = {}) {
    if (!list) return;
    if (!list.title.trim()) { flash('error', 'Lista musi mieć tytuł.'); return; }
    setBusy(true);
    const next = { ...settingsOf(list), title: list.title.trim(), ...extra };
    const { error } = await supabase.from('spoot_lists').update(next).eq('id', list.id);
    setBusy(false);
    if (error) { flash('error', `Nie zapisano: ${error.message}`); return; }
    const merged = { ...list, ...next };
    setList(merged);
    setSaved(settingsOf(merged));
    flash('ok', extra.is_published === true ? 'Lista jest na Starcie w aplikacji.' : extra.is_published === false ? 'Zdjęto ze Startu.' : 'Zapisano.');
  }

  async function addPlace(place: PlaceResult) {
    const position = places.length ? Math.max(...places.map(p => p.position)) + 1 : 0;
    const { data, error } = await supabase
      .from('spoot_list_places')
      .insert({ list_id: id, place_id: place.id, position })
      .select(PLACE_COLS)
      .single();
    if (error) { flash('error', error.code === '23505' ? 'To miejsce już jest na liście.' : `Nie dodano: ${error.message}`); return; }
    setPlaces(prev => [...prev, data as unknown as SpootListPlace]);
  }

  async function removePlace(placeId: string) {
    const { error } = await supabase.from('spoot_list_places').delete().eq('list_id', id).eq('place_id', placeId);
    if (error) { flash('error', `Nie usunięto: ${error.message}`); return; }
    setPlaces(prev => prev.filter(p => p.place_id !== placeId));
  }

  async function persistOrder(reordered: SpootListPlace[]) {
    const withPos = reordered.map((p, i) => ({ ...p, position: i }));
    setPlaces(withPos);
    const results = await Promise.all(withPos.map(p =>
      supabase.from('spoot_list_places').update({ position: p.position }).eq('list_id', id).eq('place_id', p.place_id)
    ));
    if (results.some(r => r.error)) flash('error', 'Nie zapisano kolejności — odśwież stronę i spróbuj jeszcze raz.');
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = places.findIndex(p => p.place_id === active.id);
    const to = places.findIndex(p => p.place_id === over.id);
    persistOrder(arrayMove(places, from, to));
  }

  async function saveNote(placeId: string, note: string) {
    const { error } = await supabase.from('spoot_list_places').update({ note: note || null }).eq('list_id', id).eq('place_id', placeId);
    if (error) { flash('error', `Nie zapisano notki: ${error.message}`); return false; }
    setPlaces(prev => prev.map(p => (p.place_id === placeId ? { ...p, note: note || null } : p)));
    return true;
  }

  async function deleteList() {
    if (!list || !confirm(`Usunąć listę „${list.title}”? Miejsca zostają w bazie — znika tylko lista.`)) return;
    const { error } = await supabase.from('spoot_lists').delete().eq('id', list.id);
    if (error) { flash('error', `Nie usunięto: ${error.message}`); return; }
    router.push('/dashboard/spoot-lists');
    router.refresh();
  }

  const countLabel = `${places.length} ${plural(places.length, 'miejsce', 'miejsca', 'miejsc')}`;

  return (
    <div className="max-w-[1160px] mx-auto">
      <Link href="/dashboard/spoot-lists" className="inline-flex items-center gap-1 min-h-9 text-sm font-heading font-semibold text-onSurfaceVariant hover:text-onSurface mb-2">
        <Icon name="chevron" size={16} className="rotate-180" />Listy Spoot
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="font-heading font-bold text-[26px] leading-[34px] lg:text-[32px] lg:leading-10 truncate">{list.title.trim() || 'Bez tytułu'}</h1>
          {list.is_published ? <Badge tone="success">Na Starcie</Badge> : <Badge tone="neutral">Szkic</Badge>}
        </div>
        {list.is_published ? (
          <Button variant="ghost" onClick={() => save({ is_published: false })} disabled={busy}>Zdejmij ze Startu</Button>
        ) : (
          <Button onClick={() => save({ is_published: true })} disabled={busy || places.length === 0} title={places.length === 0 ? 'Dodaj najpierw miejsca' : undefined}>
            Pokaż na Starcie
          </Button>
        )}
      </div>

      {message && (
        <p role="status" className={`mb-4 rounded-md px-4 py-3 text-sm font-medium ${message.tone === 'error' ? 'bg-red-100' : 'bg-ratedSurface'}`}>{message.text}</p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <section aria-labelledby="places-h" className="bg-cardMuted rounded-xl p-4 lg:p-5 flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="places-h" className="font-heading font-bold text-lg">Miejsca</h2>
            <span className="text-sm text-onSurfaceVariant">{countLabel}</span>
          </div>
          <PlaceSearch onSelect={addPlace} excludeIds={places.map(p => p.place_id)} defaultMetro={list.city} autoFocus={places.length === 0} />
          {places.length === 0 ? (
            <p className="text-sm text-onSurfaceVariant py-6 text-center">Wpisz nazwę lokalu — Enter dodaje pierwszy wynik.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={places.map(p => p.place_id)} strategy={verticalListSortingStrategy}>
                <ol className="flex flex-col gap-2">
                  {places.map((item, i) => (
                    <PlaceRow key={item.place_id} item={item} index={i} total={places.length}
                      onMove={(index, dir) => persistOrder(arrayMove(places, index, index + dir))}
                      onRemove={removePlace} onNote={saveNote} />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          )}
          {places.length > 0 && places.length < 3 && (
            <p className="text-xs text-onSurfaceVariant">W aplikacji lista wygląda najlepiej od 3 miejsc.</p>
          )}
        </section>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
          <section aria-labelledby="settings-h" className="bg-cardMuted rounded-xl p-4 lg:p-5 flex flex-col gap-3.5">
            <h2 id="settings-h" className="font-heading font-bold text-lg">Ustawienia</h2>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Tytuł</span>
              <input value={list.title} onChange={e => set({ title: e.target.value })} className={fieldClass} />
            </label>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="emoji" className={labelClass}>Emoji (gdy brak okładki)</label>
              <div className="flex flex-wrap items-center gap-1.5">
                <input id="emoji" value={list.emoji ?? ''} onChange={e => set({ emoji: e.target.value || null })} className={`${fieldClass} !w-16 text-center`} />
                {EMOJI.map(em => (
                  <button key={em} type="button" onClick={() => set({ emoji: em })} aria-label={`Ustaw emoji ${em}`}
                    className={`w-10 h-10 rounded-md text-xl ${list.emoji === em ? 'bg-primary/15 ring-2 ring-primary' : 'hover:bg-cardMutedDark/60'}`}>
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Miasto</span>
              <select value={list.city ?? ''} onChange={e => set({ city: e.target.value || null })} className={fieldClass}>
                <option value="">Cała Polska</option>
                {METROS.map(m => <option key={m} value={m}>{m}</option>)}
                {list.city && !METROS.includes(list.city) && <option value={list.city}>{list.city}</option>}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Okładka — adres zdjęcia</span>
              <input value={list.cover_url ?? ''} onChange={e => set({ cover_url: e.target.value.trim() || null })} placeholder="https://…" className={fieldClass} />
            </label>
            <Button onClick={() => save()} disabled={!dirty || busy}>{busy ? 'Zapisuję…' : dirty ? 'Zapisz zmiany' : 'Wszystko zapisane'}</Button>
          </section>

          <section aria-labelledby="preview-h" className="bg-cardMuted rounded-xl p-4 lg:p-5 flex flex-col gap-3">
            <h2 id="preview-h" className="font-heading font-bold text-lg">Podgląd w aplikacji</h2>
            <div className="w-[180px]">
              <AppCardPreview title={list.title} coverUrl={list.cover_url} emoji={list.emoji} subtitle={`${places.length} miejsc`} />
            </div>
          </section>

          <Button variant="danger" onClick={deleteList}>
            <Icon name="trash" size={16} />Usuń listę
          </Button>
        </aside>
      </div>
    </div>
  );
}
