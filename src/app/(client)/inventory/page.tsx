'use client';
import { useState, useEffect } from 'react';
import { Package, AlertTriangle, Filter, Search, Plus, Globe, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { getProducts, deleteProduct, updateProduct } from '@/services/supabase/products';
import { getCategories } from '@/services/supabase/categories';
import toast from 'react-hot-toast';
import { importChileProducts, importProductByBarcode } from '@/services/integrations/openFoodFacts';
import SecurityGuard from '@/components/SecurityGuard';

// Modal simple para editar stock
function EditStockModal({ open, onClose, product, onSave }: any) {
  const [form, setForm] = useState({
    stock: product?.stock || 0,
    min_stock: product?.min_stock || 0,
    price: product?.price || 0,
    cost: product?.cost || 0,
  });

  // Funciones de formato para el modal
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CL').format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Función para formatear valores en inputs
  const formatInputValue = (value: any) => {
    if (!value || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return formatNumber(num);
  };

  // Función para extraer número de string formateado
  const parseFormattedNumber = (value: string) => {
    if (!value) return '';
    return value.replace(/\./g, '');
  };

  useEffect(() => {
    if (product) {
      setForm({
        stock: product.stock || 0,
        min_stock: product.min_stock || 0,
        price: product.price || 0,
        cost: product.cost || 0,
      });
    }
  }, [product]);

  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md">
        <h3 className="text-lg font-bold mb-2">Editar Stock - {product.name}</h3>
        <div className="text-sm text-gray-600 mb-4">
          <p>Stock actual: {formatNumber(product.stock)} | Precio: {formatCurrency(product.price)} | Costo: {formatCurrency(product.cost)}</p>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSave({
            stock: Number(form.stock),
            min_stock: Number(form.min_stock),
            price: Number(form.price),
            cost: Number(form.cost),
          });
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Stock</label>
            <input 
              type="text" 
              value={formatInputValue(form.stock)} 
              onChange={(e) => {
                const rawValue = parseFormattedNumber(e.target.value);
                setForm({...form, stock: rawValue});
              }}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="1.000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Stock Mínimo</label>
            <input 
              type="text" 
              value={formatInputValue(form.min_stock)} 
              onChange={(e) => {
                const rawValue = parseFormattedNumber(e.target.value);
                setForm({...form, min_stock: rawValue});
              }}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Precio</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input 
                type="text" 
                value={formatInputValue(form.price)} 
                onChange={(e) => {
                  const rawValue = parseFormattedNumber(e.target.value);
                  setForm({...form, price: rawValue});
                }}
                className="w-full border rounded pl-8 pr-12 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="1.000"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">CLP</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Formato: {form.price ? formatCurrency(Number(form.price)) : '$0'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Costo</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input 
                type="text" 
                value={formatInputValue(form.cost)} 
                onChange={(e) => {
                  const rawValue = parseFormattedNumber(e.target.value);
                  setForm({...form, cost: rawValue});
                }}
                className="w-full border rounded pl-8 pr-12 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="1.000"
              />
              <span className="absolute right-3 top-2 text-gray-500 text-sm">CLP</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Formato: {form.cost ? formatCurrency(Number(form.cost)) : '$0'}</p>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode?: string | null;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  category_id: string;
  supplier_id: string | null;
  image_url: string | null;
  brand?: string | null;
  user_id?: string | null;
  store_type?: string | null;
  business_id?: string | null;
  app_id?: string | null;
  general_name?: string | null;
  quantity?: string | null;
  packaging?: string | null;
  labels?: string[] | null;
  categories_list?: string[] | null;
  countries_sold?: string[] | null;
  origin_ingredients?: string | null;
  manufacturing_places?: string | null;
  traceability_code?: string | null;
  official_url?: string | null;
  off_metadata?: any | null;
  created_at: string;
  updated_at: string;
  ws_categories?: { name: string };
  ws_suppliers?: { name: string };
}

export default function Inventory() {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const { storeConfig, currentBusiness } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [importing, setImporting] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [editStockModal, setEditStockModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    loadData();
  }, [user?.id]);

  // Recargar datos cuando la página se vuelve visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('Página visible, recargando inventario...');
        loadData();
      }
    };

    // Sin event listeners de visibilidad
  }, [user?.id]);

  const loadData = async () => {
    if (loadingData) {
      console.log('Data already loading, skipping...');
      return;
    }
    
    try {
      setLoadingData(true);
      setLoading(true);
      setLoadingStatus('Cargando datos...');
      
      // Limpiar estado antes de cargar
      setProducts([]);
      setCategories([]);
      
      // Mostrar la página inmediatamente con datos vacíos
      setLoading(false);
      
      // Ejecutar consultas en segundo plano
      setLoadingStatus('Obteniendo productos...');
      const productsPromise = (user && currentBusiness?.id)
        ? getProducts(currentBusiness.id).catch(err => {
            console.error('Error in products:', err);
            return [];
          })
        : Promise.resolve([]);
      
      setLoadingStatus('Obteniendo categorías...');
      const categoriesPromise = getCategories().catch(err => {
        console.error('Error in categories:', err);
        return [];
      });
      
      setLoadingStatus('Finalizando...');
      const [productsData, categoriesData] = await Promise.all([
        productsPromise,
        categoriesPromise
      ]);
      
      setProducts(productsData);
      setCategories(categoriesData);
      setLoadingStatus('');
    } catch (error) {
      console.error('Error loading inventory data:', error);
      toast.error('Error al cargar los datos del inventario');
      // Mostrar datos vacíos en caso de error
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
      setLoadingData(false);
      setLoadingStatus('');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      const success = await deleteProduct(productId);
      if (success) {
        setProducts(products.filter(p => p.id !== productId));
        toast.success('Producto eliminado correctamente');
      } else {
        toast.error('Error al eliminar el producto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesLowStock = !showLowStock || product.stock <= product.min_stock;
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4 mb-2">Cargando inventario...</p>
          {loadingStatus && (
            <p className="text-sm text-gray-500">{loadingStatus}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <SecurityGuard>
        {/* Indicador de carga en la parte superior */}
        {loadingStatus && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-blue-700 text-sm">{loadingStatus}</p>
            </div>
          </div>
        )}
        
        <div className="w-full max-w-8xl mx-auto px-3 md:px-4 lg:px-4 space-y-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
            <p className="text-gray-600">Gestiona tus productos y stock</p>
          </div>
          <div className="flex gap-2">
            <div className="hidden md:flex items-center gap-2">
              <input
                type="text"
                placeholder="Código de barras"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <Button
                variant="outline"
                disabled={importing || !barcode.trim()}
                onClick={async () => {
                  if (!user) return;
                  try {
                    setImporting(true);
                    toast.loading('Buscando producto por código...', { id: 'off-barcode' });
                    if (!currentBusiness?.id) {
                      toast.error('Selecciona un negocio antes de importar');
                      return;
                    }
                    const res = await importProductByBarcode(user.id, currentBusiness.id, barcode.trim());
                    toast.dismiss('off-barcode');
                    if (res.success) {
                      toast.success('Producto importado');
                      setBarcode('');
                      await loadData();
                    } else {
                      toast.error(res.reason || 'No se pudo importar');
                    }
                  } catch {
                    toast.dismiss('off-barcode');
                    toast.error('Error al importar por código');
                  } finally {
                    setImporting(false);
                  }
                }}
              >
                Buscar por código
              </Button>
            </div>
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
            <Button
              variant="outline"
              onClick={() => router.push('/inventory/aggregator')}
              className="flex items-center space-x-2"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden md:inline">Agregador</span>
            </Button>
            <Button
              variant="outline"
              disabled={importing}
              onClick={async () => {
                if (!user) return;
                try {
                  setImporting(true);
                  toast.loading('Importando productos desde OFF...', { id: 'off' });
                  if (!currentBusiness?.id) {
                    toast.error('Selecciona un negocio antes de importar');
                    return;
                  }
                  const result = await importChileProducts(user.id, currentBusiness.id, 10);
                  toast.dismiss('off');
                  toast.success(`Importados: ${result.imported}, Omitidos: ${result.skipped}, Errores: ${result.errors}`);
                  await loadData();
                } catch {
                  toast.dismiss('off');
                  toast.error('Error al importar productos');
                } finally {
                  setImporting(false);
                }
              }}
            >
              Importar OFF (CL)
            </Button>
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
                  {products.length === 0 && categories.length > 0 
                    ? "La tabla de productos no existe o está vacía" 
                    : "Agrega tu primer producto para comenzar"}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.cost)}</td>
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
        onSave={async (form: { stock: number; min_stock: number; price: number; cost: number }) => {
          if (!editStockModal.product) return;
          const res = await updateProduct(editStockModal.product.id, {
            stock: Number(form.stock),
            min_stock: Number(form.min_stock),
            price: Number(form.price),
            cost: Number(form.cost),
          }, editStockModal.product.user_id || '');
          if (res.success) {
            toast.success('Producto actualizado');
            setEditStockModal({ open: false, product: null });
            await loadData();
          } else {
            toast.error(res.error || 'Error al actualizar');
          }
        }}
      />
    </SecurityGuard>
  );
} 