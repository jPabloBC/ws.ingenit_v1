'use client';
import { useState, useEffect } from 'react';
import { Check, CheckCircle, Database, RefreshCw, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import Layout from '@/components/layout/Layout';

interface UserData {
  id: string;
  email: string;
  name: string;
  email_confirmed_at: string | null;
  created_at: string;
  schema: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CheckDataPage() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [schemas, setSchemas] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkDataLocation();
    }
  }, [user]);

  const checkDataLocation = async () => {
    setLoading(true);
    try {
      // Verificar en auth.users (siempre existe)
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        toast.error('Error cargando usuarios de auth: ' + authError.message);
        return;
      }

      const usersData: UserData[] = [];

      // Agregar usuarios de auth.users
      authUsers.users.forEach(authUser => {
        usersData.push({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || 'Sin nombre',
          email_confirmed_at: authUser.email_confirmed_at || null,
          created_at: authUser.created_at || '',
          schema: 'auth.users'
        });
      });

      // Verificar en diferentes schemas
      const schemasToCheck = ['public', 'app_ws'];
      const foundSchemas: string[] = [];

      for (const schema of schemasToCheck) {
        try {
          // Crear cliente con schema específico
          const { createClient } = await import('@supabase/supabase-js');
          const schemaClient = createClient(
            'https://juupotamdjqzpxuqdtco.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDIyMTgsImV4cCI6MjA2NTI3ODIxOH0.8aXgTBg4vhs0DmTKPg9WGTvQ9hHBd_uCGHgt89ZfM_E',
            {
              db: { schema }
            }
          );

          // Verificar si existe la tabla ws_users en este schema
          const { data: tableData, error: tableError } = await schemaClient
            .from('ws_users')
            .select('*')
            .limit(1);

          if (!tableError) {
            foundSchemas.push(schema);
            
            // Obtener usuarios de este schema
            const { data: profileUsers, error: profileError } = await schemaClient
              .from('ws_users')
              .select('*');

            if (!profileError && profileUsers) {
              profileUsers.forEach(profileUser => {
                usersData.push({
                  id: profileUser.user_id || profileUser.id,
                  email: profileUser.email || '',
                  name: profileUser.name || 'Sin nombre',
                  email_confirmed_at: null, // Los perfiles no tienen este campo
                  created_at: profileUser.created_at || '',
                  schema: `${schema}.ws_users`
                });
              });
            }
          }
        } catch (e) {
          console.log(`Schema ${schema} no accesible o no tiene ws_users`);
        }
      }

      setUsers(usersData);
      setSchemas(foundSchemas);
      
      toast.success(`Datos encontrados en schemas: ${foundSchemas.join(', ')}`);
    } catch (error) {
      console.error('Error checking data location:', error);
      toast.error('Error verificando ubicación de datos');
    } finally {
      setLoading(false);
    }
  };

  const getSchemaIcon = (schema: string) => {
    if (schema === 'auth.users') {
      return <User className="h-5 w-5 text-blue-500" />;
    } else if (schema.includes('ws_users')) {
      return <Database className="h-5 w-5 text-green-500" />;
    }
    return <Database className="h-5 w-5 text-gray-500" />;
  };

  const getSchemaColor = (schema: string) => {
    if (schema === 'auth.users') {
      return 'bg-blue-50 text-blue-800';
    } else if (schema.includes('ws_users')) {
      return 'bg-green-50 text-green-800';
    }
    return 'bg-gray-50 text-gray-800';
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verificar Ubicación de Datos
          </h1>
          <p className="text-gray-600">
            Verifica dónde se están guardando los datos de usuarios
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Auth Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.schema === 'auth.users').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <Database className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Perfiles ws_users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.filter(u => u.schema.includes('ws_users')).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Schemas Activos</p>
                <p className="text-2xl font-bold text-gray-900">{schemas.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Verificación de Datos
            </h2>
            <button
              onClick={checkDataLocation}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Verificar Ahora
            </button>
          </div>
        </div>

        {/* Lista de usuarios */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Usuarios Encontrados por Schema
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schema
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email Verificado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user, index) => (
                  <tr key={`${user.schema}-${user.id}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSchemaColor(user.schema)}`}>
                        {getSchemaIcon(user.schema)}
                        <span className="ml-1">{user.schema}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email_confirmed_at ? (
                        <span className="text-green-600">✓ Verificado</span>
                      ) : (
                        <span className="text-red-600">✗ No verificado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">
            Información Importante
          </h3>
          <div className="space-y-2 text-yellow-800">
            <p><strong>auth.users:</strong> Usuarios de autenticación de Supabase (siempre existe)</p>
            <p><strong>public.ws_users:</strong> Vista que refleja app_ws.ws_users</p>
            <p><strong>app_ws.ws_users:</strong> Tabla real donde se guardan los perfiles</p>
            <p className="mt-4 text-sm">
              <strong>Nota:</strong> El cliente de Supabase debe estar configurado para usar el schema correcto.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
