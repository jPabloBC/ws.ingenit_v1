import { supabaseAdmin as supabase } from './admin';

export async function getReportData(period: 'month' | 'year' = 'month') {
  // Calcular fechas de inicio y fin según el periodo
  const now = new Date();
  let startDate: string;
  if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  } else {
    startDate = new Date(now.getFullYear(), 0, 1).toISOString();
  }

  // Ventas totales y órdenes
  const { data: sales, error: salesError } = await supabase
    .from('ws_sales')
    .select('id, total_amount, customer_id, created_at')
    .gte('created_at', startDate);

  if (salesError) throw salesError;

  // Productos totales
  const { count: totalProducts, error: productsError } = await supabase
    .from('ws_products')
    .select('id', { count: 'exact', head: true });
  if (productsError) throw productsError;

  // Clientes únicos
  const uniqueCustomers = new Set((sales || []).map(s => s.customer_id).filter(Boolean));

  // Crecimiento simple: comparación con periodo anterior
  let growth = 0;
  if (period === 'month') {
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevStart = prevMonth.toISOString();
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { data: prevSales } = await supabase
      .from('ws_sales')
      .select('total_amount')
      .gte('created_at', prevStart)
      .lt('created_at', prevEnd);
    const prevTotal = (prevSales || []).reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const thisTotal = (sales || []).reduce((sum, s) => sum + (s.total_amount || 0), 0);
    if (prevTotal > 0) {
      growth = ((thisTotal - prevTotal) / prevTotal) * 100;
    }
  }

  return {
    period: period === 'month' ? 'Este mes' : 'Este año',
    totalSales: (sales || []).reduce((sum, s) => sum + (s.total_amount || 0), 0),
    totalOrders: (sales || []).length,
    totalProducts: totalProducts || 0,
    totalCustomers: uniqueCustomers.size,
    growth: Math.round(growth * 10) / 10
  };
}
