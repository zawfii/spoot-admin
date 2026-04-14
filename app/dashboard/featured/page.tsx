'use client';
import { useEffect, useState, useCallback } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { createClient } from '@/lib/supabase/client';
import PlaceSearch from '@/components/PlaceSearch';
import SortableItem from '@/components/SortableItem';
import type { FeaturedPlace } from '@/lib/types';

export default function FeaturedPage() {
  const [featured, setFeatured] = useState<FeaturedPlace[]>([]);
  const [validUntil, setValidUntil] = useState('');

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('featured_places')
      .select('*, place:places(id, name, city, category)')
      .order('position');
    setFeatured(data ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(place: { id: string }) {
    const supabase = createClient();
    await supabase.from('featured_places').insert({
      place_id: place.id,
      position: featured.length,
      valid_until: validUntil || null,
    });
    setValidUntil('');
    load();
  }

  async function handleRemove(id: string) {
    const supabase = createClient();
    await supabase.from('featured_places').delete().eq('id', id);
    setFeatured(prev => prev.filter(f => f.id !== id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = featured.findIndex(f => f.id === active.id);
    const newIndex = featured.findIndex(f => f.id === over.id);
    const reordered = arrayMove(featured, oldIndex, newIndex);
    setFeatured(reordered);
    const supabase = createClient();
    await Promise.all(reordered.map((f, pos) =>
      supabase.from('featured_places').update({ position: pos }).eq('id', f.id)
    ));
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Wyróżnione miejsca</h1>
      <p className="text-sm text-gray-500 mb-6">
        Miejsca wyróżnione są pokazywane na głównym ekranie appki. Maksymalnie 10 slotów.
      </p>

      <div className="bg-white rounded-2xl border p-6 mb-6">
        <h2 className="font-semibold mb-3">Dodaj miejsce</h2>
        <div className="space-y-3">
          <PlaceSearch
            onSelect={handleAdd}
            excludeIds={featured.map(f => f.place_id)}
            placeholder="Szukaj miejsca do wyróżnienia..."
          />
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-500">Ważne do (opcjonalnie)</label>
            <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-6">
        <h2 className="font-semibold mb-4">Aktualnie wyróżnione ({featured.length}/10)</h2>
        {featured.length === 10 && (
          <p className="text-sm text-amber-600 mb-3">Osiągnięto limit 10 miejsc.</p>
        )}
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={featured.map(f => f.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {featured.map((f, i) => (
                <SortableItem key={f.id} id={f.id}>
                  <div className="border rounded-xl p-3 bg-gray-50 flex items-center justify-between cursor-grab">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-5">#{i + 1}</span>
                      <div>
                        <div className="font-medium text-sm">{(f.place as any)?.name}</div>
                        <div className="text-xs text-gray-400">{(f.place as any)?.city}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {f.valid_until && (
                        <span className="text-xs text-gray-400">do {f.valid_until}</span>
                      )}
                      <button onClick={() => handleRemove(f.id)}
                        className="text-xs text-red-400 hover:text-red-600">Usuń</button>
                    </div>
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {featured.length === 0 && (
          <div className="text-center text-gray-400 py-6 text-sm">Brak wyróżnionych miejsc.</div>
        )}
      </div>
    </div>
  );
}
