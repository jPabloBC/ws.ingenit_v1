'use client';
// Removido: import no usado
import { ChevronLeft, ChevronRight, Crown, X, Home, Package, ShoppingCart, Users, Folder, Truck, Wrench, Clipboard, Calendar, User, BarChart, Settings, FileText, CreditCard, Box, Warehouse, Table, Utensils, ClipboardList } from 'lucide-react';
import { useRouter } from 'next/navigation';
// Removido: import no usado
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
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  Settings,
  FileText,
  CreditCard,
  Box,
  Warehouse,
  Table,
  Utensils,
  ClipboardList
};

export default function Sidebar({ isOpen, onClose, storeConfig, isCollapsed = false, onToggleCollapse }: SidebarProps) {
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
        fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'w-16' : 'w-64'}
        md:fixed md:translate-x-0 md:top-16 md:bottom-0 md:z-30
      `}>
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <div className={`flex flex-col ${isCollapsed ? 'items-center w-full' : ''}`}>
              {!isCollapsed && (
                <>
                  <h2 className="text-lg font-semibold text-gray-900">{storeConfig.name}</h2>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </>
              )}
              {isCollapsed && (
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {storeConfig.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {/* Toggle collapse button - solo visible en pantallas medianas y grandes */}
              <button
                onClick={onToggleCollapse}
                className="hidden md:flex p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                title={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
              {/* Close button - solo visible en móviles */}
              <button
                onClick={onClose}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
            {storeConfig.modules.map((module) => {
              const IconComponent = iconMap[module.icon];
              return (
                <button
                  key={module.path}
                  onClick={() => handleNavigation(module.path)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors relative group ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                  title={isCollapsed ? module.name : undefined}
                >
                  <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
                    {IconComponent && <IconComponent className="h-5 w-5" />}
                    {!isCollapsed && <span className="ml-3">{module.name}</span>}
                  </div>
                  
                  {/* Tooltip para sidebar colapsado */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                      {module.name}
                      <div className="absolute top-1/2 right-full transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 space-y-2 flex-shrink-0">
            <button
              onClick={() => handleNavigation('/subscription')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium text-blue-600 rounded-md hover:bg-blue-50 transition-colors relative group ${
                isCollapsed ? 'justify-center' : ''
              }`}
              title={isCollapsed ? "Suscripción" : undefined}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
                <Crown className="h-4 w-4" />
                {!isCollapsed && <span className="ml-3">Suscripción</span>}
              </div>
              
              {/* Tooltip para sidebar colapsado */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Suscripción
                  <div className="absolute top-1/2 right-full transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                </div>
              )}
            </button>
            {!isCollapsed && (
              <div className="text-xs text-gray-500">
                Ingenit Store Manager v1.0
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 