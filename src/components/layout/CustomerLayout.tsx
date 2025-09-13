'use client';
// Removido: import no usado
import { ReactNode, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from './Header';
import DashboardHeader from './DashboardHeader';
import Sidebar from './Sidebar';
// import CustomerRouteGuard from '@/components/auth/CustomerRouteGuard';

interface CustomerLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  isLandingPage?: boolean;
}

export default function CustomerLayout({ children, showSidebar = true, isLandingPage = false }: CustomerLayoutProps) {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Mock store config for now
  const storeConfig = {
    name: 'Mi Tienda',
    type: 'restaurant',
    modules: []
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleStoreChange = () => {
    // TODO: Implementar lógica para cambiar de tienda
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
        ) : user && storeConfig ? (
          <DashboardHeader
            user={user}
            storeName={storeConfig.name}
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
          {showSidebar && user && storeConfig && (
            <Sidebar
              isOpen={sidebarOpen}
              onClose={handleSidebarClose}
              storeConfig={storeConfig}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={handleSidebarToggleCollapse}
            />
          )}

          {/* Page Content - Scrollable */}
          <main className={`flex-1 transition-all duration-300 overflow-auto pt-16 ${
            showSidebar ? (sidebarCollapsed ? 'md:ml-16' : 'md:ml-64') : ''
          }`}>
            {children}
          </main>
        </div>
      </div>
  );
}
