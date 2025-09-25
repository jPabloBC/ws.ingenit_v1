'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Package, AlertTriangle, Filter, Search, Plus, Globe, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { getProducts, deleteProduct, updateProduct, Product } from '@/services/supabase/products';
import { getCategories } from '@/services/supabase/categories';
import toast from 'react-hot-toast';
import { importProductByBarcode } from '@/services/integrations/openFoodFacts';
import SecurityGuard from '@/components/SecurityGuard';
import EditStockModal from '@/components/modals/EditStockModal';
import { supabase } from '@/services/supabase/client';

// Modal movido a componente separado para mejor rendimiento

export default function Inventory() {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const { storeConfig, currentBusiness } = useStore();
  
  // Estados locales simples
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [importing, setImporting] = useState(false);
  // Eliminado barcode search
  const [editStockModal, setEditStockModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [isSaving, setIsSaving] = useState(false);

  // Función para cargar datos
  const loadData = useCallback(async () => {
    if (!currentBusiness?.id || !user?.id) return;
    
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(currentBusiness.id),
        getCategories()
      ]);
      
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [currentBusiness?.id, user?.id]);

  // Función para manejar el guardado del modal
  const handleModalSave = useCallback(async (form: { stock: number; min_stock: number; price: number; cost: number }) => {
    if (isSaving || !editStockModal.product) return;
    
    setIsSaving(true);
    const previousProduct = editStockModal.product;

    try {
      // Actualizar producto localmente primero
      const updatedProduct = {
        ...editStockModal.product,
        stock: Number(form.stock),
        min_stock: Number(form.min_stock),
        price: Number(form.price),
        cost: Number(form.cost),
      };
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));

      // Confirmar en Supabase
      const res = await updateProduct(
        previousProduct.id,
        {
          stock: Number(form.stock),
          min_stock: Number(form.min_stock),
          price: Number(form.price),
          cost: Number(form.cost),
        },
        previousProduct.user_id || '',
        currentBusiness?.id || null
      );

      if (res?.success) {
        toast.success('Producto actualizado');
        setEditStockModal({ open: false, product: null });
      } else {
        // Revertir cambios locales si falla
        setProducts(prev => prev.map(p => p.id === previousProduct.id ? previousProduct : p));
        toast.error('No se pudo guardar en el servidor');
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      setProducts(prev => prev.map(p => p.id === previousProduct.id ? previousProduct : p));
      toast.error('Error al actualizar el producto');
    } finally {
      setIsSaving(false);
    }
  }, [editStockModal.product, isSaving, currentBusiness?.id]);

  // Cargar datos al montar el componente
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (currentBusiness?.id && user?.id) {
      loadData();
    }
  }, [user, currentBusiness?.id, user?.id, loadData, router]);

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      const success = await deleteProduct(productId);
      if (success) {
        setProducts(prev => prev.filter(p => p.id !== productId));
        toast.success('Producto eliminado correctamente');
      } else {
        toast.error('Error al eliminar el producto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  // Memoizar el ordenamiento y filtrado para evitar re-renderizados innecesarios
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      // Primero por nombre alfabético
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      
      // Si los nombres son iguales, por fecha de creación (más recientes primero)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    return sortedProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesLowStock = !showLowStock || product.stock <= product.min_stock;
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });
  }, [sortedProducts, searchTerm, selectedCategory, showLowStock]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCurrencyWithDecimals = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CL').format(num);
  };

  const lowStockCount = products.filter(p => p.stock <= p.min_stock).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  // Mostrar spinner solo si está cargando y no hay productos
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4 mb-2">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  return (
    <SecurityGuard>
        <div className="w-full max-w-8xl mx-auto px-3 md:px-4 lg:px-6 space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
            <p className="text-gray-600">Gestiona tus productos y stock</p>
          </div>
          <div className="flex gap-2">
            {/* Input y botón de código de barras eliminados */}
            <Button 
              onClick={async () => {
                if (!user) return;
                
                // TODO: Add usage check
                
                router.push('/inventory/add');
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Producto
            </Button>
            {/* Agregador eliminado */}
            {/* Botón Importar OFF (CL) eliminado */}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{formatNumber(products.length)}</p>
                  <p className="text-sm text-gray-600">Total Productos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{formatNumber(lowStockCount)}</p>
                  <p className="text-sm text-gray-600">Stock Bajo</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{formatNumber(outOfStockCount)}</p>
                  <p className="text-sm text-gray-600">Sin Stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(products.reduce((sum, p) => sum + (p.stock * p.price), 0))}
                  </p>
                  <p className="text-sm text-gray-600">Valor Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showLowStock}
                    onChange={(e) => setShowLowStock(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Solo stock bajo</span>
                </label>
              </div>
              
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setShowLowStock(false);
                  }}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Productos ({formatNumber(filteredProducts.length)})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No se encontraron productos</p>
                <p className="text-sm text-gray-400">
                  {products.length === 0 
                    ? "Agrega tu primer producto para comenzar" 
                    : "No hay productos que coincidan con los filtros"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Producto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código de Barras</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metadatos OFF</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.image_url && (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-10 w-10 rounded-lg object-cover mr-3"
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.sku}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{categories.find(cat => cat.id === product.category_id)?.name || 'Sin categoría'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            product.stock === 0 
                              ? 'bg-red-100 text-red-800'
                              : product.stock <= product.min_stock
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {formatNumber(product.stock)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.cost)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.barcode || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.brand || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.supplier_id || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {/* Botón para ver metadatos OFF extendidos */}
                          {product.general_name || product.quantity || product.packaging || product.labels || product.categories_list ? (
                            <Button size="sm" variant="outline" onClick={() => alert(JSON.stringify({
                              general_name: product.general_name,
                              quantity: product.quantity,
                              packaging: product.packaging,
                              labels: product.labels,
                              categories_list: product.categories_list,
                              countries_sold: product.countries_sold,
                              origin_ingredients: product.origin_ingredients,
                              manufacturing_places: product.manufacturing_places,
                              traceability_code: product.traceability_code,
                              official_url: product.official_url
                            }, null, 2))}>
                              Ver OFF
                            </Button>
                          ) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white z-10">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/inventory/edit/${product.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditStockModal({ open: true, product })}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200"
                            >
                              Stock
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteProduct(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* Modal edición rápida de stock */}
      <EditStockModal
        open={editStockModal.open}
        product={editStockModal.product}
        onClose={() => setEditStockModal({ open: false, product: null })}
        onSave={handleModalSave}
        isSaving={isSaving}
      />
    </SecurityGuard>
  );
} 