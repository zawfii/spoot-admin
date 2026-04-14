'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import type { AdminPlace } from '@/lib/types';

const MapPreview = dynamic(() => import('./MapPreview'), { ssr: false });

export default function PlaceEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [place, setPlace] = useState<AdminPlace | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    createClient().from('places').select('*').eq('id', id).single()
      .then(({ data }) => setPlace(data));
  }, [id]);

  if (!place) return <div className="p-8 text-gray-400">Ładowanie...</div>;

  function update(field: keyof AdminPlace, value: unknown) {
    setPlace(prev => prev ? { ...prev, [field]: value } : prev);
  }

  async function handleSave() {
    if (!place) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('places').update({
      name: place.name,
      category: place.category,
      city: place.city,
      district: place.district,
      address: place.address,
      phone: place.phone,
      hours: place.hours,
      price_range: place.price_range,
      atmosphere: place.atmosphere,
      image_url: place.image_url,
      lat: place.lat,
      lng: place.lng,
      venue_type: place.venue_type,
    }).eq('id', place.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900">←</button>
        <h1 className="text-2xl font-bold">{place.name}</h1>
      </div>

      <div className="bg-white rounded-2xl border p-6 space-y-4">
        {([
          ['name', 'Nazwa'],
          ['category', 'Kategoria'],
          ['city', 'Miasto'],
          ['district', 'Dzielnica'],
          ['address', 'Adres'],
          ['phone', 'Telefon'],
          ['image_url', 'URL zdjęcia'],
          ['venue_type', 'Typ miejsca'],
        ] as [keyof AdminPlace, string][]).map(([field, label]) => (
          <div key={field}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input
              value={(place[field] as string) ?? ''}
              onChange={e => update(field, e.target.value || null)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium mb-1">Godziny otwarcia</label>
          <textarea
            value={place.hours ?? ''}
            onChange={e => update('hours', e.target.value || null)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Przedział cenowy</label>
          <select
            value={place.price_range ?? ''}
            onChange={e => update('price_range', e.target.value || null)}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">—</option>
            {['$', '$$', '$$$', '$$$$'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Lat</label>
            <input
              type="number"
              step="any"
              value={place.lat ?? ''}
              onChange={e => update('lat', e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Lng</label>
            <input
              type="number"
              step="any"
              value={place.lng ?? ''}
              onChange={e => update('lng', e.target.value ? parseFloat(e.target.value) : null)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {place.lat != null && place.lng != null && (
          <MapPreview lat={place.lat} lng={place.lng} />
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {saved ? 'Zapisano ✓' : saving ? 'Zapisywanie...' : 'Zapisz'}
        </button>
      </div>
    </div>
  );
}
