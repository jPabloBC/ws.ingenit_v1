'use client';
import { supabase } from '@/services/supabase/client';
import { useState, useEffect } from 'react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SimpleAdminLogin() {
  const [email, setEmail] = useState('gerencia@ingenit.cl');
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Removido: variable no usada
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('🔐 Intentando login con:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });
      
      if (error) {
        console.error('❌ Error de login:', error);
        toast.error('Credenciales inválidas');
        setLoading(false);
        return;
      }

      console.log('✅ Login exitoso, usuario:', data.user?.id);

      if (data.user) {
        // Verificar rol
        const { data: profile, error: profileError } = await supabase
          .from('ws_users')
          .select('role, name')
          .eq('user_id', data.user.id)
          .single();

        console.log('📋 Perfil encontrado:', profile);

        if (profileError) {
          console.error('❌ Error al obtener perfil:', profileError);
          toast.error('Error verificando permisos');
          setLoading(false);
          return;
        }

        if (profile && ['admin', 'dev'].includes(profile.role)) {
          console.log('✅ Acceso autorizado como:', profile.role);
          toast.success(`Acceso autorizado como ${profile.name}`);
          router.push('/admin/dashboard');
        } else {
          console.log('❌ Rol no autorizado:', profile?.role);
          toast.error('No tienes permisos de administrador');
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('❌ Error general:', error);
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Login Simple
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Acceso directo sin interferencias
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white p-8 rounded-lg shadow-md">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="gerencia@ingenit.cl"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
                  placeholder="Ingresa tu contraseña"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verificando...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Solo usuarios con rol de Administrador o Desarrollador pueden acceder
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-500 text-sm flex items-center justify-center"
          >
            ← Volver al sitio principal
          </Link>
        </div>
      </div>
    </div>
  );
}
