'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, Wrench, BookOpen, CheckCircle, AlertTriangle, Crown, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/services/supabase/client";
import { canAddStore, getSubscription, getUsage } from "@/services/supabase/subscriptions";
import toast from "react-hot-toast";

interface StoreType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function StoreSelector() {
  const [availableStores, setAvailableStores] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { setStoreType } = useStore();

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

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        
        // Cargar datos en paralelo
        const [profileResult, subscriptionResult, usageResult] = await Promise.all([
          supabase
            .from('ws_profiles')
            .select('store_types')
            .eq('email', user.email)
            .single(),
          getSubscription(user.id),
          getUsage(user.id)
        ]);

        if (profileResult.error) {
          console.error('Error fetching user stores:', profileResult.error);
          toast.error('Error al cargar los tipos de negocio');
        } else if (profileResult.data?.store_types) {
          setAvailableStores(profileResult.data.store_types);
        }

        if (subscriptionResult.data) {
          setSubscription(subscriptionResult.data);
        }

        if (usageResult.data) {
          setUsage(usageResult.data);
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, router]);

  const handleStoreSelect = async (storeId: string) => {
    if (!user) return;

    // Verificar si ya tiene este tipo de tienda
    if (availableStores.includes(storeId)) {
      setStoreType(storeId);
      toast.success(`Has seleccionado: ${storeTypes.find(s => s.id === storeId)?.name}`);
      router.push('/dashboard');
      return;
    }

    // Verificar límites de suscripción
    const { can, error } = await canAddStore(user.id);
    if (!can) {
      toast.error(error || 'No puedes agregar más tiendas');
      router.push('/subscription');
      return;
    }

    // Agregar nuevo tipo de tienda
    try {
      const newStoreTypes = [...availableStores, storeId];
      const { error: updateError } = await supabase
        .from('ws_profiles')
        .update({ store_types: newStoreTypes })
        .eq('email', user.email);

      if (updateError) {
        console.error('Error updating store types:', updateError);
        toast.error('Error al agregar el tipo de negocio');
        return;
      }

      setAvailableStores(newStoreTypes);
      setStoreType(storeId);
      toast.success(`Has agregado: ${storeTypes.find(s => s.id === storeId)?.name}`);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al agregar el tipo de negocio');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tipos de negocio...</p>
        </div>
      </div>
    );
  }

  const filteredStores = storeTypes.filter(store => availableStores.includes(store.id));
  const availableToAdd = storeTypes.filter(store => !availableStores.includes(store.id));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Selecciona tu Negocio
          </h2>
          <p className="text-lg text-gray-600">
            Elige el tipo de negocio que quieres gestionar
          </p>
        </div>

        {/* Información de suscripción */}
        {subscription && usage && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Plan: {subscription.plan === 'free' ? 'Gratuito' : subscription.plan}
                </h3>
                <p className="text-sm text-gray-600">
                  Tiendas: {usage.current_stores} / {subscription.max_stores === -1 ? '∞' : subscription.max_stores}
                </p>
              </div>
              {subscription.plan === 'free' && !usage.is_trial_active && (
                <div className="flex items-center text-orange-600">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">Período de prueba expirado</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tiendas actuales */}
        {filteredStores.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Tus Negocios Actuales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredStores.map((storeId) => {
                const store = storeTypes.find(s => s.id === storeId);
                if (!store) return null;
                
                return (
                  <Card
                    key={store.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${getColorClasses(store.color)}`}
                    onClick={() => handleStoreSelect(store.id)}
                  >
                    <CardHeader className="text-center">
                      <div className="flex justify-center mb-4">
                        <div className="p-6 rounded-full bg-white shadow-lg">
                          <store.icon className={`h-12 w-12 ${getIconColor(store.color)}`} />
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-bold text-gray-900">
                        {store.name}
                      </CardTitle>
                      <p className="text-gray-600 mt-2">{store.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activo
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Tiendas disponibles para agregar */}
        {availableToAdd.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Agregar Nuevo Negocio</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availableToAdd.map((store) => (
                <Card
                  key={store.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${getColorClasses(store.color)}`}
                  onClick={() => handleStoreSelect(store.id)}
                >
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-6 rounded-full bg-white shadow-lg">
                        <store.icon className={`h-12 w-12 ${getIconColor(store.color)}`} />
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">
                      {store.name}
                    </CardTitle>
                    <p className="text-gray-600 mt-2">{store.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {filteredStores.length === 0 && availableToAdd.length === 0 && (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              No tienes tipos de negocio configurados. Contacta con soporte.
            </p>
            <button
              onClick={() => router.push('/register')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Configurar Negocio
            </button>
          </div>
        )}

        {/* Información de límites */}
        {subscription?.plan === 'free' && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Plan Gratuito - Límites Aplicados
                </p>
                <p className="text-sm text-yellow-700">
                  Solo puedes tener 1 tipo de negocio, 5 productos máximo y 3 unidades por producto. 
                  <button 
                    onClick={() => router.push('/subscription')}
                    className="ml-1 underline hover:no-underline"
                  >
                    Actualiza tu plan
                  </button> para eliminar estos límites.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 