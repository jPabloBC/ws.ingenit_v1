'use client';
import { useState, useEffect } from 'react';
import { Filter, Search, Table, Users, Clock, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
// Removido: import no usado
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import QuickStat from '@/components/ui/QuickStat';
import { useAuth } from '@/contexts/AuthContext';
// Removido: useStore no usado
import toast from 'react-hot-toast';
// Removido: import no usado
import SecurityGuard from '@/components/SecurityGuard';

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  current_order?: {
    id: string;
    total: number;
    items_count: number;
    created_at: string;
  };
  reservation?: {
    customer_name: string;
    time: string;
    guests: number;
  };
}

export default function TablesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<Table[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    totalTables: 0,
    available: 0,
    occupied: 0,
    reserved: 0,
    cleaning: 0
  });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);
      // TODO: Implementar servicio de mesas
      // Por ahora usamos datos de ejemplo
      const mockTables: Table[] = [
        { id: '1', number: 1, capacity: 4, status: 'available' },
        { id: '2', number: 2, capacity: 6, status: 'occupied', 
          current_order: { id: '1', total: 45000, items_count: 3, created_at: '2024-01-15T14:30:00' } },
        { id: '3', number: 3, capacity: 2, status: 'reserved',
          reservation: { customer_name: 'Juan Pérez', time: '19:00', guests: 2 } },
        { id: '4', number: 4, capacity: 8, status: 'cleaning' },
        { id: '5', number: 5, capacity: 4, status: 'available' },
        { id: '6', number: 6, capacity: 6, status: 'occupied',
          current_order: { id: '2', total: 32000, items_count: 2, created_at: '2024-01-15T15:00:00' } }
      ];
      
      setTables(mockTables);

      // Calcular estadísticas
      const available = mockTables.filter(t => t.status === 'available').length;
      const occupied = mockTables.filter(t => t.status === 'occupied').length;
      const reserved = mockTables.filter(t => t.status === 'reserved').length;
      const cleaning = mockTables.filter(t => t.status === 'cleaning').length;

      setStats({
        totalTables: mockTables.length,
        available,
        occupied,
        reserved,
        cleaning
      });
    } catch (error) {
      console.error('Error loading tables:', error);
      toast.error('Error al cargar las mesas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'cleaning':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
      case 'cleaning':
        return 'Limpieza';
      default:
        return 'Desconocido';
    }
  };

  const handleTableAction = (table: Table, action: string) => {
    switch (action) {
      case 'new_order':
        router.push(`/orders/new?table=${table.id}`);
        break;
      case 'view_order':
        if (table.current_order) {
          router.push(`/orders/${table.current_order.id}`);
        }
        break;
      case 'reserve':
        router.push(`/tables/reserve/${table.id}`);
        break;
      case 'clean':
        // TODO: Implementar limpieza de mesa
        toast.success(`Mesa ${table.number} marcada como limpia`);
        break;
    }
  };

  const filteredTables = tables.filter(table => {
    const matchesSearch = table.number.toString().includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || table.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return (
      <SecurityGuard>
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner />
          </div>
        </Layout>
      </SecurityGuard>
    );
  }

  return (
    <SecurityGuard>
      <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Control de Mesas</h1>
            <p className="text-gray-600">Gestiona el estado de las mesas del restaurante</p>
          </div>
          <Button             onClick={() => router.push('/tables/add')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Mesa
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <QuickStat
            title="Total Mesas"
            value={stats.totalTables.toString()}
            icon={Table}
            color="blue"
          />
          <QuickStat
            title="Disponibles"
            value={stats.available.toString()}
            icon={Table}
            color="green"
          />
          <QuickStat
            title="Ocupadas"
            value={stats.occupied.toString()}
            icon={Users}
            color="red"
          />
          <QuickStat
            title="Reservadas"
            value={stats.reserved.toString()}
            icon={Clock}
            color="yellow"
          />
          <QuickStat
            title="Limpieza"
            value={stats.cleaning.toString()}
            icon={Table}
            color="blue"
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
                    placeholder="Buscar por número de mesa..."
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
                  <option value="available">Disponibles</option>
                  <option value="occupied">Ocupadas</option>
                  <option value="reserved">Reservadas</option>
                  <option value="cleaning">Limpieza</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Mesas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <Table className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay mesas</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No se encontraron mesas con los filtros aplicados'
                  : 'Aún no se han configurado mesas'
                }
              </p>
              <Button                 onClick={() => router.push('/tables/add')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primera Mesa
              </Button>
            </div>
          ) : (
            filteredTables.map((table) => (
              <Card key={table.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Mesa {table.number}</CardTitle>
                      <p className="text-sm text-gray-600">{table.capacity} personas</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(table.status)}`}>
                      {getStatusText(table.status)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {table.status === 'occupied' && table.current_order && (
                    <div className="mb-4 p-3 bg-red-50 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-800">Orden Activa</p>
                          <p className="text-xs text-red-600">{table.current_order.items_count} items</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-red-800">
                            ${table.current_order.total.toLocaleString()}
                          </p>
                          <p className="text-xs text-red-600">
                            {new Date(table.current_order.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {table.status === 'reserved' && table.reservation && (
                    <div className="mb-4 p-3 bg-yellow-50 rounded-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Reservada</p>
                          <p className="text-xs text-yellow-600">{table.reservation.customer_name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-yellow-800">{table.reservation.time}</p>
                          <p className="text-xs text-yellow-600">{table.reservation.guests} personas</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {table.status === 'available' && (
                      <>
                        <Button                           onClick={() => handleTableAction(table, 'new_order')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Nueva Orden
                        </Button>
                        <Button                           onClick={() => handleTableAction(table, 'reserve')}
                          size="sm"
                          variant="outline"
                        >
                          Reservar
                        </Button>
                      </>
                    )}
                    
                    {table.status === 'occupied' && (
                      <>
                        <Button                           onClick={() => handleTableAction(table, 'view_order')}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Ver Orden
                        </Button>
                        <Button                           onClick={() => handleTableAction(table, 'clean')}
                          size="sm"
                          variant="outline"
                        >
                          Limpiar
                        </Button>
                      </>
                    )}
                    
                    {table.status === 'cleaning' && (
                      <Button                         onClick={() => handleTableAction(table, 'clean')}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Disponible
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
    </SecurityGuard>
  );
} 