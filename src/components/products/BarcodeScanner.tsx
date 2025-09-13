'use client';
import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, Loader2, Search } from 'lucide-react';
// Removido: import no usado
import { searchProductByBarcode, searchLocalBarcodes, ProductApiResult } from '@/services/api/productApis';
import Button from '@/components/ui/Button';

interface BarcodeScannerProps {
  onProductFound: (product: ProductApiResult) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onProductFound, onClose }: BarcodeScannerProps) {
  const [manualBarcode, setManualBarcode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [suggestions, setSuggestions] = useState<ProductApiResult[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Intento de escaneo con @zxing/browser si está disponible (opcional)
  useEffect(() => {
    let codeReader: any;
    async function setup() {
      try {
        const mod = await import('@zxing/browser');
        const { BrowserMultiFormatReader } = mod as any;
        codeReader = new BrowserMultiFormatReader();
        const video = videoRef.current;
        if (!video) return;
        await codeReader.decodeFromVideoDevice(null, video, (result: any, err: any) => {
          if (result?.getText) {
            const code = String(result.getText());
            setManualBarcode(code);
          }
        });
      } catch {
        // si no está disponible, no bloquear la UI
      }
    }
    setup();
    return () => {
      try { codeReader?.reset(); } catch {}
    };
  }, []);

  const handleManualSearch = async (codeOverride?: string) => {
    const codeToUse = (codeOverride ?? manualBarcode).trim();
    if (!codeToUse) {
      setError('Ingresa un código de barras');
      return;
    }

    setLoading(true);
    setError('');
    setDebugInfo('');

    try {
      console.log('🔍 Buscando código:', codeToUse);
      
      const product = await searchProductByBarcode(codeToUse);
      
      console.log('📦 Resultado de búsqueda:', product);
      
      if (product) {
        setDebugInfo(`✅ Encontrado: ${product.name} (${product.brand})`);
        onProductFound(product);
        onClose();
      } else {
        setError('Producto no encontrado. Verifica el código de barras.');
        setDebugInfo('❌ No se encontró producto con ese código');
      }
    } catch (error) {
      console.error('Error buscando producto:', error);
      setError('Error al buscar el producto. Intenta de nuevo.');
      setDebugInfo(`💥 Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCode = (code: string) => {
    setManualBarcode(code);
    void handleManualSearch(code);
  };

  // Actualizar sugerencias interactivas mientras escribe
  const handleChange = (value: string) => {
    setManualBarcode(value);
    setError('');
    setDebugInfo('');
    if (typingTimeout) clearTimeout(typingTimeout);
    const timeout = setTimeout(() => {
      if (!value || value.trim().length === 0) {
        setSuggestions([]);
        return;
      }
      const local = searchLocalBarcodes(value, 8);
      setSuggestions(local);
    }, 150);
    setTypingTimeout(timeout);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Camera className="h-6 w-6 text-blue8" />
            <h2 className="text-xl font-semibold text-gray-900">
              Escáner de Código de Barras
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
              <h3 className="font-medium text-blue-900 mb-2">📱 Escáner de Códigos de Barras</h3>
              <p className="text-sm text-blue-800">
                Ingresa manualmente el código de barras del producto que quieres buscar.
              </p>
            <div className="mt-3">
              <video ref={videoRef} className="w-full rounded-lg bg-black/50" muted playsInline></video>
            </div>
            </div>

            {/* Test Codes */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">
                Códigos de Prueba (Haz clic para probar)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: '7800000000001', name: 'Coca Cola' },
                  { code: '7800000000003', name: 'Leche Colun' },
                  { code: '1234567890123', name: 'Aceite Chef' },
                  { code: '1234567890124', name: 'Azúcar Iansa' }
                ].map((item) => (
                  <button
                    key={item.code}
                    onClick={() => handleTestCode(item.code)}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{item.code}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Search */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Búsqueda Manual
              </h3>
              
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Ingresa el código de barras (ej: 7800000000001)"
                  value={manualBarcode}
                  onChange={(e) => handleChange(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue8 focus:border-transparent"
                />
                <Button
                  onClick={() => handleManualSearch()}
                  disabled={loading || !manualBarcode.trim()}
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
              </div>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg divide-y">
                {suggestions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      const code = s.barcode || '';
                      setManualBarcode(code);
                      void handleManualSearch(code);
                    }}
                    className="w-full text-left p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">{s.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{s.barcode}</div>
                    </div>
                    <div className="text-xs text-gray-500">{s.brand} · {s.category}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {/* Debug Info */}
            {debugInfo && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="text-sm text-gray-700">
                  <strong>Debug:</strong> {debugInfo}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-6 border-t bg-gray-50 flex-shrink-0">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Busca productos desde la base de datos OpenFoodFacts y productos chilenos
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
