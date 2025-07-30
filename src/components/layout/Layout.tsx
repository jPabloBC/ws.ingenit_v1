'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { storeType, storeConfig, clearStoreType } = useStore();

  const handleSignOut = async () => {
    await signOut();
    clearStoreType();
  };

  const handleStoreChange = () => {
    clearStoreType();
  };

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!user || !storeConfig) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        storeConfig={storeConfig}
      />
      
      <div className="md:ml-64">
        <Header
          user={user}
          storeName={storeConfig.name}
          onSignOut={handleSignOut}
          onStoreChange={handleStoreChange}
          onMenuClick={handleMenuClick}
        />
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 