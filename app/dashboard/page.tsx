import Link from 'next/link';
import { getDashboardStats, getDashboardExtras } from '@/lib/queries';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Icon, IconName } from '@/components/Icon';
import { plural } from '@/lib/plural';

export default async function DashboardPage() {
  const [stats, extras] = await Promise.all([getDashboardStats(), getDashboardExtras()]);
  const pending = extras.needsAttention;

  const queue: { label: string; hint: string; count: number; href: string; icon: IconName }[] = [
    { label: 'Miejsca do moderacji', hint: 'Dodane ręcznie w aplikacji', count: pending.placesPending, href: '/dashboard/places?status=pending', icon: 'pin' },
    { label: 'Zgłoszenia właścicieli', hint: 'Prośby o przejęcie lokalu', count: pending.ownershipPending, href: '/dashboard/ownership-requests', icon: 'store' },
    { label: 'Oferty dnia', hint: 'Czekają na akceptację', count: pending.dealsPending, href: '/dashboard/deals', icon: 'tag' },
    { label: 'Sugestie kategorii dań', hint: 'Nowe kategorie od lokali', count: pending.dishCategoriesPending, href: '/dashboard/dish-categories', icon: 'layers' },
    { label: 'Zgłoszenia sponsoringu', hint: 'Płatne wyróżnienia lokali', count: pending.promotionsPending, href: '/dashboard/promotions', icon: 'trending' },
  ];
  const total = queue.reduce((sum, item) => sum + item.count, 0);

  const signals: { label: string; value: number; href: string | null; dot: string }[] = [
    { label: 'Miejsca bez współrzędnych', value: extras.placesMissingCoords, href: '/dashboard/places', dot: 'bg-secondary' },
    { label: 'Sponsoring wygasa w ciągu 3 dni', value: extras.promotionsExpiringSoon, href: '/dashboard/promotions?filter=all', dot: 'bg-secondary' },
    { label: 'Nieopublikowane szkice', value: extras.draftsUnpublished, href: null, dot: 'bg-cardMutedDark' },
    { label: 'Nowe miejsca w 7 dni', value: extras.placesNewLast7Days, href: '/dashboard/places', dot: 'bg-ratingHigh' },
  ];

  const statTiles = [
    { label: 'Miejsc w bazie', value: stats.placesTotal },
    { label: 'Opublikowanych list Spoot', value: stats.listsPublished },
    { label: 'Opublikowanych przewodników', value: stats.guidesPublished },
    { label: 'Wyróżnionych miejsc', value: stats.featuredCount },
  ];

  const today = new Date().toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Warsaw' });

  return (
    <div className="max-w-[1160px] mx-auto">
      <PageHeader
        eyebrow={today}
        title="Pulpit"
        subtitle={total > 0 ? `Masz ${total} ${plural(total, 'sprawę', 'sprawy', 'spraw')} do przejrzenia.` : 'Nic nie czeka na decyzję.'}
        actions={
          <>
            <Link href="/dashboard/spoot-lists"><Button variant="ghost">Nowa lista Spoot</Button></Link>
            <Link href="/dashboard/places/new"><Button>Nowe miejsce</Button></Link>
          </>
        }
      />

      <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-wrap gap-5 items-start">
        <section aria-labelledby="queue-h" className="flex-[2_1_480px] min-w-0 bg-cardMuted rounded-xl p-1.5 lg:p-2">
          <h2 id="queue-h" className="px-3.5 pt-3.5 pb-1.5 lg:px-4 lg:pt-4 font-heading font-bold text-lg">Do przejrzenia</h2>
          {queue.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 lg:gap-3.5 min-h-[60px] lg:min-h-16 px-3 lg:px-4 py-2 rounded-lg hover:bg-[#e3ddd4] transition-colors ${item.count === 0 ? 'text-onSurfaceVariant' : 'text-onSurface'}`}
            >
              <span className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-surface flex items-center justify-center">
                <Icon name={item.icon} size={18} />
              </span>
              <span className="flex-1 min-w-0 flex flex-col">
                <span className="font-heading font-semibold text-[15px] leading-5">{item.label}</span>
                <span className="text-xs lg:text-[13px] leading-[18px] text-onSurfaceVariant">{item.hint}</span>
              </span>
              <span className={`font-heading font-bold text-xl lg:text-[22px] ${item.count === 0 ? 'opacity-60' : ''}`}>{item.count}</span>
              <Icon name="chevron" size={16} />
            </Link>
          ))}
        </section>

        <section aria-labelledby="signals-h" className="flex-[1_1_300px] min-w-0 bg-cardMuted rounded-xl p-5 lg:p-6 flex flex-col">
          <h2 id="signals-h" className="mb-1.5 font-heading font-bold text-lg">Sygnały</h2>
          {signals.map(signal => {
            const row = (
              <>
                <span className="flex items-center gap-2 text-sm">
                  <span aria-hidden="true" className={`w-2 h-2 rounded-full shrink-0 ${signal.dot}`} />
                  {signal.label}
                </span>
                <span className="font-heading font-bold text-lg">{signal.value}</span>
              </>
            );
            const cls = 'flex items-center justify-between gap-3 min-h-[52px] border-b border-outlineVariant last:border-0';
            return signal.href
              ? <Link key={signal.label} href={signal.href} className={`${cls} hover:text-primaryLight`}>{row}</Link>
              : <div key={signal.label} className={cls}>{row}</div>;
          })}
        </section>
      </div>

      <section aria-labelledby="stats-h" className="flex flex-col gap-3">
        <h2 id="stats-h" className="font-heading font-bold text-[11px] leading-4 tracking-[0.8px] uppercase text-onSurfaceVariant">W bazie</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statTiles.map(tile => (
            <div key={tile.label} className="bg-cardMuted rounded-lg p-4 lg:p-5 flex flex-col gap-0.5">
              <span className="font-heading font-bold text-2xl lg:text-[28px] lg:leading-[34px]">{tile.value.toLocaleString('pl-PL')}</span>
              <span className="text-xs lg:text-[13px] leading-[18px] text-onSurfaceVariant">{tile.label}</span>
            </div>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}
