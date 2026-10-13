import { getDeals } from '@/lib/queries';
import ApproveButton from './ApproveButton';
import RejectButton from './RejectButton';

const DAY_LABELS: Record<string, string> = {
  mon: 'Pon', tue: 'Wt', wed: 'Śr', thu: 'Czw', fri: 'Pt', sat: 'Sob', sun: 'Nd',
};

const SOURCE_LABELS: Record<string, string> = {
  owner: 'Właściciel', admin: 'Admin', user: 'Użytkownik', scraper: 'Scraper',
};

function formatDays(days: string[]): string {
  return days.map(d => DAY_LABELS[d] ?? d).join(', ');
}

function formatPrice(price: number): string {
  return price.toLocaleString('pl-PL', { minimumFractionDigits: 2 }) + ' zł';
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: filterParam } = await searchParams;
  const filter = filterParam === 'all' ? 'all' : 'pending';
  const deals = await getDeals(filter);

  function statusBadge(status: string) {
    if (status === 'pending')  return <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">Oczekuje</span>;
    if (status === 'approved') return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">Aktywne</span>;
    return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-medium">Odrzucone</span>;
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Oferty dnia</h1>
        <div className="flex gap-2">
          <a href="?filter=pending" className={`px-3 py-1.5 rounded-lg text-sm border ${filter === 'pending' ? 'bg-black text-white border-black' : 'hover:bg-gray-50'}`}>
            Oczekujące
          </a>
          <a href="?filter=all" className={`px-3 py-1.5 rounded-lg text-sm border ${filter === 'all' ? 'bg-black text-white border-black' : 'hover:bg-gray-50'}`}>
            Wszystkie
          </a>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Lokal</th>
              <th className="text-left px-4 py-3 font-medium">Danie</th>
              <th className="text-left px-4 py-3 font-medium">Cena</th>
              <th className="text-left px-4 py-3 font-medium">Dni</th>
              <th className="text-left px-4 py-3 font-medium">Źródło</th>
              <th className="text-left px-4 py-3 font-medium">Data zgłoszenia</th>
              <th className="text-left px-4 py-3 font-medium">Do kiedy</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {deals.map(deal => (
              <tr key={deal.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{deal.place_name}</td>
                <td className="px-4 py-3">{deal.dish_name}</td>
                <td className="px-4 py-3 font-mono">
                  {formatPrice(deal.price)}
                  {deal.original_price != null && (
                    <span className="text-gray-400 line-through ml-1">{formatPrice(deal.original_price)}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDays(deal.days_of_week)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{SOURCE_LABELS[deal.source] ?? deal.source}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(deal.created_at)}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(deal.valid_until)}</td>
                <td className="px-4 py-3">{statusBadge(deal.status)}</td>
                <td className="px-4 py-3">
                  {deal.status === 'pending' && (
                    <div className="flex gap-2">
                      <ApproveButton dealId={deal.id} />
                      <RejectButton dealId={deal.id} />
                    </div>
                  )}
                  {deal.status !== 'pending' && deal.admin_note && (
                    <span className="text-gray-400 text-xs italic truncate max-w-[120px] block">{deal.admin_note}</span>
                  )}
                </td>
              </tr>
            ))}
            {deals.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">
                  {filter === 'pending' ? 'Brak oczekujących ofert' : 'Brak ofert'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
