'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
// Removido: import no usado
interface StoreConfig {
  name: string;
  modules: Array<{
    name: string;
    path: string;
    icon: string;
  }>;
}

interface StoreContextType {
  storeType: string | null;
  storeConfig: StoreConfig | null;
  setStoreType: (type: string) => void;
  clearStoreType: () => void;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};

const storeConfigs: { [key: string]: StoreConfig } = {
  almacen: {
    name: "Almacén General",
    modules: [
      { name: "Dashboard", path: "/dashboard", icon: "Home" },
      { name: "Productos", path: "/inventory", icon: "Package" },
      { name: "Ventas Rápidas", path: "/quick-sales", icon: "ShoppingCart" },
      { name: "Historial de Ventas", path: "/sales", icon: "ShoppingCart" },
      { name: "Stock", path: "/stock", icon: "Box" },
      { name: "Bodega", path: "/warehouse", icon: "Warehouse" },
      { name: "Categorías", path: "/categories", icon: "Folder" },
      { name: "Proveedores", path: "/suppliers", icon: "Truck" },
      { name: "Reportes", path: "/reports", icon: "BarChart" },
      { name: "Configuración", path: "/settings", icon: "Settings" }
    ]
  },
  ferreteria: {
    name: "Ferretería",
    modules: [
      { name: "Dashboard", path: "/dashboard", icon: "Home" },
      { name: "Productos", path: "/inventory", icon: "Package" },
      { name: "Historial de Ventas", path: "/sales", icon: "ShoppingCart" },
      { name: "Clientes", path: "/customers", icon: "Users" },
      { name: "Categorías", path: "/categories", icon: "Folder" },
      { name: "Servicios", path: "/services", icon: "Wrench" },
      { name: "Reparaciones", path: "/repairs", icon: "Clipboard" },
      { name: "Agenda", path: "/calendar", icon: "Calendar" },
      { name: "Proveedores", path: "/suppliers", icon: "Truck" },
      { name: "Reportes", path: "/reports", icon: "BarChart" },
      { name: "Configuración", path: "/settings", icon: "Settings" }
    ]
  },
  libreria: {
    name: "Librería",
    modules: [
      { name: "Dashboard", path: "/dashboard", icon: "Home" },
      { name: "Productos", path: "/inventory", icon: "Package" },
      { name: "Historial de Ventas", path: "/sales", icon: "ShoppingCart" },
      { name: "Clientes", path: "/customers", icon: "Users" },
      { name: "Categorías", path: "/categories", icon: "Folder" },
      { name: "Eventos", path: "/events", icon: "Calendar" },
      { name: "Proveedores", path: "/suppliers", icon: "Truck" },
      { name: "Reportes", path: "/reports", icon: "BarChart" },
      { name: "Configuración", path: "/settings", icon: "Settings" }
    ]
  },
  botilleria: {
    name: "Botillería",
    modules: [
      { name: "Dashboard", path: "/dashboard", icon: "Home" },
      { name: "Productos", path: "/inventory", icon: "Package" },
      { name: "Ventas Rápidas", path: "/quick-sales", icon: "ShoppingCart" },
      { name: "Historial de Ventas", path: "/sales", icon: "ShoppingCart" },
      { name: "Stock", path: "/stock", icon: "Box" },
      { name: "Categorías", path: "/categories", icon: "Folder" },
      { name: "Proveedores", path: "/suppliers", icon: "Truck" },
      { name: "Reportes", path: "/reports", icon: "BarChart" },
      { name: "Configuración", path: "/settings", icon: "Settings" }
    ]
  },
  restaurante: {
    name: "Restaurante",
    modules: [
      { name: "Dashboard", path: "/dashboard", icon: "Home" },
      { name: "Mesas", path: "/tables", icon: "Table" },
      { name: "Menú", path: "/menu", icon: "Utensils" },
      { name: "Órdenes", path: "/orders", icon: "ClipboardList" },
      { name: "Cocina", path: "/kitchen", icon: "ChefHat" },
      { name: "Clientes", path: "/customers", icon: "Users" },
      { name: "Reservas", path: "/reservations", icon: "Calendar" },
      { name: "Reportes", path: "/reports", icon: "BarChart" },
      { name: "Configuración", path: "/settings", icon: "Settings" }
    ]
  }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storeType, setStoreTypeState] = useState<string | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadUserStoreTypes = async () => {
      try {
        // No cargar perfil en la página de registro - el usuario aún no tiene perfil
        if (typeof window !== 'undefined' && window.location.pathname === '/register') {
          setLoading(false);
          return;
        }

        // TODO: Implement profile loading functions
        // For now, set default store type
        const savedStoreType = localStorage.getItem('selectedStoreType') || 'restaurant';
        setStoreTypeState(savedStoreType);
        setStoreConfig(storeConfigs[savedStoreType]);
      } catch (error) {
        console.error('Error loading user store types:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserStoreTypes();
  }, [user]);

  const setStoreType = (type: string) => {
    setStoreTypeState(type);
    setStoreConfig(storeConfigs[type]);
    localStorage.setItem('selectedStoreType', type);
  };

  const clearStoreType = () => {
    setStoreTypeState(null);
    setStoreConfig(null);
    localStorage.removeItem('selectedStoreType');
  };

  const value = {
    storeType,
    storeConfig,
    setStoreType,
    clearStoreType,
    loading
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}; 