'use client';
// Removido: import no usado
import { LogOut, Menu, Store } from 'lucide-react';
import Button from "@/components/ui/Button";

interface DashboardHeaderProps {
  user: any;
  storeName: string;
  onSignOut: () => void;
  onStoreChange: () => void;
  onMenuClick: () => void;
}

export default function DashboardHeader({ 
  user, 
  storeName, 
  onSignOut, 
  onStoreChange, 
  onMenuClick 
}: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0 fixed top-0 left-0 right-0 z-40 m-0">
      <div className="flex items-center justify-between px-6 py-4 m-0">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <Store className="h-6 w-6 text-blue8" />
            <h1 className="text-xl font-semibold text-gray-900">{storeName}</h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
            <p className="text-xs text-gray-500">Usuario activo</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={onStoreChange}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
            >
              Cambiar Tienda
            </Button>
            
            <Button
              variant="outline"
              onClick={onSignOut}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 