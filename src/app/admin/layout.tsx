'use client';
import { usePathname } from 'next/navigation';
import AdminNavigation from '@/components/admin/AdminNavigation';
import ConnectivityChecker from '@/components/ConnectivityChecker';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  return (
    <div className="min-h-screen bg-gray-50">
        {!isLoginPage && <AdminNavigation />}
        
        {/* Main content with conditional sidebar offset */}
        <div className={!isLoginPage ? "md:ml-64 min-h-screen" : "min-h-screen"}>
          <ConnectivityChecker>
            {children}
          </ConnectivityChecker>
        </div>
      </div>
  );
}
