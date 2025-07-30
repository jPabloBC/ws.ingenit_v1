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
import { getProducts } from '@/services/supabase/products';
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, DollarSign, Package, Search } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category_id: string;
  ws_categories?: { name: string };
}

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

export default function QuickSalesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { storeConfig } = useStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [cashReceived, setCashReceived] = useState(0);
  const [stats, setStats] = useState({
    totalProducts: 0,
    availableProducts: 0,
    cartTotal: 0,
    cartItems: 0
  });

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
    const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    setStats(prev => ({
      ...prev,
      cartTotal,
      cartItems
    }));
  }, [cart]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await getProducts();
      const availableProducts = productsData?.filter(p => p.stock > 0) || [];
      setProducts(availableProducts);

      setStats(prev => ({
        ...prev,
        totalProducts: productsData?.length || 0,
        availableProducts: availableProducts.length
      }));
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('No hay suficiente stock');
        return;
      }
      setCart(cart.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.product.price }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, total: product.price }]);
    }
    toast.success(`${product.name} agregado al carrito`);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const item = cart.find(item => item.product.id === productId);
    if (!item) return;

    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (newQuantity > item.product.stock) {
      toast.error('No hay suficiente stock');
      return;
    }

    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.product.price }
        : item
    ));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (paymentMethod === 'cash' && cashReceived < stats.cartTotal) {
      toast.error('El monto recibido es menor al total');
      return;
    }

    try {
      // TODO: Implementar creación de venta
      const saleData = {
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.total
        })),
        total_amount: stats.cartTotal,
        payment_method: paymentMethod,
        cash_received: cashReceived,
        change: paymentMethod === 'cash' ? cashReceived - stats.cartTotal : 0
      };

      console.log('Venta creada:', saleData);
      
      // Limpiar carrito
      setCart([]);
      setCashReceived(0);
      
      toast.success('Venta realizada exitosamente');
      
      // Recargar productos para actualizar stock
      await loadProducts();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al procesar la venta');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           product.ws_categories?.name === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.ws_categories?.name).filter(Boolean)));

  const change = paymentMethod === 'cash' ? cashReceived - stats.cartTotal : 0;

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
            <h1 className="text-2xl font-bold text-gray-900">Ventas Rápidas</h1>
            <p className="text-gray-600">Sistema de venta rápida para botillería</p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <QuickStat
            title="Productos Disponibles"
            value={stats.availableProducts.toString()}
            icon={Package}
            color="blue"
          />
          <QuickStat
            title="Items en Carrito"
            value={stats.cartItems.toString()}
            icon={ShoppingCart}
            color="green"
          />
          <QuickStat
            title="Total Carrito"
            value={formatCurrency(stats.cartTotal)}
            icon={DollarSign}
            color="purple"
          />
          <QuickStat
            title="Total Productos"
            value={stats.totalProducts.toString()}
            icon={Package}
            color="orange"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Productos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Productos Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filtros */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todas las categorías</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Grid de Productos */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="col-span-full flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
                      <p className="text-gray-600">
                        {searchTerm || selectedCategory !== 'all'
                          ? 'No se encontraron productos con los filtros aplicados'
                          : 'No hay productos disponibles'
                        }
                      </p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <Card key={product.id} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-3">
                          <div className="text-center">
                            <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-500 mb-2">
                              {product.ws_categories?.name}
                            </p>
                            <p className="font-bold text-lg text-gray-900 mb-2">
                              {formatCurrency(product.price)}
                            </p>
                            <p className="text-xs text-gray-500 mb-3">
                              Stock: {product.stock}
                            </p>
                            <Button
                              onClick={() => addToCart(product)}
                              size="sm"
                              className="w-full bg-blue-600 hover:bg-blue-700"
                              disabled={product.stock === 0}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Agregar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Carrito */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Carrito de Compras</CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Carrito vacío</h3>
                    <p className="text-gray-600">Agrega productos para comenzar</p>
                  </div>
                ) : (
                  <>
                    {/* Items del carrito */}
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900">{item.product.name}</h4>
                            <p className="text-xs text-gray-500">{formatCurrency(item.product.price)} c/u</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              size="sm"
                              variant="outline"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              size="sm"
                              variant="outline"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              onClick={() => removeFromCart(item.product.id)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatCurrency(item.total)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="border-t pt-4 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold text-lg">{formatCurrency(stats.cartTotal)}</span>
                      </div>
                    </div>

                    {/* Método de pago */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Método de pago:</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setPaymentMethod('cash')}
                          size="sm"
                          variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                          className={paymentMethod === 'cash' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Efectivo
                        </Button>
                        <Button
                          onClick={() => setPaymentMethod('card')}
                          size="sm"
                          variant={paymentMethod === 'card' ? 'default' : 'outline'}
                          className={paymentMethod === 'card' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Tarjeta
                        </Button>
                      </div>
                    </div>

                    {/* Efectivo recibido */}
                    {paymentMethod === 'cash' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Efectivo recibido:
                        </label>
                        <input
                          type="number"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                        {cashReceived > 0 && (
                          <div className="mt-2 text-sm">
                            <p className="text-gray-600">
                              Cambio: <span className="font-medium">{formatCurrency(change)}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Botón de pago */}
                    <Button
                      onClick={handleCheckout}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={cart.length === 0 || (paymentMethod === 'cash' && cashReceived < stats.cartTotal)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Completar Venta
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
} 