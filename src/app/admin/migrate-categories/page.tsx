'use client';
import { useState } from 'react';
import { supabase } from '@/services/supabase/client';
import { migrateCategoriesToUUID } from '@/scripts/migrateCategoriesToUUID';
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

export default function MigrateCategoriesPage() {
  const [loading, setLoading] = useState(false);
  const [currentCategories, setCurrentCategories] = useState<Category[]>([]);
  const [result, setResult] = useState<string>('');
  const [tableInfo, setTableInfo] = useState<any>(null);

  const checkTableStructure = async () => {
    try {
      const { data, error } = await supabase
        .from('ws_categories')
        .select('*')
        .limit(1);

      if (error) {
        setTableInfo({ exists: false, error: error.message });
        return;
      }

      // Obtener información de la estructura
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'ws_categories')
        .eq('table_schema', 'public');

      if (columnsError) {
        setTableInfo({ exists: true, error: columnsError.message });
        return;
      }

      setTableInfo({ 
        exists: true, 
        columns: columns,
        isUUID: columns?.find((col: any) => col.column_name === 'id')?.data_type === 'uuid'
      });

    } catch (error) {
      setTableInfo({ exists: false, error: 'Error verificando tabla' });
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
    } catch (error) {
      console.error('Error:', error);
      setResult(`❌ Error: ${error}`);
    }
  };

  const handleMigration = async () => {
    setLoading(true);
    setResult('');

    try {
      const migrationResult = await migrateCategoriesToUUID();
      
      if (migrationResult.success) {
        setResult(`✅ ${migrationResult.message}`);
        await loadCurrentCategories(); // Recargar para mostrar los cambios
        await checkTableStructure(); // Verificar estructura actualizada
      } else {
        setResult(`❌ Error: ${(migrationResult as any).error?.message || 'Error desconocido'}`);
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
            Migrar ws_categories a UUID
          </h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Cambios a realizar:</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <ul className="space-y-2">
                <li>
                  <strong>ID:</strong> SERIAL (entero) → UUID (string)
                </li>
                <li>
                  <strong>Referencias:</strong> Actualizar category_id en ws_products
                </li>
                <li>
                  <strong>Índices:</strong> Recrear índices para UUID
                </li>
                <li>
                  <strong>Datos:</strong> Migrar categorías existentes
                </li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <Button
              onClick={checkTableStructure}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Verificar Estructura
            </Button>
            
            <Button
              onClick={loadCurrentCategories}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Cargar Categorías
            </Button>
            
            <Button
              onClick={handleMigration}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              {loading ? 'Migrando...' : 'Ejecutar Migración'}
            </Button>
          </div>

          {tableInfo && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Estado de la Tabla:</h2>
              <div className={`p-4 rounded-lg ${
                tableInfo.exists 
                  ? (tableInfo.isUUID ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800')
                  : 'bg-red-100 text-red-800'
              }`}>
                <p><strong>Existe:</strong> {tableInfo.exists ? 'Sí' : 'No'}</p>
                {tableInfo.exists && (
                  <>
                    <p><strong>Tipo de ID:</strong> {tableInfo.isUUID ? 'UUID ✅' : 'SERIAL (necesita migración)'}</p>
                    {tableInfo.columns && (
                      <div className="mt-2">
                        <p><strong>Columnas:</strong></p>
                        <ul className="ml-4 text-sm">
                          {tableInfo.columns.map((col: any, index: number) => (
                            <li key={index}>
                              {col.column_name}: {col.data_type} 
                              {col.is_nullable === 'NO' && ' (NOT NULL)'}
                              {col.column_default && ` (DEFAULT: ${col.column_default})`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                {tableInfo.error && (
                  <p><strong>Error:</strong> {tableInfo.error}</p>
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
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">ID</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Nombre</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Descripción</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Color</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Tipo de Tienda</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Creado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCategories.map((category) => (
                      <tr key={category.id} className="border-t border-gray-200">
                        <td className="px-4 py-2 text-sm text-gray-700 font-mono">
                          {category.id.length > 20 ? `${category.id.substring(0, 8)}...` : category.id}
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
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {new Date(category.created_at).toLocaleString('es-CL')}
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
