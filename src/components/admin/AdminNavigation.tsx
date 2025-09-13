'use client';
// Removido: import no usado
import { LogOut, Menu, Shield, X, BarChart3, Users, Store, Activity, Code, Database, Settings } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
const adminModules = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: BarChart3,
    description: 'Vista general del sistema',
    roles: ['admin', 'dev']
  },
  {
    name: 'Usuarios',
    href: '/admin/users',
    icon: Users,
    description: 'Gestionar usuarios del sistema',
    roles: ['admin', 'dev']
  },
  {
    name: 'Tiendas',
    href: '/admin/stores',
    icon: Store,
    description: 'Administrar tiendas registradas',
    roles: ['admin', 'dev']
  },
  {
    name: 'Clientes',
    href: '/admin/customers',
    icon: Users,
    description: 'Todos los clientes del sistema',
    roles: ['admin', 'dev']
  },
  {
    name: 'Reportes',
    href: '/admin/reports',
    icon: BarChart3,
    description: 'Análisis y estadísticas',
    roles: ['admin', 'dev']
  },
  {
    name: 'Actividad',
    href: '/admin/activity',
    icon: Activity,
    description: 'Logs y actividad del sistema',
    roles: ['admin', 'dev']
  },
  // Módulos exclusivos para DEV
  {
    name: 'Herramientas Dev',
    href: '/admin/dev-tools',
    icon: Code,
    description: 'Herramientas de desarrollo',
    roles: ['dev']
  },
  {
    name: 'Base de Datos',
    href: '/admin/database',
    icon: Database,
    description: 'Gestión de base de datos',
    roles: ['dev']
  },
  {
    name: 'Configuración',
    href: '/admin/settings',
    icon: Settings,
    description: 'Configuración del sistema',
    roles: ['admin', 'dev']
  }
];

export default function AdminNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, userRole, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation */}
      <nav className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600">Panel de Administración</p>
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {userRole === 'dev' ? '🔧 Desarrollador' : 
                   userRole === 'admin' ? '👑 Administrador' : 
                   '👤 Usuario'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation links */}
          <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 space-y-2">
              {adminModules
                .filter(module => module.roles.includes(userRole || 'user'))
                .map((module) => {
                  const Icon = module.icon;
                  const isActive = pathname === module.href;
                  
                  return (
                    <Link
                      key={module.href}
                      href={module.href}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${isActive 
                          ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600' 
                          : 'text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{module.name}</span>
                    </Link>
                  );
                })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-2">
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Store className="h-5 w-5" />
                <span>Ir al Sitio Principal</span>
              </Link>
              
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
