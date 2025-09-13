'use client';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Plus, Users, UserPlus, Search, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import CustomerLayout from '@/components/layout/CustomerLayout';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import QuickStat from '@/components/ui/QuickStat';
import { useAuth } from '@/contexts/AuthContext';
import { getCustomers, deleteCustomer } from '@/services/supabase/customers';
import toast from 'react-hot-toast';
import { Customer } from '@/services/supabase/customers';
import SecurityGuard from '@/components/SecurityGuard';

function CustomersPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomersThisMonth: 0,
    averageSpent: 0
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const customersData = await getCustomers();
      setCustomers(customersData || []);

      // Calcular estadísticas
      const activeCustomers = customersData?.filter(customer => (customer.total_purchases || 0) > 0).length || 0;
      const thisMonth = new Date().getMonth();
      const newCustomersThisMonth = customersData?.filter(customer => 
        new Date(customer.created_at).getMonth() === thisMonth
      ).length || 0;

      setStats({
        totalCustomers: customersData?.length || 0,
        activeCustomers,
        newCustomersThisMonth,
        averageSpent: 0 // TODO: Implementar cálculo de total gastado cuando se agregue el campo
      });
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      return;
    }

    try {
      const success = await deleteCustomer(customerId);
      if (!success) {
        toast.error('Error al eliminar el cliente');
        return;
      }
      toast.success('Cliente eliminado exitosamente');
      loadCustomers();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error inesperado');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  if (!user) {
    return (
      <SecurityGuard>
        <CustomerLayout>
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner />
          </div>
        </CustomerLayout>
      </SecurityGuard>
    );
  }

  return (
    <SecurityGuard>
      <CustomerLayout>
        <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-gray-600">Gestiona tu base de datos de clientes</p>
          </div>
          <Button             onClick={() => router.push('/customers/add')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <QuickStat
            title="Total Clientes"
            value={stats.totalCustomers.toString()}
            icon={Users}
            color="blue"
          />
          <QuickStat
            title="Clientes Activos"
            value={stats.activeCustomers.toString()}
            icon={UserPlus}
            color="green"
          />
          <QuickStat
            title="Nuevos este Mes"
            value={stats.newCustomersThisMonth.toString()}
            icon={UserPlus}
            color="purple"
          />
          <QuickStat
            title="Promedio Gastado"
            value={`$${stats.averageSpent.toFixed(0)}`}
            icon={UserPlus}
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
                    placeholder="Buscar por nombre, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Base de Datos de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? 'No se encontraron clientes con la búsqueda aplicada'
                    : 'Aún no se han registrado clientes'
                  }
                </p>
                <Button                   onClick={() => router.push('/customers/add')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Cliente
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Nombre</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Teléfono</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Compras</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Total Gastado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Fecha Registro</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">{customer.name}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {customer.email}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {customer.phone}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {customer.total_purchases || 0}
                        </td>
                        <td className="py-3 px-4 font-medium text-gray-900">
                          $0
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(customer.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Button                               onClick={() => router.push(`/customers/${customer.id}`)}
                              size="sm"
                              variant="outline"
                            >
                              Ver
                            </Button>
                            <Button                               onClick={() => router.push(`/customers/edit/${customer.id}`)}
                              size="sm"
                              variant="outline"
                            >
                              Editar
                            </Button>
                            <Button                               onClick={() => handleDeleteCustomer(customer.id)}
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
      </CustomerLayout>
    </SecurityGuard>
  );
}

export default dynamic(() => Promise.resolve(CustomersPage), {
  ssr: false
}); 