'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPlace } from '@/app/actions/places';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

export default function NewPlacePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [city, setCity] = useState('Warszawa');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !category.trim()) return;
    setSaving(true);
    setError('');
    try {
      const id = await createPlace(name.trim(), city.trim(), category.trim());
      router.push(`/dashboard/places/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się utworzyć miejsca.');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md">
      <PageHeader title="Nowe miejsce" />
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-onSurfaceVariant">Nazwa</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full border border-outlineVariant rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-onSurfaceVariant">Miasto</label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              required
              className="w-full border border-outlineVariant rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-onSurfaceVariant">Kategoria</label>
            <input
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="np. Kawiarnia, Restauracja..."
              required
              className="w-full border border-outlineVariant rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <p className="text-xs text-onSurfaceVariant/70">
            Reszta danych (adres, dzielnica, współrzędne, zdjęcie) uzupełnisz na kolejnym ekranie.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Tworzenie...' : 'Utwórz i przejdź do edycji'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
