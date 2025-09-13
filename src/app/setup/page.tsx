'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Removido: import no usado
import Button from '@/components/ui/Button';
import { setupDatabase, checkDatabaseConnection } from '@/services/supabase/setup';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';
import SecurityGuard from '@/components/SecurityGuard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleSetupDatabase = async () => {
    setLoading(true);
    setStatus('Configurando base de datos...');

    try {
      const result = await setupDatabase();
      
      if (result.success) {
        setStatus('Base de datos configurada correctamente');
        toast.success('Base de datos configurada correctamente');
      } else {
        setStatus('Error al configurar la base de datos');
        toast.error('Error al configurar la base de datos');
      }
    } catch (error) {
      console.error('Setup error:', error);
      setStatus('Error inesperado');
      toast.error('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckConnection = async () => {
    setLoading(true);
    setStatus('Verificando conexión...');

    try {
      const result = await checkDatabaseConnection();
      
      if (result.connected) {
        setStatus('Conexión exitosa');
        toast.success('Conexión exitosa');
      } else {
        setStatus('Error de conexión');
        toast.error('Error de conexión');
      }
    } catch (error) {
      console.error('Connection check error:', error);
      setStatus('Error al verificar conexión');
      toast.error('Error al verificar conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSetup = async () => {
    setLoading(true);
    setStatus('Intentando crear tabla manualmente...');

    try {
      // Intentar crear un registro de prueba
      const { data, error } = await supabase
        .from('ws_users')
        .insert([{
          name: 'Test User',
          email: 'test@example.com',
          store_types: ['almacen']
        }])
        .select();

      if (error) {
        console.error('Manual setup error:', error);
        setStatus('Error: ' + error.message);
        toast.error('Error: ' + error.message);
      } else {
        setStatus('Tabla creada correctamente');
        toast.success('Tabla creada correctamente');
        
        // Eliminar el registro de prueba
        if (data && data[0]) {
          await supabase
            .from('ws_users')
            .delete()
            .eq('email', 'test@example.com');
        }
      }
    } catch (error) {
      console.error('Manual setup error:', error);
      setStatus('Error inesperado');
      toast.error('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SecurityGuard>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Configuración de Base de Datos
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Configura automáticamente las tablas necesarias
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configuración Automática</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleSetupDatabase} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Configurando...' : 'Configurar Base de Datos'}
            </Button>

            <Button 
              onClick={handleCheckConnection} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Verificando...' : 'Verificar Conexión'}
            </Button>

            <Button 
              onClick={handleManualSetup} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Probando...' : 'Probar Creación Manual'}
            </Button>

            {status && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <p className="text-sm text-gray-700">{status}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Si los métodos automáticos no funcionan, ejecuta manualmente el script SQL en Supabase Dashboard
          </p>
          <a 
            href="https://supabase.com/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            Ir a Supabase Dashboard
          </a>
        </div>
      </div>
    </div>
  
      </SecurityGuard>);
} 