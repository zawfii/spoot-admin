import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <main className="flex-1 min-w-0 px-4 pt-6 pb-10 sm:px-6 lg:px-12 lg:pt-10 lg:pb-14">{children}</main>
    </div>
  );
}
