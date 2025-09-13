'use client';
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        console.log('Login error:', error);
        if (error.message === 'EMAIL_NOT_VERIFIED') {
          // Usuario no ha verificado email, redirigir al registro para verificar
          toast("Debes verificar tu email. Redirigiendo...", { icon: 'ℹ️' });
          setTimeout(() => {
            router.push("/register?step=verification");
          }, 1000);
        } else {
          toast.error("Error al iniciar sesión: " + error.message);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue15 to-blue13">
      <Header />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-title font-extrabold text-blue1">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray2 font-body">
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
                <label htmlFor="email" className="block text-sm font-medium text-blue1 font-body">
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
                    className="appearance-none relative block w-full px-10 py-2 border border-gray8 placeholder-gray6 text-blue1 rounded-md focus:outline-none focus:ring-blue8 focus:border-blue8 focus:z-10 sm:text-sm font-body"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-blue1 font-body">
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
                    className="appearance-none relative block w-full px-10 py-2 border border-gray8 placeholder-gray6 text-blue1 rounded-md focus:outline-none focus:ring-blue8 focus:border-blue8 focus:z-10 sm:text-sm font-body"
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

        <div className="text-center">
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
      </div>
      <Footer />
    </div>
  );
} 