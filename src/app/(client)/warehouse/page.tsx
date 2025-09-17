'use client';
import dynamic from 'next/dynamic';
// Removido: import no usado
import { useState, useEffect, useCallback } from 'react';
import { Filter, Search, Truck, Warehouse, Package, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
// Removido: import no usado
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import QuickStat from '@/components/ui/QuickStat';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { getProducts } from '@/services/supabase/products';
import SecurityGuard from '@/components/SecurityGuard';
// Removido: import no usado
// Removido: import no usado
import toast from 'react-hot-toast';
// Removido: import no usado
interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  min_stock: number;
  price: number;
  cost: number;
  category_id: string;
  ws_categories?: { name: string };
}

function WarehousePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentBusiness } = useStore();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    totalCost: 0,
    profit: 0,
    lowStock: 0
  });

  const recalcStats = useCallback((items: Product[]) => {
    let totalValue = 0;
    let totalCost = 0;
    let lowStock = 0;
    items.forEach(p => {
      totalValue += p.stock * p.price;
      totalCost += p.stock * p.cost;
      if (p.stock <= p.min_stock) lowStock += 1;
    });
    const profit = totalValue - totalCost;
    setStats({
      totalProducts: items.length,
      totalValue,
      totalCost,
      profit,
      lowStock
    });
  }, []);

  const loadProducts = useCallback(async () => {
    if (!user) return;
    if (!currentBusiness?.id) {
      setProducts([]);
      setStats(s => ({ ...s, totalProducts: 0, totalValue: 0, totalCost: 0, profit: 0, lowStock: 0 }));
      return;
    }
    setLoading(true);
    try {
      const data = await getProducts(currentBusiness.id);
      setProducts(data as any);
      recalcStats(data as any);
    } catch (err) {
      console.error('Error loading warehouse products:', err);
      toast.error('No se pudieron cargar productos');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user, currentBusiness?.id, recalcStats]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    switch (filterType) {
      case 'low':
        matchesFilter = product.stock <= product.min_stock;
        break;
      case 'high':
        matchesFilter = product.stock > product.min_stock * 2;
        break;
      case 'zero':
        matchesFilter = product.stock === 0;
        break;
    }
    
    return matchesSearch && matchesFilter;
  });

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
      <div className="px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Control de Bodega</h1>
            <p className="text-gray-600">Gestiona el inventario y valor de la bodega</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => router.push('/inventory/add')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
            <Button onClick={() => router.push('/warehouse/transfer')}
              variant="outline"
            >
              <Truck className="h-4 w-4 mr-2" />
              Transferencia
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <QuickStat
            title="Total Productos"
            value={stats.totalProducts.toString()}
            icon={Package}
            color="blue"
          />
          <QuickStat
            title="Valor Total"
            value={formatCurrency(stats.totalValue)}
            icon={TrendingUp}
            color="green"
          />
          <QuickStat
            title="Costo Total"
            value={formatCurrency(stats.totalCost)}
            icon={Warehouse}
            color="orange"
          />
          <QuickStat
            title="Ganancia"
            value={formatCurrency(stats.profit)}
            icon={TrendingUp}
            color="purple"
          />
          <QuickStat
            title="Stock Bajo"
            value={stats.lowStock.toString()}
            icon={AlertTriangle}
            color="red"
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
                    placeholder="Buscar productos en bodega..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los productos</option>
                  <option value="low">Stock bajo</option>
                  <option value="high">Stock alto</option>
                  <option value="zero">Sin stock</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Productos */}
        <Card>
          <CardHeader>
            <CardTitle>Inventario de Bodega</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Warehouse className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterType !== 'all' 
                    ? 'No se encontraron productos con los filtros aplicados'
                    : 'Aún no se han agregado productos a la bodega'
                  }
                </p>
                <Button onClick={() => router.push('/inventory/add')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Primer Producto
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Producto</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">SKU</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Stock</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Precio</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Costo</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Valor</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Ganancia</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const stockValue = product.stock * product.price;
                      const stockCost = product.stock * product.cost;
                      const profit = stockValue - stockCost;
                      return (
                        <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <span className="font-medium text-gray-900">{product.name}</span>
                              {product.ws_categories && (
                                <p className="text-sm text-gray-500">{product.ws_categories.name}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{product.sku}</td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${
                              product.stock === 0 ? 'text-red-600' :
                              product.stock <= product.min_stock ? 'text-orange-600' :
                              'text-green-600'
                            }`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-700">{formatCurrency(product.price)}</td>
                          <td className="py-3 px-4 text-gray-700">{formatCurrency(product.cost)}</td>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {formatCurrency(stockValue)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${
                              profit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(profit)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <Button onClick={() => router.push(`/inventory/edit/${product.id}`)}
                                size="sm"
                                variant="outline"
                              >
                                Editar
                              </Button>
                              <Button onClick={() => router.push(`/warehouse/transfer/${product.id}`)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Transferir
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

export default dynamic(() => Promise.resolve(WarehousePage), {
  ssr: false
}); 