'use client';
import { useState } from 'react';
import { supabase } from '@/services/supabase/client';
import { resetCategoriesIds } from '@/scripts/resetCategoriesIds';
import Button from '@/components/ui/Button';

interface Category {
  id: number;
  name: string;
  description: string | null;
  color: string;
  store_type: string | null;
  created_at: string;
  updated_at: string;
}

export default function ResetCategoriesIdsPage() {
  const [loading, setLoading] = useState(false);
  const [currentCategories, setCurrentCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<string>('');
  const [stats, setStats] = useState<{
    minId: number;
    maxId: number;
    total: number;
  } | null>(null);

  const loadCurrentCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('ws_categories')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('Error loading categories:', error);
        setResult(`❌ Error cargando categorías: ${error.message}`);
        return;
      }

      setCurrentCategories(data || []);
      
      if (data && data.length > 0) {
        const minId = Math.min(...data.map((c: Category) => c.id));
        const maxId = Math.max(...data.map((c: Category) => c.id));
        setStats({
          minId,
          maxId,
          total: data.length
        });
        setResult(`✅ Cargadas ${data.length} categorías (IDs: ${minId} - ${maxId})`);
      } else {
        setStats(null);
        setResult('ℹ️ No hay categorías');
      }
    } catch (error) {
      console.error('Error:', error);
      setResult(`❌ Error: ${error}`);
    }
  };

  const handleResetIds = async () => {
    setLoading(true);
    setResult('');

    try {
      const resetResult = await resetCategoriesIds();
      
      if (resetResult.success) {
        setResult(`✅ ${resetResult.message}`);
        await loadCurrentCategories(); // Recargar para mostrar los cambios
      } else {
        setResult(`❌ Error: ${(resetResult.error as any)?.message || 'Error desconocido'}`);
      }
    } catch (error) {
      setResult(`❌ Error inesperado: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Reiniciar IDs de Categorías
          </h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">¿Qué hace este proceso?</h2>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <ul className="space-y-2 text-sm">
                <li>
                  <strong>Reinicia los IDs</strong> para que empiecen desde 1
                </li>
                <li>
                  <strong>Actualiza referencias</strong> en ws_products automáticamente
                </li>
                <li>
                  <strong>Mantiene todos los datos</strong> (nombres, descripciones, etc.)
                </li>
                <li>
                  <strong>Recrea índices</strong> y constraints
                </li>
                <li className="text-red-600 font-semibold">
                  ⚠️ <strong>Requiere tiempo de inactividad</strong> - La tabla no estará disponible durante el proceso
                </li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <Button
              onClick={loadCurrentCategories}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Cargar Categorías Actuales
            </Button>
            
            <Button
              onClick={handleResetIds}
              disabled={loading || currentCategories.length === 0}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {loading ? 'Reiniciando IDs...' : 'Reiniciar IDs desde 1'}
            </Button>
          </div>

          {stats && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Estadísticas Actuales:</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Categorías</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.minId}</div>
                  <div className="text-sm text-gray-600">ID Mínimo</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.maxId}</div>
                  <div className="text-sm text-gray-600">ID Máximo</div>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className={`p-4 rounded-lg mb-6 ${
              result.includes('✅') ? 'bg-green-100 text-green-800' : 
              result.includes('ℹ️') ? 'bg-blue-100 text-blue-800' : 
              'bg-red-100 text-red-800'
            }`}>
              {result}
            </div>
          )}

          {currentCategories.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Categorías Actuales ({currentCategories.length}):</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nombre</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Descripción</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Color</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Tipo de Tienda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCategories.map((category) => (
                      <tr key={category.id} className="border-t border-gray-200">
                        <td className="px-4 py-2 text-sm text-gray-700 font-mono font-bold">
                          {category.id}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-700">{category.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{category.description || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded mr-2" 
                              style={{ backgroundColor: category.color }}
                            ></div>
                            {category.color}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{category.store_type || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentCategories.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <p>No hay categorías cargadas. Haz clic en "Cargar Categorías Actuales" para ver los datos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
