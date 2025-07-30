'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import { supabase } from '@/services/supabase/client';
import toast from 'react-hot-toast';

const supabaseUrl = "https://mwzdohmphqosxfzxqakp.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13emRvaG1waHFvc3hmenhxYWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5MDE1MjAsImV4cCI6MjA2NzQ3NzUyMH0.9j0oorHPcsBg6GEpX3CF4dUDKI9tYxdW5ieVpQ3K6yU";

export default function SupabaseAdmin() {
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [buckets, setBuckets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<any[]>([]);

  const testConnection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('ws_profiles').select('count').limit(1);
      
      if (error) {
        setConnectionStatus('Error: ' + error.message);
        toast.error('Error de conexión');
      } else {
        setConnectionStatus('Conexión exitosa');
        toast.success('Conexión exitosa');
      }
    } catch (error) {
      setConnectionStatus('Error de conexión');
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const listBuckets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        toast.error('Error al listar buckets: ' + error.message);
      } else {
        setBuckets(data || []);
        toast.success('Buckets listados correctamente');
      }
    } catch (error) {
      toast.error('Error al listar buckets');
    } finally {
      setLoading(false);
    }
  };

  const createBucket = async (bucketName: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true
      });
      
      if (error) {
        toast.error('Error al crear bucket: ' + error.message);
      } else {
        toast.success('Bucket creado correctamente');
        listBuckets(); // Refresh list
      }
    } catch (error) {
      toast.error('Error al crear bucket');
    } finally {
      setLoading(false);
    }
  };

  const deleteBucket = async (bucketName: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.storage.deleteBucket(bucketName);
      
      if (error) {
        toast.error('Error al eliminar bucket: ' + error.message);
      } else {
        toast.success('Bucket eliminado correctamente');
        listBuckets(); // Refresh list
      }
    } catch (error) {
      toast.error('Error al eliminar bucket');
    } finally {
      setLoading(false);
    }
  };

  const checkTables = async () => {
    setLoading(true);
    try {
      // Verificar si existe la tabla ws_profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('ws_profiles')
        .select('*')
        .limit(1);

      if (profilesError) {
        console.error('Error checking ws_profiles table:', profilesError);
        toast.error('Tabla ws_profiles no existe o no es accesible');
        setTables([]);
      } else {
        toast.success('Tabla ws_profiles existe');
        setTables(['ws_profiles']);
      }
    } catch (error) {
      console.error('Error checking tables:', error);
      toast.error('Error al verificar tablas');
    } finally {
      setLoading(false);
    }
  };

  const createProfilesTable = async () => {
    setLoading(true);
    try {
      // Intentar crear un registro de prueba
      const { data, error } = await supabase
        .from('ws_profiles')
        .insert([{
          name: 'Test User',
          email: 'test@example.com',
          store_types: ['almacen']
        }])
        .select();

      if (error) {
        console.error('Error creating test profile:', error);
        toast.error('Error al crear perfil de prueba: ' + error.message);
      } else {
        toast.success('Tabla ws_profiles funciona correctamente');
        // Eliminar el registro de prueba
        if (data && data[0]) {
          await supabase
            .from('ws_profiles')
            .delete()
            .eq('email', 'test@example.com');
        }
      }
    } catch (error) {
      console.error('Error in createProfilesTable:', error);
      toast.error('Error al probar la tabla ws_profiles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Administración de Supabase</h1>
      
      {/* Connection Test */}
      <Card>
        <CardHeader>
          <CardTitle>Prueba de Conexión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={testConnection} disabled={loading}>
            {loading ? 'Probando...' : 'Probar Conexión'}
          </Button>
          {connectionStatus && (
            <p className={`text-sm ${connectionStatus.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {connectionStatus}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Database Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Tablas de Base de Datos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={checkTables} disabled={loading}>
              {loading ? 'Verificando...' : 'Verificar Tablas'}
            </Button>
            <Button 
              onClick={createProfilesTable} 
              disabled={loading}
              variant="outline"
            >
              Probar Tabla ws_profiles
            </Button>
          </div>
          
          {tables.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Tablas disponibles:</h3>
              {tables.map((table) => (
                <div key={table} className="flex items-center justify-between p-2 border rounded">
                  <span>{table}</span>
                  <span className="text-green-600 text-sm">✓ Disponible</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Storage Buckets */}
      <Card>
        <CardHeader>
          <CardTitle>Buckets de Storage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Button onClick={listBuckets} disabled={loading}>
              {loading ? 'Cargando...' : 'Listar Buckets'}
            </Button>
            <Button 
              onClick={() => createBucket('products')} 
              disabled={loading}
              variant="outline"
            >
              Crear Bucket 'products'
            </Button>
          </div>
          
          {buckets.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Buckets disponibles:</h3>
              {buckets.map((bucket) => (
                <div key={bucket.id} className="flex items-center justify-between p-2 border rounded">
                  <span>{bucket.id}</span>
                  <Button 
                    onClick={() => deleteBucket(bucket.id)}
                    variant="destructive"
                    size="sm"
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Conexión</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>URL:</strong> {supabaseUrl}</p>
            <p><strong>Anon Key:</strong> {supabaseAnonKey.substring(0, 20)}...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 