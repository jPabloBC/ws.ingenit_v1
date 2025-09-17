'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Package, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { getProduct, updateProduct, Product } from '@/services/supabase/products';
import { getCategories } from '@/services/supabase/categories';
import toast from 'react-hot-toast';
interface Category {
  id: string;
  name: string;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    price: '',
    cost: '',
    stock: '',
    min_stock: '',
    category_id: '',
    supplier_id: '',
    image_url: '',
    barcode: '',
    brand: '',
    general_name: '',
    quantity: '',
    packaging: '',
    labels: '',
    categories_list: '',
    countries_sold: '',
    origin_ingredients: '',
    manufacturing_places: '',
    traceability_code: '',
    official_url: ''
  });

  // Cargar producto y categorías
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar categorías
        const categoriesData = await getCategories();
        setCategories(categoriesData || []);

        // Cargar producto
        const productData = await getProduct(productId);
        if (productData) {
          setProduct(productData);
          setFormData({
            name: productData.name || '',
            description: productData.description || '',
            sku: productData.sku || '',
            price: productData.price?.toString() || '',
            cost: productData.cost?.toString() || '',
            stock: productData.stock?.toString() || '',
            min_stock: productData.min_stock?.toString() || '',
            category_id: productData.category_id || '',
            supplier_id: productData.supplier_id || '',
            image_url: productData.image_url || '',
            barcode: productData.barcode || '',
            brand: productData.brand || '',
            general_name: productData.general_name || '',
            quantity: productData.quantity || '',
            packaging: productData.packaging || '',
            labels: (productData.labels || []).join(', '),
            categories_list: (productData.categories_list || []).join(', '),
            countries_sold: (productData.countries_sold || []).join(', '),
            origin_ingredients: productData.origin_ingredients || '',
            manufacturing_places: productData.manufacturing_places || '',
            traceability_code: productData.traceability_code || '',
            official_url: productData.official_url || ''
          });
        } else {
          toast.error('Producto no encontrado');
          router.push('/inventory');
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar los datos');
        router.push('/inventory');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadData();
    }
  }, [productId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || 0,
        stock: parseInt(formData.stock) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        category_id: formData.category_id || undefined,
        supplier_id: formData.supplier_id || undefined,
        labels: formData.labels ? formData.labels.split(',').map(s => s.trim()).filter(Boolean) : [],
        categories_list: formData.categories_list ? formData.categories_list.split(',').map(s => s.trim()).filter(Boolean) : [],
        countries_sold: formData.countries_sold ? formData.countries_sold.split(',').map(s => s.trim()).filter(Boolean) : []
      };

      if (!user) {
        toast.error('Debes iniciar sesión para actualizar productos');
        return;
      }
      
      const { error } = await updateProduct(productId, productData, user.id);

      if (error) {
        console.error('Error updating product:', error);
        toast.error('Error al actualizar el producto: ' + error);
        return;
      }

      toast.success('Producto actualizado exitosamente');
      router.push('/inventory');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error inesperado');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Producto no encontrado</h1>
          <Button
            onClick={() => router.push('/inventory')}
            className="mt-4"
          >
            Volver al Inventario
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-8xl mx-auto px-3 md:px-4 lg:px-4 space-y-5">
      <div className="mb-6">
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
        <p className="text-gray-600">Editando: {product.name}</p>
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
            <div className="grid grid-cols-1 gap-6">
                {/* Nombre */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del producto"
                  />
                </div>

                {/* SKU */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Código SKU"
                  />
                </div>

                {/* Precio */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">
                    Precio de Venta *
                  </label>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-2 text-gray-500 text-sm">CLP</span>
                  </div>
                </div>

                {/* Costo */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">
                    Costo
                  </label>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="cost"
                      value={formData.cost}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-2 text-gray-500 text-sm">CLP</span>
                  </div>
                </div>

                {/* Stock */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">
                    Stock Actual *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Stock Mínimo */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    name="min_stock"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                    min="0"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Categoría */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">
                    Categoría
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* URL de Imagen */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">
                    URL de Imagen
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>

                {/* Código de Barras */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Código de barras"
                  />
                </div>

                {/* Marca */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">
                    Marca
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Marca"
                  />
                </div>
              </div>

              {/* --- Metadatos OFF --- */}
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4">Metadatos OpenFoodFacts (OFF)</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">Nombre General</label>
                    <input type="text" name="general_name" value={formData.general_name} onChange={handleInputChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nombre general" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">Cantidad</label>
                    <input type="text" name="quantity" value={formData.quantity} onChange={handleInputChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: 500g, 1L" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">Empaque</label>
                    <input type="text" name="packaging" value={formData.packaging} onChange={handleInputChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: botella, caja" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">Etiquetas</label>
                    <input type="text" name="labels" value={formData.labels} onChange={handleInputChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="orgánico, vegano (separadas por coma)" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">Lista de Categorías</label>
                    <input type="text" name="categories_list" value={formData.categories_list} onChange={handleInputChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="bebidas, snacks (separadas por coma)" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">Países de Venta</label>
                    <input type="text" name="countries_sold" value={formData.countries_sold} onChange={handleInputChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Chile, Argentina (separados por coma)" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">Ingredientes de Origen</label>
                    <input type="text" name="origin_ingredients" value={formData.origin_ingredients} onChange={handleInputChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: leche, azúcar" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">Lugares de Fabricación</label>
                    <input type="text" name="manufacturing_places" value={formData.manufacturing_places} onChange={handleInputChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Santiago, Chile" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">Código de Trazabilidad</label>
                    <input type="text" name="traceability_code" value={formData.traceability_code} onChange={handleInputChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Código de trazabilidad" />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0">URL Oficial</label>
                    <input type="url" name="official_url" value={formData.official_url} onChange={handleInputChange} className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className="flex flex-col sm:flex-row gap-2">
                <label className="text-sm font-medium text-gray-700 sm:w-40 sm:flex-shrink-0 sm:pt-2">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción del producto..."
                />
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  );
} 