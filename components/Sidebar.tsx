'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: '◎' },
  { href: '/dashboard/places', label: 'Miejsca', icon: '📍' },
  { href: '/dashboard/spoot-lists', label: 'Listy Spoot', icon: '📋' },
  { href: '/dashboard/guides', label: 'Przewodniki', icon: '📖' },
  { href: '/dashboard/featured', label: 'Wyróżnione', icon: '⭐' },
  { href: '/dashboard/ownership-requests', label: 'Właściciele', icon: '🏪' },
  { href: '/dashboard/promotions', label: 'Wyróżnienia', icon: '🚀' },
  { href: '/dashboard/deals', label: 'Oferty dnia', icon: '💸' },
  { href: '/dashboard/dish-categories', label: 'Nowe kategorie', icon: '🏷️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [pendingCount, setPendingCount] = useState(0);
  const [pendingPromotionsCount, setPendingPromotionsCount] = useState(0);
  const [pendingDishCategoriesCount, setPendingDishCategoriesCount] = useState(0);
  const [pendingDealsCount, setPendingDealsCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('ownership_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setPendingCount(count ?? 0));
    supabase
      .from('promotions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setPendingPromotionsCount(count ?? 0));
    supabase
      .from('dish_category_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setPendingDishCategoriesCount(count ?? 0));
    supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .then(({ count }) => setPendingDealsCount(count ?? 0));
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="w-60 shrink-0 bg-primary text-surface min-h-screen flex flex-col">
      <div className="px-5 py-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-secondary" />
        <span className="font-heading font-bold text-lg text-onPrimary">Spoot Admin</span>
      </div>
      <nav className="flex-1 px-3 space-y-0.5">
        {links.map(link => {
          const active = link.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active ? 'bg-primaryLight text-onPrimary' : 'text-surface/70 hover:bg-primaryLight/60 hover:text-onPrimary'
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
              {link.href === '/dashboard/ownership-requests' && pendingCount > 0 && (
                <span className="ml-auto bg-secondary text-onSecondary text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-bold">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
              {link.href === '/dashboard/promotions' && pendingPromotionsCount > 0 && (
                <span className="ml-auto bg-secondary text-onSecondary text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-bold">
                  {pendingPromotionsCount > 9 ? '9+' : pendingPromotionsCount}
                </span>
              )}
              {link.href === '/dashboard/dish-categories' && pendingDishCategoriesCount > 0 && (
                <span className="ml-auto bg-secondary text-onSecondary text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-bold">
                  {pendingDishCategoriesCount > 9 ? '9+' : pendingDishCategoriesCount}
                </span>
              )}
              {link.href === '/dashboard/deals' && pendingDealsCount > 0 && (
                <span className="ml-auto bg-secondary text-onSecondary text-xs rounded-full min-w-5 h-5 px-1 flex items-center justify-center font-bold">
                  {pendingDealsCount > 9 ? '9+' : pendingDealsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-onPrimary/10">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-surface/70 hover:text-onPrimary rounded-md hover:bg-primaryLight/60 transition-colors"
        >
          Wyloguj
        </button>
      </div>
    </aside>
  );
}
