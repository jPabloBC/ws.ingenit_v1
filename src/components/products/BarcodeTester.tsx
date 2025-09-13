'use client';
import React, { useState } from 'react';
import { AlertCircle, Bug, Check, CheckCircle, Loader2, Package, Play, Search } from 'lucide-react';
// Removido: import no usado
import { searchProductByBarcode, ProductApiResult, testBarcodeSearch, testBarcodeFunction } from '@/services/api/productApis';
import Button from '@/components/ui/Button';

interface BarcodeTesterProps {
  onProductFound: (product: ProductApiResult) => void;
  onClose: () => void;
}

// Códigos de barras de prueba para productos chilenos
const chileanTestBarcodes = [
  { code: '7800000000001', name: 'Coca Cola 2L', description: 'Bebida gaseosa' },
  { code: '7800000000002', name: 'Cerveza Cristal 350ml', description: 'Cerveza chilena' },
  { code: '7800000000003', name: 'Leche Colun 1L', description: 'Leche entera' },
  { code: '7800000000004', name: 'Pan Ideal 500g', description: 'Pan de molde' },
  { code: '7800000000005', name: 'Arroz Miraflores 1kg', description: 'Arroz grado 1' },
  { code: '7800000000006', name: 'Detergente Omo 2L', description: 'Detergente líquido' },
  { code: '7800000000007', name: 'Jabón Lux 90g', description: 'Jabón de tocador' },
  { code: '7800000000008', name: 'Papas Lays 150g', description: 'Papas fritas' },
  { code: '7800000000009', name: 'Chocolate Nestlé 100g', description: 'Chocolate de leche' },
  { code: '7800000000010', name: 'Agua Vital 1.5L', description: 'Agua mineral' },
  { code: '1234567890123', name: 'Aceite Chef 1L', description: 'Aceite de cocina' },
  { code: '1234567890124', name: 'Azúcar Iansa 1kg', description: 'Azúcar granulada' },
  { code: '1234567890125', name: 'Harina Blanca Flor 1kg', description: 'Harina de trigo' },
  { code: '1234567890126', name: 'Atún Camanchaca 170g', description: 'Atún en agua' },
  { code: '1234567890127', name: 'Cerveza Austral 350ml', description: 'Cerveza chilena' }
];

export default function BarcodeTester({ onProductFound, onClose }: BarcodeTesterProps) {
  const [selectedBarcode, setSelectedBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; product?: ProductApiResult } | null>(null);

  const handleTestBarcode = async (barcode: string) => {
    setSelectedBarcode(barcode);
    setLoading(true);
    setResult(null);

    try {
      const product = await searchProductByBarcode(barcode);
      
      if (product) {
        setResult({
          success: true,
          message: `✅ Producto encontrado: ${product.name}`,
          product
        });
      } else {
        setResult({
          success: false,
          message: '❌ Producto no encontrado en ninguna base de datos'
        });
      }
    } catch (error) {
      console.error('Error probando código de barras:', error);
      setResult({
        success: false,
        message: '❌ Error al buscar el producto'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseProduct = () => {
    if (result?.product) {
      onProductFound(result.product);
      onClose();
    }
  };

  const handleRunTests = async () => {
    console.log('🧪 Ejecutando pruebas automáticas...');
    await testBarcodeSearch();
  };

  const handleDebugBarcodes = () => {
    console.log('🐛 Ejecutando debug de códigos de barras...');
    testBarcodeFunction();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Package className="h-6 w-6 text-blue8" />
            <h2 className="text-xl font-semibold text-gray-900">
              Probador de Códigos de Barras - Productos Chilenos
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

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">🧪 Probador de Códigos de Barras</h3>
              <p className="text-sm text-blue-800">
                Prueba la funcionalidad de búsqueda por código de barras con productos chilenos simulados. 
                Estos códigos están configurados para funcionar con la base de datos chilena.
              </p>
              <div className="mt-3 space-y-2">
                <Button
                  onClick={handleRunTests}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 w-full"
                >
                  <Play className="h-4 w-4" />
                  <span>Ejecutar Pruebas Automáticas</span>
                </Button>
                <Button
                  onClick={handleDebugBarcodes}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2 w-full"
                >
                  <Bug className="h-4 w-4" />
                  <span>Debug Códigos de Barras</span>
                </Button>
              </div>
            </div>

            {/* Test Barcodes */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Códigos de Barras de Prueba
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {chileanTestBarcodes.map((item) => (
                  <div
                    key={item.code}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                          {item.code}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleTestBarcode(item.code)}
                      disabled={loading && selectedBarcode === item.code}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      {loading && selectedBarcode === item.code ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Probando...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Probar Código
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Results */}
            {result && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Resultado de la Prueba
                </h3>
                
                <div className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2 mb-3">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.message}
                    </span>
                  </div>
                  
                  {result.product && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-4">
                        {result.product.image && (
                          <img
                            src={result.product.image}
                            alt={result.product.name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/assets/placeholder-product.png';
                            }}
                          />
                        )}
                        <div>
                          <h4 className="font-medium text-gray-900">{result.product.name}</h4>
                          <p className="text-sm text-gray-600">{result.product.description}</p>
                          <p className="text-sm text-gray-500">
                            Marca: {result.product.brand} | Categoría: {result.product.category}
                          </p>
                          {result.product.price && (
                            <p className="text-sm font-medium text-blue8">
                              Precio: ${result.product.price}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Fuente: {result.product.api_name} {result.product.country && `(${result.product.country})`}
                      </div>
                      
                      <Button
                        onClick={handleUseProduct}
                        className="w-full"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Usar Este Producto
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Manual Test */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Probar Código Personalizado
              </h3>
              
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Ingresa un código de barras (ej: 7800000000001)"
                  value={selectedBarcode}
                  onChange={(e) => setSelectedBarcode(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                />
                <Button
                  onClick={() => handleTestBarcode(selectedBarcode)}
                  disabled={loading || !selectedBarcode.trim()}
                  className="px-6"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Probando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Probar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t bg-gray-50 flex-shrink-0">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              💡 Los códigos de prueba están configurados para funcionar con productos chilenos simulados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
