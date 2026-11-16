'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Icon, IconName } from '@/components/Icon';
import { Logo } from '@/components/Logo';

type NavLink = { href: string; label: string; icon: IconName; pendingTable?: string };

const groups: { title?: string; links: NavLink[] }[] = [
  { links: [{ href: '/dashboard', label: 'Pulpit', icon: 'grid' }] },
  {
    title: 'Treści',
    links: [
      { href: '/dashboard/places', label: 'Miejsca', icon: 'pin' },
      { href: '/dashboard/spoot-lists', label: 'Listy Spoot', icon: 'list' },
      { href: '/dashboard/guides', label: 'Przewodniki', icon: 'book' },
      { href: '/dashboard/featured', label: 'Wyróżnione', icon: 'star' },
    ],
  },
  {
    title: 'Moderacja',
    links: [
      { href: '/dashboard/ownership-requests', label: 'Właściciele', icon: 'store', pendingTable: 'ownership_requests' },
      { href: '/dashboard/promotions', label: 'Sponsoring', icon: 'trending', pendingTable: 'promotions' },
      { href: '/dashboard/deals', label: 'Oferty dnia', icon: 'tag', pendingTable: 'deals' },
      { href: '/dashboard/deal-promotions', label: 'Promocje ofert', icon: 'trending', pendingTable: 'deal_promotions' },
      { href: '/dashboard/menu-requests', label: 'Prośby o menu', icon: 'list', pendingTable: 'menu_entry_requests' },
      { href: '/dashboard/website-requests', label: 'Strony lokali', icon: 'store', pendingTable: 'website_requests' },
      { href: '/dashboard/dish-categories', label: 'Nowe kategorie', icon: 'layers', pendingTable: 'dish_category_suggestions' },
    ],
  },
];

const pendingLinks = groups.flatMap(g => g.links).filter(l => l.pendingTable);

function AdminTag() {
  return (
    <span className="font-heading font-bold text-[10px] leading-[14px] tracking-[0.8px] text-white/80 px-2 py-[3px] border border-white/30 rounded-full">
      ADMIN
    </span>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all(
      pendingLinks.map(l =>
        supabase.from(l.pendingTable!).select('id', { count: 'exact', head: true }).eq('status', 'pending')
          .then(({ count }) => [l.href, count ?? 0] as const)
      )
    ).then(entries => setCounts(Object.fromEntries(entries)));
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push('/login');
  }

  // large = menu na telefonie: wyższe wiersze i większy tekst pod palec.
  const nav = (large: boolean) => (
    <>
      {groups.map((group, i) => (
        <div key={i} className="flex flex-col gap-0.5">
          {group.title && (
            <p className="px-3 pb-1.5 font-heading font-bold text-[11px] leading-4 tracking-[0.8px] uppercase text-white/60">{group.title}</p>
          )}
          {group.links.map(link => {
            const active = link.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(link.href);
            const count = counts[link.href] ?? 0;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 rounded-lg font-heading font-semibold transition-colors ${
                  large ? 'min-h-[52px] text-base' : 'min-h-11 text-sm'
                } ${active ? 'bg-white/[0.14] text-white' : 'text-white/80 hover:bg-white/[0.08] hover:text-white'}`}
              >
                <Icon name={link.icon} size={large ? 22 : 20} />
                {link.label}
                {count > 0 && (
                  <span className="ml-auto min-w-[22px] h-[22px] px-1.5 rounded-full bg-secondary text-primary text-xs leading-[22px] font-bold text-center">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
      <div className="mt-auto pt-4 px-3 border-t border-white/15 flex items-center justify-between gap-3">
        <span className="text-sm text-white/70">Spoot Admin</span>
        <button
          onClick={handleLogout}
          className="min-h-11 px-4 inline-flex items-center gap-2 rounded-full border border-white/30 text-sm font-heading font-semibold text-white hover:bg-white/[0.08]"
        >
          <Icon name="logout" size={18} />
          Wyloguj
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Komputer: menu boczne */}
      <aside className="hidden lg:flex w-[248px] shrink-0 bg-primaryLight text-white flex-col gap-6 px-3 pt-6 pb-4 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-2.5 px-3">
          <Logo variant="kolor-ciemne" size={22} />
          <AdminTag />
        </div>
        <nav aria-label="Menu panelu" className="flex-1 flex flex-col gap-6">{nav(false)}</nav>
      </aside>

      {/* Telefon i tablet: górny pasek + menu na cały ekran */}
      <header className="lg:hidden sticky top-0 z-30 h-[60px] bg-primaryLight text-white flex items-center gap-1.5 pl-1.5 pr-3">
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Otwórz menu"
          aria-expanded={menuOpen}
          className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-white/[0.08]"
        >
          <Icon name="menu" size={24} />
        </button>
        <Link href="/dashboard" className="flex items-center gap-1.5">
          <Logo variant="kolor-ciemne" size={18} />
          <AdminTag />
        </Link>
        {Object.values(counts).some(c => c > 0) && (
          <span className="ml-auto text-xs font-heading font-bold text-primary bg-secondary rounded-full px-2 py-0.5">
            {Object.values(counts).reduce((a, b) => a + b, 0)} do przejrzenia
          </span>
        )}
      </header>
      {menuOpen && (
        <div role="dialog" aria-modal="true" aria-label="Menu panelu" className="lg:hidden fixed inset-0 z-40 bg-primaryLight text-white overflow-y-auto flex flex-col gap-5 px-3 pb-6">
          <div className="h-[60px] flex items-center gap-1.5 pl-3 -mx-0.5">
            <Logo variant="kolor-ciemne" size={18} />
            <AdminTag />
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Zamknij menu"
              className="ml-auto w-11 h-11 flex items-center justify-center rounded-lg hover:bg-white/[0.08]"
            >
              <Icon name="close" size={24} />
            </button>
          </div>
          <nav aria-label="Menu panelu" className="flex-1 flex flex-col gap-5">{nav(true)}</nav>
        </div>
      )}
    </>
  );
}
