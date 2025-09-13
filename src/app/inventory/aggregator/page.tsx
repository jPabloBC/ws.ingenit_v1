'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Camera, Search, TestTube, Globe, TrendingUp, Zap, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import ProductSearch from '@/components/products/ProductSearch';
import ProductSuggestions from '@/components/products/ProductSuggestions';
import BarcodeScanner from '@/components/products/BarcodeScanner';
import BarcodeTester from '@/components/products/BarcodeTester';
import { ProductApiResult } from '@/services/api/productApis';

export default function ProductAggregatorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showBarcodeTester, setShowBarcodeTester] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<ProductApiResult[]>([]);

  const handleProductSelect = (product: ProductApiResult) => {
    // Verificar si el producto ya está seleccionado
    const isAlreadySelected = selectedProducts.some(p => p.id === product.id);
    
    if (isAlreadySelected) {
      toast.error('Este producto ya está seleccionado');
      return;
    }

    setSelectedProducts(prev => [...prev, product]);
    toast.success(`"${product.name}" agregado a la selección`);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
    toast.success('Producto removido de la selección');
  };

  const handleAddToInventory = () => {
    if (selectedProducts.length === 0) {
      toast.error('No hay productos seleccionados');
      return;
    }

    // Guardar productos seleccionados en localStorage para el formulario
    localStorage.setItem('selectedProductsFromApi', JSON.stringify(selectedProducts));
    router.push('/inventory/add?fromAggregator=true');
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Agregador de Productos
              </h1>
              <p className="text-gray-600">
                Descubre y agrega productos desde APIs públicas a tu inventario
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowBarcodeScanner(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Camera className="h-4 w-4" />
                <span>Escanear Código</span>
              </Button>
              <Button
                onClick={() => setShowProductSearch(true)}
                className="flex items-center space-x-2"
              >
                <Search className="h-4 w-4" />
                <span>Buscar Productos</span>
              </Button>
              <Button
                onClick={() => setShowBarcodeTester(true)}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <TestTube className="h-4 w-4" />
                <span>Probar Códigos</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Globe className="h-8 w-8 text-blue-600" />
                <h3 className="text-lg font-semibold">APIs Públicas</h3>
              </div>
              <p className="text-gray-600">
                Accede a miles de productos desde APIs gratuitas como FakeStore y DummyJSON
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <h3 className="text-lg font-semibold">Productos Populares</h3>
              </div>
              <p className="text-gray-600">
                Descubre productos trending en diferentes categorías
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Zap className="h-8 w-8 text-yellow-600" />
                <h3 className="text-lg font-semibold">Importación Rápida</h3>
              </div>
              <p className="text-gray-600">
                Agrega productos a tu inventario con un solo clic
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Product Suggestions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Productos Sugeridos por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductSuggestions onProductSelect={handleProductSelect} />
          </CardContent>
        </Card>

        {/* Selected Products */}
        {selectedProducts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Productos Seleccionados ({selectedProducts.length})
                </div>
                <Button
                  onClick={handleAddToInventory}
                  className="flex items-center space-x-2"
                >
                  <Package className="h-4 w-4" />
                  <span>Agregar al Inventario</span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-4 relative"
                  >
                    <button
                      onClick={() => handleRemoveProduct(product.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                    
                    {product.image && (
                      <div className="aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/placeholder-product.png';
                          }}
                        />
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <h3 className="font-medium text-gray-900 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        {product.price && (
                          <span className="text-lg font-semibold text-blue-600">
                            ${product.price}
                          </span>
                        )}
                        
                        {product.brand && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {product.brand}
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        Fuente: {product.api_name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal de búsqueda de productos */}
        {showProductSearch && (
          <ProductSearch
            onProductSelect={handleProductSelect}
            onClose={() => setShowProductSearch(false)}
          />
        )}

        {/* Modal de escáner de códigos de barras */}
        {showBarcodeScanner && (
          <BarcodeScanner
            onProductFound={handleProductSelect}
            onClose={() => setShowBarcodeScanner(false)}
          />
        )}

        {/* Modal de probador de códigos de barras */}
        {showBarcodeTester && (
          <BarcodeTester
            onProductFound={handleProductSelect}
            onClose={() => setShowBarcodeTester(false)}
          />
        )}
      </div>
    </Layout>
  );
}
