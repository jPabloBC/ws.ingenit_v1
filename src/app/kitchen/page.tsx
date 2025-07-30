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
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';
import { ChefHat, Clock, CheckCircle, AlertTriangle, Timer, Eye, Play, Pause } from 'lucide-react';

interface KitchenOrder {
  id: string;
  order_number: string;
  table_number: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  total_amount: number;
  created_at: string;
  estimated_time: number;
  priority: 'low' | 'medium' | 'high';
  items: KitchenItem[];
  notes?: string;
}

interface KitchenItem {
  id: string;
  menu_item_name: string;
  quantity: number;
  preparation_time: number;
  status: 'pending' | 'preparing' | 'ready';
  notes?: string;
  category: string;
}

export default function KitchenPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { storeConfig } = useStore();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [stats, setStats] = useState({
    totalOrders: 0,
    pending: 0,
    preparing: 0,
    ready: 0,
    averageTime: 0
  });

  useEffect(() => {
    loadKitchenOrders();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadKitchenOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadKitchenOrders = async () => {
    try {
      setLoading(true);
      // TODO: Implementar servicio de cocina
      // Por ahora usamos datos de ejemplo
      const mockOrders: KitchenOrder[] = [
        {
          id: '1',
          order_number: 'ORD-001',
          table_number: 2,
          status: 'preparing',
          total_amount: 45000,
          created_at: '2024-01-15T14:30:00',
          estimated_time: 15,
          priority: 'high',
          notes: 'Sin cebolla en la pasta',
          items: [
            { id: '1', menu_item_name: 'Pasta Carbonara', quantity: 1, preparation_time: 15, status: 'preparing', notes: 'Sin cebolla', category: 'Pasta' },
            { id: '2', menu_item_name: 'Ensalada César', quantity: 1, preparation_time: 8, status: 'ready', category: 'Ensaladas' },
            { id: '3', menu_item_name: 'Tiramisú', quantity: 1, preparation_time: 5, status: 'pending', category: 'Postres' }
          ]
        },
        {
          id: '2',
          order_number: 'ORD-002',
          table_number: 6,
          status: 'ready',
          total_amount: 32000,
          created_at: '2024-01-15T15:00:00',
          estimated_time: 20,
          priority: 'medium',
          items: [
            { id: '4', menu_item_name: 'Pizza Margherita', quantity: 1, preparation_time: 20, status: 'ready', category: 'Pizza' },
            { id: '5', menu_item_name: 'Ensalada César', quantity: 1, preparation_time: 8, status: 'ready', category: 'Ensaladas' }
          ]
        },
        {
          id: '3',
          order_number: 'ORD-003',
          table_number: 1,
          status: 'pending',
          total_amount: 28000,
          created_at: '2024-01-15T15:30:00',
          estimated_time: 25,
          priority: 'low',
          items: [
            { id: '6', menu_item_name: 'Pasta Carbonara', quantity: 2, preparation_time: 15, status: 'pending', category: 'Pasta' },
            { id: '7', menu_item_name: 'Tiramisú', quantity: 1, preparation_time: 5, status: 'pending', category: 'Postres' }
          ]
        }
      ];
      
      setOrders(mockOrders);

      // Calcular estadísticas
      const pending = mockOrders.filter(o => o.status === 'pending').length;
      const preparing = mockOrders.filter(o => o.status === 'preparing').length;
      const ready = mockOrders.filter(o => o.status === 'ready').length;
      const averageTime = mockOrders.reduce((sum, order) => sum + order.estimated_time, 0) / mockOrders.length;

      setStats({
        totalOrders: mockOrders.length,
        pending,
        preparing,
        ready,
        averageTime
      });
    } catch (error) {
      console.error('Error loading kitchen orders:', error);
      toast.error('Error al cargar las órdenes de cocina');
    } finally {
      setLoading(false);
    }
  };

  const handleItemStatusChange = async (orderId: string, itemId: string, newStatus: string) => {
    try {
      setOrders(orders.map(order => 
        order.id === orderId 
          ? {
              ...order,
              items: order.items.map(item => 
                item.id === itemId 
                  ? { ...item, status: newStatus as KitchenItem['status'] }
                  : item
              )
            }
          : order
      ));
      toast.success('Estado del item actualizado');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as KitchenOrder['status'] }
          : order
      ));
      toast.success('Estado de orden actualizado');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      default:
        return 'Desconocida';
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
      default:
        return 'Desconocido';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || order.priority === filterPriority;
    
    return matchesStatus && matchesPriority;
  });

  // Ordenar por prioridad y tiempo de creación
  const sortedOrders = filteredOrders.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
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
            <h1 className="text-2xl font-bold text-gray-900">Control de Cocina</h1>
            <p className="text-gray-600">Gestiona la preparación de órdenes</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Actualización automática cada 30s</span>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <QuickStat
            title="Total Órdenes"
            value={stats.totalOrders.toString()}
            icon={ChefHat}
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
            icon={Timer}
            color="blue"
          />
          <QuickStat
            title="Listas"
            value={stats.ready.toString()}
            icon={CheckCircle}
            color="green"
          />
          <QuickStat
            title="Tiempo Promedio"
            value={`${Math.round(stats.averageTime)} min`}
            icon={Timer}
            color="orange"
          />
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendientes</option>
                  <option value="preparing">Preparando</option>
                  <option value="ready">Listas</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las prioridades</option>
                  <option value="high">Alta</option>
                  <option value="medium">Media</option>
                  <option value="low">Baja</option>
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
          ) : sortedOrders.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes</h3>
              <p className="text-gray-600 mb-4">
                {filterStatus !== 'all' || filterPriority !== 'all'
                  ? 'No se encontraron órdenes con los filtros aplicados'
                  : 'No hay órdenes pendientes en cocina'
                }
              </p>
            </div>
          ) : (
            sortedOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{order.order_number}</CardTitle>
                      <p className="text-sm text-gray-600">Mesa {order.table_number}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(order.priority)}`}>
                        {getPriorityText(order.priority)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {order.notes && (
                    <div className="mb-4 p-2 bg-yellow-50 rounded-md">
                      <p className="text-xs text-yellow-800">
                        <strong>Notas:</strong> {order.notes}
                      </p>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-2">Items:</p>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {item.quantity}x {item.menu_item_name}
                              </span>
                              <span className="text-xs text-gray-500">({item.category})</span>
                            </div>
                            {item.notes && (
                              <p className="text-xs text-gray-600 mt-1">{item.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{item.preparation_time} min</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              item.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {item.status === 'pending' ? 'Pendiente' :
                               item.status === 'preparing' ? 'Preparando' : 'Listo'}
                            </span>
                            <div className="flex gap-1">
                              {item.status === 'pending' && (
                                <Button
                                  onClick={() => handleItemStatusChange(order.id, item.id, 'preparing')}
                                  size="sm"
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              )}
                              {item.status === 'preparing' && (
                                <Button
                                  onClick={() => handleItemStatusChange(order.id, item.id, 'ready')}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </span>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <Button
                          onClick={() => handleOrderStatusChange(order.id, 'preparing')}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Iniciar Preparación
                        </Button>
                      )}
                      {order.status === 'preparing' && order.items.every(item => item.status === 'ready') && (
                        <Button
                          onClick={() => handleOrderStatusChange(order.id, 'ready')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Marcar Lista
                        </Button>
                      )}
                      <Button
                        onClick={() => router.push(`/orders/${order.id}`)}
                        size="sm"
                        variant="outline"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
} 