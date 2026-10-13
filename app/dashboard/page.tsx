import Link from 'next/link';
import { getDashboardStats, getDashboardExtras } from '@/lib/queries';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

export default async function DashboardPage() {
  const [stats, extras] = await Promise.all([getDashboardStats(), getDashboardExtras()]);

  const statCards = [
    { label: 'Miejsc w bazie', value: stats.placesTotal },
    { label: 'Listy Spoot (live)', value: stats.listsPublished },
    { label: 'Przewodniki (live)', value: stats.guidesPublished },
    { label: 'Wyróżnione miejsca', value: stats.featuredCount },
  ];

  const attentionItems = [
    { label: 'Miejsca do moderacji', count: extras.needsAttention.placesPending, href: '/dashboard/places?status=pending' },
    { label: 'Zgłoszenia sponsoringu', count: extras.needsAttention.promotionsPending, href: '/dashboard/promotions' },
    { label: 'Zgłoszenia właścicieli', count: extras.needsAttention.ownershipPending, href: '/dashboard/ownership-requests' },
    { label: 'Sugestie kategorii dań', count: extras.needsAttention.dishCategoriesPending, href: '/dashboard/dish-categories' },
  ].filter(item => item.count > 0);

  const signalCards = [
    { label: 'Miejsca bez współrzędnych', value: extras.placesMissingCoords, href: '/dashboard/places' },
    { label: 'Sponsoring wygasa ≤ 3 dni', value: extras.promotionsExpiringSoon, href: '/dashboard/promotions?filter=all' },
    { label: 'Niepublikowane szkice', value: extras.draftsUnpublished, href: null },
    { label: 'Nowe miejsca (7 dni)', value: extras.placesNewLast7Days, href: '/dashboard/places' },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        actions={
          <>
            <Link href="/dashboard/places/new"><Button size="sm" variant="secondary">+ Nowe miejsce</Button></Link>
            <Link href="/dashboard/spoot-lists"><Button size="sm" variant="ghost">+ Nowa lista Spoot</Button></Link>
          </>
        }
      />

      {attentionItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-heading font-semibold text-onSurfaceVariant mb-3 uppercase tracking-wide">Wymaga uwagi</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {attentionItems.map(item => (
              <Link key={item.label} href={item.href}>
                <Card className="p-4 flex items-center justify-between hover:border-secondary transition-colors">
                  <span className="text-sm font-medium text-onSurface">{item.label}</span>
                  <Badge tone="warning">{item.count}</Badge>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <Card key={card.label} className="p-6">
            <div className="text-3xl font-heading font-bold text-onSurface">{card.value}</div>
            <div className="text-sm text-onSurfaceVariant mt-1">{card.label}</div>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-heading font-semibold text-onSurfaceVariant mb-3 uppercase tracking-wide">Sygnały</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {signalCards.map(card => {
            const content = (
              <Card className={`p-6 ${card.href ? 'hover:border-secondary transition-colors' : ''}`}>
                <div className="text-3xl font-heading font-bold text-onSurface">{card.value}</div>
                <div className="text-sm text-onSurfaceVariant mt-1">{card.label}</div>
              </Card>
            );
            return card.href ? <Link key={card.label} href={card.href}>{content}</Link> : <div key={card.label}>{content}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
