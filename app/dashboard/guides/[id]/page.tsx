'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { createClient } from '@/lib/supabase/client';
import PlaceSearch from '@/components/PlaceSearch';
import SortableItem from '@/components/SortableItem';
import type { SpootGuide, SpootGuidePlace } from '@/lib/types';

const THEMES = ['ukryte perły', 'nowe miejsca', 'niedocenione', 'food tour', 'inne'];

export default function GuideEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [guide, setGuide] = useState<SpootGuide | null>(null);
  const [places, setPlaces] = useState<SpootGuidePlace[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [guideRes, placesRes] = await Promise.all([
      supabase.from('spoot_guides').select('*').eq('id', id).single(),
      supabase.from('spoot_guide_places')
        .select('*, place:places(id, name, city, category)')
        .eq('guide_id', id).order('position'),
    ]);
    setGuide(guideRes.data);
    setPlaces(placesRes.data ?? []);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!guide) return <div className="p-8 text-gray-400">Ładowanie...</div>;

  async function handleSave() {
    if (!guide) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('spoot_guides').update({
      title: guide.title, slug: guide.slug, intro: guide.intro,
      city: guide.city, theme: guide.theme, cover_url: guide.cover_url,
      is_published: guide.is_published,
    }).eq('id', guide.id);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function handleAddPlace(place: { id: string }) {
    const supabase = createClient();
    await supabase.from('spoot_guide_places').insert({ guide_id: id, place_id: place.id, position: places.length });
    load();
  }

  async function handleRemovePlace(placeId: string) {
    const supabase = createClient();
    await supabase.from('spoot_guide_places').delete().eq('guide_id', id).eq('place_id', placeId);
    setPlaces(prev => prev.filter(p => p.place_id !== placeId));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = places.findIndex(p => p.place_id === active.id);
    const newIndex = places.findIndex(p => p.place_id === over.id);
    const reordered = arrayMove(places, oldIndex, newIndex);
    setPlaces(reordered);
    const supabase = createClient();
    await Promise.all(reordered.map((p, pos) =>
      supabase.from('spoot_guide_places').update({ position: pos }).eq('guide_id', id).eq('place_id', p.place_id)
    ));
  }

  async function handleNoteChange(placeId: string, note: string) {
    setPlaces(prev => prev.map(p => p.place_id === placeId ? { ...p, editorial_note: note || null } : p));
    const supabase = createClient();
    await supabase.from('spoot_guide_places').update({ editorial_note: note || null }).eq('guide_id', id).eq('place_id', placeId);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900">←</button>
        <h1 className="text-2xl font-bold">Edytuj przewodnik</h1>
      </div>

      <div className="bg-white rounded-2xl border p-6 space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Tytuł</label>
          <input value={guide.title} onChange={e => setGuide(g => g ? { ...g, title: e.target.value } : g)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug (URL)</label>
          <input value={guide.slug} onChange={e => setGuide(g => g ? { ...g, slug: e.target.value } : g)}
            className="w-full border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Wstęp (max 400 zn.)</label>
          <textarea value={guide.intro ?? ''} rows={3} maxLength={400}
            onChange={e => setGuide(g => g ? { ...g, intro: e.target.value || null } : g)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          <div className="text-xs text-gray-400 text-right">{(guide.intro ?? '').length}/400</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Miasto</label>
            <input value={guide.city ?? ''} onChange={e => setGuide(g => g ? { ...g, city: e.target.value || null } : g)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tematyka</label>
            <select value={guide.theme ?? ''} onChange={e => setGuide(g => g ? { ...g, theme: e.target.value || null } : g)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black">
              <option value="">—</option>
              {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">URL okładki</label>
          <input value={guide.cover_url ?? ''} onChange={e => setGuide(g => g ? { ...g, cover_url: e.target.value || null } : g)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="gpublished" checked={guide.is_published}
            onChange={e => setGuide(g => g ? { ...g, is_published: e.target.checked } : g)} />
          <label htmlFor="gpublished" className="text-sm font-medium">Opublikowany (widoczny w appce)</label>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          {saved ? 'Zapisano ✓' : saving ? 'Zapisywanie...' : 'Zapisz'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border p-6">
        <h2 className="font-semibold mb-4">Miejsca ({places.length})</h2>
        <div className="mb-4">
          <PlaceSearch onSelect={handleAddPlace} excludeIds={places.map(p => p.place_id)} />
        </div>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={places.map(p => p.place_id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {places.map((p, i) => (
                <SortableItem key={p.place_id} id={p.place_id}>
                  <div className="border rounded-xl p-3 bg-gray-50 cursor-grab">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs text-gray-400 mr-2">#{i + 1}</span>
                        <span className="font-medium text-sm">{(p.place as any)?.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{(p.place as any)?.city}</span>
                      </div>
                      <button onClick={() => handleRemovePlace(p.place_id)}
                        className="text-xs text-red-400 hover:text-red-600">Usuń</button>
                    </div>
                    <textarea
                      value={p.editorial_note ?? ''}
                      onChange={e => handleNoteChange(p.place_id, e.target.value)}
                      placeholder="Nota redakcyjna (opcjonalnie, max 200 zn.)..."
                      maxLength={200}
                      rows={2}
                      className="w-full text-xs border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-black bg-white resize-none"
                    />
                    <div className="text-xs text-gray-400 text-right">{(p.editorial_note ?? '').length}/200</div>
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
