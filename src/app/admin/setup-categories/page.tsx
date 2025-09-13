'use client';
import { useState } from 'react';
import { supabase } from '@/services/supabase/client';
import { simpleMigrateCategories } from '@/scripts/simpleMigrateCategories';
import Button from '@/components/ui/Button';

interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  store_type: string | null;
  created_at: string;
  updated_at: string;
}

export default function SetupCategoriesPage() {
  const [loading, setLoading] = useState(false);
  const [currentCategories, setCurrentCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<string>('');
  const [tableExists, setTableExists] = useState<boolean | null>(null);

  const checkTableExists = async () => {
    try {
      const { data, error } = await supabase
        .from('ws_categories')
        .select('id')
        .limit(1);

      if (error) {
        setTableExists(false);
        setResult(`❌ Tabla ws_categories no existe: ${error.message}`);
        return;
      }

      setTableExists(true);
      setResult('✅ Tabla ws_categories existe y es accesible');
    } catch (error) {
      setTableExists(false);
      setResult(`❌ Error verificando tabla: ${error}`);
    }
  };

  const loadCurrentCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('ws_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error loading categories:', error);
        setResult(`❌ Error cargando categorías: ${error.message}`);
        return;
      }

      setCurrentCategories(data || []);
      setResult(`✅ Cargadas ${data?.length || 0} categorías`);
    } catch (error) {
      console.error('Error:', error);
      setResult(`❌ Error: ${error}`);
    }
  };

  const handleSetupCategories = async () => {
    setLoading(true);
    setResult('');

    try {
      const setupResult = await simpleMigrateCategories();
      
      if (setupResult.success) {
        setResult(`✅ ${setupResult.message}`);
        await loadCurrentCategories(); // Recargar para mostrar los cambios
      } else {
        setResult(`❌ Error: ${(setupResult.error as any)?.message || 'Error desconocido'}`);
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
            Configurar Categorías
          </h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">¿Qué hace este proceso?</h2>
            <div className="bg-blue-50 p-4 rounded-lg">
              <ul className="space-y-2">
                <li>
                  <strong>Verifica</strong> que la tabla ws_categories existe
                </li>
                <li>
                  <strong>Inserta</strong> categorías por defecto si no existen
                </li>
                <li>
                  <strong>Configura</strong> categorías básicas para retail
                </li>
                <li>
                  <strong>No modifica</strong> datos existentes
                </li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <Button
              onClick={checkTableExists}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Verificar Tabla
            </Button>
            
            <Button
              onClick={loadCurrentCategories}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Cargar Categorías
            </Button>
            
            <Button
              onClick={handleSetupCategories}
              disabled={loading || tableExists === false}
              className="bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
            >
              {loading ? 'Configurando...' : 'Configurar Categorías'}
            </Button>
          </div>

          {tableExists !== null && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Estado de la Tabla:</h2>
              <div className={`p-4 rounded-lg ${
                tableExists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <p><strong>Tabla ws_categories:</strong> {tableExists ? 'Existe ✅' : 'No existe ❌'}</p>
                {!tableExists && (
                  <p className="mt-2 text-sm">
                    <strong>Nota:</strong> Necesitas crear la tabla primero usando el SQL Editor de Supabase.
                    Ejecuta el archivo <code>migrate-categories-to-uuid.sql</code> en Supabase.
                  </p>
                )}
              </div>
            </div>
          )}

          {result && (
            <div className={`p-4 rounded-lg mb-6 ${
              result.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {result}
            </div>
          )}

          {currentCategories.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Categorías Actuales ({currentCategories.length}):</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentCategories.map((category) => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <div 
                        className="w-4 h-4 rounded mr-2" 
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{category.description}</p>
                    <p className="text-xs text-gray-500">
                      Tipo: {category.store_type || 'General'}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {category.id.length > 20 ? `${category.id.substring(0, 8)}...` : category.id}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tableExists === false && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">Instrucciones para crear la tabla:</h3>
              <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
                <li>Ve al SQL Editor de Supabase</li>
                <li>Copia y pega el contenido del archivo <code>migrate-categories-to-uuid.sql</code></li>
                <li>Ejecuta el script</li>
                <li>Vuelve aquí y haz clic en "Verificar Tabla"</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
