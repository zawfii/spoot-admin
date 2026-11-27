import Link from 'next/link';
import { getPlaces, getDistinctCities } from '@/lib/queries';
import { PlaceStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterChip } from '@/components/ui/FilterChip';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon } from '@/components/Icon';
import { plural } from '@/lib/plural';

const statusTabs = [
  { value: '', label: 'Wszystkie' },
  { value: 'pending', label: 'Oczekujące' },
  { value: 'active', label: 'Zatwierdzone' },
  { value: 'rejected', label: 'Odrzucone' },
];

function Coords({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-ratingHigh"><Icon name="check" size={16} />Są</span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-onSurface"><Icon name="alert" size={16} className="text-secondary" />Brak</span>
  );
}

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: { search?: string; city?: string; status?: string };
}) {
  const search = searchParams.search ?? '';
  const city = searchParams.city ?? '';
  const status = searchParams.status ?? '';
  const [places, cities] = await Promise.all([getPlaces(search, city, status), getDistinctCities()]);

  const hrefFor = (nextStatus: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (city) params.set('city', city);
    if (nextStatus) params.set('status', nextStatus);
    const qs = params.toString();
    return qs ? `/dashboard/places?${qs}` : '/dashboard/places';
  };

  // getPlaces zwraca maks. 100 wierszy.
  const subtitle = places.length >= 100
    ? 'Pokazuję pierwsze 100 — zawęź wyszukiwanie.'
    : `${places.length} ${plural(places.length, 'miejsce', 'miejsca', 'miejsc')}`;

  return (
    <div className="max-w-[1160px] mx-auto">
      <PageHeader
        title="Miejsca"
        subtitle={subtitle}
        actions={<Link href="/dashboard/places/new"><Button>Nowe miejsce</Button></Link>}
      />

      <div className="flex flex-col gap-3 mb-6 xl:flex-row xl:items-center xl:justify-between">
        <form role="search" className="flex flex-wrap gap-3 xl:flex-1 xl:max-w-[640px]">
          <label htmlFor="search" className="sr-only">Szukaj po nazwie</label>
          <div className="relative flex-[1_1_100%] sm:flex-[1_1_240px] text-onSurfaceVariant">
            <Icon name="search" size={18} className="absolute left-3.5 top-[13px]" />
            <input
              id="search"
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Szukaj po nazwie…"
              className="w-full h-11 pl-10 pr-3.5 border border-outlineVariant rounded-md bg-surfaceLowest text-base lg:text-sm text-onSurface focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
          <label htmlFor="city" className="sr-only">Miasto</label>
          <select
            id="city"
            name="city"
            defaultValue={city}
            className="flex-1 lg:flex-none h-11 px-3.5 border border-outlineVariant rounded-md bg-surfaceLowest text-base lg:text-sm text-onSurface focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <option value="">Wszystkie miasta</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {status && <input type="hidden" name="status" value={status} />}
          <Button type="submit" variant="ghost">Szukaj</Button>
        </form>
        <div role="group" aria-label="Status" className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          {statusTabs.map(tab => (
            <FilterChip key={tab.value} href={hrefFor(tab.value)} active={status === tab.value}>{tab.label}</FilterChip>
          ))}
        </div>
      </div>

      {places.length === 0 ? (
        <div className="bg-cardMuted rounded-xl px-6 py-10 text-center">
          <p className="font-heading font-semibold">Nic nie znaleziono</p>
          <p className="text-sm text-onSurfaceVariant mt-1">Spróbuj innej nazwy albo innego statusu.</p>
        </div>
      ) : (
        <>
          {/* Komputer: tabela */}
          <div className="hidden md:block bg-cardMuted rounded-xl p-2 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left font-heading font-bold text-[11px] leading-4 tracking-[0.8px] uppercase text-onSurfaceVariant">
                  <th scope="col" className="px-4 pt-3 pb-2">Nazwa</th>
                  <th scope="col" className="px-4 pt-3 pb-2">Kategoria</th>
                  <th scope="col" className="px-4 pt-3 pb-2">Miasto</th>
                  <th scope="col" className="px-4 pt-3 pb-2">Status</th>
                  <th scope="col" className="px-4 pt-3 pb-2">Współrzędne</th>
                  <th scope="col"><span className="sr-only">Otwórz</span></th>
                </tr>
              </thead>
              <tbody>
                {places.map((place: any) => {
                  // Cały wiersz klikalny: link w każdej komórce. Nie link rozciągnięty ::after na <tr> —
                  // Safari nie liczy go od <tr>, więc przykrywał całą stronę razem z wyszukiwarką.
                  const href = `/dashboard/places/${place.id}`;
                  const cell = (children: React.ReactNode, cls = 'px-4') => (
                    <td><Link href={href} tabIndex={-1} className={`block py-3.5 ${cls}`}>{children}</Link></td>
                  );
                  return (
                    <tr key={place.id} className="border-t border-outlineVariant hover:bg-[#e3ddd4] transition-colors">
                      <td>
                        <Link href={href} className="block px-4 py-3.5 font-heading font-semibold text-[15px] text-onSurface">
                          {place.name}
                        </Link>
                      </td>
                      {cell(place.category ?? '—', 'px-4 text-onSurfaceVariant')}
                      {cell(place.city ?? '—', 'px-4 text-onSurfaceVariant')}
                      {cell(<PlaceStatusBadge status={place.status} />)}
                      {cell(<Coords ok={place.lat != null && place.lng != null} />)}
                      {cell(<Icon name="chevron" size={18} />, 'pr-4 text-onSurfaceVariant')}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Telefon: karty */}
          <ul className="md:hidden flex flex-col gap-2">
            {places.map((place: any) => (
              <li key={place.id}>
                <Link href={`/dashboard/places/${place.id}`} className="flex items-center gap-3 p-4 pr-3.5 rounded-lg bg-cardMuted active:opacity-90">
                  <span className="flex-1 min-w-0 flex flex-col gap-2">
                    <span className="flex flex-col">
                      <span className="font-heading font-semibold text-[15px] leading-5">{place.name}</span>
                      <span className="text-[13px] leading-[18px] text-onSurfaceVariant">
                        {[place.category, place.city].filter(Boolean).join(' · ') || '—'}
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      <PlaceStatusBadge status={place.status} />
                      {(place.lat == null || place.lng == null) && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold">
                          <Icon name="alert" size={14} className="text-secondary" />Brak współrzędnych
                        </span>
                      )}
                    </span>
                  </span>
                  <Icon name="chevron" size={18} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
