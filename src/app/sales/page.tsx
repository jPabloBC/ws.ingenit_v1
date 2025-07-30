'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import QuickStat from '@/components/ui/QuickStat';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { getSales, deleteSale } from '@/services/supabase/sales';
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';
import { Plus, DollarSign, TrendingUp, ShoppingCart, Calendar, Search, Filter } from 'lucide-react';

interface Sale {
  id: string;
  sale_number: string;
  customer_name: string;
  total_amount: number;
  created_at: string;
  status: string;
}

export default function SalesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { storeConfig } = useStore();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    averageAmount: 0,
    todaySales: 0
  });

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const salesData = await getSales();
      setSales(salesData || []);

      // Calcular estadísticas
      const totalAmount = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      const today = new Date().toISOString().split('T')[0];
      const todaySales = salesData?.filter(sale => 
        sale.created_at?.startsWith(today)
      ).length || 0;

      setStats({
        totalSales: salesData?.length || 0,
        totalAmount,
        averageAmount: salesData?.length ? totalAmount / salesData.length : 0,
        todaySales
      });
    } catch (error) {
      console.error('Error loading sales:', error);
      toast.error('Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta venta?')) {
      return;
    }

    try {
      const { error } = await deleteSale(saleId);
      if (error) {
        toast.error('Error al eliminar la venta: ' + error.message);
        return;
      }
      toast.success('Venta eliminada exitosamente');
      loadSales();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error inesperado');
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.sale_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
            <p className="text-gray-600">Gestiona las ventas de tu negocio</p>
          </div>
          <Button
            onClick={() => router.push('/sales/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Venta
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <QuickStat
            title="Total Ventas"
            value={stats.totalSales.toString()}
            icon={ShoppingCart}
            color="blue"
          />
          <QuickStat
            title="Monto Total"
            value={formatCurrency(stats.totalAmount)}
            icon={DollarSign}
            color="green"
          />
          <QuickStat
            title="Promedio por Venta"
            value={formatCurrency(stats.averageAmount)}
            icon={TrendingUp}
            color="purple"
          />
          <QuickStat
            title="Ventas Hoy"
            value={stats.todaySales.toString()}
            icon={Calendar}
            color="orange"
          />
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por número de venta o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="completed">Completadas</option>
                  <option value="pending">Pendientes</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Ventas */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay ventas</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'No se encontraron ventas con los filtros aplicados'
                    : 'Aún no se han registrado ventas'
                  }
                </p>
                <Button
                  onClick={() => router.push('/sales/new')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Venta
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Número</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Cliente</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Monto</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">{sale.sale_number}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{sale.customer_name}</td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {formatCurrency(sale.total_amount)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(sale.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                            sale.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {sale.status === 'completed' ? 'Completada' :
                             sale.status === 'pending' ? 'Pendiente' : 'Cancelada'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              onClick={() => router.push(`/sales/${sale.id}`)}
                              size="sm"
                              variant="outline"
                            >
                              Ver
                            </Button>
                            <Button
                              onClick={() => router.push(`/sales/edit/${sale.id}`)}
                              size="sm"
                              variant="outline"
                            >
                              Editar
                            </Button>
                            <Button
                              onClick={() => handleDeleteSale(sale.id)}
                              size="sm"
                              variant="destructive"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 