'use client';
import { createClient } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
// Removido: import no usado
export default function EmailSetupPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  // Removido: variable no usada
  const [result, setResult] = useState<any>(null);

  const testEmail = async () => {
    if (!email) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });
      
      setResult({ data, error });
    } catch (error) {
      setResult({ error: error });
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Configuración de Email</h1>
      
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <strong>Problema:</strong> Los correos de verificación no están llegando.
        <br />
        <strong>Solución:</strong> Configurar SMTP en Supabase Dashboard → Authentication → Settings → SMTP Settings
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Email para probar:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-md"
          placeholder="test@example.com"
        />
        <button
          onClick={testEmail}
          disabled={loading}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Probar Email'}
        </button>
      </div>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Resultado:</h3>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-6 bg-blue-50 p-4 rounded">
        <h3 className="font-bold mb-2">Pasos para configurar SMTP:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Ve a Supabase Dashboard</li>
          <li>Selecciona tu proyecto</li>
          <li>Ve a Authentication → Settings</li>
          <li>Busca "SMTP Settings"</li>
          <li>Configura con tu proveedor de email (Gmail, SendGrid, etc.)</li>
          <li>Guarda la configuración</li>
        </ol>
      </div>
    </div>
  );
}
