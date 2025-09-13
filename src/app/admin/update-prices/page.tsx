'use client';
import { useState } from 'react';
import { supabase } from '@/services/supabase/client';
import { updatePlansPrices } from '@/scripts/updatePlansPrices';
import Button from '@/components/ui/Button';

interface Plan {
  id: number;
  name: string;
  price: number;
  billing_cycle: string;
  discount_percentage: number | null;
  is_popular: boolean;
  updated_at: string;
}

export default function UpdatePricesPage() {
  const [loading, setLoading] = useState(false);
  const [currentPlans, setCurrentPlans] = useState<Plan[]>([]);
  const [result, setResult] = useState<string>('');

  const loadCurrentPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('ws_plans')
        .select('id, name, price, billing_cycle, discount_percentage, is_popular, updated_at')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        console.error('Error loading plans:', error);
        return;
      }

      setCurrentPlans(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpdatePrices = async () => {
    setLoading(true);
    setResult('');

    try {
      const updateResult = await updatePlansPrices();
      
      if (updateResult.success) {
        setResult('✅ Precios actualizados correctamente');
        await loadCurrentPlans(); // Recargar para mostrar los cambios
      } else {
        setResult(`❌ Error: ${(updateResult.error as any)?.message || 'Error desconocido'}`);
      }
    } catch (error) {
      setResult(`❌ Error inesperado: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Actualizar Precios de Planes
          </h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Cambios a realizar:</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <ul className="space-y-2">
                <li>
                  <strong>Plan Mensual:</strong> $15.000 → $9.990
                </li>
                <li>
                  <strong>Plan Anual:</strong> $144.000 → $99.990
                </li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <Button
              onClick={loadCurrentPlans}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Cargar Planes Actuales
            </Button>
            
            <Button
              onClick={handleUpdatePrices}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : 'Actualizar Precios'}
            </Button>
          </div>

          {result && (
            <div className={`p-4 rounded-lg mb-6 ${
              result.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result}
            </div>
          )}

          {currentPlans.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Planes Actuales:</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nombre</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Precio</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Ciclo</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Descuento</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Popular</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actualizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPlans.map((plan) => (
                      <tr key={plan.id} className="border-t border-gray-200">
                        <td className="px-4 py-2 text-sm text-gray-700">{plan.id}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-700">{plan.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          ${plan.price.toLocaleString('es-CL')}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700 capitalize">{plan.billing_cycle}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {plan.discount_percentage ? `${plan.discount_percentage}%` : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {plan.is_popular ? '✅' : '❌'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {new Date(plan.updated_at).toLocaleString('es-CL')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
