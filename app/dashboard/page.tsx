import { getDashboardStats } from '@/lib/queries';

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: 'Miejsc w bazie', value: stats.placesTotal },
    { label: 'Listy Spoot (live)', value: stats.listsPublished },
    { label: 'Przewodniki (live)', value: stats.guidesPublished },
    { label: 'Wyróżnione miejsca', value: stats.featuredCount },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-2xl border p-6">
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-sm text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
