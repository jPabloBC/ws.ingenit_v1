'use client';
// Removido: import no usado
import { Activity, BarChart3, Bug, Code, Database, Settings, Shield, Terminal, Zap, Users, Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { supabase } from '@/services/supabase/client';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
interface DevStats {
  totalUsers: number;
  totalStores: number;
  totalCustomers: number;
  totalSales: number;
  totalProducts: number;
  systemStatus: string;
}

export default function DevPanel() {
  const [stats, setStats] = useState<DevStats>({
    totalUsers: 0,
    totalStores: 0,
    totalCustomers: 0,
    totalSales: 0,
    totalProducts: 0,
    systemStatus: 'Checking...'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevStats();
  }, []);

  const loadDevStats = async () => {
    setLoading(true);
    try {
      // Cargar estadísticas del sistema
      const [
        { count: users },
        { count: customers },
        { count: sales },
        { count: products }
      ] = await Promise.all([
        supabase.from('ws_users').select('*', { count: 'exact', head: true }),
        supabase.from('ws_customers').select('*', { count: 'exact', head: true }),
        supabase.from('ws_sales').select('*', { count: 'exact', head: true }),
        supabase.from('ws_products').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        totalUsers: users || 0,
        totalStores: users || 0, // Cada usuario es una tienda
        totalCustomers: customers || 0,
        totalSales: sales || 0,
        totalProducts: products || 0,
        systemStatus: 'Operativo'
      });
    } catch (error) {
      console.error('Error loading dev stats:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('ws_users').select('count').limit(1);
      if (error) throw error;
      toast.success('✅ Conexión a base de datos exitosa');
    } catch (error) {
      toast.error('❌ Error de conexión a base de datos');
    }
  };

  const clearCache = async () => {
    try {
      // Limpiar cache del navegador
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Limpiar localStorage
      localStorage.clear();
      
      toast.success('✅ Cache limpiado correctamente');
    } catch (error) {
      toast.error('❌ Error al limpiar cache');
    }
  };

  const resetDatabase = async () => {
    if (!confirm('⚠️ ¿Estás seguro? Esto eliminará todos los datos de prueba.')) {
      return;
    }

    try {
      // Eliminar datos de prueba (solo en desarrollo)
      await Promise.all([
        supabase.from('ws_sales').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('ws_customers').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('ws_products').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      ]);

      toast.success('✅ Base de datos reseteada');
      loadDevStats();
    } catch (error) {
      toast.error('❌ Error al resetear base de datos');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Code className="h-8 w-8 text-blue-600 mr-3" />
            Panel de Desarrollo
          </h1>
          <p className="text-gray-600 mt-2">
            Acceso completo al sistema - Solo para desarrolladores
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            🔧 Desarrollador
          </div>
        </div>
      </div>

      {/* Estadísticas del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <p className="text-sm font-medium text-gray-600">Total Tiendas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStores}</p>
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
              <BarChart3 className="h-8 w-8 text-yellow-600" />
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
              <Database className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Estado Sistema</p>
                <p className="text-2xl font-bold text-gray-900">{stats.systemStatus}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Herramientas de Desarrollo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Terminal className="h-5 w-5 mr-2" />
              Herramientas de Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testDatabaseConnection} className="w-full">
              <Database className="h-4 w-4 mr-2" />
              Probar Conexión BD
            </Button>
            
            <Button onClick={clearCache} variant="outline" className="w-full">
              <Zap className="h-4 w-4 mr-2" />
              Limpiar Cache
            </Button>
            
            <Button onClick={loadDevStats} variant="outline" className="w-full">
              <Activity className="h-4 w-4 mr-2" />
              Actualizar Estadísticas
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bug className="h-5 w-5 mr-2" />
              Mantenimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={resetDatabase} 
              variant="destructive" 
              className="w-full"
            >
              <Database className="h-4 w-4 mr-2" />
              Resetear BD (Pruebas)
            </Button>
            
            <Button variant="outline" className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Verificar Seguridad
            </Button>
            
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configuración Avanzada
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Información del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Ambiente:</strong> Desarrollo</p>
              <p><strong>Versión:</strong> 1.0.0</p>
              <p><strong>Base de Datos:</strong> Supabase</p>
            </div>
            <div>
              <p><strong>Framework:</strong> Next.js 14</p>
              <p><strong>UI:</strong> Tailwind CSS</p>
              <p><strong>Autenticación:</strong> Supabase Auth</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
