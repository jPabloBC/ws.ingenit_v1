'use client';
// Removido: import no usado
import { ArrowLeft, Shield, Home, Users, Store, BarChart3, Activity, Database, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
// Removido: import no usado
import { useAuth } from '@/contexts/AuthContext';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const adminModules = [
  { name: "Dashboard", path: "/admin/dashboard", icon: Home },
  { name: "Usuarios", path: "/admin/users", icon: Users },
  { name: "Tiendas", path: "/admin/stores", icon: Store },
  { name: "Clientes", path: "/admin/customers", icon: Users },
  { name: "Reportes", path: "/admin/reports", icon: BarChart3 },
  { name: "Actividad", path: "/admin/activity", icon: Activity },
  { name: "Base de Datos", path: "/admin", icon: Database },
  { name: "Configuración", path: "/admin/settings", icon: Settings },
];

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const router = useRouter();
  const { user, userRole } = useAuth();

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleBackToStore = () => {
    // Redirigir según el rol del usuario
    if (userRole === 'dev' || userRole === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard');
    }
    onClose();
  };

  // Solo mostrar si el usuario es dev o admin
  if (userRole !== 'dev' && userRole !== 'admin') {
    return null;
  }

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
        fixed inset-y-0 left-0 z-50 bg-gray-900 text-white transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        w-64 md:fixed md:translate-x-0 md:top-0 md:bottom-0 md:z-30
      `}>
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
            {adminModules.map((module) => {
              const IconComponent = module.icon;
              return (
                <button
                  key={module.path}
                  onClick={() => handleNavigation(module.path)}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <IconComponent className="h-5 w-5 mr-3" />
                  <span>{module.name}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 space-y-2 flex-shrink-0">
            <button
              onClick={handleBackToStore}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-blue-400 rounded-md hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-3" />
              Volver a Tienda
            </button>
            <div className="text-xs text-gray-500 text-center">
              Ingenit Admin v1.0
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
