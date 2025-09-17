'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Camera, ExternalLink, Filter, Loader2, Package, Search } from 'lucide-react';
import { searchProductsFromAllApis, ProductApiResult } from '@/services/api/productApis';
import { searchPublicProducts, convertToProductApiResult } from '@/services/api/publicProductsApi';
import Button from '@/components/ui/Button';

interface ProductSearchProps {
  onProductSelect: (product: ProductApiResult) => void;
  onClose: () => void;
}

export default function ProductSearch({ onProductSelect, onClose }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [products, setProducts] = useState<ProductApiResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const [barcodeGlobal, setBarcodeGlobal] = useState(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    // TODO: Implement getAvailableCategories
    setCategories(['Bebidas', 'Lácteos', 'Panadería', 'Carnes', 'Verduras', 'Limpieza']);
  }, []);

  // Start/stop camera scanner (Html5Qrcode directo, facingMode: environment)
  useEffect(() => {
    let qrcode: any;
    let isMounted = true;
    const start = async () => {
      if (!showScanner) return;
      try {
        setScannerError('');
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        qrcode = new Html5Qrcode('off-scanner');
        const config: any = {
          fps: 12,
          // Rectangular scan box (horizontal)
          qrbox: (vw: number) => {
            const width = Math.min(640, Math.max(260, Math.floor(vw * 0.92)));
            const height = Math.max(120, Math.floor(width / 2.2));
            return { width, height };
          },
          aspectRatio: 1.7777778,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ],
        };
        await qrcode.start({ facingMode: 'environment' }, config,
          (text: string) => {
            if (!isMounted) return;
            const code = String(text).trim();
            if (!/^[0-9]{8,14}$/.test(code)) return;
            setSearchQuery(code);
            setShowScanner(false);
            qrcode.stop().then(() => qrcode.clear()).catch(() => {});
            void handleSearchWithValue(code);
          },
          () => {}
        );
        scannerRef.current = qrcode;
      } catch (e: any) {
        const name = e?.name || '';
        if (name === 'NotAllowedError') {
          setScannerError('Permiso de cámara denegado. Autoriza la cámara para localhost:3000.');
        } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
          setScannerError('La cámara requiere HTTPS o localhost.');
        } else {
          setScannerError('No se pudo iniciar la cámara. Usa la búsqueda manual.');
        }
      }
    };
    start();
    return () => {
      isMounted = false;
      try { qrcode?.stop().then(() => qrcode.clear()); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showScanner]);

  const handleSearch = async (valueOverride?: string) => {
    const term = (valueOverride ?? searchQuery).trim();
    if (!term) return;

    setLoading(true);
    setSearched(true);

    try {
      // Buscar en la tabla pública
      const publicResultsRaw = await searchPublicProducts(term, 20);
      const publicResults: ProductApiResult[] = publicResultsRaw.map(convertToProductApiResult);

      // Buscar en APIs externas
      const apiResults = await searchProductsFromAllApis({
        query: term,
        category: selectedCategory || undefined,
        limit: 20,
        barcodeGlobal
      });

      // Combinar y eliminar duplicados por código de barras
      const allResults = [...publicResults, ...apiResults];
      const uniqueResults = allResults.filter((product, index, self) =>
        product.barcode &&
        index === self.findIndex(p => p.barcode === product.barcode)
      );
      setProducts(uniqueResults);
    } catch (error) {
      console.error('Error buscando productos:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Permitir inyectar un valor (desde cámara) y mantenerlo visible en el input
  const handleSearchWithValue = async (value: string) => {
    setSearchQuery(value);
    await handleSearch(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleProductSelect = (product: ProductApiResult) => {
    onProductSelect(product);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue8" />
            <h2 className="text-xl font-semibold text-gray-900">
              Buscar Productos desde APIs Públicas
            </h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
        </div>

        {/* Search Bar - Fixed */}
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex space-x-3 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos (ej: leche, detergente, coca cola...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
              />
            </div>
            <Button
              onClick={() => handleSearch()}
              disabled={loading || !searchQuery.trim()}
              className="px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowScanner((v) => !v)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Camera className="h-4 w-4" />
              <span>{showScanner ? 'Cerrar Cámara' : 'Cámara'}</span>
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Categoría:</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent text-sm"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          {/* Barcode global toggle */}
          <div className="mt-3 text-sm text-gray-600 flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={barcodeGlobal} onChange={(e) => setBarcodeGlobal(e.target.checked)} />
              <span>Buscar global (solo códigos de barras)</span>
            </label>
          </div>
          
          <div className="mt-3 text-sm text-gray-600">
            <p>💡 Busca productos por nombre o código de barras. Usa la cámara para leer códigos EAN/UPC.</p>
          </div>

          {showScanner && (
            <div className="mt-3 space-y-2">
              <div id="off-scanner" className="w-full rounded-lg overflow-hidden aspect-video border border-gray-200" />
              {scannerError && (
                <div className="text-xs text-red-600">{scannerError}</div>
              )}
            </div>
          )}
        </div>

        {/* Results - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6">
            {!searched && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Busca productos para agregar a tu inventario
                </h3>
                <p className="text-gray-600">
                  Escribe el nombre de un producto y presiona buscar para encontrar opciones desde APIs públicas
                </p>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 text-blue8 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Buscando productos...</p>
              </div>
            )}

            {searched && !loading && products.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-gray-600">
                  Intenta con otros términos de búsqueda o categorías
                </p>
              </div>
            )}

            {products.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className="flex items-start space-x-3">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/placeholder-product.png';
                          }}
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {product.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {product.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          {product.price && (
                            <span className="text-lg font-semibold text-blue8">
                              ${product.price}
                            </span>
                          )}
                          
                          <div className="flex items-center space-x-2">
                            {product.brand && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {product.brand}
                              </span>
                            )}
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        
                        {product.category && (
                          <span className="text-xs text-gray-500">
                            {product.category}
                          </span>
                        )}
                        
                        <div className="text-xs text-gray-400">
                          Fuente: {product.api_name} {product.country && `(${product.country})`}
                        </div>
                        
                        {/* OFF extra info */}
                        {product.quantity && (
                          <div className="text-xs text-gray-600">Cantidad: {product.quantity}</div>
                        )}
                        {product.packaging && (
                          <div className="text-xs text-gray-600">Envase: {product.packaging}</div>
                        )}
                        {product.labels && product.labels.length > 0 && (
                          <div className="text-xs text-gray-600">Sellos: {product.labels.slice(0,4).join(', ')}{product.labels.length>4?'…':''}</div>
                        )}
                        {product.countries_sold && product.countries_sold.length > 0 && (
                          <div className="text-xs text-gray-600">Países de venta: {product.countries_sold.slice(0,3).join(', ')}{product.countries_sold.length>3?'…':''}</div>
                        )}

                        {/* Mostrar información nutricional si está disponible */}
                        {product.nutrition_info && (
                          <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                            <div className="font-medium text-green-800 mb-1">Información Nutricional:</div>
                            <div className="grid grid-cols-2 gap-1 text-green-700">
                              {product.nutrition_info.calories && (
                                <span>Calorías: {product.nutrition_info.calories}kcal</span>
                              )}
                              {product.nutrition_info.protein && (
                                <span>Proteínas: {product.nutrition_info.protein}g</span>
                              )}
                              {product.nutrition_info.carbs && (
                                <span>Carbohidratos: {product.nutrition_info.carbs}g</span>
                              )}
                              {product.nutrition_info.fat && (
                                <span>Grasas: {product.nutrition_info.fat}g</span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Mostrar ingredientes si están disponibles */}
                        {product.ingredients && product.ingredients.length > 0 && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <div className="font-medium text-blue-800 mb-1">Ingredientes:</div>
                            <div className="text-blue-700 line-clamp-2">
                              {product.ingredients.slice(0, 3).join(', ')}
                              {product.ingredients.length > 3 && '...'}
                            </div>
                          </div>
                        )}
                        
                        {/* Mostrar alérgenos si están disponibles */}
                        {product.allergens && product.allergens.length > 0 && (
                          <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                            <div className="font-medium text-red-800 mb-1">Alérgenos:</div>
                            <div className="text-red-700">
                              {product.allergens.slice(0, 3).join(', ')}
                              {product.allergens.length > 3 && '...'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {products.length > 0 && (
                <span>{products.length} productos encontrados</span>
              )}
            </div>
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
