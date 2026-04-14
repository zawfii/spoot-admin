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
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [pendingCount, setPendingCount] = useState(0);
  const [pendingPromotionsCount, setPendingPromotionsCount] = useState(0);

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
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="w-56 shrink-0 bg-white border-r min-h-screen flex flex-col">
      <div className="p-5 border-b">
        <span className="font-bold text-lg">Spoot Admin</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map(link => {
          const active = link.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50 text-gray-600'
              }`}
            >
              <span>{link.icon}</span>
              {link.label}
              {link.href === '/dashboard/ownership-requests' && pendingCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
              {link.href === '/dashboard/promotions' && pendingPromotionsCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {pendingPromotionsCount > 9 ? '9+' : pendingPromotionsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-50"
        >
          Wyloguj
        </button>
      </div>
    </aside>
  );
}
