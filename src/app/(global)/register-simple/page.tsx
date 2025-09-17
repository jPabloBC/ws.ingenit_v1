'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/services/supabase/client';
import toast from 'react-hot-toast';

export default function RegisterSimple() {
  const [currentStep, setCurrentStep] = useState<'basic' | 'verification' | 'business'>('basic');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    country: "Chile"
  });
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const router = useRouter();

  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            phone: formData.phone,
            country: formData.country
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        toast.success("¡Cuenta creada! Revisa tu email para verificar.");
        setCurrentStep('verification');
      }
    } catch (error) {
      toast.error("Error creando la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user?.email) {
        toast.error("No hay usuario autenticado");
        return;
      }
      
      const { data: verificationData, error: verificationError } = await supabase
        .from('ws_email_verifications')
        .select('verified')
        .eq('email', user.email.toLowerCase())
        .maybeSingle();

      if (verificationError) {
        toast.error("Error verificando el email");
        return;
      }

      if (verificationData?.verified) {
        toast.success("¡Email verificado! Continuando...");
        setCurrentStep('business');
      } else {
        toast.error("El email aún no ha sido verificado. Revisa tu correo.");
      }
    } catch (error) {
      toast.error("Error verificando el email");
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error("No hay usuario autenticado");
        return;
      }

      const { error } = await supabase
        .from('ws_users')
        .update({
          store_types: selectedStores,
          email_verified: true
        })
        .eq('email', user.email);

      if (error) {
        toast.error("Error guardando configuración");
        return;
      }

      toast.success("¡Configuración completada! Redirigiendo...");
      router.push('/dashboard');
    } catch (error) {
      toast.error("Error completando configuración");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Registro</h1>
        </div>

        {currentStep === 'basic' && (
          <form onSubmit={handleBasicSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? "Creando cuenta..." : "Crear Cuenta"}
            </button>
          </form>
        )}

        {currentStep === 'verification' && (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Verifica tu Email</h2>
            <p className="text-gray-600 mb-6">
              Hemos enviado un enlace de verificación a tu email. 
              Haz clic en el enlace y luego presiona el botón de abajo.
            </p>
            <button
              onClick={handleCheckVerification}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Ya verifiqué mi correo
            </button>
          </div>
        )}

        {currentStep === 'business' && (
          <form onSubmit={handleBusinessSubmit} className="space-y-6">
            <h2 className="text-xl font-semibold">Selecciona tu tipo de negocio</h2>
            
            <div className="space-y-2">
              {['almacen', 'restaurante', 'retail'].map((store) => (
                <label key={store} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedStores.includes(store)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStores([...selectedStores, store]);
                      } else {
                        setSelectedStores(selectedStores.filter(s => s !== store));
                      }
                    }}
                    className="mr-2"
                  />
                  {store.charAt(0).toUpperCase() + store.slice(1)}
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || selectedStores.length === 0}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Completar Registro"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}