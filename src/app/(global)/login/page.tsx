'use client';
import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, CheckCircle, Shield, Zap, Users, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import PageLayout from "@/components/layout/PageLayout";
import Section from "@/components/ui/Section";
import SectionTitle from "@/components/ui/SectionTitle";


import { Suspense } from 'react';

export default function Login() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  // ...toda la lógica y el return original de Login aquí...
  // Copiado exactamente igual que antes

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
    // Verificar si viene de verificación de email
    const email = searchParams.get('email');
    const verified = searchParams.get('verified');
    
    if (email && verified === 'true') {
      // Pre-llenar el email y mostrar mensaje
      setFormData(prev => ({ ...prev, email }));
      toast.success("¡Email verificado exitosamente! Ahora inicia sesión para continuar con la configuración.", { 
        icon: <CheckCircle className="h-4 w-4" />,
        duration: 6000
      });
    }
  }, [searchParams]);

  // Manejar navegación pendiente
  useEffect(() => {
    if (pendingNavigation) {
      console.log('[Login] Ejecutando navegación pendiente a:', pendingNavigation);
      router.push(pendingNavigation);
      setPendingNavigation(null); // Limpiar después de navegar
    }
  }, [pendingNavigation, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('[Login] Iniciando signIn...');
      const { error, nextRoute } = await signIn(formData.email, formData.password);
      console.log('[Login] signIn result:', { error, nextRoute });
      
      if (error && error.message === 'Invalid login credentials') {
        toast.error('El correo o la contraseña no son correctos.');
        return;
      }
      if (error && error.message === 'EMAIL_NOT_VERIFIED') {
        // Mostrar aviso y NO navegar aunque signIn devuelva nextRoute
        toast('Debes verificar tu email antes de continuar. Revisa tu bandeja o solicita un nuevo enlace.', { icon: <Info className="h-4 w-4" /> });
      }
      if (!error) {
        // Si nextRoute apunta al selector de negocio, mensaje acorde
        if (nextRoute && nextRoute.startsWith('/select-business')) {
          toast.success('Completa la configuración de tu negocio');
        } else {
          toast.success('¡Inicio de sesión exitoso!');
        }
      }
      if (nextRoute && !(error && error.message === 'EMAIL_NOT_VERIFIED')) {
        console.log('[Login] Programando navegación a:', nextRoute);
        setPendingNavigation(nextRoute);
      } else if (!nextRoute) {
        console.log('[Login] No hay nextRoute, no programando navegación');
      } else {
        console.log('[Login] Ignorando navegación porque email no verificado');
      }
    } catch (error) {
      console.error('[Login] Error en handleSubmit:', error);
      toast.error((error as Error).message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  // Inicialización de la página
  useEffect(() => {
    const initializeLogin = async () => {
      // Delay para mostrar el loader
      await new Promise(resolve => setTimeout(resolve, 1200));
      setInitializing(false);
    };
    
    initializeLogin();
  }, []);

  // Mostrar loading mientras inicializa
  if (initializing) {
    return (
      <PageLayout>
        <Section className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue15 border-t-blue8 rounded-full animate-spin mx-auto"></div>
            </div>
            <div className="space-y-2">
              <p className="text-lg text-blue1 font-body">Cargando...</p>
            </div>
          </div>
        </Section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Section className="py-6 sm:py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Login Form */}
            <div className="space-y-4 sm:space-y-6">
              <div className="text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Iniciar Sesión
                </h1>
                <p className="text-base sm:text-lg text-gray-600">
                  Accede a tu cuenta de Ingenit Store
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 sm:p-8">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Credenciales</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-900">
                      Correo Electrónico
                    </label>
                    <div className="mt-1 relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="appearance-none relative block w-full px-3 py-2 sm:py-3 pl-4 sm:pl-4 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-sm sm:text-base"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-900">
                      Contraseña
                    </label>
                    <div className="mt-1 relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className="appearance-none relative block w-full px-3 py-2 sm:py-3 pl-4 sm:pl-4 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-600 text-sm sm:text-base"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent text-sm sm:text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  ¿No tienes una cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>
            </div>

            {/* Panel de Bienvenida */}
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                  ¡Bienvenido a tu plataforma!
                </h2>
                <p className="text-base sm:text-lg text-gray-600">
                  Gestiona tu negocio de manera inteligente y eficiente con nuestras herramientas profesionales.
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Seguridad Garantizada</h3>
                    <p className="text-sm sm:text-base text-gray-600">Tus datos están protegidos con encriptación de nivel bancario.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Acceso Rápido</h3>
                    <p className="text-sm sm:text-base text-gray-600">Interfaz intuitiva y eficiente para una gestión ágil.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Soporte 24/7</h3>
                    <p className="text-sm sm:text-base text-gray-600">Nuestro equipo está disponible para ayudarte en cualquier momento.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </PageLayout>
  );
}