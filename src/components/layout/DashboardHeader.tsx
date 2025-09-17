'use client';
import { LogOut, Menu } from 'lucide-react';
import Image from "next/image";
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
    <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0 fixed top-0 left-0 right-0 z-50 m-0 h-16">
      <div className="flex items-center justify-between px-4 md:px-6 py-2 m-0 h-full">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-2 md:space-x-3">
            <Image
              src="/assets/icon_ingenIT.png"
              alt="IngenIT"
              width={48}
              height={48}
              className="h-8 md:h-10 w-auto"
            />
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-normal text-gray8 leading-tight">IngenIT</h1>
              <p className="text-xs md:text-sm text-gray5 leading-tight hidden sm:block">{storeName}</p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <div className="hidden lg:block text-right">
            <p className="text-sm font-medium text-gray-900 truncate max-w-32">{user.email}</p>
            <p className="text-xs text-gray-500">Usuario activo</p>
          </div>
          
          <div className="flex items-center space-x-1 md:space-x-2">
            <Button
              variant="outline"
              onClick={onStoreChange}
              className="px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 hidden sm:flex"
            >
              <span className="hidden md:inline">Cambiar Tienda</span>
              <span className="md:hidden">Tienda</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={onSignOut}
              className="flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1 md:py-2 text-xs md:text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 