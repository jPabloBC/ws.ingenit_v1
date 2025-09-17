'use client';
// Removido: import no usado
import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import Header from './Header';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  isLandingPage?: boolean;
}

export default function Layout({ children, showSidebar = true, isLandingPage = false }: LayoutProps) {
  const { user, signOut } = useAuth();
  const { storeConfig, loading: storeLoading } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleStoreChange = () => {
    // Implementar lógica para cambiar de tienda
    console.log('Cambiar tienda');
  };

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  const handleSidebarToggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header - Fixed */}
      {isLandingPage ? (
        <Header />
      ) : user ? (
        <DashboardHeader
          user={user}
          storeName={storeConfig?.name || 'Mi Negocio'}
          onSignOut={handleSignOut}
          onStoreChange={handleStoreChange}
          onMenuClick={handleMenuClick}
        />
      ) : (
        <Header />
      )}

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar - Fixed */}
        {showSidebar && user && !storeLoading && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={handleSidebarClose}
            storeConfig={storeConfig || { name: 'Mi Negocio', modules: [] }}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleSidebarToggleCollapse}
          />
        )}

        {/* Page Content - Scrollable */}
        <main className={`flex-1 transition-all duration-300 overflow-auto mt-20 ${
          showSidebar ? (sidebarCollapsed ? 'md:ml-16' : 'md:ml-48') : ''
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
} 