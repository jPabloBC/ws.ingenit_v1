'use client';
import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { createSale, generateSaleNumber } from '@/services/supabase/sales';
import toast from 'react-hot-toast';
import SecurityGuard from '@/components/SecurityGuard';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  total: number;
}

export default function NewSalePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      // Implementar carga de productos
      setProducts([]);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };












  const addToCart = (product: Product) => {
    const existing = cart.find(i => i.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('Stock insuficiente');
        return;
      }
      setCart(cart.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.product.price } : i));
    } else {
      setCart([...cart, { product, quantity: 1, total: product.price }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const item = cart.find(i => i.product.id === productId);
    if (!item) return;
    if (quantity <= 0) {
      setCart(cart.filter(i => i.product.id !== productId));
      return;
    }
    if (quantity > item.product.stock) {
      toast.error('Stock insuficiente');
      return;
    }
    setCart(cart.map(i => i.product.id === productId ? { ...i, quantity, total: quantity * i.product.price } : i));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(i => i.product.id !== productId));
  };

  const total = cart.reduce((sum, i) => sum + i.total, 0);

  const handleCreateSale = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    try {
      setSaving(true);
      const saleNumber = await generateSaleNumber();
      console.log('Sale number:', saleNumber);
      const sale = await createSale({
        user_id: user?.id || '',
        total_amount: total,
        payment_method: 'cash',
        status: 'completed',
        items: cart.map(i => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.product.price,
          total_price: i.total
        }))
      });
      if (sale) {
        toast.success('Venta creada correctamente');
        router.push('/sales');
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error('Error al crear la venta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SecurityGuard>
        <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Nueva Venta</h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Productos</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><LoadingSpinner /></div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                    {products.map((p) => (
                      <Card key={p.id} className="hover:shadow-sm cursor-pointer">
                        <CardContent className="p-3">
                          <div className="text-center">
                            <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">{p.name}</h3>
                            <p className="text-xs text-gray-500 mb-2">SKU: {p.sku}</p>
                            <p className="font-bold text-lg text-gray-900 mb-2">{formatCurrency(p.price)}</p>
                            <p className="text-xs text-gray-500 mb-3">Stock: {p.stock}</p>
                            <Button size="sm" onClick={() => addToCart(p)} disabled={p.stock === 0}>
                              <Plus className="h-3 w-3 mr-1" /> Agregar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Carrito</CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Agrega productos para comenzar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <h4 className="font-medium text-sm text-gray-900">{item.product.name}</h4>
                          <p className="text-xs text-gray-500">{formatCurrency(item.product.price)} c/u</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button size="sm" variant="outline" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => removeFromCart(item.product.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">{formatCurrency(item.total)}</p>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold text-lg">{formatCurrency(total)}</span>
                      </div>
                      <Button onClick={handleCreateSale} disabled={saving} className="w-full">
                        <ShoppingCart className="h-4 w-4 mr-2" /> Crear Venta
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  
      </SecurityGuard>);
}







