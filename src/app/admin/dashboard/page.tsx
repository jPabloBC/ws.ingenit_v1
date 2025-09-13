'use client';
import { useState, useEffect } from 'react';
import { Menu, Shield, Users, Store, DollarSign, TrendingUp, Activity, Code, Database, Bug, Settings, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
interface AdminStats {
  totalUsers: number;
  totalStores: number;
  totalCustomers: number;
  totalSales: number;
  activeStores: number;
  newUsersThisMonth: number;
}

export default function AdminDashboard() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalStores: 0,
    totalCustomers: 0,
    totalSales: 0,
    activeStores: 0,
    newUsersThisMonth: 0
  });

  useEffect(() => {
    if (user) {
      loadAdminStats();
    }
  }, [user]);

  // Removido: función no usada















  const loadAdminStats = async () => {
    try {
      setLoading(true);

      // Obtener estadísticas globales
      const [
        { count: totalUsers },
        { count: totalCustomers },
        { count: totalSales }
      ] = await Promise.all([
        supabase.from('ws_users').select('*', { count: 'exact', head: true }),
        supabase.from('ws_customers').select('*', { count: 'exact', head: true }),
        supabase.from('ws_sales').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalUsers: totalUsers || 0,
        totalStores: 0, // TODO: Implement store count
        totalCustomers: totalCustomers || 0,
        totalSales: totalSales || 0,
        activeStores: 0, // TODO: Implement active store count
        newUsersThisMonth: 0 // TODO: Implement new users this month
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
      toast.error('Error cargando estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <Menu className="h-6 w-6" />
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
                  <p className="text-gray-600">Gestión global del sistema</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Administrador</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Store className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tiendas Activas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeStores}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Clientes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Nuevos Usuarios (Mes)</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.newUsersThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sistema</p>
                  <p className="text-2xl font-bold text-gray-900">Activo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas - Comunes para Admin y Dev */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestionar Usuarios</h3>
                <p className="text-sm text-gray-600 mb-4">Ver y administrar todos los usuarios del sistema</p>
                <Button onClick={() => window.location.href = '/admin/users'} className="w-full">
                  Acceder
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <Store className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestionar Tiendas</h3>
                <p className="text-sm text-gray-600 mb-4">Administrar todas las tiendas registradas</p>
                <Button onClick={() => window.location.href = '/admin/stores'} className="w-full">
                  Acceder
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Todos los Clientes</h3>
                <p className="text-sm text-gray-600 mb-4">Ver clientes de todas las tiendas</p>
                <Button onClick={() => window.location.href = '/admin/customers'} className="w-full">
                  Acceder
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reportes</h3>
                <p className="text-sm text-gray-600 mb-4">Análisis y reportes del sistema</p>
                <Button onClick={() => window.location.href = '/admin/reports'} className="w-full">
                  Acceder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección exclusiva para Desarrolladores */}
        {userRole === 'dev' && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Code className="h-6 w-6 mr-2 text-blue-600" />
              Herramientas de Desarrollo
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-blue-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Database className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Base de Datos</h3>
                    <p className="text-sm text-gray-600 mb-4">Gestión y mantenimiento de la base de datos</p>
                    <Button onClick={() => window.location.href = '/admin/database'} className="w-full">
                      Acceder
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-red-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Bug className="h-12 w-12 text-red-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Herramientas Dev</h3>
                    <p className="text-sm text-gray-600 mb-4">Reset BD, cache, logs y debugging</p>
                    <Button onClick={() => window.location.href = '/admin/dev-tools'} className="w-full">
                      Acceder
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow border-green-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Settings className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Configuración Avanzada</h3>
                    <p className="text-sm text-gray-600 mb-4">Configuración del sistema y variables de entorno</p>
                    <Button onClick={() => window.location.href = '/admin/settings'} className="w-full">
                      Acceder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
