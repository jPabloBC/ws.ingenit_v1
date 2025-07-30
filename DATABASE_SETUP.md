# Configuración de Base de Datos

## Problema Actual
El error indica que la tabla `ws_profiles` no tiene la columna `name`. Esto significa que la tabla no existe o tiene una estructura incorrecta.

## Solución

### 1. Acceder a Supabase Dashboard
1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a la sección "SQL Editor"

### 2. Ejecutar el Script SQL
Copia y pega el contenido del archivo `database-setup.sql` en el editor SQL y ejecútalo.

### 3. Verificar la Configuración
Después de ejecutar el script, verifica que las tablas se crearon correctamente:

```sql
-- Verificar que la tabla ws_profiles existe
SELECT * FROM ws_profiles LIMIT 1;

-- Verificar la estructura de la tabla
\d ws_profiles;
```

### 4. Configurar Políticas de Seguridad
Si las políticas RLS no se crearon automáticamente, ejecuta:

```sql
-- Políticas para ws_profiles
CREATE POLICY "Allow all operations on ws_profiles" ON ws_profiles FOR ALL USING (true);
```

### 5. Probar la Configuración
Ve a http://localhost:3000/admin y:
1. Haz clic en "Verificar Tablas"
2. Haz clic en "Probar Tabla ws_profiles"

## Estructura de Tablas

### ws_profiles
- `id`: UUID (Primary Key)
- `name`: VARCHAR(255) NOT NULL
- `email`: VARCHAR(255) UNIQUE NOT NULL
- `store_types`: TEXT[] DEFAULT '{}'
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE

### ws_products
- `id`: UUID (Primary Key)
- `name`: VARCHAR(255) NOT NULL
- `description`: TEXT
- `sku`: VARCHAR(100) UNIQUE
- `price`: DECIMAL(10,2) NOT NULL
- `cost`: DECIMAL(10,2) NOT NULL
- `stock`: INTEGER DEFAULT 0
- `min_stock`: INTEGER DEFAULT 0
- `category_id`: UUID (Foreign Key)
- `supplier_id`: UUID (Foreign Key)
- `image_url`: TEXT
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE

### Otras tablas
- `ws_categories`
- `ws_suppliers`
- `ws_customers`
- `ws_sales`
- `ws_sale_items`

## Funciones y Triggers

### generate_sale_number()
Genera números de venta automáticamente (SAL000001, SAL000002, etc.)

### generate_sku()
Genera SKUs automáticamente para productos (SKU + 8 caracteres del UUID)

## Troubleshooting

### Error: "Could not find the 'name' column"
- La tabla `ws_profiles` no existe o no tiene la estructura correcta
- Ejecuta el script SQL completo

### Error: "Permission denied"
- Las políticas RLS no están configuradas correctamente
- Ejecuta las políticas de seguridad

### Error: "Table does not exist"
- Ejecuta el script SQL para crear todas las tablas

## Notas Importantes

1. **Backup**: Siempre haz backup de tu base de datos antes de ejecutar scripts
2. **Testing**: Prueba en un entorno de desarrollo primero
3. **Permissions**: Asegúrate de que tu usuario tenga permisos para crear tablas
4. **RLS**: Las políticas RLS están configuradas para permitir todo en desarrollo

## Comandos Útiles

```sql
-- Verificar todas las tablas
\dt ws_*

-- Verificar estructura de una tabla
\d ws_profiles

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'ws_profiles';

-- Eliminar tabla si es necesario (¡CUIDADO!)
DROP TABLE IF EXISTS ws_profiles CASCADE;
``` 