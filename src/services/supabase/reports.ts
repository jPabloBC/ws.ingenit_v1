import { supabase } from './client';

export async function getReportData(period: 'month' | 'year' = 'month') {
  try {
    // Calcular fechas de inicio y fin según el periodo
    const now = new Date();
    let startDate: string;
    if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString();
    }

    // Intentar obtener ventas - si falla, usar datos mock
    let sales: any[] = [];
    let salesError: any = null;
    
    try {
      const { data, error } = await supabase
        .from('ws_sales')
        .select('id, total_amount, customer_id, created_at')
        .gte('created_at', startDate);
      
      if (error) throw error;
      sales = data || [];
    } catch (err) {
      console.warn('No se pudieron cargar ventas, usando datos mock:', err);
      salesError = err;
    }

    // Productos totales
    let totalProducts = 0;
    try {
      const { count, error: productsError } = await supabase
        .from('ws_products')
        .select('id', { count: 'exact', head: true });
      
      if (productsError) throw productsError;
      totalProducts = count || 0;
    } catch (err) {
      console.warn('No se pudieron cargar productos, usando 0:', err);
    }

    // Si no hay ventas reales, usar datos mock
    if (salesError || sales.length === 0) {
      return {
        period: period === 'month' ? 'Este mes' : 'Este año',
        totalSales: 0,
        totalOrders: 0,
        totalProducts: totalProducts,
        totalCustomers: 0,
        growth: 0
      };
    }

    // Clientes únicos
    const uniqueCustomers = new Set(sales.map(s => s.customer_id).filter(Boolean));

    // Crecimiento simple: comparación con periodo anterior
    let growth = 0;
    if (period === 'month') {
      try {
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const prevStart = prevMonth.toISOString();
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const { data: prevSales } = await supabase
          .from('ws_sales')
          .select('total_amount')
          .gte('created_at', prevStart)
          .lt('created_at', prevEnd);
        
        const prevTotal = (prevSales || []).reduce((sum, s) => sum + (s.total_amount || 0), 0);
        const thisTotal = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
        if (prevTotal > 0) {
          growth = ((thisTotal - prevTotal) / prevTotal) * 100;
        }
      } catch (err) {
        console.warn('No se pudo calcular crecimiento:', err);
      }
    }

    return {
      period: period === 'month' ? 'Este mes' : 'Este año',
      totalSales: sales.reduce((sum, s) => sum + (s.total_amount || 0), 0),
      totalOrders: sales.length,
      totalProducts: totalProducts,
      totalCustomers: uniqueCustomers.size,
      growth: Math.round(growth * 10) / 10
    };
  } catch (error) {
    console.error('Error en getReportData:', error);
    // Retornar datos vacíos en caso de error
    return {
      period: period === 'month' ? 'Este mes' : 'Este año',
      totalSales: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      growth: 0
    };
  }
}
