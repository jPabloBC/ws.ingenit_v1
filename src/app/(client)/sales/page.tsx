'use client';
import { useState, useEffect } from 'react';
import { Search, Filter, ShoppingCart, DollarSign, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { getSales, Sale } from '@/services/supabase/sales';
import { getCompanyInfo } from '@/services/supabase/company';
import toast from 'react-hot-toast';
import InvoiceActions from '@/components/invoices/InvoiceActions';
import SecurityGuard from '@/components/SecurityGuard';

export default function SalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  useEffect(() => {
    loadSales();
    loadCompanyInfo();
  }, [user?.id]);

  // Manejo robusto de visibilidad - sin recargar datos automáticamente
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('Página se va a recargar, limpiando estado...');
      setSales([]);
      setLoading(true);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const salesData = await getSales();
      setSales(salesData);
    } catch (error) {
      console.error('Error loading sales:', error);
      toast.error('Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };




















  const loadCompanyInfo = async () => {
    try {
      const info = await getCompanyInfo();
      setCompanyInfo(info);
    } catch (error) {
      console.error('Error loading company info:', error);
    }
  };

  const filteredSales = sales.filter(sale => {
    console.log('Filtrando venta:', sale.id, 'searchTerm:', searchTerm, 'paymentFilter:', paymentFilter);
    const matchesSearch = sale.sale_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         searchTerm === '';
    const matchesPayment = paymentFilter === 'all' || sale.payment_method === paymentFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const saleDate = new Date(sale.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      switch (dateFilter) {
        case 'today':
          matchesDate = saleDate.toDateString() === today.toDateString();
          break;
        case 'yesterday':
          matchesDate = saleDate.toDateString() === yesterday.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = saleDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDate = saleDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesPayment && matchesDate;
  });

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <ShoppingCart className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Efectivo';
      case 'card':
        return 'Tarjeta';
      default:
        return method;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalItems = filteredSales.reduce((sum, sale) => sum + (sale.items?.length || 0), 0);

  if (!user) {
    return (
      <SecurityGuard>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </SecurityGuard>
    );
  }

  return (
    <SecurityGuard>
      <div className="px-4 md:px-6 pb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas</h1>
            <p className="text-gray-600">Gestiona y revisa todas las ventas realizadas</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredSales.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Items Vendidos</p>
                  <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por número de venta o cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago
                </label>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="cash">Efectivo</option>
                  <option value="card">Tarjeta</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos</option>
                  <option value="today">Hoy</option>
                  <option value="yesterday">Ayer</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mes</option>
                </select>
              </div>
              
              <div className="flex items-end gap-2">
                <Button                   onClick={loadSales}
                  variant="outline"
                  className="flex-1"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
                <Button                   onClick={() => {
                    setSales([]);
                    setLoading(true);
                    setTimeout(() => loadSales(), 100);
                  }}
                  variant="outline"
                  className="px-3"
                  title="Recarga forzada"
                >
                  🔄
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Ventas */}
        <Card>
          <CardHeader>
            <CardTitle>Ventas Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay ventas</h3>
                <p className="text-gray-600">No se encontraron ventas con los filtros aplicados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Venta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Productos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Método
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {sale.sale_number || `V-${sale.id.toString().slice(0, 8)}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {sale.customer?.name || 'Consumidor Final'}
                          </div>
                          {sale.customer?.email && (
                            <div className="text-sm text-gray-500">{sale.customer.email}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {sale.items && Array.isArray(sale.items) && sale.items.length > 0 ? (
                              <div>
                                {sale.items.slice(0, 2).map((item: any, index: number) => (
                                  <div key={index} className="text-xs">
                                    {item.quantity}x {item.product_name || item.product?.name || 'Producto'} - {formatCurrency(item.total_price || 0)}
                                  </div>
                                ))}
                                {sale.items.length > 2 && (
                                  <div className="text-xs text-gray-500">
                                    +{sale.items.length - 2} más...
                                  </div>
                                )}
                              </div>
                            ) : sale.items && typeof sale.items === 'string' ? (
                              <span className="text-gray-400">Items en formato JSON</span>
                            ) : (
                              <span className="text-gray-400">
                                Sin productos - Tipo: {typeof sale.items}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getPaymentMethodIcon(sale.payment_method)}
                            <span className="ml-2 text-sm text-gray-900">
                              {getPaymentMethodLabel(sale.payment_method)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(sale.total_amount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                            {getStatusLabel(sale.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(sale.created_at).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(sale.created_at).toLocaleTimeString('es-CL', { timeZone: 'America/Santiago' })}
                          </div>
                        </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <InvoiceActions
                                        invoiceId={sale.id}
                                        invoiceData={{
                                          folio: sale.sale_number || `V-${sale.id.toString().slice(0, 8)}`,
                                          fecha_emision: sale.created_at,
                                          razon_social_cliente: sale.customer?.name || 'Consumidor Final',
                                          rut_cliente: 'N/A',
                                          direccion_cliente: 'N/A',
                                          subtotal: Math.round(sale.total_amount / 1.19), // Sin IVA
                                          iva: Math.round(sale.total_amount - (sale.total_amount / 1.19)), // IVA calculado
                                          total: Math.round(sale.total_amount),
                                          items: sale.items?.map((item: any) => ({
                                            cantidad: item.quantity,
                                            nombre_producto: item.product_name || item.product?.name || 'Producto',
                                            precio_unitario: Math.round(item.unit_price || 0),
                                            total: Math.round(item.total_price || 0)
                                          })) || [],
                                          track_id: `TRK-${sale.id}`,
                                          estado_sii: 'Aceptado',
                                          // Datos de la empresa
                                          rut_empresa: companyInfo?.rut || '76.123.456-7',
                                          razon_social: companyInfo?.razon_social || 'Mi Empresa Ltda.',
                                          direccion: companyInfo?.direccion || 'Av. Principal 123',
                                          comuna: companyInfo?.comuna || 'Santiago',
                                          ciudad: companyInfo?.ciudad || 'Santiago'
                                        }}
                                      />
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
    </SecurityGuard>
  );
} 