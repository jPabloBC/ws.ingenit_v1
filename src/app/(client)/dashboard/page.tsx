"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { usePersistentState } from '@/hooks/usePersistentState';
import { Package, TrendingUp, Users, AlertTriangle, DollarSign } from 'lucide-react';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  
  // Estados persistentes para datos del dashboard - SOLO DATOS REALES
  const { state: stats, setState: setStats } = usePersistentState({
    key: `dashboard-stats-${currentBusiness?.id}`,
    defaultValue: { products: 0, salesToday: 0, customers: 0, ordersToday: 0, inventoryValue: 0 }
  });
  
  const { state: recentSales, setState: setRecentSales } = usePersistentState({
    key: `dashboard-recent-sales-${currentBusiness?.id}`,
    defaultValue: []
  });
  
  const { state: stockAlerts, setState: setStockAlerts } = usePersistentState({
    key: `dashboard-stock-alerts-${currentBusiness?.id}`,
    defaultValue: []
  });
  
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Función para cargar datos reales de Supabase con timeout agresivo
  const loadDashboardData = useCallback(async () => {
    // Protección contra múltiples llamadas simultáneas
    if (isLoading) {
      console.log('[Dash] ⏳ Ya hay una carga en progreso, saltando...');
      return;
    }
    
    // console.log('[Dash] 🔍 Cargando datos reales de Supabase...');
    setIsLoading(true);
    
    if (!currentBusiness?.id || !user?.id) {
      // console.log('[Dash] ⚠️ Datos faltantes, usando datos por defecto');
      setIsLoading(false);
      return;
    }
    
    try {
      // Consulta a productos con timeout de 30 segundos
      // console.log('[Dash] 📦 Consultando productos...');
      const productQuery = supabase
        .from('ws_products')
        .select('*')
        .eq('business_id', currentBusiness.id);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout productos')), 30000)
      );
      
      const { data: productData, error: productError } = await Promise.race([
        productQuery,
        timeoutPromise
      ]) as any;
      
      let productList: any[] = [];
      if (productError) {
        console.error('[Dash] ❌ Error productos:', productError);
        // NO DATOS HARDCODEADOS - usar array vacío si falla
        productList = [];
      } else {
        productList = productData || [];
        // console.log('[Dash] ✅ Productos obtenidos:', productList.length);
      }
      
  const productsCount = productList.length;
  const inventoryValue = productList.reduce((sum: number, p: any) => sum + (Number(p.price || 0) * Number(p.stock || 0)), 0);
      
      // Calcular alertas de stock reales
      const allStockAlerts = productList
        .filter(p => Number(p.stock || 0) <= Number(p.min_stock || 0))
        .map(p => ({
          id: p.id,
          name: p.name,
          stock: Number(p.stock || 0),
          min_stock: Number(p.min_stock || 0),
          price: Number(p.price || 0)
        }));
      
      // console.log('[Dash] ✅ Datos calculados:', { 
      //   productsCount, 
      //   inventoryValue, 
      //   stockAlertsCount: allStockAlerts.length 
      // });
      // console.log('[Dash] ✅ Alertas de stock:', allStockAlerts);
      
      // Actualizar estados con datos reales - SIN HARDCODEADOS
      setStats({
        products: productsCount,
        inventoryValue: inventoryValue,
        salesToday: 0, // TODO: Implementar consulta real de ventas
        customers: 0, // TODO: Implementar consulta real de clientes
        ordersToday: 0 // TODO: Implementar consulta real de órdenes
      });
      
      setStockAlerts(allStockAlerts);
      
      // Consultar ventas recientes reales
      try {
        // console.log('[Dash] 💰 Consultando ventas recientes...');
        const salesQuery = supabase
          .from('ws_sales')
          .select('id, total_amount, created_at, sale_number')
          .eq('business_id', currentBusiness.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        const salesTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ventas')), 5000)
        );
        
        const { data: salesData, error: salesError } = await Promise.race([
          salesQuery,
          salesTimeoutPromise
        ]) as any;
        
        if (salesError) {
          console.error('[Dash] ❌ Error ventas:', salesError);
          setRecentSales([]);
        } else {
          const recentSalesData = salesData || [];
          // console.log('[Dash] ✅ Ventas obtenidas:', recentSalesData.length);
          // console.log('[Dash] 📊 Datos de ventas:', recentSalesData);
          setRecentSales(recentSalesData);
        }
      } catch (e) {
        console.error('[Dash] Error consultando ventas:', e);
        setRecentSales([]);
      }
      
      // console.log('[Dash] ✅ Dashboard actualizado con datos reales');
    } catch (e) {
      console.error('[Dash] Error:', e);
      // En caso de error, mostrar 0 - NO DATOS HARDCODEADOS
      setStats({
        products: 0,
        inventoryValue: 0,
        salesToday: 0,
        customers: 0,
        ordersToday: 0
      });
      setStockAlerts([]);
      // No resetear ventas recientes en caso de error general
    } finally {
      setIsLoading(false);
    }
  }, [currentBusiness?.id, user?.id, setStats, setRecentSales, setStockAlerts, isLoading]);

  // Cargar datos automáticamente al montar el componente - UNA SOLA VEZ
  useEffect(() => {
    if (user?.id && currentBusiness?.id) {
      // console.log('[Dash] 🚀 Carga inicial automática');
      loadDashboardData();
    }
  }, [user?.id, currentBusiness?.id]); // Removido loadDashboardData de dependencias

  // SIN POLLING AUTOMÁTICO - Solo actualizar cuando sea necesario

  // SIN LISTENERS DE VISIBILIDAD - Solo carga inicial y manual

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
    } finally {
      setRefreshing(false);
    }
  };

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
        <button
          onClick={handleManualRefresh}
          className={`px-4 py-2 text-sm rounded-md border ${refreshing ? 'bg-gray-100 text-gray-500' : 'bg-blue-600 text-white hover:bg-blue-700'} `}
          disabled={refreshing}
          aria-busy={refreshing}
        >
          {refreshing ? 'Actualizando…' : '🔄 Actualizar Dashboard'}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        <QuickStat 
          title="Productos" 
          value={String((stats as any).products)} 
          icon={Package} 
          color="bg-blue-600 text-white" 
        />
        <QuickStat 
          title="Valor Inventario" 
          value={`$${(stats as any).inventoryValue?.toLocaleString() || '0'}`} 
          icon={DollarSign} 
          color="bg-green-600 text-white" 
        />
        <QuickStat 
          title="Ventas Hoy" 
          value={`$${(stats as any).salesToday?.toLocaleString() || '0'}`} 
          icon={TrendingUp} 
          color="bg-purple-600 text-white" 
        />
        <QuickStat 
          title="Clientes" 
          value={String((stats as any).customers)} 
          icon={Users} 
          color="bg-orange-600 text-white" 
        />
      </div>

      {/* Alertas de Stock Bajo */}
      {(stockAlerts as any[]).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-red-800">Alertas de Stock Bajo</h3>
            </div>
            <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm font-medium">
              {(stockAlerts as any[]).length} producto(s)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(stockAlerts as any[]).map((alert) => (
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
        {(recentSales as any[]).length > 0 ? (
          <div className="space-y-3">
            {(recentSales as any[]).map((sale) => (
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