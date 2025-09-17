'use client';
import dynamic from 'next/dynamic';
import { supabase } from '@/services/supabase/client';
import { useState, useEffect } from 'react';
import { AlertTriangle, Check, CheckCircle, RefreshCw, X, XCircle, User, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import Layout from '@/components/layout/Layout';


interface UserProfile {
  id: string;
  email: string;
  name: string;
  email_confirmed_at: string | null;
  created_at: string;
  hasProfile: boolean;
  profileId?: string;
}

function FixProfilesPage() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [creatingProfiles, setCreatingProfiles] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUsers();
    }
  }, [user?.id]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Obtener usuarios de auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        toast.error('Error cargando usuarios: ' + authError.message);
        return;
      }

      // Obtener perfiles existentes
      const { data: profiles, error: profilesError } = await supabase
        .from('ws_users')
        .select('user_id, id');

      if (profilesError) {
        console.error('Error cargando perfiles:', profilesError);
      }

      const profileMap = new Map();
      if (profiles) {
        profiles.forEach(profile => {
          profileMap.set(profile.user_id, profile.id);
        });
      }

      // Combinar datos
      const usersWithProfiles = authUsers.users.map(authUser => ({
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuario',
        email_confirmed_at: authUser.email_confirmed_at || null,
        created_at: authUser.created_at,
        hasProfile: profileMap.has(authUser.id),
        profileId: profileMap.get(authUser.id)
      }));

      setUsers(usersWithProfiles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  const createProfileForUser = async (userId: string, email: string, name: string) => {
    setCreatingProfiles(prev => new Set(prev).add(userId));
    
    try {
      const { createMissingProfile } = await import('@/utils/createMissingProfile');
      
      const result = await createMissingProfile(
        userId,
        email,
        name,
        {
          store_types: [],
          plan_id: 'free',
          country_code: 'CL',
          currency_code: 'CLP'
        }
      );

      if (result.success) {
        toast.success(`Perfil creado para ${email}`);
        // Recargar la lista
        await loadUsers();
      } else {
        toast.error(`Error creando perfil para ${email}: ${(result.error as any)?.message || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error(`Error creando perfil para ${email}`);
    } finally {
      setCreatingProfiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const createAllMissingProfiles = async () => {
    const usersWithoutProfiles = users.filter(u => !u.hasProfile);
    
    if (usersWithoutProfiles.length === 0) {
      toast.success('Todos los usuarios ya tienen perfiles');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutProfiles) {
      try {
        const { createMissingProfile } = await import('@/utils/createMissingProfile');
        
        const result = await createMissingProfile(
          user.id,
          user.email,
          user.name,
          {
            store_types: [],
            plan_id: 'free',
            country_code: 'CL',
            currency_code: 'CLP'
          }
        );

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Error creando perfil para ${user.email}:`, result.error);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error creando perfil para ${user.email}:`, error);
      }
    }

    toast.success(`Perfiles creados: ${successCount}, Errores: ${errorCount}`);
    await loadUsers();
    setLoading(false);
  };

  const getStatusIcon = (user: UserProfile) => {
    if (user.hasProfile) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (user: UserProfile) => {
    if (user.hasProfile) {
      return 'Perfil OK';
    } else {
      return 'Sin perfil';
    }
  };

  const getStatusColor = (user: UserProfile) => {
    if (user.hasProfile) {
      return 'bg-green-50 text-green-800';
    } else {
      return 'bg-red-50 text-red-800';
    }
  };

  const usersWithoutProfiles = users.filter(u => !u.hasProfile);
  const verifiedUsersWithoutProfiles = usersWithoutProfiles.filter(u => u.email_confirmed_at);

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reparar Perfiles de Usuarios
          </h1>
          <p className="text-gray-600">
            Verifica y crea perfiles faltantes en ws_users
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Con Perfil</p>
                <p className="text-2xl font-bold text-gray-900">{users.length - usersWithoutProfiles.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Sin Perfil</p>
                <p className="text-2xl font-bold text-gray-900">{usersWithoutProfiles.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Verificados Sin Perfil</p>
                <p className="text-2xl font-bold text-gray-900">{verifiedUsersWithoutProfiles.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Acciones
            </h2>
            <div className="flex gap-3">
              <button
                onClick={loadUsers}
                disabled={loading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Recargar
              </button>
              
              {usersWithoutProfiles.length > 0 && (
                <button
                  onClick={createAllMissingProfiles}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Todos los Perfiles Faltantes
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de usuarios */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Lista de Usuarios
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email Verificado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user)}`}>
                        {getStatusIcon(user)}
                        <span className="ml-1">{getStatusText(user)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email_confirmed_at ? (
                        <span className="text-green-600">✓ Verificado</span>
                      ) : (
                        <span className="text-red-600">✗ No verificado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!user.hasProfile && (
                        <button
                          onClick={() => createProfileForUser(user.id, user.email, user.name)}
                          disabled={creatingProfiles.has(user.id)}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50 flex items-center"
                        >
                          {creatingProfiles.has(user.id) ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Plus className="h-4 w-4 mr-1" />
                          )}
                          Crear Perfil
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default dynamic(() => Promise.resolve(FixProfilesPage), {
  ssr: false
});
