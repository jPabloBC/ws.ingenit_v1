'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { businessesService, Business } from '@/services/supabase/businesses';

interface StoreConfig {
  name: string;
  type: string;
  modules: Array<{
    name: string;
    path: string;
    icon: string;
  }>;
}

interface StoreContextType {
  storeType: string | null;
  storeConfig: StoreConfig | null;
  currentBusiness: Business | null;
  userBusinesses: Business[];
  setStoreType: (type: string) => void;
  setCurrentBusiness: (business: Business) => void;
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
  retail: {
    name: "Retail / Tienda",
    type: "retail",
    modules: [
      { name: "Dashboard", path: "/dashboard", icon: "Home" },
      { name: "Productos", path: "/inventory", icon: "Package" },
      { name: "Ventas Rápidas", path: "/quick-sales", icon: "ShoppingCart" },
      { name: "Historial de Ventas", path: "/sales", icon: "ShoppingCart" },
      { name: "Stock", path: "/stock", icon: "Box" },
      { name: "Bodega", path: "/warehouse", icon: "Warehouse" },
      { name: "Categorías", path: "/categories", icon: "Folder" },
      { name: "Clientes", path: "/customers", icon: "Users" },
      { name: "Proveedores", path: "/suppliers", icon: "Truck" },
      { name: "Reportes", path: "/reports", icon: "BarChart" },
      { name: "Pagos", path: "/payment", icon: "FileText" },
    ]
  },
  services: {
    name: "Servicios",
    type: "services",
    modules: [
      { name: "Dashboard", path: "/dashboard", icon: "Home" },
      { name: "Servicios", path: "/services", icon: "Wrench" },
      { name: "Órdenes", path: "/orders", icon: "ClipboardList" },
      { name: "Agenda", path: "/calendar", icon: "Calendar" },
      { name: "Clientes", path: "/customers", icon: "Users" },
      { name: "Reportes", path: "/reports", icon: "BarChart" },
      { name: "Pagos", path: "/payment", icon: "FileText" },
    ]
  },
  ecommerce: {
    name: "E-commerce",
    type: "ecommerce",
    modules: [
      { name: "Dashboard", path: "/dashboard", icon: "Home" },
      { name: "Productos", path: "/inventory", icon: "Package" },
      { name: "Pedidos", path: "/orders", icon: "ClipboardList" },
      { name: "Clientes", path: "/customers", icon: "Users" },
      { name: "Categorías", path: "/categories", icon: "Folder" },
      { name: "Reportes", path: "/reports", icon: "BarChart" },
      { name: "Pagos", path: "/payment", icon: "FileText" },
    ]
  },
  other: {
    name: "Otro",
    type: "other",
    modules: [
      { name: "Dashboard", path: "/dashboard", icon: "Home" },
      { name: "Productos", path: "/inventory", icon: "Package" },
      { name: "Clientes", path: "/customers", icon: "Users" },
      { name: "Reportes", path: "/reports", icon: "BarChart" },
      { name: "Pagos", path: "/payment", icon: "FileText" },
    ]
  },
  almacen: {
    name: "Almacén General",
    type: "almacen",
    modules: [
      { name: "Dashboard", path: "/dashboard", icon: "Home" },
      { name: "Productos", path: "/inventory", icon: "Package" },
      { name: "Ventas Rápidas", path: "/quick-sales", icon: "ShoppingCart" },
      { name: "Historial de Ventas", path: "/sales", icon: "ShoppingCart" },
      { name: "Stock", path: "/stock", icon: "Box" },
      { name: "Bodega", path: "/warehouse", icon: "Warehouse" },
      { name: "Categorías", path: "/categories", icon: "Folder" },
      { name: "Clientes", path: "/customers", icon: "Users" },
      { name: "Proveedores", path: "/suppliers", icon: "Truck" },
      { name: "Reportes", path: "/reports", icon: "BarChart" },
      { name: "Pagos", path: "/payment", icon: "FileText" },
    ]
  },
  ferreteria: {
    name: "Ferretería",
    type: "ferreteria",
    modules: [
      { name: "Dashboard", path: "/dashboard", icon: "Home" },
      { name: "Productos", path: "/inventory", icon: "Package" },
      { name: "Historial de Ventas", path: "/sales", icon: "ShoppingCart" },
      { name: "Stock", path: "/stock", icon: "Box" },
      { name: "Bodega", path: "/warehouse", icon: "Warehouse" },
      { name: "Categorías", path: "/categories", icon: "Folder" },
      { name: "Clientes", path: "/customers", icon: "Users" },
      { name: "Servicios", path: "/services", icon: "Wrench" },
      { name: "Reparaciones", path: "/repairs", icon: "Clipboard" },
      { name: "Agenda", path: "/calendar", icon: "Calendar" },
      { name: "Proveedores", path: "/suppliers", icon: "Truck" },
      { name: "Reportes", path: "/reports", icon: "BarChart" },
      { name: "Pagos", path: "/payment", icon: "FileText" },
    ]
  },
  libreria: {
    name: "Librería",
    type: "libreria",
    modules: [
      { name: "Dashboard", path: "/dashboard", icon: "Home" },
      { name: "Productos", path: "/inventory", icon: "Package" },
      { name: "Historial de Ventas", path: "/sales", icon: "ShoppingCart" },
      { name: "Stock", path: "/stock", icon: "Box" },
      { name: "Bodega", path: "/warehouse", icon: "Warehouse" },
      { name: "Categorías", path: "/categories", icon: "Folder" },
      { name: "Clientes", path: "/customers", icon: "Users" },
      { name: "Eventos", path: "/events", icon: "Calendar" },
      { name: "Agenda", path: "/calendar", icon: "Calendar" },
      { name: "Proveedores", path: "/suppliers", icon: "Truck" },
      { name: "Reportes", path: "/reports", icon: "BarChart" },
      { name: "Pagos", path: "/payment", icon: "FileText" },
    ]
  },
  botilleria: {
    name: "Botillería",
    type: "botilleria",
    modules: [
      { name: "Dashboard", path: "/dashboard", icon: "Home" },
      { name: "Productos", path: "/inventory", icon: "Package" },
      { name: "Ventas Rápidas", path: "/quick-sales", icon: "ShoppingCart" },
      { name: "Historial de Ventas", path: "/sales", icon: "ShoppingCart" },
      { name: "Stock", path: "/stock", icon: "Box" },
      { name: "Bodega", path: "/warehouse", icon: "Warehouse" },
      { name: "Categorías", path: "/categories", icon: "Folder" },
      { name: "Clientes", path: "/customers", icon: "Users" },
      { name: "Proveedores", path: "/suppliers", icon: "Truck" },
      { name: "Reportes", path: "/reports", icon: "BarChart" },
      { name: "Pagos", path: "/payment", icon: "FileText" },
    ]
  },
  restaurante: {
    name: "Restaurante",
    type: "restaurante",
    modules: [
      { name: "Dashboard", path: "/dashboard", icon: "Home" },
      { name: "Mesas", path: "/tables", icon: "Table" },
      { name: "Menú", path: "/menu", icon: "Utensils" },
      { name: "Órdenes", path: "/orders", icon: "ClipboardList" },
      { name: "Cocina", path: "/kitchen", icon: "ChefHat" },
      { name: "Clientes", path: "/customers", icon: "Users" },
      { name: "Reservas", path: "/reservations", icon: "Calendar" },
      { name: "Stock", path: "/stock", icon: "Box" },
      { name: "Bodega", path: "/warehouse", icon: "Warehouse" },
      { name: "Categorías", path: "/categories", icon: "Folder" },
      { name: "Proveedores", path: "/suppliers", icon: "Truck" },
      { name: "Reportes", path: "/reports", icon: "BarChart" },
      { name: "Pagos", path: "/payment", icon: "FileText" },
    ]
  }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storeType, setStoreTypeState] = useState<string | null>(null);
  const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null);
  const [currentBusiness, setCurrentBusinessState] = useState<Business | null>(null);
  const [userBusinesses, setUserBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedBusinesses, setHasLoadedBusinesses] = useState(false);
  const loadingRef = React.useRef<{userId:string|null, loading:boolean}>({userId:null, loading:false});
  const { user } = useAuth();

  // Resetear estado cuando cambie el usuario
  useEffect(() => {
    setHasLoadedBusinesses(false);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    if (loadingRef.current.loading && loadingRef.current.userId === user.id) {
      return; // ya en curso
    }
    if (hasLoadedBusinesses) return; // ya cargado

    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/register')) {
      setLoading(false);
      setHasLoadedBusinesses(true);
      return;
    }

    loadingRef.current = { userId: user.id, loading: true };

    (async () => {
      try {
        const businesses = await businessesService.getUserBusinesses(user.id);
        setUserBusinesses(businesses);
        if (businesses.length > 0) {
          const savedBusinessId = localStorage.getItem('selectedBusinessId');
          const selectedBusiness = savedBusinessId
            ? businesses.find(b => b.id === savedBusinessId) || businesses[0]
            : businesses[0];
          const resolvedKey = storeConfigs[selectedBusiness.store_type] ? selectedBusiness.store_type : 'almacen';
          if (!storeConfigs[selectedBusiness.store_type]) {
            console.warn('[StoreContext] store_type sin config definida:', selectedBusiness.store_type, ' -> usando almacen');
          }
          setCurrentBusinessState(selectedBusiness);
          setStoreTypeState(resolvedKey);
          setStoreConfig(storeConfigs[resolvedKey]);
          localStorage.setItem('selectedBusinessId', selectedBusiness.id);
          localStorage.setItem('selectedStoreType', resolvedKey);
        } else {
          const savedStoreType = localStorage.getItem('selectedStoreType') || 'almacen';
          setStoreTypeState(savedStoreType);
          setStoreConfig(storeConfigs[savedStoreType]);
        }
      } catch (error) {
        const savedStoreType = localStorage.getItem('selectedStoreType') || 'almacen';
        setStoreTypeState(savedStoreType);
        setStoreConfig(storeConfigs[savedStoreType]);
      } finally {
        setLoading(false);
        setHasLoadedBusinesses(true);
        loadingRef.current = { userId: user.id, loading: false };
      }
    })();
  }, [user?.id, hasLoadedBusinesses]);

  const setStoreType = (type: string) => {
    setStoreTypeState(type);
    setStoreConfig(storeConfigs[type]);
    localStorage.setItem('selectedStoreType', type);
    
    // Si hay negocios disponibles, encontrar uno del tipo seleccionado
    const businessOfType = userBusinesses.find(b => b.store_type === type);
    if (businessOfType) {
      setCurrentBusinessState(businessOfType);
      localStorage.setItem('selectedBusinessId', businessOfType.id);
    }
  };

  const setCurrentBusiness = (business: Business) => {
    setCurrentBusinessState(business);
    setStoreTypeState(business.store_type);
    setStoreConfig(storeConfigs[business.store_type]);
    localStorage.setItem('selectedBusinessId', business.id);
    localStorage.setItem('selectedStoreType', business.store_type);
  };

  const clearStoreType = () => {
    setStoreTypeState(null);
    setStoreConfig(null);
    setCurrentBusinessState(null);
    localStorage.removeItem('selectedStoreType');
    localStorage.removeItem('selectedBusinessId');
  };

  const value = {
    storeType,
    storeConfig,
    currentBusiness,
    userBusinesses,
    setStoreType,
    setCurrentBusiness,
    clearStoreType,
    loading
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}; 