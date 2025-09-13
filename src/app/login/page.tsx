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

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        console.log('Login error:', error);
        if (error.message === 'EMAIL_NOT_VERIFIED') {
          // Usuario no ha verificado email, redirigir al registro para verificar
          toast("Debes verificar tu email...", { icon: <Info className="h-4 w-4" /> });
          // Usar router.push inmediatamente sin setTimeout para evitar problemas en producción
          router.push("/register?step=verification");
        } else if (error.message === 'EMAIL_VERIFIED_NO_BUSINESS') {
          // Usuario verificado pero sin negocio seleccionado, redirigir al paso 3
          toast.success("¡Email verificado! Completa tu configuración...", { icon: <CheckCircle className="h-4 w-4" /> });
          router.push("/register?step=business");
        } else {
          toast.error("Error al iniciar sesión: " + (error.message || 'Error desconocido'));
        }
      } else {
        toast.success("¡Inicio de sesión exitoso!");
        router.push("/dashboard");
      }
    } catch (error) {
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
      <Section className="py-12">
        {/* Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Login Form */}
            <div className="space-y-8">
              <div>
                <SectionTitle title="Iniciar Sesión" className="mb-2" />
                <p className="text-gray2 font-body">
                  Accede a tu cuenta de Ingenit Store
                </p>
              </div>

              <Card className="border-blue13">
                <CardHeader>
                  <CardTitle className="font-title text-blue1">Credenciales</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="email" className="block text-base font-medium text-blue1 font-body">
                        Correo Electrónico
                      </label>
                      <div className="mt-1 relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray6" />
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          className="appearance-none relative block w-full px-3 py-3 border border-gray8 placeholder-gray6 text-blue1 rounded-md focus:outline-none focus:ring-blue8 focus:border-blue8 focus:z-10 text-base font-body"
                          placeholder="correo@ejemplo.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="password" className="block text-base font-medium text-blue1 font-body">
                        Contraseña
                      </label>
                      <div className="mt-1 relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray6" />
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          required
                          value={formData.password}
                          onChange={handleInputChange}
                          className="appearance-none relative block w-full px-3 py-3 border border-gray8 placeholder-gray6 text-blue1 rounded-md focus:outline-none focus:ring-blue8 focus:border-blue8 focus:z-10 text-base font-body"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray6 hover:text-gray4"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue8 hover:bg-blue6 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue8 disabled:opacity-50 disabled:cursor-not-allowed font-body"
                      >
                        {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <div>
                <p className="text-sm text-gray2 font-body">
                  ¿No tienes una cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="font-medium text-blue8 hover:text-blue6 font-body"
                  >
                    Regístrate aquí
                  </button>
                </p>
              </div>
            </div>

            {/* Panel de Bienvenida */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-title font-bold text-blue1 mb-4">
                  ¡Bienvenido a tu plataforma!
                </h2>
                <p className="text-gray2 font-body text-lg">
                  Gestiona tu negocio de manera inteligente y eficiente con nuestras herramientas profesionales.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue8 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-title font-semibold text-blue1 mb-2">Seguridad Garantizada</h3>
                    <p className="text-gray2 font-body">Tus datos están protegidos con encriptación de nivel bancario.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue8 rounded-full flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-title font-semibold text-blue1 mb-2">Acceso Rápido</h3>
                    <p className="text-gray2 font-body">Interfaz intuitiva y eficiente para una gestión ágil.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue8 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-title font-semibold text-blue1 mb-2">Soporte 24/7</h3>
                    <p className="text-gray2 font-body">Nuestro equipo está disponible para ayudarte en cualquier momento.</p>
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