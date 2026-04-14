import Link from 'next/link';
import { getPlaces, getDistinctCities } from '@/lib/queries';

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: { search?: string; city?: string };
}) {
  const search = searchParams.search ?? '';
  const city = searchParams.city ?? '';
  const [places, cities] = await Promise.all([getPlaces(search, city), getDistinctCities()]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Miejsca</h1>

      <form className="flex gap-3 mb-6">
        <input
          name="search"
          defaultValue={search}
          placeholder="Szukaj po nazwie..."
          className="border rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-black"
        />
        <select
          name="city"
          defaultValue={city}
          className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">Wszystkie miasta</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button type="submit" className="bg-black text-white px-4 py-2 rounded-lg text-sm">
          Szukaj
        </button>
      </form>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Nazwa</th>
              <th className="text-left px-4 py-3 font-medium">Kategoria</th>
              <th className="text-left px-4 py-3 font-medium">Miasto</th>
              <th className="text-left px-4 py-3 font-medium">Koordynaty</th>
            </tr>
          </thead>
          <tbody>
            {places.map((place: any) => (
              <tr key={place.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link href={`/dashboard/places/${place.id}`} className="font-medium hover:underline">
                    {place.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-500">{place.category}</td>
                <td className="px-4 py-3 text-gray-500">{place.city ?? '—'}</td>
                <td className="px-4 py-3">
                  {place.lat != null && place.lng != null ? (
                    <span className="text-green-600 font-medium">✓</span>
                  ) : (
                    <span className="text-red-400">✗</span>
                  )}
                </td>
              </tr>
            ))}
            {places.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Brak wyników</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
