# Flujo de Registro y Verificación de Email

## 📋 Nuevo Flujo Implementado

### 1. **Registro** (`/register`)
- Usuario ingresa datos básicos (nombre, email, contraseña)
- Se crea cuenta en Supabase Auth
- Se envía email de verificación automáticamente
- Usuario ve mensaje: "Revisa tu correo para confirmar tu email"

### 2. **Verificación de Email** (`/auth/callback`)
- Usuario hace clic en el enlace del email
- Se verifica el email en Supabase Auth
- Redirección automática a `/onboarding`

### 3. **Onboarding** (`/onboarding`)
- **Solo accesible con email verificado**
- Usuario selecciona plan de suscripción:
  - Plan Gratuito ($0)
  - Plan Mensual ($9.990/mes)
  - Plan Anual ($99.990/año - 2 meses gratis)
- Usuario selecciona tipo(s) de negocio:
  - Retail/Tienda
  - Restaurante
  - Servicios
  - E-commerce
  - Otro
- Se crea perfil en `ws_profiles` con los datos seleccionados
- Redirección automática a `/dashboard`

### 4. **Dashboard** (`/dashboard`)
- **Solo accesible con perfil completo**
- Usuario puede usar la plataforma normalmente

## 🔒 Middleware de Protección

### Rutas Protegidas
- `/dashboard`
- `/settings`
- `/products`
- `/sales`
- `/invoices`
- `/subscription`

### Lógica de Redirección
1. **Sin sesión** → `/login`
2. **Email no verificado** → `/register`
3. **Email verificado sin perfil** → `/onboarding`
4. **Perfil completo** → Acceso normal a la plataforma

## 🛠️ Archivos Modificados

### Nuevos Archivos
- `src/app/onboarding/page.tsx` - Página de selección de plan y negocio
- `src/middleware/onboardingCheck.ts` - Middleware de protección

### Archivos Modificados
- `src/app/register/page.tsx` - Redirección a onboarding
- `src/app/auth/callback/page.tsx` - Redirección a onboarding

## ✅ Beneficios del Nuevo Flujo

1. **Verificación obligatoria** - No se puede usar la plataforma sin verificar email
2. **Configuración guiada** - Usuario configura plan y tipo de negocio paso a paso
3. **Experiencia mejorada** - Flujo claro y sin confusión
4. **Seguridad** - Middleware previene acceso no autorizado
5. **Datos completos** - Todos los usuarios tienen perfil completo desde el inicio

## 🧪 Pruebas Recomendadas

1. **Registro completo**:
   - Ir a `/register`
   - Completar formulario
   - Verificar que se envía email
   - Hacer clic en enlace del email
   - Verificar redirección a `/onboarding`

2. **Selección de plan y negocio**:
   - Seleccionar plan
   - Seleccionar tipo(s) de negocio
   - Completar onboarding
   - Verificar redirección a `/dashboard`

3. **Protección de rutas**:
   - Intentar acceder a `/dashboard` sin login
   - Intentar acceder a `/dashboard` sin verificar email
   - Intentar acceder a `/dashboard` sin completar onboarding
