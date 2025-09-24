'use client';
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Product } from '@/services/supabase/products';

interface EditStockModalProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (form: { stock: number; min_stock: number; price: number; cost: number }) => Promise<void>;
  isSaving?: boolean;
}

export default function EditStockModal({ open, product, onClose, onSave, isSaving = false }: EditStockModalProps) {
  const [form, setForm] = useState({
    stock: 0,
    min_stock: 0,
    price: 0,
    cost: 0,
  });
  // Porcentaje de margen para calcular precio desde costo
  const [percent, setPercent] = useState<number>(30);

  // Funciones de formato para el modal
  const formatNumber = useCallback((num: number) => {
    return new Intl.NumberFormat('es-CL').format(num);
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  // Función para formatear valores en inputs
  const formatInputValue = useCallback((value: any) => {
    if (!value || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return formatNumber(num);
  }, [formatNumber]);

  // Función para extraer número de string formateado
  const parseFormattedNumber = useCallback((value: string) => {
    if (!value) return '';
    return value.replace(/\./g, '');
  }, []);

  // Actualizar formulario cuando cambie el producto
  useEffect(() => {
    if (product) {
      console.log('🔄 Modal product changed:', product);
      // Calcular porcentaje inicial desde precio y costo si es posible
      let initialPercent = 30;
      if (product.cost > 0 && product.price >= product.cost) {
        initialPercent = Math.round(((Number(product.price) / Number(product.cost)) - 1) * 100);
      }
      // Clamp 5-200
      initialPercent = Math.min(200, Math.max(5, initialPercent));
      setPercent(initialPercent);

      setForm({
        stock: product.stock || 0,
        min_stock: product.min_stock || 0,
        price: product.price || 0,
        cost: product.cost || 0,
      });
    }
  }, [product]);

  // Recalcular precio cuando cambie costo o porcentaje
  useEffect(() => {
    const computedPrice = Math.round(Number(form.cost || 0) * (1 + Number(percent) / 100));
    if (computedPrice !== form.price) {
      setForm(prev => ({ ...prev, price: computedPrice }));
    }
  }, [form.cost, percent]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Form submitted:', form, 'isSaving:', isSaving);
    
    if (isSaving) {
      console.log('⚠️ Form submission ignored - already saving');
      return;
    }
    
    try {
      await onSave({
        stock: Number(form.stock),
        min_stock: Number(form.min_stock),
        price: Number(form.price),
        cost: Number(form.cost),
      });
      // Emitir BroadcastChannel para refrescar dashboard inmediatamente
      try {
        if (product?.business_id) {
          const bc = new BroadcastChannel('inv-sync');
          bc.postMessage({ type: 'inventory_updated', businessId: product.business_id });
          bc.close();
        }
      } catch {}
    } catch (error) {
      console.error('❌ Error in form submission:', error);
      toast.error('Error al guardar el producto');
    }
  }, [form, onSave, isSaving]);

  // Early return después de todos los hooks
  if (!open || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md">
        <h3 className="text-lg font-bold mb-2">Editar Stock - {product.name}</h3>
        <div className="text-sm text-gray-600 mb-4">
          <p>Stock actual: {formatNumber(product.stock)} | Precio: {formatCurrency(product.price)} | Costo: {formatCurrency(product.cost)}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Stock</label>
            <input 
              type="text" 
              value={formatInputValue(form.stock)} 
              onChange={(e) => {
                const rawValue = parseFormattedNumber(e.target.value);
                setForm({...form, stock: Number(rawValue) || 0});
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
                setForm({...form, min_stock: Number(rawValue) || 0});
              }}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Costo</label>
            <input 
              type="text" 
              value={formatInputValue(form.cost)} 
              onChange={(e) => {
                const rawValue = parseFormattedNumber(e.target.value);
                setForm({...form, cost: Number(rawValue) || 0});
              }}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              placeholder="8.000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: {form.cost ? formatCurrency(Number(form.cost)) : '$0'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Porcentaje sobre Costo</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={5}
                max={200}
                step={1}
                value={percent}
                onChange={(e) => {
                  const v = Math.min(200, Math.max(5, Number(e.target.value) || 0));
                  setPercent(v);
                }}
                className="w-24 border rounded px-2 py-2"
              />
              <input
                type="range"
                min={5}
                max={200}
                step={1}
                value={percent}
                onChange={(e) => setPercent(Math.min(200, Math.max(5, Number(e.target.value))))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Rango permitido: 5% - 200%</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Precio (auto-calculado)</label>
            <input 
              type="text"
              readOnly
              value={formatInputValue(form.price)} 
              className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-700"
              placeholder="10.000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: {form.price ? formatCurrency(Number(form.price)) : '$0'}
            </p>
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
              disabled={isSaving}
              className={`px-4 py-2 text-white rounded ${
                isSaving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
