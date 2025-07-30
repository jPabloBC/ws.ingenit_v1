'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, User, Store, Wrench, BookOpen, CheckCircle, Info, Crown, Zap, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/services/supabase/client";
import { createFreeSubscription } from "@/services/supabase/subscriptions";
import toast from "react-hot-toast";

interface StoreType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  maxStores: number;
  maxProducts: number;
  maxStockPerProduct: number;
  features: string[];
  color: string;
  popular?: boolean;
}

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const router = useRouter();
  const { signUp, createProfile } = useAuth();

  const storeTypes: StoreType[] = [
    {
      id: "almacen",
      name: "Almacén General",
      description: "Ventas rápidas, control de stock y bodega. Sin registro de clientes.",
      icon: Store,
      color: "blue"
    },
    {
      id: "ferreteria",
      name: "Ferretería",
      description: "Productos variados, clientes registrados, servicios y reparaciones",
      icon: Wrench,
      color: "orange"
    },
    {
      id: "libreria",
      name: "Librería",
      description: "Libros, papelería, eventos y gestión de clientes",
      icon: BookOpen,
      color: "green"
    },
    {
      id: "botilleria",
      name: "Botillería",
      description: "Venta de licores, control de stock y ventas rápidas",
      icon: Store,
      color: "purple"
    },
    {
      id: "restaurante",
      name: "Restaurante",
      description: "Control de mesas, menús, órdenes y cocina",
      icon: Store,
      color: "red"
    }
  ];

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: "free",
      name: "Plan Gratuito",
      price: "Gratis",
      maxStores: 1,
      maxProducts: 5,
      maxStockPerProduct: 3,
      features: [
        "1 tipo de negocio",
        "Máximo 5 productos",
        "Máximo 3 unidades por producto",
        "10 días de prueba",
        "Soporte básico"
      ],
      color: "gray"
    },
    {
      id: "single",
      name: "Single Store",
      price: "$10.000/mes",
      maxStores: 1,
      maxProducts: -1, // Ilimitado
      maxStockPerProduct: -1, // Ilimitado
      features: [
        "1 tipo de negocio",
        "Productos ilimitados",
        "Stock ilimitado",
        "Soporte prioritario",
        "Reportes avanzados"
      ],
      color: "blue"
    },
    {
      id: "double",
      name: "Double Store",
      price: "$15.000/mes",
      maxStores: 2,
      maxProducts: -1,
      maxStockPerProduct: -1,
      features: [
        "2 tipos de negocio",
        "Productos ilimitados",
        "Stock ilimitado",
        "Soporte prioritario",
        "Reportes avanzados"
      ],
      color: "green"
    },
    {
      id: "triple",
      name: "Triple Store",
      price: "$18.000/mes",
      maxStores: 3,
      maxProducts: -1,
      maxStockPerProduct: -1,
      features: [
        "3 tipos de negocio",
        "Productos ilimitados",
        "Stock ilimitado",
        "Soporte prioritario",
        "Reportes avanzados"
      ],
      color: "purple"
    },
    {
      id: "quad",
      name: "Quad Store",
      price: "$22.000/mes",
      maxStores: 4,
      maxProducts: -1,
      maxStockPerProduct: -1,
      features: [
        "4 tipos de negocio",
        "Productos ilimitados",
        "Stock ilimitado",
        "Soporte prioritario",
        "Reportes avanzados"
      ],
      color: "orange"
    },
    {
      id: "full",
      name: "Full Access",
      price: "$25.000/mes",
      maxStores: -1, // Ilimitado
      maxProducts: -1,
      maxStockPerProduct: -1,
      features: [
        "Tipos de negocio ilimitados",
        "Productos ilimitados",
        "Stock ilimitado",
        "Soporte VIP",
        "Reportes avanzados",
        "Integración con WebPay"
      ],
      color: "red",
      popular: true
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleStoreToggle = (storeId: string) => {
    // Solo permitir una store en la versión gratuita
    setSelectedStores([storeId]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting registration process...');
      console.log('Form data:', formData);
      console.log('Selected stores:', selectedStores);

      // Validaciones
      if (formData.password !== formData.confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }

      if (selectedStores.length === 0) {
        toast.error("Debes seleccionar un tipo de negocio");
        return;
      }

      if (selectedStores.length > 1) {
        toast.error("En la versión gratuita solo puedes seleccionar un tipo de negocio");
        return;
      }

      // PRIMERO: Crear cuenta en Supabase Auth
      console.log('Creating Supabase Auth account...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            store_types: selectedStores
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        toast.error("Error al crear la cuenta: " + authError.message);
        return;
      }

      if (!authData.user) {
        toast.error("Error: No se pudo crear el usuario");
        return;
      }

      console.log('Auth account created successfully:', authData.user.id);

      // SEGUNDO: Crear perfil en ws_profiles
      console.log('Creating profile in ws_profiles...');
      const { error: profileError } = await createProfile({
        user_id: authData.user.id,
        name: formData.name,
        email: formData.email,
        store_types: selectedStores
      });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        console.error("Profile error details:", {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        });
        toast.error("Error al crear el perfil: " + profileError.message);
        return;
      }

      console.log('Profile created successfully');

      // TERCERO: Crear suscripción gratuita
      console.log('Creating free subscription...');
      const { error: subscriptionError } = await createFreeSubscription(authData.user.id);
      
      if (subscriptionError) {
        console.error("Error creating subscription:", subscriptionError);
        toast.error("Error al crear la suscripción gratuita");
        return;
      }

      console.log('Free subscription created successfully');
      toast.success("¡Cuenta creada exitosamente! Tienes 10 días de prueba gratuita. Revisa tu email para confirmar.");
      router.push("/login");
    } catch (error: any) {
      console.error("Error during registration:", error);
      toast.error(error.message || "Error al crear la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "border-blue-200 hover:border-blue-300 bg-blue-50 hover:bg-blue-100";
      case "orange":
        return "border-orange-200 hover:border-orange-300 bg-orange-50 hover:bg-orange-100";
      case "green":
        return "border-green-200 hover:border-green-300 bg-green-50 hover:bg-green-100";
      case "purple":
        return "border-purple-200 hover:border-purple-300 bg-purple-50 hover:bg-purple-100";
      case "red":
        return "border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100";
      default:
        return "border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100";
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case "blue":
        return "text-blue-600";
      case "orange":
        return "text-orange-600";
      case "green":
        return "text-green-600";
      case "purple":
        return "text-purple-600";
      case "red":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getPlanColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "border-blue-200 bg-blue-50";
      case "orange":
        return "border-orange-200 bg-orange-50";
      case "green":
        return "border-green-200 bg-green-50";
      case "purple":
        return "border-purple-200 bg-purple-50";
      case "red":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear Cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Regístrate y selecciona el tipo de negocio que necesitas
          </p>
        </div>

        {/* Información sobre Planes */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <Info className="h-5 w-5 mr-2" />
              Información sobre Planes de Suscripción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-yellow-700 mb-4">
                <strong>Plan Gratuito:</strong> Incluye 1 tipo de negocio, máximo 5 productos y 3 unidades por producto. 
                Después de 10 días, puedes actualizar a un plan de pago para acceder a más funcionalidades.
              </p>
              <button
                type="button"
                onClick={() => setShowPlans(!showPlans)}
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
              >
                {showPlans ? "Ocultar" : "Ver"} todos los planes
                <Zap className="ml-2 h-4 w-4" />
              </button>
            </div>

            {showPlans && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {subscriptionPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`${getPlanColorClasses(plan.color)} ${
                      plan.popular ? 'ring-2 ring-yellow-400' : ''
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-gray-900">
                          {plan.name}
                        </CardTitle>
                        {plan.popular && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Crown className="h-3 w-3 mr-1" />
                            Popular
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {plan.price}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      {plan.id === 'free' && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="text-sm text-blue-800">
                              <strong>Limitaciones:</strong> 1 negocio, 5 productos, 3 stock por producto
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nombre Completo
                </label>
                <div className="mt-1 relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="appearance-none relative block w-full px-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Tu nombre completo"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Correo Electrónico
                </label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="appearance-none relative block w-full px-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="appearance-none relative block w-full px-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Contraseña
                </label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="appearance-none relative block w-full px-10 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selección de Tipos de Negocio */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Negocio</CardTitle>
              <p className="text-sm text-gray-600">
                Selecciona el tipo de negocio que necesitas gestionar (solo uno en versión gratuita)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {storeTypes.map((store) => (
                  <Card
                    key={store.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedStores.includes(store.id)
                        ? "ring-2 ring-blue-500 scale-105"
                        : ""
                    } ${getColorClasses(store.color)}`}
                    onClick={() => handleStoreToggle(store.id)}
                  >
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <div className="p-4 rounded-full bg-white shadow-lg">
                          <store.icon className={`h-8 w-8 ${getIconColor(store.color)}`} />
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900">
                        {store.name}
                      </CardTitle>
                      <p className="text-gray-600 mt-2 text-sm">{store.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        {selectedStores.includes(store.id) ? (
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Seleccionado
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
                            No seleccionado
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Botón de Registro */}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading || selectedStores.length === 0}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creando cuenta..." : "Crear Cuenta Gratuita"}
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Al crear tu cuenta, aceptas comenzar con el plan gratuito que incluye limitaciones.
              Puedes actualizar a un plan de pago en cualquier momento desde tu dashboard.
            </p>
          </div>

          {/* Link a Login */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Inicia sesión
              </button>
            </p>
          </div>

          {/* Debug Info */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              ¿Problemas? Visita{" "}
              <button
                type="button"
                onClick={() => router.push("/fix-database")}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                /fix-database
              </button>{" "}
              para arreglar la base de datos,{" "}
              <button
                type="button"
                onClick={() => router.push("/setup")}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                /setup
              </button>{" "}
              para configuración automática o{" "}
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                /admin
              </button>{" "}
              para diagnosticar
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 