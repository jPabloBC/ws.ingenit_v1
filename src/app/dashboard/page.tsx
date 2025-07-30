'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import QuickStat from '@/components/ui/QuickStat';
import WelcomeCard from '@/components/ui/WelcomeCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { getProducts } from '@/services/supabase/products';
import { getSales } from '@/services/supabase/sales';
import { getCustomers } from '@/services/supabase/customers';
import { formatCurrency } from '@/lib/currency';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalProducts: number;
  totalSales: number;
  totalCustomers: number;
  totalRevenue: number;
  lowStockProducts: number;
  recentSales: any[];
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { storeConfig, loading: storeLoading } = useStore();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalSales: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
    recentSales: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (storeLoading) {
      return;
    }

    if (!storeConfig) {
      router.push('/select-store');
      return;
    }

    loadDashboardData();
  }, [user, storeConfig, storeLoading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Cargar datos en paralelo
      const [products, sales, customers] = await Promise.all([
        getProducts().catch(() => []),
        getSales().catch(() => []),
        getCustomers().catch(() => [])
      ]);

      // Calcular estadísticas
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
      const lowStockProducts = products.filter(p => p.stock <= p.min_stock).length;
      const recentSales = sales.slice(0, 5);

      setStats({
        totalProducts: products.length,
        totalSales: sales.length,
        totalCustomers: customers.length,
        totalRevenue,
        lowStockProducts,
        recentSales
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-product':
        router.push('/inventory/add');
        break;
      case 'new-sale':
        router.push('/sales/new');
        break;
      case 'add-customer':
        router.push('/customers/add');
        break;
      case 'view-reports':
        router.push('/reports');
        break;
      default:
        break;
    }
  };

  if (storeLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!storeConfig) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Bienvenido a {storeConfig.name}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickStat
            title="Total Productos"
            value={stats.totalProducts}
            icon={Package}
            color="blue"
          />
          <QuickStat
            title="Total Ventas"
            value={stats.totalSales}
            icon={ShoppingCart}
            color="green"
          />
          <QuickStat
            title="Total Clientes"
            value={stats.totalCustomers}
            icon={Users}
            color="purple"
          />
          <QuickStat
            title="Ingresos Totales"
            value={formatCurrency(stats.totalRevenue)}
            icon={DollarSign}
            color="orange"
          />
        </div>

        {/* Alerts */}
        {stats.lowStockProducts > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    {stats.lowStockProducts} productos con stock bajo
                  </p>
                  <p className="text-xs text-orange-600">
                    Revisa el inventario para reabastecer
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <WelcomeCard
            title="Agregar Producto"
            description="Registra un nuevo producto en el inventario"
            icon={Plus}
            color="blue"
            onClick={() => handleQuickAction('add-product')}
          />
          <WelcomeCard
            title="Nueva Venta"
            description="Procesa una venta rápidamente"
            icon={ShoppingCart}
            color="green"
            onClick={() => handleQuickAction('new-sale')}
          />
          <WelcomeCard
            title="Agregar Cliente"
            description="Registra un nuevo cliente"
            icon={Users}
            color="purple"
            onClick={() => handleQuickAction('add-customer')}
          />
          <WelcomeCard
            title="Ver Reportes"
            description="Analiza el rendimiento del negocio"
            icon={BarChart3}
            color="orange"
            onClick={() => handleQuickAction('view-reports')}
          />
        </div>

        {/* Recent Sales */}
        {stats.recentSales.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ventas Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        Venta #{sale.sale_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        {formatCurrency(sale.total_amount)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sale.payment_method}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Store Modules */}
        <Card>
          <CardHeader>
            <CardTitle>Módulos Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {storeConfig.modules.slice(1).map((module) => (
                <div
                  key={module.path}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => router.push(module.path)}
                >
                  <h3 className="font-medium text-gray-900">{module.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Gestiona {module.name.toLowerCase()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 