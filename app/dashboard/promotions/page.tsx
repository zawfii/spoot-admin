import { getPromotions } from '@/lib/queries';
import ApprovePromotionButton from './ApprovePromotionButton';
import RejectPromotionButton from './RejectPromotionButton';

const PACKAGE_LABELS: Record<string, string> = { '7d': '7 dni', '14d': '14 dni', '30d': '30 dni' };

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: filterParam } = await searchParams;
  const filter = filterParam === 'all' ? 'all' : 'pending';
  const promotions = await getPromotions(filter);

  function statusBadge(status: string) {
    if (status === 'pending')  return <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">Oczekuje</span>;
    if (status === 'approved') return <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium">Aktywne</span>;
    if (status === 'expired')  return <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">Wygasłe</span>;
    return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs font-medium">Odrzucone</span>;
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Wyróżnienia</h1>
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
              <th className="text-left px-4 py-3 font-medium">Właściciel</th>
              <th className="text-left px-4 py-3 font-medium">Pakiet</th>
              <th className="text-left px-4 py-3 font-medium">Data prośby</th>
              <th className="text-left px-4 py-3 font-medium">Aktywne do</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map(promo => (
              <tr key={promo.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{promo.place_name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{promo.owner_display_name}</td>
                <td className="px-4 py-3 font-mono">{PACKAGE_LABELS[promo.package] ?? promo.package}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(promo.created_at)}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(promo.active_until)}</td>
                <td className="px-4 py-3">{statusBadge(promo.status)}</td>
                <td className="px-4 py-3">
                  {promo.status === 'pending' && (
                    <div className="flex gap-2">
                      <ApprovePromotionButton promotionId={promo.id} />
                      <RejectPromotionButton promotionId={promo.id} />
                    </div>
                  )}
                  {promo.status !== 'pending' && promo.admin_note && (
                    <span className="text-gray-400 text-xs italic truncate max-w-[120px] block">{promo.admin_note}</span>
                  )}
                </td>
              </tr>
            ))}
            {promotions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  {filter === 'pending' ? 'Brak oczekujących wyróżnień' : 'Brak wyróżnień'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
