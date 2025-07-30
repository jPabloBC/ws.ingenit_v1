'use client';

import { Menu, LogOut, Store } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface HeaderProps {
  user: User;
  storeName: string;
  onSignOut: () => void;
  onStoreChange: () => void;
  onMenuClick: () => void;
}

export default function Header({ user, storeName, onSignOut, onStoreChange, onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <Store className="h-6 w-6 text-blue-600" />
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
            <button
              onClick={onStoreChange}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cambiar Tienda
            </button>
            
            <button
              onClick={onSignOut}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 