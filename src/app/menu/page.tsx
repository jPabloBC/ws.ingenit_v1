'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import QuickStat from '@/components/ui/QuickStat';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';
import { Utensils, Plus, Search, Filter, Edit, Trash2, Eye } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
  preparation_time: number;
  image_url?: string;
  allergens?: string[];
  nutritional_info?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function MenuPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { storeConfig } = useStore();
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');
  const [stats, setStats] = useState({
    totalItems: 0,
    available: 0,
    unavailable: 0,
    categories: 0,
    averagePrice: 0
  });

  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setLoading(true);
      // TODO: Implementar servicio de menú
      // Por ahora usamos datos de ejemplo
      const mockMenuItems: MenuItem[] = [
        {
          id: '1',
          name: 'Pasta Carbonara',
          description: 'Pasta con salsa cremosa, panceta y queso parmesano',
          price: 12000,
          category: 'Pasta',
          is_available: true,
          preparation_time: 15,
          image_url: '/images/carbonara.jpg',
          allergens: ['Gluten', 'Lácteos'],
          nutritional_info: { calories: 450, protein: 15, carbs: 60, fat: 18 }
        },
        {
          id: '2',
          name: 'Ensalada César',
          description: 'Lechuga romana, crutones, parmesano y aderezo César',
          price: 8500,
          category: 'Ensaladas',
          is_available: true,
          preparation_time: 8,
          image_url: '/images/cesar.jpg',
          allergens: ['Gluten', 'Huevos'],
          nutritional_info: { calories: 280, protein: 12, carbs: 15, fat: 22 }
        },
        {
          id: '3',
          name: 'Pizza Margherita',
          description: 'Pizza tradicional con tomate, mozzarella y albahaca',
          price: 15000,
          category: 'Pizza',
          is_available: false,
          preparation_time: 20,
          image_url: '/images/margherita.jpg',
          allergens: ['Gluten', 'Lácteos'],
          nutritional_info: { calories: 320, protein: 14, carbs: 45, fat: 12 }
        },
        {
          id: '4',
          name: 'Tiramisú',
          description: 'Postre italiano con café, mascarpone y cacao',
          price: 6500,
          category: 'Postres',
          is_available: true,
          preparation_time: 5,
          image_url: '/images/tiramisu.jpg',
          allergens: ['Huevos', 'Lácteos'],
          nutritional_info: { calories: 380, protein: 8, carbs: 35, fat: 22 }
        }
      ];
      
      setMenuItems(mockMenuItems);

      // Calcular estadísticas
      const available = mockMenuItems.filter(item => item.is_available).length;
      const unavailable = mockMenuItems.filter(item => !item.is_available).length;
      const categories = new Set(mockMenuItems.map(item => item.category)).size;
      const averagePrice = mockMenuItems.reduce((sum, item) => sum + item.price, 0) / mockMenuItems.length;

      setStats({
        totalItems: mockMenuItems.length,
        available,
        unavailable,
        categories,
        averagePrice
      });
    } catch (error) {
      console.error('Error loading menu:', error);
      toast.error('Error al cargar el menú');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este plato del menú?')) {
      return;
    }

    try {
      // TODO: Implementar eliminación
      setMenuItems(menuItems.filter(item => item.id !== itemId));
      toast.success('Plato eliminado del menú');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el plato');
    }
  };

  const handleToggleAvailability = async (itemId: string) => {
    try {
      setMenuItems(menuItems.map(item => 
        item.id === itemId 
          ? { ...item, is_available: !item.is_available }
          : item
      ));
      toast.success('Disponibilidad actualizada');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar disponibilidad');
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesAvailability = filterAvailability === 'all' || 
                               (filterAvailability === 'available' && item.is_available) ||
                               (filterAvailability === 'unavailable' && !item.is_available);
    
    return matchesSearch && matchesCategory && matchesAvailability;
  });

  const categories = Array.from(new Set(menuItems.map(item => item.category)));

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Menú</h1>
            <p className="text-gray-600">Administra los platos y bebidas del restaurante</p>
          </div>
          <Button
            onClick={() => router.push('/menu/add')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Plato
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <QuickStat
            title="Total Platos"
            value={stats.totalItems.toString()}
            icon={Utensils}
            color="blue"
          />
          <QuickStat
            title="Disponibles"
            value={stats.available.toString()}
            icon={Utensils}
            color="green"
          />
          <QuickStat
            title="No Disponibles"
            value={stats.unavailable.toString()}
            icon={Utensils}
            color="red"
          />
          <QuickStat
            title="Categorías"
            value={stats.categories.toString()}
            icon={Utensils}
            color="purple"
          />
          <QuickStat
            title="Precio Promedio"
            value={formatCurrency(stats.averagePrice)}
            icon={Utensils}
            color="orange"
          />
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar platos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  value={filterAvailability}
                  onChange={(e) => setFilterAvailability(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los estados</option>
                  <option value="available">Disponibles</option>
                  <option value="unavailable">No disponibles</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Platos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay platos</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterCategory !== 'all' || filterAvailability !== 'all'
                  ? 'No se encontraron platos con los filtros aplicados'
                  : 'Aún no se han agregado platos al menú'
                }
              </p>
              <Button
                onClick={() => router.push('/menu/add')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primer Plato
              </Button>
            </div>
          ) : (
            filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <p className="text-sm text-gray-600">{item.category}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.is_available ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-lg text-gray-900">
                      {formatCurrency(item.price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {item.preparation_time} min
                    </span>
                  </div>

                  {item.allergens && item.allergens.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Alérgenos:</p>
                      <div className="flex flex-wrap gap-1">
                        {item.allergens.map(allergen => (
                          <span key={allergen} className="inline-flex px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => router.push(`/menu/edit/${item.id}`)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleToggleAvailability(item.id)}
                      size="sm"
                      variant={item.is_available ? "outline" : "default"}
                      className={item.is_available ? "text-red-600" : "bg-green-600 hover:bg-green-700"}
                    >
                      {item.is_available ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button
                      onClick={() => handleDeleteItem(item.id)}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
} 