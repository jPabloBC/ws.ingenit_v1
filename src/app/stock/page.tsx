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
import { getProducts } from '@/services/supabase/products';
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';
import { Package, AlertTriangle, TrendingDown, TrendingUp, Search, Filter, Plus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  stock: number;
  min_stock: number;
  price: number;
  category_id: string;
  ws_categories?: { name: string };
}

export default function StockPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { storeConfig } = useStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await getProducts();
      setProducts(productsData || []);

      // Calcular estadísticas
      const lowStock = productsData?.filter(p => p.stock <= p.min_stock && p.stock > 0).length || 0;
      const outOfStock = productsData?.filter(p => p.stock === 0).length || 0;
      const totalValue = productsData?.reduce((sum, p) => sum + (p.stock * p.price), 0) || 0;

      setStats({
        totalProducts: productsData?.length || 0,
        lowStock,
        outOfStock,
        totalValue
      });
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    switch (filterType) {
      case 'low':
        matchesFilter = product.stock <= product.min_stock && product.stock > 0;
        break;
      case 'out':
        matchesFilter = product.stock === 0;
        break;
      case 'normal':
        matchesFilter = product.stock > product.min_stock;
        break;
    }
    
    return matchesSearch && matchesFilter;
  });

  const getStockStatus = (product: Product) => {
    if (product.stock === 0) {
      return { status: 'out', text: 'Sin Stock', color: 'bg-red-100 text-red-800' };
    } else if (product.stock <= product.min_stock) {
      return { status: 'low', text: 'Stock Bajo', color: 'bg-orange-100 text-orange-800' };
    } else {
      return { status: 'normal', text: 'Normal', color: 'bg-green-100 text-green-800' };
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Control de Stock</h1>
            <p className="text-gray-600">Monitorea el inventario y stock de productos</p>
          </div>
          <Button
            onClick={() => router.push('/inventory/add')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <QuickStat
            title="Total Productos"
            value={stats.totalProducts.toString()}
            icon={Package}
            color="blue"
          />
          <QuickStat
            title="Stock Bajo"
            value={stats.lowStock.toString()}
            icon={AlertTriangle}
            color="orange"
          />
          <QuickStat
            title="Sin Stock"
            value={stats.outOfStock.toString()}
            icon={TrendingDown}
            color="red"
          />
          <QuickStat
            title="Valor Total"
            value={formatCurrency(stats.totalValue)}
            icon={TrendingUp}
            color="green"
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
                    placeholder="Buscar productos..."
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
                  <option value="out">Sin stock</option>
                  <option value="normal">Stock normal</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Productos */}
        <Card>
          <CardHeader>
            <CardTitle>Estado del Stock</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterType !== 'all' 
                    ? 'No se encontraron productos con los filtros aplicados'
                    : 'Aún no se han agregado productos'
                  }
                </p>
                <Button
                  onClick={() => router.push('/inventory/add')}
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
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Mínimo</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Estado</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Valor</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product);
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
                          <td className="py-3 px-4 text-gray-600">{product.min_stock}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                              {stockStatus.text}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-gray-900">
                            {formatCurrency(product.stock * product.price)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                onClick={() => router.push(`/inventory/edit/${product.id}`)}
                                size="sm"
                                variant="outline"
                              >
                                Editar
                              </Button>
                              <Button
                                onClick={() => router.push(`/stock/adjust/${product.id}`)}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Ajustar
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
    </Layout>
  );
} 