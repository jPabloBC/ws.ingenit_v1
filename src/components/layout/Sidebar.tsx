'use client';

import { useRouter } from 'next/navigation';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  Folder, 
  Truck, 
  Wrench, 
  Clipboard, 
  Calendar, 
  User, 
  BarChart, 
  Settings,
  X,
  Crown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Module {
  name: string;
  path: string;
  icon: string;
}

interface StoreConfig {
  name: string;
  modules: Module[];
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  storeConfig: StoreConfig;
}

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Home,
  Package,
  ShoppingCart,
  Users,
  Folder,
  Truck,
  Wrench,
  Clipboard,
  Calendar,
  User,
  BarChart,
  Settings
};

export default function Sidebar({ isOpen, onClose, storeConfig }: SidebarProps) {
  const router = useRouter();
  const { user } = useAuth();

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{storeConfig.name}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {storeConfig.modules.map((module) => {
              const IconComponent = iconMap[module.icon];
              return (
                <button
                  key={module.path}
                  onClick={() => handleNavigation(module.path)}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  {IconComponent && <IconComponent className="mr-3 h-5 w-5" />}
                  {module.name}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={() => handleNavigation('/subscription')}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            >
              <Crown className="mr-3 h-4 w-4" />
              Suscripción
            </button>
            <div className="text-xs text-gray-500">
              Ingenit Store Manager v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 