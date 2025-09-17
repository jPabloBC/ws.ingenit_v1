'use client';
import dynamic from 'next/dynamic';
import { useState, useCallback } from 'react';
import { AlertTriangle, Package, ShoppingCart, TrendingUp, Users } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import QuickStat from "@/components/ui/QuickStat";
import { getDatabaseStatus } from "@/lib/databaseCheck";
import { supabase } from '@/services/supabase/client';
import { useOncePerUser } from "@/hooks/useOncePerUser";
import { useStore } from '@/contexts/StoreContext';

function Dashboard() {
  const { user, loading } = useAuth();
  const { loading: storeLoading, currentBusiness } = useStore();
  const [storeType, setStoreType] = useState<string>('restaurant');
  const [stats, setStats] = useState({ products: 0, salesToday: 0, customers: 0, ordersToday: 0 });
  const [recentSales, setRecentSales] = useState<Array<{ id: string; title: string; subtitle: string; amount: number }>>([]);
  const [stockAlerts, setStockAlerts] = useState<Array<{ id: string; name: string; stock: number }>>([]);

  const router = useRouter();


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  // Función de carga de datos que se ejecutará SOLO UNA VEZ por usuario
  const loadDashboardData = useCallback(async () => {
  console.log('🔄 Dashboard - Cargando datos por negocio (useOncePerUser) para user:', user?.id, 'business:', currentBusiness?.id);
    
    try {
      // Verificar estado de la base de datos
      const status = await getDatabaseStatus();
      if (status.status === 'error') {
        console.warn('⚠️ Problema con la base de datos:', status.message);
      }

      // Cargar datos por negocio (user_id + business_id)
      if (!currentBusiness?.id) {
        console.warn('⚠️ currentBusiness no disponible; se omite carga de métricas');
        return;
      }
      // Productos: contar productos del usuario actual en el negocio
      const { count: productsCountRaw, error: productsErr } = await supabase
        .from('ws_products')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('business_id', currentBusiness.id);
      if (productsErr) console.warn('Productos count error:', productsErr.message);
      const productsCount = productsCountRaw || 0;
      
      // Ventas de hoy
      const today = new Date();
      today.setHours(0,0,0,0);
      const { data: salesTodayRows, error: salesTodayErr } = await supabase
        .from('ws_sales')
        .select('total_amount, created_at')
        .eq('user_id', user!.id)
        .eq('business_id', currentBusiness.id)
        .gte('created_at', today.toISOString());
      if (salesTodayErr) console.warn('Ventas hoy error:', salesTodayErr.message);
      const salesToday = (salesTodayRows || []).reduce((sum: number, r:any) => sum + (r.total_amount||0), 0);
      const ordersToday = (salesTodayRows || []).length;
      
      // Clientes (si existe tabla)
      const { count: customersCount, error: customersErr } = await supabase
        .from('ws_customers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('business_id', currentBusiness.id);
      if (customersErr) console.warn('Clientes count error:', customersErr.message);
      const customers = customersCount || 0;
      
      setStats({ products: productsCount || 0, salesToday, customers, ordersToday });

      // Ventas recientes
      const { data: recent, error: recentErr } = await supabase
        .from('ws_sales')
        .select('id,total_amount,created_at')
        .eq('user_id', user!.id)
        .eq('business_id', currentBusiness.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (recentErr) console.warn('Ventas recientes error:', recentErr.message);
      setRecentSales((recent||[]).map((r:any) => ({
        id: r.id,
        title: 'Venta',
        subtitle: new Date(r.created_at).toLocaleString(),
        amount: r.total_amount || 0,
      })));

      // Alertas de stock: stock <= min_stock
      const { data: low, error: lowErr } = await supabase
        .from('ws_products')
        .select('id,name,stock,min_stock')
        .eq('user_id', user!.id)
        .eq('business_id', currentBusiness.id)
        .limit(5);
      if (lowErr) console.warn('Productos bajo stock error:', lowErr.message);
      // Filtrar en el cliente para stock <= min_stock
      const lowStockProducts = (low || []).filter((p: any) => p.stock <= p.min_stock);
      setStockAlerts(lowStockProducts.map((p:any) => ({ id: p.id, name: p.name, stock: p.stock })));
      
    } catch (e) {
      console.warn('No se pudieron cargar métricas reales:', e);
    }
  }, [user?.id, currentBusiness?.id]);

  // Ejecutar sólo cuando usuario + negocio listos. Clave incluye business para recargar al cambiar.
  useOncePerUser(loadDashboardData, user?.id && currentBusiness?.id ? `${user.id}:${currentBusiness.id}` : undefined);

  // SecurityGuard ya verificó la autenticación

  if (loading || storeLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-b-2 border-blue-600 rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Preparando tu panel...</p>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no hay datos reales
  const noData =
    stats.products === 0 &&
    stats.salesToday === 0 &&
    stats.customers === 0 &&
    stats.ordersToday === 0 &&
    recentSales.length === 0 &&
    stockAlerts.length === 0;

  return (
    <div className="px-4 md:px-6">
      <div className="mb-4 md:mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">Bienvenido, {user?.email || 'Usuario'}</p>
      </div>

      {noData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
            <div>
              <p className="font-semibold text-yellow-800">No hay datos para el negocio seleccionado.</p>
              <p className="text-yellow-700 text-sm">Aún no se han registrado productos, ventas ni clientes para este negocio.</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <QuickStat title="Productos" value={String(stats.products)} icon={Package} color="bg-blue-600 text-white" />
        <QuickStat title="Ventas Hoy" value={formatCurrency(stats.salesToday)} icon={TrendingUp} color="bg-green-500 text-white" />
        <QuickStat title="Clientes" value={String(stats.customers)} icon={Users} color="bg-purple-500 text-white" />
        <QuickStat title="Órdenes" value={String(stats.ordersToday)} icon={ShoppingCart} color="bg-orange-500 text-white" />
      </div>

      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 md:mb-4">
            Ventas Recientes
          </h3>
          <div className="space-y-3 md:space-y-4">
            {recentSales.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no hay ventas.</p>
            ) : recentSales.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <p className="font-medium text-gray-900">{s.title}</p>
                  <p className="text-sm text-gray-500">{s.subtitle}</p>
                </div>
                <span className="text-green-600 font-semibold">{formatCurrency(s.amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 md:mb-4">
            Alertas de Stock
          </h3>
          <div className="space-y-3 md:space-y-4">
            {stockAlerts.length === 0 ? (
              <p className="text-sm text-gray-500">Sin alertas de stock.</p>
            ) : stockAlerts.map(p => (
              <div key={p.id} className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <div>
                  <p className="font-medium text-red-800">{p.name} - Stock bajo</p>
                  <p className="text-sm text-red-600">Quedan {p.stock} unidades</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Available Modules */}
      <div className="mt-6 md:mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 md:mb-4">
          Módulos Disponibles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-2 md:space-x-3">
              <Package className="h-6 md:h-8 w-6 md:w-8 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">Inventario</h4>
                <p className="text-sm text-gray-500">Gestionar productos</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-2 md:space-x-3">
              <ShoppingCart className="h-6 md:h-8 w-6 md:w-8 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900">Ventas</h4>
                <p className="text-sm text-gray-500">Procesar ventas</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-2 md:space-x-3">
              <Users className="h-6 md:h-8 w-6 md:w-8 text-purple-600" />
              <div>
                <h4 className="font-medium text-gray-900">Clientes</h4>
                <p className="text-sm text-gray-500">Gestionar clientes</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center space-x-2 md:space-x-3">
              <TrendingUp className="h-6 md:h-8 w-6 md:w-8 text-orange-600" />
              <div>
                <h4 className="font-medium text-gray-900">Reportes</h4>
                <p className="text-sm text-gray-500">Ver estadísticas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(Dashboard), {
  ssr: false
}); 