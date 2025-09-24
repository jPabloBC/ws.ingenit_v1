'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { importChileProducts, importProductByBarcode } from '@/services/integrations/openFoodFacts';
import SecurityGuard from '@/components/SecurityGuard';
import { useProducts } from '@/contexts/ProductsContext';
import { useCategories } from '@/contexts/CategoriesContext';
import EditStockModal from '@/components/modals/EditStockModal';
import { supabase } from '@/services/supabase/client';
import { useRobustInterval } from '@/hooks/useRobustInterval';
import { usePageVisibility } from '@/hooks/usePageVisibility';

// Modal movido a componente separado para mejor rendimiento

export default function Inventory() {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const { storeConfig, currentBusiness } = useStore();
  
  // Usar contexto global de productos
  const { 
    products, 
    loading: productsLoading, 
    error: productsError,
    loadProducts,
    refreshProducts,
    updateProduct: updateProductInCache,
    removeProduct: removeProductFromCache
  } = useProducts();
  
  // Usar contexto global de categorías
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    loadCategories
  } = useCategories();
  
  // Hook de visibilidad para recargar datos cuando vuelve al primer plano
  const { isVisible } = usePageVisibility();
  
  const [loading, setLoading] = useState(false); // Cambiado a false inicialmente
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [importing, setImporting] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [loadingData, setLoadingData] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [editStockModal, setEditStockModal] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [isSaving, setIsSaving] = useState(false);

  // Función para manejar el guardado del modal
  const handleModalSave = useCallback(async (form: { stock: number; min_stock: number; price: number; cost: number }) => {
    // console.log('🔧 handleModalSave called:', { form, product: editStockModal.product, isSaving });
    
    if (isSaving) {
      // console.log('⚠️ Already saving, ignoring request');
      return;
    }
    
    if (!editStockModal.product) {
      console.error('❌ No product in modal state');
      toast.error('Error: No hay producto seleccionado');
      return;
    }
    
    setIsSaving(true);
    
    // Helper: timeout
    const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
        p.then((v) => { clearTimeout(timer); resolve(v); })
         .catch((e) => { clearTimeout(timer); reject(e); });
      });
    };

    // Guardar valores previos por si hay que revertir
    const previousProduct = editStockModal.product;

    try {
      // console.log('🔄 Updating product in cache (optimistic)...');
      const updatedProduct = {
        ...editStockModal.product,
        stock: Number(form.stock),
        min_stock: Number(form.min_stock),
        price: Number(form.price),
        cost: Number(form.cost),
      };
      updateProductInCache(updatedProduct);

      // Confirmar en Supabase con reintentos
      // console.log('🔄 Saving to Supabase with retries...');
      const trySave = async () => {
        const res = await withTimeout(
          updateProduct(
            previousProduct.id,
            {
              stock: Number(form.stock),
              min_stock: Number(form.min_stock),
              price: Number(form.price),
              cost: Number(form.cost),
            },
            previousProduct.user_id || '',
            currentBusiness?.id || null
          ),
          10000
        );
        return res;
      };

      let res: any;
      let attempt = 0;
      let lastErr: any = null;
      while (attempt < 3) {
        try {
          attempt += 1;
          res = await trySave();
          if (res?.success) break;
          lastErr = res?.error || 'Unknown error';
        } catch (e) {
          lastErr = e;
        }
        await new Promise(r => setTimeout(r, 500 * attempt));
      }

      if (res?.success) {
        // Si el backend devolvió el producto (con updated_at / triggers), actualizar cache con esos datos
        if (res.data) {
          updateProductInCache({ ...previousProduct, ...res.data });
        }
        if (currentBusiness?.id && user?.id) {
          try {
            localStorage.setItem(`inv-last-change-${currentBusiness.id}`, Date.now().toString());
          } catch {}
          // BroadcastChannel local inmediato
          try {
            const bc = new BroadcastChannel('inv-sync');
            bc.postMessage({ type: 'inventory_updated', businessId: currentBusiness.id });
            setTimeout(() => { try { bc.close(); } catch {} }, 500);
          } catch {}
          // (Opcional) refresh local para asegurar consistencia si había triggers que cambian otros campos
          // refreshProducts(currentBusiness.id, user.id); // Deshabilitado para depender de realtime y evitar cargas duplicadas
          try {
            const registry: any = (window as any).__invChannels ||= {};
            // Canal dedicado
            const invChanName = `inv-broadcast-${currentBusiness.id}`;
            let invChannel = registry[invChanName];
            if (!invChannel) {
              invChannel = supabase.channel(invChanName);
              registry[invChanName] = invChannel;
              await invChannel.subscribe();
            }
            // Canal compartido que el dashboard ya escucha (biz-<id>)
            const bizChanName = `biz-${currentBusiness.id}`;
            let bizChannel = registry[bizChanName];
            if (!bizChannel) {
              bizChannel = supabase.channel(bizChanName);
              registry[bizChanName] = bizChannel;
              await bizChannel.subscribe();
            }
            const payload = { type: 'broadcast', event: 'inventory_updated', payload: { businessId: currentBusiness.id } } as any;
            await Promise.all([
              invChannel.send(payload).catch(() => {}),
              bizChannel.send(payload).catch(() => {})
            ]);
          } catch (e) {
            // Silencioso: si falla broadcast no bloquea el update
          }
        }
        toast.success('Producto actualizado');
        setEditStockModal({ open: false, product: null });
      } else {
        console.error('❌ Save failed:', lastErr);
        // Revertir cambios en cache si falla confirmación
        updateProductInCache(previousProduct);
        toast.error('No se pudo guardar en el servidor. Intenta nuevamente.');
      }
    } catch (error: any) {
      console.error('❌ Error updating product:', error);
      updateProductInCache(previousProduct);
      toast.error('Error al actualizar el producto');
    } finally {
      setIsSaving(false);
    }
  }, [editStockModal.product, updateProductInCache, updateProduct, isSaving, currentBusiness?.id, user?.id]);

  // Debug logs (DUPLICADO - comentado)
  // console.log('🔍 Inventory Debug:', {
  //   productsLoading,
  //   productsCount: products.length,
  //   categoriesLoading,
  //   categoriesCount: categories.length,
  //   user: !!user,
  //   currentBusiness: !!currentBusiness
  // });

  // Cargar datos iniciales solo una vez + retry si vienen vacíos
  const initialLoadDone = useRef(false);
  const retryAttemptsRef = useRef(0);
  const hasLoadedOnce = useRef(false); // Evita volver al spinner después de tener datos
  const lastRefreshRef = useRef(0); // Último momento en que se aceptó una carga/refresh

  // Marcar cuando ya tenemos datos (primera vez)
  useEffect(() => {
    if (products.length > 0) {
      hasLoadedOnce.current = true;
      lastRefreshRef.current = Date.now();
    }
  }, [products.length]);
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!currentBusiness?.id || !user?.id) return;

    const attemptLoad = (force = false) => {
      if (!initialLoadDone.current || force) {
        initialLoadDone.current = true;
        loadProducts(currentBusiness.id!, user.id!, force);
        loadCategories();
      }
    };

    // Primera carga
    attemptLoad(false);

    // Retry progresivo si productos siguen vacíos (hasta 3 veces)
    if (products.length === 0 && retryAttemptsRef.current < 3) {
      const timeout = setTimeout(() => {
        if (products.length === 0 && currentBusiness?.id && user?.id) {
          retryAttemptsRef.current += 1;
          attemptLoad(true);
        }
      }, 1500 * (retryAttemptsRef.current + 1));
      return () => clearTimeout(timeout);
    }
  }, [user?.id, currentBusiness?.id, products.length]);

  // DESACTIVADO: refresco por visibilidad temporalmente para aislar causa de loading infinito
  // useEffect(() => { ... })

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      const success = await deleteProduct(productId);
      if (success) {
        removeProductFromCache(productId);
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

  // Debug logs (DUPLICADO - comentado)
  // console.log('🔍 Inventory Debug:', {
  //   productsLoading,
  //   productsCount: products.length,
  //   categoriesLoading,
  //   categoriesCount: categories.length,
  //   user: !!user,
  //   currentBusiness: !!currentBusiness
  // });

  // DESACTIVADO intervalo automático para evitar interferencias durante diagnóstico
  // useRobustInterval(() => { ... })

  // Mostrar spinner SOLO si todavía no hemos cargado nada nunca
  if (!hasLoadedOnce.current && productsLoading && products.length === 0) {
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
        {/* Barra debug temporal */}
        <div className="text-xs bg-gray-100 border border-gray-200 rounded p-2 flex flex-wrap gap-3">
          <span>debug: productos={products.length}</span>
          <span>loading={String(productsLoading)}</span>
          <span>hasLoadedOnce={String(hasLoadedOnce.current)}</span>
          <span>lastRefresh={(lastRefreshRef.current && new Date(lastRefreshRef.current).toLocaleTimeString()) || '-'}</span>
          {productsError && <span className="text-red-600">error={productsError}</span>}
          <button
            onClick={() => {
              if (currentBusiness?.id && user?.id) {
                lastRefreshRef.current = Date.now();
                refreshProducts(currentBusiness.id, user.id);
              }
            }}
            className="px-2 py-1 bg-blue-600 text-white rounded"
          >Recargar</button>
        </div>
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
                      if (currentBusiness?.id && user?.id) {
                        await loadProducts(currentBusiness.id, user.id, true);
                      }
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
                  if (currentBusiness?.id && user?.id) {
                    await loadProducts(currentBusiness.id, user.id, true);
                  }
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