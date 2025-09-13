'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { AlertTriangle, Package, ShoppingCart, TrendingUp, Users, Store } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import QuickStat from "@/components/ui/QuickStat";
import WelcomeCard from "@/components/ui/WelcomeCard";
import { getDatabaseStatus } from "@/lib/databaseCheck";
import SecurityGuard from "@/components/SecurityGuard";
import { supabase } from '@/services/supabase/client';

function Dashboard() {
  const { user, loading, userRole } = useAuth();
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

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user && !storeType) {
      // Solo redirigir si el usuario está autenticado, no tiene store seleccionado
      // y no es dev/admin (ellos no necesitan store config)
      if (userRole !== 'dev' && userRole !== 'admin' && window.location.pathname !== '/select-store') {
        router.push("/select-store");
      }
    }
  }, [user, loading, storeType, userRole, router]);



  // Verificar estado de la base de datos al cargar
  useEffect(() => {
    if (user) {
      getDatabaseStatus().then(status => {
        if (status.status === 'error') {
          console.warn('⚠️ Problema con la base de datos:', status.message);
        }
      });
      // Cargar datos reales
      (async () => {
        try {
          // Productos
          const { count: productsCount } = await supabase
            .from('ws_products')
            .select('id', { count: 'exact', head: true });
          // Ventas de hoy
          const today = new Date();
          today.setHours(0,0,0,0);
          const { data: salesTodayRows } = await supabase
            .from('ws_sales')
            .select('total_amount, created_at')
            .gte('created_at', today.toISOString());
          const salesToday = (salesTodayRows || []).reduce((sum: number, r:any) => sum + (r.total_amount||0), 0);
          const ordersToday = (salesTodayRows || []).length;
          // Clientes (si existe tabla)
          let customers = 0;
          try {
            const { count: customersCount } = await supabase
              .from('ws_customers')
              .select('id', { count: 'exact', head: true });
            customers = customersCount || 0;
          } catch {}
          setStats({ products: productsCount || 0, salesToday, customers, ordersToday });

          // Ventas recientes
          const { data: recent } = await supabase
            .from('ws_sales')
            .select('id,total_amount,created_at')
            .order('created_at', { ascending: false })
            .limit(3);
          setRecentSales((recent||[]).map((r:any) => ({
            id: r.id,
            title: 'Venta',
            subtitle: new Date(r.created_at).toLocaleString(),
            amount: r.total_amount || 0,
          })));

                      // Alertas de stock: stock <= min_stock
            const { data: low } = await supabase
              .from('ws_products')
              .select('id,name,stock,min_stock')
              .limit(5);
            // Filtrar en el cliente para stock <= min_stock
            const lowStockProducts = (low || []).filter((p: any) => p.stock <= p.min_stock);
            setStockAlerts(lowStockProducts.map((p:any) => ({ id: p.id, name: p.name, stock: p.stock })));
        } catch (e) {
          console.warn('No se pudieron cargar métricas reales:', e);
        }
      })();
    }
  }, [user]);

  // Recargar datos cuando la página se vuelve visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user && storeType) {
        console.log('Página visible, recargando dashboard...');
        // Recargar datos del dashboard
        (async () => {
          try {
            // Productos
            const { count: productsCount } = await supabase
              .from('ws_products')
              .select('id', { count: 'exact', head: true });
            // Ventas de hoy
            const today = new Date();
            today.setHours(0,0,0,0);
            const { data: salesTodayRows } = await supabase
              .from('ws_sales')
              .select('total_amount, created_at')
              .gte('created_at', today.toISOString());
            const salesToday = (salesTodayRows || []).reduce((sum: number, r:any) => sum + (r.total_amount||0), 0);
            const ordersToday = (salesTodayRows || []).length;
            // Clientes (si existe tabla)
            let customers = 0;
            try {
              const { count: customersCount } = await supabase
                .from('ws_customers')
                .select('id', { count: 'exact', head: true });
              customers = customersCount || 0;
            } catch {}
            setStats({ products: productsCount || 0, salesToday, customers, ordersToday });

            // Ventas recientes
            const { data: recent } = await supabase
              .from('ws_sales')
              .select('id,total_amount,created_at')
              .order('created_at', { ascending: false })
              .limit(3);
            setRecentSales((recent||[]).map((r:any) => ({
              id: r.id,
              title: 'Venta',
              subtitle: new Date(r.created_at).toLocaleString(),
              amount: r.total_amount || 0,
            })));

            // Alertas de stock: stock <= min_stock
            const { data: low } = await supabase
              .from('ws_products')
              .select('id,name,stock,min_stock')
              .limit(5);
            // Filtrar en el cliente para stock <= min_stock
            const lowStockProducts = (low || []).filter((p: any) => p.stock <= p.min_stock);
            setStockAlerts(lowStockProducts.map((p:any) => ({ id: p.id, name: p.name, stock: p.stock })));
          } catch (e) {
            console.warn('No se pudieron cargar métricas reales:', e);
          }
        })();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, storeType]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SecurityGuard>
      <Layout showSidebar={true}>
        <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Bienvenido, {user.email}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <QuickStat title="Productos" value={String(stats.products)} icon={Package} color="bg-blue-600 text-white" />
          <QuickStat title="Ventas Hoy" value={formatCurrency(stats.salesToday)} icon={TrendingUp} color="bg-green-500 text-white" />
          <QuickStat title="Clientes" value={String(stats.customers)} icon={Users} color="bg-purple-500 text-white" />
          <QuickStat title="Órdenes" value={String(stats.ordersToday)} icon={ShoppingCart} color="bg-orange-500 text-white" />
        </div>

        {/* Welcome Card */}
        <div className="mb-8">
          <WelcomeCard
            title="¡Bienvenido a Ingenit Store Manager!"
            description="Tu plataforma completa para gestionar inventario, ventas y clientes. Comienza explorando las diferentes secciones desde el menú lateral."
            icon={Store}
            color="blue"
          />
        </div>

        {/* Recent Activity & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Sales */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ventas Recientes
            </h3>
            <div className="space-y-4">
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Alertas de Stock
            </h3>
            <div className="space-y-4">
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
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Módulos Disponibles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <Package className="h-8 w-8 text-blue-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Inventario</h4>
                  <p className="text-sm text-gray-500">Gestionar productos</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-8 w-8 text-green-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Ventas</h4>
                  <p className="text-sm text-gray-500">Procesar ventas</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Clientes</h4>
                  <p className="text-sm text-gray-500">Gestionar clientes</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Reportes</h4>
                  <p className="text-sm text-gray-500">Ver estadísticas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
    </SecurityGuard>
  );
}

export default dynamic(() => Promise.resolve(Dashboard), {
  ssr: false
}); 