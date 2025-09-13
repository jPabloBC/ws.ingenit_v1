'use client';
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
// Removido: import no usado
import Button from '@/components/ui/Button';

interface AccountInfo {
  user: any;
  profile: any;
  error?: string;
}

export default function CheckAccountPage() {
  const [email, setEmail] = useState('jpalebe@hotmail.com');
  const [loading, setLoading] = useState(false);
  // Removido: variable no usada
  const [result, setResult] = useState<AccountInfo | null>(null);

  const checkAccount = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🔍 Verificando cuenta para:', email);

      // 1. Verificar usuario en auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error obteniendo usuarios auth:', authError);
        setResult({ user: null, profile: null, error: `Error auth: ${authError.message}` });
        return;
      }

      const user = authUsers.users.find(u => u.email === email);
      console.log('👤 Usuario encontrado:', user ? 'Sí' : 'No');

      if (!user) {
        setResult({ user: null, profile: null, error: 'Usuario no encontrado en auth.users' });
        return;
      }

      // 2. Verificar perfil en ws_users
      const { data: profile, error: profileError } = await supabase
        .from('ws_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('👤 Perfil encontrado:', profile ? 'Sí' : 'No');
      console.log('❌ Error perfil:', profileError);

      setResult({ user, profile, error: profileError?.message });

    } catch (error) {
      console.error('Error inesperado:', error);
      setResult({ user: null, profile: null, error: `Error inesperado: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Verificar Estado de Cuenta
          </h1>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email a verificar:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ingresa el email"
            />
          </div>

          <Button
            onClick={checkAccount}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Verificar Cuenta'}
          </Button>

          {result && (
            <div className="mt-6 space-y-4">
              <div className={`p-4 rounded-lg ${
                result.error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                <h3 className="font-semibold mb-2">Resultado:</h3>
                {result.error ? (
                  <p>❌ {result.error}</p>
                ) : (
                  <p>✅ Cuenta verificada correctamente</p>
                )}
              </div>

              {result.user && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Usuario Auth:</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify({
                      id: result.user.id,
                      email: result.user.email,
                      email_confirmed_at: result.user.email_confirmed_at,
                      created_at: result.user.created_at,
                      last_sign_in_at: result.user.last_sign_in_at
                    }, null, 2)}
                  </pre>
                </div>
              )}

              {result.profile && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Perfil ws_users:</h3>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(result.profile, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
