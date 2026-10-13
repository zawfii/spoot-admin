'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import dynamic from 'next/dynamic';
import type { AdminPlace } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const MapPreview = dynamic(() => import('./MapPreview'), { ssr: false });

const inputClass = 'w-full border border-outlineVariant rounded-md px-3 py-2 text-sm bg-surfaceLowest focus:outline-none focus:ring-2 focus:ring-secondary';

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

  if (!place) return <div className="p-8 text-onSurfaceVariant/60">Ładowanie...</div>;

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
      status: place.status,
    }).eq('id', place.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-onSurfaceVariant/60 hover:text-onSurface">←</button>
        <h1 className="text-2xl font-heading font-bold text-onSurface">{place.name}</h1>
        {place.status === 'pending' ? <Badge tone="warning">Oczekuje</Badge> : <Badge tone="success">Zatwierdzone</Badge>}
      </div>

      <Card className="p-6 space-y-4">
        {place.status === 'pending' && (
          <div className="flex items-center justify-between bg-secondaryFixed rounded-md px-4 py-3">
            <span className="text-sm text-onSecondaryFixed font-medium">To miejsce czeka na moderację (zgłoszone przez użytkownika).</span>
            <Button size="sm" variant="secondary" onClick={() => update('status', 'approved')}>
              Zatwierdź
            </Button>
          </div>
        )}

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
            <label className="block text-sm font-medium mb-1 text-onSurfaceVariant">{label}</label>
            <input
              value={(place[field] as string) ?? ''}
              onChange={e => update(field, e.target.value || null)}
              className={inputClass}
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium mb-1 text-onSurfaceVariant">Godziny otwarcia</label>
          <textarea
            value={place.hours ?? ''}
            onChange={e => update('hours', e.target.value || null)}
            rows={3}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-onSurfaceVariant">Przedział cenowy</label>
          <select
            value={place.price_range ?? ''}
            onChange={e => update('price_range', e.target.value || null)}
            className={inputClass + ' w-auto'}
          >
            <option value="">—</option>
            {['$', '$$', '$$$', '$$$$'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-onSurfaceVariant">Lat</label>
            <input
              type="number"
              step="any"
              value={place.lat ?? ''}
              onChange={e => update('lat', e.target.value ? parseFloat(e.target.value) : null)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-onSurfaceVariant">Lng</label>
            <input
              type="number"
              step="any"
              value={place.lng ?? ''}
              onChange={e => update('lng', e.target.value ? parseFloat(e.target.value) : null)}
              className={inputClass}
            />
          </div>
        </div>

        {place.lat != null && place.lng != null && (
          <MapPreview lat={place.lat} lng={place.lng} />
        )}

        <Button onClick={handleSave} disabled={saving}>
          {saved ? 'Zapisano ✓' : saving ? 'Zapisywanie...' : 'Zapisz'}
        </Button>
      </Card>
    </div>
  );
}
