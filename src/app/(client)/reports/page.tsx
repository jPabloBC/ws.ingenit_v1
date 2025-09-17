'use client';

import { useState, useEffect } from 'react';
import { Download, Calendar, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SecurityGuard from '@/components/SecurityGuard';
import { getReportData } from '@/services/supabase/reports';

interface ReportData {
  period: string;
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  growth: number;
}

export default function Reports() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, [selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      // Cargar datos reales desde Supabase
      const period = selectedPeriod === 'year' ? 'year' : 'month';
      const data = await getReportData(period);
      setReportData(data);
    } catch (error) {
      console.error('Error loading reports:', error);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: string) => {
    // TODO: Implementar exportación de reportes
    console.log(`Exporting report as ${format}`);
  };

  return (
    <SecurityGuard>
        <div className="px-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
            <p className="text-gray-600">Análisis y estadísticas de tu negocio</p>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="year">Este año</option>
            </select>
            <button
              onClick={() => exportReport('pdf')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${reportData?.totalSales.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+{reportData?.growth}%</span>
                  <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Órdenes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData?.totalOrders}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+8.2%</span>
                  <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Productos</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData?.totalProducts}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+3.1%</span>
                  <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Clientes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {reportData?.totalCustomers}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+15.3%</span>
                  <span className="text-sm text-gray-500 ml-1">vs período anterior</span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ventas por Día</h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>Gráfico de ventas por día (próximamente)</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Productos Más Vendidos</h3>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>Gráfico de productos más vendidos (próximamente)</p>
                </div>
              </div>
            </div>

            {/* Detailed Reports */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Reportes Detallados</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => exportReport('sales')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <h4 className="font-medium text-gray-900">Reporte de Ventas</h4>
                    <p className="text-sm text-gray-600 mt-1">Análisis detallado de ventas</p>
                  </button>

                  <button
                    onClick={() => exportReport('inventory')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <h4 className="font-medium text-gray-900">Reporte de Inventario</h4>
                    <p className="text-sm text-gray-600 mt-1">Estado actual del inventario</p>
                  </button>

                  <button
                    onClick={() => exportReport('customers')}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <h4 className="font-medium text-gray-900">Reporte de Clientes</h4>
                    <p className="text-sm text-gray-600 mt-1">Análisis de clientes</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
    </SecurityGuard>
  );
}
