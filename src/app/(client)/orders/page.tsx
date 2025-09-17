'use client';
import { useState, useEffect } from 'react';
import { Plus, ClipboardList, Clock, CheckCircle, Search, Filter, Eye, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import QuickStat from '@/components/ui/QuickStat';
import { useAuth } from '@/contexts/AuthContext';
import SecurityGuard from '@/components/SecurityGuard';
import toast from 'react-hot-toast';
interface Order {
  id: string;
  order_number: string;
  table_number: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total_amount: number;
  items_count: number;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  notes?: string;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  menu_item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
}

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalOrders: 0,
    pending: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    loadOrders();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      // TODO: Implementar servicio de órdenes
      // Por ahora usamos datos de ejemplo
      const mockOrders: Order[] = [
        {
          id: '1',
          order_number: 'ORD-001',
          table_number: 2,
          status: 'preparing',
          total_amount: 45000,
          items_count: 3,
          created_at: '2024-01-15T14:30:00',
          updated_at: '2024-01-15T14:35:00',
          customer_name: 'Juan Pérez',
          notes: 'Sin cebolla en la pasta',
          items: [
            { id: '1', menu_item_name: 'Pasta Carbonara', quantity: 1, unit_price: 12000, total_price: 12000, status: 'preparing', notes: 'Sin cebolla' },
            { id: '2', menu_item_name: 'Ensalada César', quantity: 1, unit_price: 8500, total_price: 8500, status: 'ready' },
            { id: '3', menu_item_name: 'Tiramisú', quantity: 1, unit_price: 6500, total_price: 6500, status: 'pending' }
          ]
        },
        {
          id: '2',
          order_number: 'ORD-002',
          table_number: 6,
          status: 'ready',
          total_amount: 32000,
          items_count: 2,
          created_at: '2024-01-15T15:00:00',
          updated_at: '2024-01-15T15:20:00',
          customer_name: 'María González',
          items: [
            { id: '4', menu_item_name: 'Pizza Margherita', quantity: 1, unit_price: 15000, total_price: 15000, status: 'ready' },
            { id: '5', menu_item_name: 'Ensalada César', quantity: 1, unit_price: 8500, total_price: 8500, status: 'ready' }
          ]
        },
        {
          id: '3',
          order_number: 'ORD-003',
          table_number: 1,
          status: 'pending',
          total_amount: 28000,
          items_count: 2,
          created_at: '2024-01-15T15:30:00',
          updated_at: '2024-01-15T15:30:00',
          items: [
            { id: '6', menu_item_name: 'Pasta Carbonara', quantity: 2, unit_price: 12000, total_price: 24000, status: 'pending' },
            { id: '7', menu_item_name: 'Tiramisú', quantity: 1, unit_price: 6500, total_price: 6500, status: 'pending' }
          ]
        }
      ];
      
      setOrders(mockOrders);

      // Calcular estadísticas
      const pending = mockOrders.filter(o => o.status === 'pending').length;
      const preparing = mockOrders.filter(o => o.status === 'preparing').length;
      const ready = mockOrders.filter(o => o.status === 'ready').length;
      const delivered = mockOrders.filter(o => o.status === 'delivered').length;
      const totalRevenue = mockOrders.reduce((sum, order) => sum + order.total_amount, 0);

      setStats({
        totalOrders: mockOrders.length,
        pending,
        preparing,
        ready,
        delivered,
        totalRevenue
      });
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Error al cargar las órdenes');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as Order['status'], updated_at: new Date().toISOString() }
          : order
      ));
      toast.success('Estado de orden actualizado');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Listo';
      case 'delivered':
        return 'Entregado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.table_number.toString().includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <SecurityGuard>
      {!user ? (
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner />
          </div>
        </Layout>
      ) : (
        <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Órdenes</h1>
            <p className="text-gray-600">Controla las órdenes del restaurante</p>
          </div>
          <Button             onClick={() => router.push('/orders/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Orden
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-6">
          <QuickStat
            title="Total Órdenes"
            value={stats.totalOrders.toString()}
            icon={ClipboardList}
            color="blue"
          />
          <QuickStat
            title="Pendientes"
            value={stats.pending.toString()}
            icon={Clock}
            color="yellow"
          />
          <QuickStat
            title="Preparando"
            value={stats.preparing.toString()}
            icon={Clock}
            color="blue"
          />
          <QuickStat
            title="Listas"
            value={stats.ready.toString()}
            icon={CheckCircle}
            color="green"
          />
          <QuickStat
            title="Entregadas"
            value={stats.delivered.toString()}
            icon={CheckCircle}
            color="gray"
          />
          <QuickStat
            title="Ingresos"
            value={formatCurrency(stats.totalRevenue)}
            icon={ClipboardList}
            color="purple"
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
                    placeholder="Buscar por número de orden, cliente o mesa..."
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
                  <option value="pending">Pendientes</option>
                  <option value="preparing">Preparando</option>
                  <option value="ready">Listas</option>
                  <option value="delivered">Entregadas</option>
                  <option value="cancelled">Canceladas</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Órdenes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all'
                  ? 'No se encontraron órdenes con los filtros aplicados'
                  : 'Aún no se han creado órdenes'
                }
              </p>
              <Button                 onClick={() => router.push('/orders/new')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Orden
              </Button>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{order.order_number}</CardTitle>
                      <p className="text-sm text-gray-600">Mesa {order.table_number}</p>
                      {order.customer_name && (
                        <p className="text-sm text-gray-600">{order.customer_name}</p>
                      )}
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(order.total_amount)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {order.items_count} items
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  {order.notes && (
                    <div className="mb-4 p-2 bg-yellow-50 rounded-md">
                      <p className="text-xs text-yellow-800">
                        <strong>Notas:</strong> {order.notes}
                      </p>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-2">Items:</p>
                    <div className="space-y-1">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">
                            {item.quantity}x {item.menu_item_name}
                          </span>
                          <span className="text-gray-900 font-medium">
                            {formatCurrency(item.total_price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button                       onClick={() => router.push(`/orders/${order.id}`)}
                      size="sm"
                      variant="outline"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    
                    {order.status === 'pending' && (
                      <Button                         onClick={() => handleStatusChange(order.id, 'preparing')}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Preparar
                      </Button>
                    )}
                    
                    {order.status === 'preparing' && (
                      <Button                         onClick={() => handleStatusChange(order.id, 'ready')}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Listo
                      </Button>
                    )}
                    
                    {order.status === 'ready' && (
                      <Button                         onClick={() => handleStatusChange(order.id, 'delivered')}
                        size="sm"
                        className="bg-gray-600 hover:bg-gray-700"
                      >
                        Entregar
                      </Button>
                    )}
                    
                    {(order.status === 'pending' || order.status === 'preparing') && (
                      <Button                         onClick={() => handleStatusChange(order.id, 'cancelled')}
                        size="sm"
                        variant="destructive"
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
      )}
    </SecurityGuard>
  );
} 