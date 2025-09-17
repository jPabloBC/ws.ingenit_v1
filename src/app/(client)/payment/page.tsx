'use client';

import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, FileText, Settings, History, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import SecurityGuard from '@/components/SecurityGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import TransbankService from '@/services/payments/transbank';
import toast from 'react-hot-toast';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'credit_card' | 'debit_card' | 'cash' | 'transfer';
  isActive: boolean;
  isDefault: boolean;
  details?: {
    last4?: string;
    brand?: string;
    expiry?: string;
  };
}

interface PaymentTransaction {
  id: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  date: string;
  orderNumber: string;
  customerName?: string;
}

export default function PaymentPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'methods' | 'transactions' | 'settings'>('methods');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [showAddMethod, setShowAddMethod] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, []);

  const loadPaymentData = async () => {
    try {
      setLoading(true);
      
      // Cargar métodos de pago (mock data por ahora)
      const mockMethods: PaymentMethod[] = [
        {
          id: '1',
          name: 'Tarjeta de Crédito Principal',
          type: 'credit_card',
          isActive: true,
          isDefault: true,
          details: {
            last4: '1234',
            brand: 'Visa',
            expiry: '12/25'
          }
        },
        {
          id: '2',
          name: 'Efectivo',
          type: 'cash',
          isActive: true,
          isDefault: false
        },
        {
          id: '3',
          name: 'Transferencia Bancaria',
          type: 'transfer',
          isActive: true,
          isDefault: false
        }
      ];

      // Cargar transacciones recientes (mock data)
      const mockTransactions: PaymentTransaction[] = [
        {
          id: '1',
          amount: 25000,
          method: 'Tarjeta de Crédito',
          status: 'completed',
          date: new Date().toISOString(),
          orderNumber: 'ORD-001',
          customerName: 'Juan Pérez'
        },
        {
          id: '2',
          amount: 15000,
          method: 'Efectivo',
          status: 'completed',
          date: new Date(Date.now() - 86400000).toISOString(),
          orderNumber: 'ORD-002',
          customerName: 'María González'
        },
        {
          id: '3',
          amount: 35000,
          method: 'Transferencia',
          status: 'pending',
          date: new Date(Date.now() - 172800000).toISOString(),
          orderNumber: 'ORD-003',
          customerName: 'Carlos López'
        }
      ];

      setPaymentMethods(mockMethods);
      setTransactions(mockTransactions);
      
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast.error('Error al cargar datos de pagos');
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentMethod = async (methodId: string) => {
    try {
      setPaymentMethods(prev => 
        prev.map(method => 
          method.id === methodId 
            ? { ...method, isActive: !method.isActive }
            : method
        )
      );
      toast.success('Método de pago actualizado');
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error('Error al actualizar método de pago');
    }
  };

  const setDefaultMethod = async (methodId: string) => {
    try {
      setPaymentMethods(prev => 
        prev.map(method => ({
          ...method,
          isDefault: method.id === methodId
        }))
      );
      toast.success('Método de pago predeterminado actualizado');
    } catch (error) {
      console.error('Error setting default method:', error);
      toast.error('Error al establecer método predeterminado');
    }
  };

  const deletePaymentMethod = async (methodId: string) => {
    try {
      setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
      toast.success('Método de pago eliminado');
    } catch (error) {
      console.error('Error deleting payment method:', error);
      toast.error('Error al eliminar método de pago');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'refunded': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'pending': return 'Pendiente';
      case 'failed': return 'Fallido';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="h-5 w-5" />;
      case 'cash':
        return <DollarSign className="h-5 w-5" />;
      case 'transfer':
        return <FileText className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <SecurityGuard>
        <div className="px-4 md:px-6 pb-6">
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </SecurityGuard>
    );
  }

  return (
    <SecurityGuard>
      <div className="px-4 md:px-6 pb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h1>
              <p className="text-gray-600">Administra métodos de pago y transacciones</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('methods')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'methods'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Métodos de Pago
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'transactions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transacciones
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'settings'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Configuración
              </button>
            </nav>
          </div>

          {/* Métodos de Pago */}
          {activeTab === 'methods' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Métodos de Pago</h2>
                <Button
                  onClick={() => setShowAddMethod(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Método
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paymentMethods.map((method) => (
                  <Card key={method.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getMethodIcon(method.type)}
                          <CardTitle className="text-sm font-medium">
                            {method.name}
                          </CardTitle>
                        </div>
                        <div className="flex items-center space-x-1">
                          {method.isDefault && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Predeterminado
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            method.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {method.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {method.details && (
                        <div className="space-y-2 text-sm text-gray-600">
                          {method.details.brand && (
                            <p><strong>Marca:</strong> {method.details.brand}</p>
                          )}
                          {method.details.last4 && (
                            <p><strong>Terminada en:</strong> ****{method.details.last4}</p>
                          )}
                          {method.details.expiry && (
                            <p><strong>Expira:</strong> {method.details.expiry}</p>
                          )}
                        </div>
                      )}
                      <div className="flex space-x-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => togglePaymentMethod(method.id)}
                        >
                          {method.isActive ? 'Desactivar' : 'Activar'}
                        </Button>
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDefaultMethod(method.id)}
                          >
                            Predeterminado
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePaymentMethod(method.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Transacciones */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Transacciones Recientes</h2>
                <Button
                  variant="outline"
                  className="flex items-center"
                >
                  <History className="h-4 w-4 mr-2" />
                  Ver Todas
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Transacción
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Método
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Monto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {transaction.orderNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.method}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.customerName || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(transaction.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                {getStatusText(transaction.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(transaction.date).toLocaleDateString('es-CL')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Configuración */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Configuración de Pagos</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Settings className="h-5 w-5 mr-2" />
                      Transbank
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado de Conexión
                      </label>
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-gray-900">Conectado</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ambiente
                      </label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Desarrollo
                      </span>
                    </div>
                    <Button variant="outline" size="sm">
                      Configurar
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Boletas Electrónicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado SII
                      </label>
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm text-gray-900">Conectado</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Folios Disponibles
                      </label>
                      <span className="text-sm text-gray-900">1,247</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Gestionar
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
      </div>
    </SecurityGuard>
  );
}
