'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Camera, TestTube, AlertTriangle, Crown, Package, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { createProduct } from '@/services/supabase/products';
import { getCategories, createCategory } from '@/services/supabase/categories';
import { addPublicProduct } from '@/services/api/publicProductsApi';
import { getCategoryNameById } from '@/services/supabase/getCategoryNameById';
import toast from 'react-hot-toast';
import ProductSearch from '@/components/products/ProductSearch';

import BarcodeScanner from '@/components/products/BarcodeScanner';

import { ProductApiResult } from '@/services/api/productApis';
import CurrencyInput from '@/components/ui/CurrencyInput';
import ImageUpload from '@/components/ui/ImageUpload';

interface Category {
  id: string;
  name: string;
}

export default function AddProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { storeConfig, currentBusiness } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableStoreTypes, setAvailableStoreTypes] = useState<{ value: string, label: string }[]>([]);
  const [selectedStoreType, setSelectedStoreType] = useState<string>('');
  
  const storeType = storeConfig?.type || 'almacen';
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    barcode: '',
    brand: '',
    sku: '',
    price: '',
    cost: '',
    stock: '',
    min_stock: '',
    category_id: '',
    supplier_id: '',
    image_url: '',
    general_name: '',
    quantity: '',
    packaging: '',
    labels: '',
    categories_list: '',
    countries_sold: '',
    origin_ingredients: '',
    manufacturing_places: '',
    traceability_code: '',
    official_url: '',
    source: '', // Para evitar duplicados en tabla pública
    imageFile: undefined as File | null | undefined // Solo uso local, nunca se envía a la DB
  });
  const [loading, setLoading] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  // Removido: variable no usada(false);
  const [currentCost, setCurrentCost] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);
  const [userLimits, setUserLimits] = useState<{ max_stock_per_product: number | null } | null>(null);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const parseCurrencyInput = (value: string) => {
    // Remove currency symbols and parse as number
    return parseFloat(value.replace(/[^0-9.-]/g, ''));
  };

  const [priceTouched, setPriceTouched] = useState(false);

  // Cargar límites del usuario al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        // TODO: Load user limits
        setUserLimits({ max_stock_per_product: null });
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, [user?.id]);

  // Cargar categorías y store_types únicos al montar o cambiar storeType
  useEffect(() => {
    const loadCategoriesAndStoreTypes = async () => {
      try {
        const typeFilter = selectedStoreType || storeConfig?.type;
        // Cargar categorías filtradas
        const categoriesData = typeFilter ? await getCategories(typeFilter) : await getCategories();
        setCategories(categoriesData || []);
        // Cargar todos los store_type únicos de ws_categories
        const { data: allTypes, error } = await (await import('@/services/supabase/client')).supabase
          .from('ws_categories')
          .select('store_type')
          .neq('store_type', null);
        if (error) {
          console.error('Error fetching store_types:', error);
          setAvailableStoreTypes([]);
        } else {
          const capitalize = (str: string) =>
            str
              .replace(/_/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase())
              .replace(/\s+/g, ' ')
              .trim();
          const uniqueTypes = Array.from(new Set((allTypes || []).map((c: any) => c.store_type)));
          const capitalizedTypes = uniqueTypes.map((t: string) => ({ value: t, label: capitalize(t) }));
          setAvailableStoreTypes(capitalizedTypes);
          // Si aún no se seleccionó nada y el storeConfig.type existe, inicializarlo
          if (!selectedStoreType && storeConfig?.type && uniqueTypes.includes(storeConfig.type)) {
            setSelectedStoreType(storeConfig.type);
          }
        }
      } catch (error) {
        console.error('❌ AddProductPage: Error loading categories/store_types:', error);
        setCategories([]);
        setAvailableStoreTypes([]);
      }
    };
    loadCategoriesAndStoreTypes();
  }, [storeConfig?.type, selectedStoreType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Currency-aware parsing for price/cost fields while keeping text input formatted in UI preview
    if (name === 'price' || name === 'cost') {
      const numeric = parseCurrencyInput(value);
      setFormData(prev => ({ ...prev, [name]: isNaN(numeric) ? '' : String(numeric) }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Debes iniciar sesión para crear productos');
      return;
    }
    setLoading(true);
    try {
      let imageUrl = formData.image_url;
      // Subir imagen a Storage si hay archivo seleccionado
      if (formData.imageFile) {
        const file = formData.imageFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `hotel/${user.id}/productos/images/${fileName}`;
        const { data, error } = await (await import('@/services/supabase/client')).supabase.storage
          .from('hotel')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });
        if (error) {
          toast.error('Error al subir la imagen');
          setLoading(false);
          return;
        }
        // Obtener URL pública
        const { data: urlData } = (await import('@/services/supabase/client')).supabase.storage
          .from('hotel')
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      const productData = {
        ...formData,
        barcode: formData.barcode || undefined,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || 0,
        stock: parseInt(formData.stock) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        category_id: formData.category_id || undefined,
        supplier_id: formData.supplier_id || undefined,
        labels: formData.labels ? formData.labels.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        categories_list: formData.categories_list ? formData.categories_list.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        countries_sold: formData.countries_sold ? formData.countries_sold.split(',').map(s => s.trim()).filter(Boolean) : undefined,
        image_url: imageUrl
      };
      // Remover campos que no deben ir a la tabla ws_products
      delete (productData as any).sku;
      delete (productData as any).source;
      delete (productData as any).imageFile;

      // Determinar businessId real desde currentBusiness (multi-negocio)
      const businessId = currentBusiness?.id;
      if (!businessId) {
        toast.error('Debes seleccionar un negocio antes de crear productos');
        setLoading(false);
        return;
      }

      const result = await createProduct(productData as any, { businessId });

      if (!result.success) {
        console.error('Error creating product:', result.error);
        toast.error(result.error || 'Error al crear el producto');
        if (result.error?.includes('límite') || result.error?.includes('plan')) {
          router.push('/subscription');
        }
        return;
      }

      // Si el producto fue creado exitosamente, también agregarlo a la tabla pública
      try {
        // Evitar bucle: solo guardar si el producto NO viene de la fuente pública
        if (formData.barcode && formData.name && formData.source !== 'public') {
          // Verificar si ya existe un producto con el mismo código de barras en la tabla pública
          const { data: existing, error: existingError } = await (await import('@/services/supabase/client')).supabase
            .from('public_products')
            .select('id')
            .eq('barcode', formData.barcode)
            .maybeSingle();

          if (!existing) {
            // Obtener el nombre real de la categoría desde la base de datos
            const categoryName = await getCategoryNameById(formData.category_id);
            if (!categoryName) {
              console.warn('No se encontró la categoría en la base de datos para el id:', formData.category_id);
            }
            const publicProductData = {
              barcode: formData.barcode,
              name: formData.name,
              description: formData.description || undefined,
              brand: formData.brand || undefined,
              category: categoryName,
              price: parseFloat(formData.price) || undefined,
              image_url: formData.image_url || undefined,
              quantity: formData.quantity || undefined,
              packaging: formData.packaging || undefined,
              country: 'Chile',
              source: 'user_contributed'
            };
            await addPublicProduct(publicProductData);
            console.log('Producto agregado a la tabla pública exitosamente');
          } else {
            console.log('Producto ya existe en la tabla pública, no se duplica.');
          }
        }
      } catch (publicError) {
        // No mostrar error al usuario ya que el producto principal fue creado exitosamente
        console.error('Error agregando producto a tabla pública:', publicError);
      }

      // Mostrar mensaje de éxito con el SKU generado
      const skuMessage = result.data?.sku ? 
        `Producto creado exitosamente. SKU: ${result.data.sku}` : 
        'Producto creado exitosamente';
      toast.success(skuMessage);
      router.push('/inventory');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleProductFromApi = (product: ProductApiResult) => {
    // Usar el precio como costo estimado si no hay costo específico
    const estimatedCost = product.price ? product.price * 0.7 : 0; // 70% del precio como costo estimado
    const productPrice = product.price || 0;
    setCurrentCost(estimatedCost);
    setCurrentPrice(estimatedCost); // Start with cost, no percentage
    setSelectedPercentage(null);
    setFormData({
      ...formData,
      name: product.name,
      description: product.description || product.general_name || '',
      barcode: product.barcode || '',
      brand: product.brand || '',
      cost: estimatedCost.toString(),
      price: estimatedCost.toString(), // Start with cost, no percentage
      image_url: product.image || '',
      general_name: product.general_name || '',
      quantity: product.quantity || '',
      packaging: product.packaging || '',
      labels: (product.labels || []).join(', '),
      categories_list: (product.categories_list || []).join(', '),
      countries_sold: (product.countries_sold || []).join(', '),
      origin_ingredients: product.origin_ingredients || '',
      manufacturing_places: product.manufacturing_places || '',
      traceability_code: product.traceability_code || '',
      official_url: product.official_url || ''
    });
    
    toast.success(`Producto "${product.name}" cargado desde ${product.api_name}`);
  };

  const handleProductFromScanner = (product: ProductApiResult) => {
    const estimatedCost = product.price ? product.price * 0.7 : 0;
    const productPrice = product.price || 0;
    setCurrentCost(estimatedCost);
    setCurrentPrice(estimatedCost); // Start with cost, no percentage
    setSelectedPercentage(null);
    setFormData({
      ...formData,
      name: product.name,
      description: product.description || '',
      barcode: product.barcode || '',
      cost: estimatedCost.toString(),
      price: estimatedCost.toString(), // Start with cost, no porcentaje
      image_url: product.image || ''
    });
    toast.success(`Código ${product.barcode} capturado (${product.name})`);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('El nombre de la categoría es requerido');
      return;
    }

    if (!storeType) {
      toast.error('No se pudo determinar el tipo de negocio');
      return;
    }

    // Verificar si la categoría ya existe
    const existingCategory = categories.find(
      cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
    );

    if (existingCategory) {
      toast.error(`La categoría "${newCategoryName.trim()}" ya existe`);
      return;
    }

    setCreatingCategory(true);

    try {
      const categoryData = {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || newCategoryName.trim(),
        color: '#3B82F6', // Color azul por defecto
        store_type: storeType
      };

      const newCategory = await createCategory(categoryData);

      if (newCategory) {
        // Agregar la nueva categoría a la lista
        setCategories(prev => [...prev, newCategory]);
        
        // Seleccionar automáticamente la nueva categoría
        setFormData(prev => ({ ...prev, category_id: newCategory.id }));
        
        // Limpiar el formulario
        setNewCategoryName('');
        setNewCategoryDescription('');
        setShowNewCategoryForm(false);
        
        toast.success(`Categoría "${newCategory.name}" creada exitosamente`);
      }
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast.error(error.message || 'Error al crear la categoría');
    } finally {
      setCreatingCategory(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
      <div className="px-4 md:px-6">
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Agregar Producto</h1>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowProductSearch(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>Buscar desde API</span>
              </Button>
              <Button
                onClick={() => setShowBarcodeScanner(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Camera className="h-4 w-4" />
                <span>Escanear Código</span>
              </Button>

            </div>
          </div>

          {/* Alerta de límites del plan gratuito */}
          {userLimits?.max_stock_per_product === 5 && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-800">
                    Plan Gratuito - Límites Aplicados
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
                    <p className="mb-2">
                      <strong>Límites actuales:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Máximo 5 productos en total</li>
                      <li>Máximo 5 unidades de stock por producto</li>
                    </ul>
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        onClick={() => router.push('/subscription')}
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        <Crown className="h-4 w-4 mr-1" />
                        Cambiar a Plan Premium
                      </Button>
                      <span className="text-xs text-amber-600">
                        Para aumentar estos límites
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

              <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Información del Producto
          </CardTitle>
        </CardHeader>
        <CardContent>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del producto"
                  />
                </div>

                {/* SKU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku || "Se generará automáticamente"}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                    placeholder="Se generará automáticamente"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    El SKU se genera automáticamente al crear el producto
                  </p>
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="p.ej. Iansa, Lobos"
                  />
                </div>

                {/* Código de Barras */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: 7800000000001"
                  />
                </div>

                {/* Costo (arriba) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo
                  </label>
                   <CurrencyInput
                    value={parseFloat(formData.cost || '0') || 0}
                    onChange={(n) => {
                      const clean = isNaN(n) ? 0 : n;
                      setCurrentCost(clean);
                      setFormData(prev => ({ ...prev, cost: String(clean) }));
                      // Update price based on selected percentage or just cost if no percentage
                      const newPrice = selectedPercentage ? clean * (1 + selectedPercentage / 100) : clean;
                      setCurrentPrice(newPrice);
                      setFormData(prev => ({ ...prev, price: String(newPrice) }));
                    }}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="0"
                   />
                  <p className="mt-1 text-xs text-gray-500">{formatCurrency(parseFloat(formData.cost || '0') || 0)}</p>
                </div>

                {/* Incrementos de precio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incremento de precio
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      const percent = parseFloat(e.target.value);
                      if (!isNaN(percent)) {
                        setSelectedPercentage(percent);
                        const incrementPrice = currentCost * (1 + percent / 100);
                        setPriceTouched(true);
                        setCurrentPrice(incrementPrice);
                        setFormData(prev => ({ ...prev, price: String(incrementPrice) }));
                      } else {
                        setSelectedPercentage(null);
                        setCurrentPrice(currentCost);
                        setFormData(prev => ({ ...prev, price: String(currentCost) }));
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Seleccionar incremento</option>
                    {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200].map((percent) => {
                      const incrementPrice = currentCost * (1 + percent / 100);
                      return (
                        <option key={percent} value={percent}>
                          {percent}% ({formatCurrency(incrementPrice)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Precio de Venta (abajo) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Precio de Venta *
                    </label>
                  </div>
                  <CurrencyInput
                    value={currentPrice}
                    onChange={(n) => {
                      setPriceTouched(true);
                      setCurrentPrice(n);
                      setFormData(prev => ({ ...prev, price: String(isNaN(n)?0:n) }));
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-xs text-gray-500">{formatCurrency(parseFloat(formData.price || '0') || 0)}</p>
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:text-blue-700"
                      onClick={() => {
                        const suggested = Math.max(0, currentCost * 1.3);
                        setSelectedPercentage(30);
                        setCurrentPrice(suggested);
                        setFormData(prev => ({ ...prev, price: String(suggested) }));
                      }}
                    >
                      Aplicar sugerido
                    </button>
                  </div>
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Actual *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    max={userLimits?.max_stock_per_product || undefined}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      userLimits?.max_stock_per_product && parseInt(formData.stock) > userLimits.max_stock_per_product
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="0"
                  />
                  {userLimits?.max_stock_per_product && (
                    <div className="mt-1">
                      {parseInt(formData.stock) > userLimits.max_stock_per_product ? (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <p className="text-xs text-red-600">
                            Excede el límite de {userLimits.max_stock_per_product} unidades. 
                            <button 
                              onClick={() => router.push('/subscription')}
                              className="ml-1 underline hover:text-red-700"
                            >
                              Cambiar plan
                            </button>
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">
                          Máximo permitido: {userLimits.max_stock_per_product} unidades
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Stock Mínimo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    name="min_stock"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Tipo de tienda (store_type) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de tienda</label>
                  <select
                    value={selectedStoreType}
                    onChange={(e)=> setSelectedStoreType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">(Todos)</option>
                    {availableStoreTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  {selectedStoreType && selectedStoreType !== storeType && (
                    <p className="mt-1 text-xs text-amber-600">Viendo distinto al negocio ({storeType})</p>
                  )}
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría {categories.length > 0 && <span className="text-gray-500 font-normal">({categories.length} disponibles)</span>}
                  </label>
                  <div className="space-y-2">
                    <select
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar categoría</option>
                      {categories.length === 0 ? (
                        <option value="" disabled>No hay categorías disponibles ({categories.length})</option>
                      ) : (
                        categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))
                      )}
                    </select>
                    
                    {/* Botón para crear nueva categoría */}
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryForm(!showNewCategoryForm)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {showNewCategoryForm ? 'Cancelar nueva categoría' : 'Crear nueva categoría'}
                    </button>
                    <p className="text-xs text-gray-500">
                      Las categorías son específicas para tu tipo de negocio ({storeType})
                    </p>
                    {categories.length === 0 && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-xs text-blue-700">
                          <strong>¡Crea tu primera categoría!</strong> Las categorías te ayudan a organizar mejor tus productos.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Formulario para crear nueva categoría */}
                  {showNewCategoryForm && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Nueva Categoría</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Nombre de la categoría *
                          </label>
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Ej: Bebidas, Herramientas, etc."
                            disabled={creatingCategory}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Descripción (opcional)
                          </label>
                          <input
                            type="text"
                            value={newCategoryDescription}
                            onChange={(e) => setNewCategoryDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            placeholder="Descripción de la categoría"
                            disabled={creatingCategory}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={handleCreateCategory}
                            disabled={creatingCategory || !newCategoryName.trim()}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          >
                            {creatingCategory ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Creando...
                              </>
                            ) : (
                              'Crear Categoría'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewCategoryForm(false);
                              setNewCategoryName('');
                              setNewCategoryDescription('');
                            }}
                            disabled={creatingCategory}
                            className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* URL de Imagen y subida */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen del producto
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                    {/* Subida de imagen a Storage */}
                    {user?.id && (
                      <ImageUpload
                        currentImage={formData.image_url}
                        onFileSelect={(file: File | null) => setFormData(prev => ({ ...prev, imageFile: file }))}
                        className="!m-0 !w-9 !h-9"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del producto..."
                />
              </div>

              {/* Datos adicionales (OpenFoodFacts) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Denominación general
                  </label>
                  <input
                    type="text"
                    name="general_name"
                    value={formData.general_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="p.ej. sal de mesa yodada"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad
                  </label>
                  <input
                    type="text"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="p.ej. 500 g"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Envase
                  </label>
                  <input
                    type="text"
                    name="packaging"
                    value={formData.packaging}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="p.ej. Botella, Plástico"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sellos / Certificados (separados por coma)
                  </label>
                  <input
                    type="text"
                    name="labels"
                    value={formData.labels}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sin gluten, Hecho en Chile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categorías (separadas por coma)
                  </label>
                  <input
                    type="text"
                    name="categories_list"
                    value={formData.categories_list}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Endulzantes, Sustitutos del azúcar"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Países de venta (separados por coma)
                  </label>
                  <input
                    type="text"
                    name="countries_sold"
                    value={formData.countries_sold}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Chile, Bolivia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Origen de los ingredientes
                  </label>
                  <input
                    type="text"
                    name="origin_ingredients"
                    value={formData.origin_ingredients}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Chile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lugares de fabricación
                  </label>
                  <input
                    type="text"
                    name="manufacturing_places"
                    value={formData.manufacturing_places}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Región Valparaíso, Chile"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de trazabilidad
                  </label>
                  <input
                    type="text"
                    name="traceability_code"
                    value={formData.traceability_code}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="SS 377/2006"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL oficial del producto
                  </label>
                  <input
                    type="url"
                    name="official_url"
                    value={formData.official_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Producto
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Modal de búsqueda de productos desde API */}
        {showProductSearch && (
          <ProductSearch
            onProductSelect={handleProductFromApi}
            onClose={() => setShowProductSearch(false)}
          />
        )}
        {showBarcodeScanner && (
          <BarcodeScanner
            onProductFound={handleProductFromScanner}
            onClose={() => setShowBarcodeScanner(false)}
          />
        )}

      </div>
  );
}