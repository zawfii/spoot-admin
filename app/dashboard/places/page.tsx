import Link from 'next/link';
import { getPlaces, getDistinctCities } from '@/lib/queries';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: { search?: string; city?: string; status?: string };
}) {
  const search = searchParams.search ?? '';
  const city = searchParams.city ?? '';
  const status = searchParams.status ?? '';
  const [places, cities] = await Promise.all([getPlaces(search, city, status), getDistinctCities()]);

  return (
    <div>
      <PageHeader
        title="Miejsca"
        actions={
          <Link href="/dashboard/places/new">
            <Button size="sm">+ Nowe miejsce</Button>
          </Link>
        }
      />

      <form className="flex gap-3 mb-6">
        <input
          name="search"
          defaultValue={search}
          placeholder="Szukaj po nazwie..."
          className="border border-outlineVariant rounded-md px-3 py-2 text-sm w-64 bg-surfaceLowest focus:outline-none focus:ring-2 focus:ring-secondary"
        />
        <select
          name="city"
          defaultValue={city}
          className="border border-outlineVariant rounded-md px-3 py-2 text-sm bg-surfaceLowest focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          <option value="">Wszystkie miasta</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="border border-outlineVariant rounded-md px-3 py-2 text-sm bg-surfaceLowest focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          <option value="">Wszystkie statusy</option>
          <option value="pending">Oczekujące na moderację</option>
          <option value="approved">Zatwierdzone</option>
        </select>
        <Button type="submit" variant="ghost" size="md">Szukaj</Button>
      </form>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surfaceLow border-b border-outlineVariant">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-onSurfaceVariant">Nazwa</th>
              <th className="text-left px-4 py-3 font-medium text-onSurfaceVariant">Kategoria</th>
              <th className="text-left px-4 py-3 font-medium text-onSurfaceVariant">Miasto</th>
              <th className="text-left px-4 py-3 font-medium text-onSurfaceVariant">Status</th>
              <th className="text-left px-4 py-3 font-medium text-onSurfaceVariant">Koordynaty</th>
            </tr>
          </thead>
          <tbody>
            {places.map((place: any) => (
              <tr key={place.id} className="border-b border-outlineVariant last:border-0 hover:bg-surfaceLow/50">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/places/${place.id}`} className="font-medium hover:underline text-onSurface">
                    {place.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-onSurfaceVariant">{place.category}</td>
                <td className="px-4 py-3 text-onSurfaceVariant">{place.city ?? '—'}</td>
                <td className="px-4 py-3">
                  {place.status === 'pending' ? (
                    <Badge tone="warning">Oczekuje</Badge>
                  ) : (
                    <Badge tone="success">Zatwierdzone</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  {place.lat != null && place.lng != null ? (
                    <span className="text-primaryLight font-medium">✓</span>
                  ) : (
                    <span className="text-red-400">✗</span>
                  )}
                </td>
              </tr>
            ))}
            {places.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-onSurfaceVariant/60">Brak wyników</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
