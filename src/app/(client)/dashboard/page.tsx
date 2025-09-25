"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { Package, TrendingUp, Users, AlertTriangle, DollarSign } from 'lucide-react';
import { supabase } from '@/services/supabase/client';

interface QuickStatProps {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
}

function QuickStat({ title, value, icon: Icon, color }: QuickStatProps) {
  return (
    <div className={`${color} p-4 rounded-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <Icon className="h-8 w-8 opacity-80" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { loading: storeLoading, currentBusiness } = useStore();
  
  // Estados locales simples
  const [stats, setStats] = useState({ products: 0, salesToday: 0, customers: 0, ordersToday: 0, inventoryValue: 0 });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Función simple para cargar datos
  const loadDashboardData = useCallback(async () => {
    if (isLoading || !currentBusiness?.id || !user?.id) return;
    
    setIsLoading(true);
    
    try {
      // Consulta simple a productos
      const { data: productData, error: productError } = await supabase
        .from('ws_products')
        .select('id, name, stock, min_stock, price')
        .eq('business_id', currentBusiness.id);
      
      if (productError) {
        console.warn('Error productos:', productError);
        setStats({ products: 0, inventoryValue: 0, salesToday: 0, customers: 0, ordersToday: 0 });
        setStockAlerts([]);
        return;
      }
      
      const productList = productData || [];
      const productsCount = productList.length;
      const inventoryValue = productList.reduce((sum: number, p: any) => sum + (Number(p.price || 0) * Number(p.stock || 0)), 0);
      
      // Calcular alertas de stock
      const allStockAlerts = productList
        .filter(p => Number(p.stock || 0) <= Number(p.min_stock || 0))
        .map(p => ({
          id: p.id,
          name: p.name,
          stock: Number(p.stock || 0),
          min_stock: Number(p.min_stock || 0),
          price: Number(p.price || 0)
        }));
      
      setStats({
        products: productsCount,
        inventoryValue: inventoryValue,
        salesToday: 0,
        customers: 0,
        ordersToday: 0
      });
      
      setStockAlerts(allStockAlerts);
      
      // Consultar ventas recientes
      const { data: salesData, error: salesError } = await supabase
        .from('ws_sales')
        .select('id, total_amount, created_at, sale_number')
        .eq('business_id', currentBusiness.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (salesError) {
        console.warn('Error ventas:', salesError);
        setRecentSales([]);
      } else {
        setRecentSales(salesData || []);
      }
      
    } catch (e) {
      console.warn('Error:', e);
      setStats({ products: 0, inventoryValue: 0, salesToday: 0, customers: 0, ordersToday: 0 });
      setStockAlerts([]);
      setRecentSales([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentBusiness?.id, user?.id, isLoading]);

  // Cargar datos al montar el componente
  useEffect(() => {
    if (user?.id && currentBusiness?.id) {
      loadDashboardData();
    }
  }, [user?.id, currentBusiness?.id, loadDashboardData]);


  // SecurityGuard ya verificó la autenticación
  if (loading || storeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6">
      <div className="mb-4 md:mb-8 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Bienvenido, {user?.email || 'Usuario'}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <QuickStat 
          title="Productos" 
          value={String(stats.products)} 
          icon={Package} 
          color="bg-blue-600 text-white" 
        />
        <QuickStat 
          title="Valor Inventario" 
          value={`$${stats.inventoryValue?.toLocaleString() || '0'}`} 
          icon={DollarSign} 
          color="bg-green-600 text-white" 
        />
        <QuickStat 
          title="Ventas Hoy" 
          value={`$${stats.salesToday?.toLocaleString() || '0'}`} 
          icon={TrendingUp} 
          color="bg-purple-600 text-white" 
        />
        <QuickStat 
          title="Clientes" 
          value={String(stats.customers)} 
          icon={Users} 
          color="bg-orange-600 text-white" 
        />
      </div>

      {/* Alertas de Stock Bajo */}
      {stockAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-red-800">Alertas de Stock Bajo</h3>
            </div>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
              {stockAlerts.length} producto(s)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stockAlerts.map((alert) => (
              <div key={alert.id} className="bg-white p-4 rounded-lg border border-red-200 hover:border-red-300 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900 text-sm">{alert.name}</h4>
                  <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                    ID: {alert.id}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Stock actual:</span>
                    <span className="text-red-600 font-semibold text-sm">{alert.stock} unidades</span>
              </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm">Stock mínimo:</span>
                    <span className="text-gray-800 font-medium text-sm">{alert.min_stock} unidades</span>
          </div>
                  {alert.price && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Precio:</span>
                      <span className="text-green-600 font-medium text-sm">${alert.price.toLocaleString()}</span>
        </div>
                  )}
                </div>
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Déficit:</span>
                    <span className="text-red-600 font-semibold text-sm">
                      {Math.max(0, alert.min_stock - alert.stock)} unidades
                    </span>
        </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ventas Recientes */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas Recientes</h3>
        {recentSales.length > 0 ? (
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">
                    {sale.sale_number ? `Venta #${sale.sale_number}` : `Venta #${sale.id}`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(sale.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="font-semibold text-green-600">
                  ${sale.total_amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay ventas recientes</p>
            <p className="text-sm text-gray-400 mt-1">Las ventas aparecerán aquí una vez que se realicen</p>
          </div>
        )}
      </div>
    </div>
  );
}