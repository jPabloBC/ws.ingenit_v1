'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import { supabase } from '@/services/supabase/client';
import toast from 'react-hot-toast';
import { Copy, Check, AlertTriangle, Database, User, Settings, Wrench, Zap, Shield } from 'lucide-react';

export default function FixDatabasePage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const fixUsageUniqueScript = `-- Script específico para corregir la tabla ws_usage
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si la tabla ws_usage existe y tiene la restricción UNIQUE
DO $$ 
BEGIN
    -- Verificar si la tabla existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ws_usage') THEN
        -- Verificar si tiene la restricción UNIQUE en user_id
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'ws_usage' 
            AND constraint_type = 'UNIQUE' 
            AND constraint_name LIKE '%user_id%'
        ) THEN
            -- Agregar la restricción UNIQUE si no existe
            ALTER TABLE ws_usage ADD CONSTRAINT ws_usage_user_id_unique UNIQUE (user_id);
            RAISE NOTICE 'Restricción UNIQUE agregada a ws_usage.user_id';
        ELSE
            RAISE NOTICE 'La restricción UNIQUE ya existe en ws_usage.user_id';
        END IF;
    ELSE
        -- Crear la tabla si no existe
        CREATE TABLE ws_usage (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
          current_stores INTEGER NOT NULL DEFAULT 0,
          current_products INTEGER NOT NULL DEFAULT 0,
          total_stock INTEGER NOT NULL DEFAULT 0,
          last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabla ws_usage creada con restricción UNIQUE';
    END IF;
END $$;

-- 2. Configurar RLS si no está habilitado
ALTER TABLE ws_usage ENABLE ROW LEVEL SECURITY;

-- 3. Crear política RLS si no existe
DROP POLICY IF EXISTS "Allow all operations on ws_usage" ON ws_usage;
CREATE POLICY "Allow all operations on ws_usage" ON ws_usage FOR ALL USING (true);

-- 4. Recrear la función update_user_usage con manejo correcto de conflictos
CREATE OR REPLACE FUNCTION update_user_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar uso cuando se modifica un perfil
  IF TG_TABLE_NAME = 'ws_profiles' THEN
    INSERT INTO ws_usage (user_id, current_stores, current_products, total_stock)
    VALUES (NEW.user_id, array_length(NEW.store_types, 1), 0, 0)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      current_stores = array_length(NEW.store_types, 1),
      last_updated = NOW();
  END IF;
  
  -- Actualizar uso cuando se modifica un producto
  IF TG_TABLE_NAME = 'ws_products' THEN
    INSERT INTO ws_usage (user_id, current_stores, current_products, total_stock)
    VALUES (NEW.user_id, 0, 1, NEW.stock)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      current_products = ws_usage.current_products + 1,
      total_stock = ws_usage.total_stock + NEW.stock,
      last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Recrear triggers
DROP TRIGGER IF EXISTS trigger_update_usage_profiles ON ws_profiles;
CREATE TRIGGER trigger_update_usage_profiles
  AFTER INSERT OR UPDATE ON ws_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

DROP TRIGGER IF EXISTS trigger_update_usage_products ON ws_products;
CREATE TRIGGER trigger_update_usage_products
  AFTER INSERT OR UPDATE ON ws_products
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

-- 6. Crear índice si no existe
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON ws_usage(user_id);

-- 7. Verificar la estructura de la tabla
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'ws_usage' 
ORDER BY ordinal_position;

-- 8. Verificar restricciones
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'ws_usage';

-- 9. Mensaje de confirmación
SELECT 'Tabla ws_usage corregida exitosamente' as status;`;

  const cleanTriggersScript = `-- Script para limpiar y recrear todos los triggers
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar todos los triggers existentes
DROP TRIGGER IF EXISTS trigger_generate_sku ON ws_products;
DROP TRIGGER IF EXISTS trigger_update_usage_profiles ON ws_profiles;
DROP TRIGGER IF EXISTS trigger_update_usage_products ON ws_products;

-- 2. Recrear función para generar SKU
CREATE OR REPLACE FUNCTION generate_sku()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sku IS NULL OR NEW.sku = '' THEN
    NEW.sku := 'SKU' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Recrear trigger para generar SKU
CREATE TRIGGER trigger_generate_sku
  BEFORE INSERT ON ws_products
  FOR EACH ROW
  EXECUTE FUNCTION generate_sku();

-- 4. Recrear función para actualizar uso
CREATE OR REPLACE FUNCTION update_user_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar uso cuando se modifica un perfil
  IF TG_TABLE_NAME = 'ws_profiles' THEN
    INSERT INTO ws_usage (user_id, current_stores, current_products, total_stock)
    VALUES (NEW.user_id, array_length(NEW.store_types, 1), 0, 0)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      current_stores = array_length(NEW.store_types, 1),
      last_updated = NOW();
  END IF;
  
  -- Actualizar uso cuando se modifica un producto
  IF TG_TABLE_NAME = 'ws_products' THEN
    INSERT INTO ws_usage (user_id, current_stores, current_products, total_stock)
    VALUES (NEW.user_id, 0, 1, NEW.stock)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      current_products = ws_usage.current_products + 1,
      total_stock = ws_usage.total_stock + NEW.stock,
      last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Recrear triggers para actualizar uso
CREATE TRIGGER trigger_update_usage_profiles
  AFTER INSERT OR UPDATE ON ws_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

CREATE TRIGGER trigger_update_usage_products
  AFTER INSERT OR UPDATE ON ws_products
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

-- 6. Verificar que los triggers se crearon correctamente
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_generate_sku', 'trigger_update_usage_profiles', 'trigger_update_usage_products')
ORDER BY trigger_name;

-- 7. Mensaje de confirmación
SELECT 'Triggers limpiados y recreados exitosamente' as status;`;

  const quickFixScript = `-- Corrección rápida para el error de ws_usage
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar la tabla ws_usage si existe
DROP TABLE IF EXISTS ws_usage CASCADE;

-- 2. Recrear la tabla ws_usage con la restricción UNIQUE correcta
CREATE TABLE ws_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_stores INTEGER NOT NULL DEFAULT 0,
  current_products INTEGER NOT NULL DEFAULT 0,
  total_stock INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Configurar RLS
ALTER TABLE ws_usage ENABLE ROW LEVEL SECURITY;

-- 4. Política RLS
CREATE POLICY "Allow all operations on ws_usage" ON ws_usage FOR ALL USING (true);

-- 5. Función para actualizar uso (corregida)
CREATE OR REPLACE FUNCTION update_user_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar uso cuando se modifica un perfil
  IF TG_TABLE_NAME = 'ws_profiles' THEN
    INSERT INTO ws_usage (user_id, current_stores, current_products, total_stock)
    VALUES (NEW.user_id, array_length(NEW.store_types, 1), 0, 0)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      current_stores = array_length(NEW.store_types, 1),
      last_updated = NOW();
  END IF;
  
  -- Actualizar uso cuando se modifica un producto
  IF TG_TABLE_NAME = 'ws_products' THEN
    INSERT INTO ws_usage (user_id, current_stores, current_products, total_stock)
    VALUES (NEW.user_id, 0, 1, NEW.stock)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      current_products = ws_usage.current_products + 1,
      total_stock = ws_usage.total_stock + NEW.stock,
      last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Crear triggers
DROP TRIGGER IF EXISTS trigger_update_usage_profiles ON ws_profiles;
CREATE TRIGGER trigger_update_usage_profiles
  AFTER INSERT OR UPDATE ON ws_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

DROP TRIGGER IF EXISTS trigger_update_usage_products ON ws_products;
CREATE TRIGGER trigger_update_usage_products
  AFTER INSERT OR UPDATE ON ws_products
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

-- 7. Índice
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON ws_usage(user_id);

-- 8. Verificar
SELECT 'Tabla ws_usage corregida exitosamente' as status;`;

  const sqlScript = `-- Script completo para configurar la base de datos de Ingenit Store Manager
-- Copia y pega esto en el SQL Editor de Supabase

-- 1. Crear tabla ws_profiles con user_id
DROP TABLE IF EXISTS ws_profiles CASCADE;
CREATE TABLE ws_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  store_types TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla ws_categories
CREATE TABLE IF NOT EXISTS ws_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear tabla ws_products
CREATE TABLE IF NOT EXISTS ws_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) UNIQUE,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  category_id UUID REFERENCES ws_categories(id),
  supplier_id UUID,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla ws_subscriptions
CREATE TABLE IF NOT EXISTS ws_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  max_stores INTEGER NOT NULL DEFAULT 1,
  max_products INTEGER NOT NULL DEFAULT 5,
  max_stock_per_product INTEGER NOT NULL DEFAULT 3,
  trial_days INTEGER NOT NULL DEFAULT 10,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear tabla ws_usage
CREATE TABLE IF NOT EXISTS ws_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_stores INTEGER NOT NULL DEFAULT 0,
  current_products INTEGER NOT NULL DEFAULT 0,
  total_stock INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Configurar RLS
ALTER TABLE ws_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ws_usage ENABLE ROW LEVEL SECURITY;

-- 7. Políticas RLS (permitir todo en desarrollo)
CREATE POLICY "Allow all operations on ws_profiles" ON ws_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on ws_categories" ON ws_categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on ws_products" ON ws_products FOR ALL USING (true);
CREATE POLICY "Allow all operations on ws_subscriptions" ON ws_subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all operations on ws_usage" ON ws_usage FOR ALL USING (true);

-- 8. Función para actualizar uso
CREATE OR REPLACE FUNCTION update_user_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar uso cuando se modifica un perfil
  IF TG_TABLE_NAME = 'ws_profiles' THEN
    INSERT INTO ws_usage (user_id, current_stores, current_products, total_stock)
    VALUES (NEW.user_id, array_length(NEW.store_types, 1), 0, 0)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      current_stores = array_length(NEW.store_types, 1),
      last_updated = NOW();
  END IF;
  
  -- Actualizar uso cuando se modifica un producto
  IF TG_TABLE_NAME = 'ws_products' THEN
    INSERT INTO ws_usage (user_id, current_stores, current_products, total_stock)
    VALUES (NEW.user_id, 0, 1, NEW.stock)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      current_products = ws_usage.current_products + 1,
      total_stock = ws_usage.total_stock + NEW.stock,
      last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Triggers para actualizar uso automáticamente
DROP TRIGGER IF EXISTS trigger_update_usage_profiles ON ws_profiles;
CREATE TRIGGER trigger_update_usage_profiles
  AFTER INSERT OR UPDATE ON ws_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

DROP TRIGGER IF EXISTS trigger_update_usage_products ON ws_products;
CREATE TRIGGER trigger_update_usage_products
  AFTER INSERT OR UPDATE ON ws_products
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage();

-- 10. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON ws_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON ws_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON ws_usage(user_id);

-- 11. Insertar categorías por defecto
INSERT INTO ws_categories (name, description, color) VALUES
('Electrónicos', 'Productos electrónicos y tecnología', '#3B82F6'),
('Ropa', 'Vestimenta y accesorios', '#EF4444'),
('Hogar', 'Artículos para el hogar', '#10B981'),
('Deportes', 'Equipamiento deportivo', '#F59E0B'),
('Libros', 'Libros y material educativo', '#8B5CF6')
ON CONFLICT DO NOTHING;

-- 12. Verificar que todo esté correcto
SELECT 'Base de datos configurada exitosamente' as status;`;

  const copyToClipboard = async (script: string) => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      toast.success('Script copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error al copiar al portapapeles');
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setStatus('Probando conexión...');

    try {
      // Probar tabla ws_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('ws_profiles')
        .select('*')
        .limit(1);

      if (profilesError) {
        setStatus('Error en ws_profiles: ' + profilesError.message);
        toast.error('Tabla ws_profiles no existe o no es accesible');
        return;
      }

      // Probar tabla ws_subscriptions
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('ws_subscriptions')
        .select('*')
        .limit(1);

      if (subscriptionsError) {
        setStatus('Error en ws_subscriptions: ' + subscriptionsError.message);
        toast.error('Tabla ws_subscriptions no existe o no es accesible');
        return;
      }

      // Probar tabla ws_usage
      const { data: usage, error: usageError } = await supabase
        .from('ws_usage')
        .select('*')
        .limit(1);

      if (usageError) {
        setStatus('Error en ws_usage: ' + usageError.message);
        toast.error('Tabla ws_usage no existe o no es accesible');
        return;
      }

      setStatus('¡Todas las tablas existen y funcionan correctamente!');
      toast.success('Conexión exitosa - Sistema de suscripciones listo');
    } catch (error) {
      setStatus('Error inesperado: ' + error);
      toast.error('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const testProfileCreation = async () => {
    setLoading(true);
    setStatus('Probando creación de perfil...');

    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setStatus('No hay usuario autenticado. Inicia sesión primero.');
        toast.error('Debes iniciar sesión para probar');
        return;
      }

      // Intentar crear un perfil de prueba
      const { data, error } = await supabase
        .from('ws_profiles')
        .insert({
          user_id: user.id,
          name: 'Test User',
          email: 'test@example.com',
          store_types: ['almacen']
        })
        .select()
        .single();

      if (error) {
        setStatus('Error al crear perfil: ' + error.message);
        toast.error('Error al crear perfil de prueba');
        return;
      }

      // Limpiar el perfil de prueba
      await supabase
        .from('ws_profiles')
        .delete()
        .eq('email', 'test@example.com');

      setStatus('¡Creación de perfil funciona correctamente!');
      toast.success('Sistema de perfiles funcionando');
    } catch (error) {
      setStatus('Error inesperado: ' + error);
      toast.error('Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Configurar Base de Datos</h1>
          <p className="text-gray-600 mt-2">
            Configura la base de datos para el sistema de suscripciones
          </p>
        </div>

        {/* Corrección Específica de ws_usage */}
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <Shield className="h-5 w-5 mr-2" />
              Corrección Específica - Error de ws_usage UNIQUE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">
              <strong>IMPORTANTE:</strong> Si recibiste el error "there is no unique or exclusion constraint matching the ON CONFLICT specification",
              ejecuta este script específico para corregir la tabla ws_usage:
            </p>
            
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm max-h-64 overflow-y-auto">
                <code>{fixUsageUniqueScript}</code>
              </pre>
              <Button
                onClick={() => copyToClipboard(fixUsageUniqueScript)}
                className="absolute top-2 right-2"
                size="sm"
                variant="outline"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="mt-4">
              <Button 
                onClick={() => copyToClipboard(fixUsageUniqueScript)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Copiar Script de Corrección Específica
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Limpieza de Triggers */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center text-purple-800">
              <Zap className="h-5 w-5 mr-2" />
              Limpiar Triggers - Error de Triggers Duplicados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-purple-700 mb-4">
              Si recibiste el error "trigger already exists", ejecuta este script para limpiar y recrear todos los triggers:
            </p>
            
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm max-h-64 overflow-y-auto">
                <code>{cleanTriggersScript}</code>
              </pre>
              <Button
                onClick={() => copyToClipboard(cleanTriggersScript)}
                className="absolute top-2 right-2"
                size="sm"
                variant="outline"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="mt-4">
              <Button 
                onClick={() => copyToClipboard(cleanTriggersScript)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Copiar Script de Limpieza de Triggers
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Corrección Rápida */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <Wrench className="h-5 w-5 mr-2" />
              Corrección Rápida - Error de ws_usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-4">
              Si recibiste el error "there is no unique or exclusion constraint matching the ON CONFLICT specification",
              ejecuta este script para corregir la tabla ws_usage:
            </p>
            
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm max-h-64 overflow-y-auto">
                <code>{quickFixScript}</code>
              </pre>
              <Button
                onClick={() => copyToClipboard(quickFixScript)}
                className="absolute top-2 right-2"
                size="sm"
                variant="outline"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="mt-4">
              <Button 
                onClick={() => copyToClipboard(quickFixScript)}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Copiar Script de Corrección
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Paso 1 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                1
              </span>
              Ir a Supabase Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Ve al dashboard de Supabase y accede a tu proyecto.
            </p>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Abrir Supabase Dashboard
            </a>
          </CardContent>
        </Card>

        {/* Paso 2 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                2
              </span>
              Ejecutar Script SQL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Copia el siguiente script SQL y pégalo en el editor SQL de Supabase:
            </p>
            
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-sm max-h-96 overflow-y-auto">
                <code>{sqlScript}</code>
              </pre>
              <Button
                onClick={() => copyToClipboard(sqlScript)}
                className="absolute top-2 right-2"
                size="sm"
                variant="outline"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Este script eliminará y recreará las tablas. Haz backup si tienes datos importantes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paso 3 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                3
              </span>
              Verificar Configuración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Después de ejecutar el script, verifica que todas las tablas se crearon correctamente:
            </p>
            <Button onClick={testConnection} disabled={loading} className="mr-4">
              {loading ? 'Verificando...' : 'Verificar Tablas'}
            </Button>
            
            <Button onClick={testProfileCreation} disabled={loading}>
              {loading ? 'Probando...' : 'Probar Creación de Perfil'}
            </Button>
            
            {status && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <p className="text-sm text-gray-700">{status}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paso 4 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">
                4
              </span>
              Probar Registro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Una vez que las tablas estén configuradas, puedes probar el registro de usuarios:
            </p>
            <a
              href="/register"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Ir a Registro
            </a>
          </CardContent>
        </Card>

        {/* Información del sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Sistema de Suscripciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Tablas Creadas:</h4>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• <code>ws_profiles</code> - Perfiles de usuarios con user_id</li>
                  <li>• <code>ws_subscriptions</code> - Planes y límites de suscripción</li>
                  <li>• <code>ws_usage</code> - Tracking automático de uso</li>
                  <li>• <code>ws_products</code> - Productos del inventario</li>
                  <li>• <code>ws_categories</code> - Categorías de productos</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900">Funcionalidades:</h4>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Creación automática de suscripción gratuita</li>
                  <li>• Verificación de límites por plan</li>
                  <li>• Tracking automático de uso</li>
                  <li>• Políticas RLS configuradas</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">Planes Disponibles:</h4>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• <strong>Gratuito:</strong> 1 tienda, 5 productos, 3 stock por producto</li>
                  <li>• <strong>Single Store:</strong> $10.000/mes - 1 tienda, ilimitado</li>
                  <li>• <strong>Double Store:</strong> $15.000/mes - 2 tiendas, ilimitado</li>
                  <li>• <strong>Triple Store:</strong> $18.000/mes - 3 tiendas, ilimitado</li>
                  <li>• <strong>Quad Store:</strong> $22.000/mes - 4 tiendas, ilimitado</li>
                  <li>• <strong>Full Access:</strong> $25.000/mes - Ilimitado</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 