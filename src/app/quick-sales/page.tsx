'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, DollarSign, CreditCard, Package, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import QuickStat from '@/components/ui/QuickStat';
import { useAuth } from '@/contexts/AuthContext';
import { createSale } from '@/services/supabase/sales';
import TransbankService from '@/services/payments/transbank';
import { electronicInvoiceService, siiCommunicationService } from '@/services/supabase/sii';
import CurrencyInput from '@/components/ui/CurrencyInput';
import toast from 'react-hot-toast';
import SecurityGuard from '@/components/SecurityGuard';

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

interface UserProfile {
  country_code?: string | null;
  currency_code?: string | null;
}

// Tasas de IVA por país
const VAT_RATES: { [key: string]: number } = {
  'CL': 0.19, // Chile: 19%
  'BO': 0.13, // Bolivia: 13%
  'AR': 0.21, // Argentina: 21%
  'PE': 0.18, // Perú: 18%
  'CO': 0.19, // Colombia: 19%
  'MX': 0.16, // México: 16%
  'ES': 0.21, // España: 21%
  'US': 0.00, // Estados Unidos: varía por estado
};

export default function QuickSalesPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [cashReceived, setCashReceived] = useState<number | undefined>(undefined);
  const [barcode, setBarcode] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    availableProducts: 0,
    cartTotal: 0,
    cartItems: 0,
    subtotal: 0,
    vat: 0,
    totalWithVat: 0
  });

  useEffect(() => {
    if (!user) return;
    loadProducts();
    loadUserProfile();
  }, [user]);

  // Recargar datos cuando la página se vuelve visible o se recarga manualmente
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('Página visible, recargando quick-sales...');
        loadProducts();
        loadUserProfile();
      }
    };

    const handleBeforeUnload = () => {
      console.log('Página se va a recargar, limpiando estado...');
      setProducts([]);
      setCart([]);
      setLoading(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  useEffect(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const vatRate = userProfile?.country_code ? VAT_RATES[userProfile.country_code] || 0 : 0;
    const vat = subtotal * vatRate;
    const totalWithVat = subtotal + vat;
    const cartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    setStats(prev => ({
      ...prev,
      subtotal,
      vat,
      totalWithVat,
      cartTotal: totalWithVat,
      cartItems
    }));
  }, [cart, userProfile]);

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

  const loadUserProfile = async () => {
    try {
      // Implementar carga de perfil de usuario
      setUserProfile({ country_code: 'CL', currency_code: 'CLP' });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };












  // Removido: función no usada



































































  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.product.price }
            : item
        );
      } else {
        return [...prevCart, {
          product,
          quantity: 1,
          total: product.price
        }];
      }
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (!product || newQuantity > product.stock) {
      toast.error('Cantidad no disponible');
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity, total: newQuantity * item.product.price }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const handleScan = () => {
    if (!barcode.trim()) return;
    
    const product = products.find(p => p.sku === barcode.trim());
    if (product) {
      addToCart(product);
      setBarcode('');
      toast.success(`Producto agregado: ${product.name}`);
    } else {
      toast.error('Producto no encontrado');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }

    if (paymentMethod === 'cash') {
      if (!cashReceived || cashReceived < stats.totalWithVat) {
        toast.error('El monto recibido es menor al total');
        return;
      }

              try {
          // Crear la venta
          const saleResult = await createSale({
            user_id: user!.id,
            customer_id: undefined, // Venta anónima para efectivo
            total_amount: stats.totalWithVat,
            payment_method: paymentMethod,
            status: 'completed',
            notes: 'Venta en efectivo',
            items: cart.map(item => ({
              product_id: item.product.id,
              quantity: item.quantity,
              unit_price: item.product.price,
              total_price: item.total
            }))
          });

          if (saleResult.success) {
            // Generar boleta electrónica para efectivo
            await generateCashInvoice(saleResult.data!.id);
            
            setCart([]);
            setCashReceived(undefined);
            toast.success('Venta realizada y boleta generada exitosamente');
            
            // Recargar productos para mostrar stock actualizado
            console.log('Recargando productos para actualizar stock...');
            await loadProducts();
            console.log('Productos recargados exitosamente');
          } else {
            toast.error('Error al procesar la venta: ' + saleResult.error);
          }
        } catch (error) {
          console.error('Error:', error);
          toast.error('Error al procesar la venta');
        }
    } else if (paymentMethod === 'card') {
      await handleCardPayment();
    }
  };

  const generateCashInvoice = async (saleId: string) => {
    try {
      // Crear boleta electrónica para efectivo
      const invoiceData = {
        user_id: user!.id,
        sale_id: saleId,
        tipo_documento: '39', // Boleta electrónica
        fecha_emision: new Date().toISOString(),
        rut_cliente: '', // Boleta anónima
        razon_social_cliente: 'Consumidor Final',
        email_cliente: '',
        telefono_cliente: '',
        direccion_cliente: '',
        comuna_cliente: '',
        ciudad_cliente: '',
        subtotal: stats.subtotal,
        iva: stats.vat,
        total: stats.totalWithVat,
        forma_pago: 'efectivo',
        medio_pago: 'efectivo'
      };

      const items = cart.map((item) => ({
        product_id: item.product.id,
        nombre_producto: item.product.name,
        cantidad: item.quantity,
        precio_unitario: item.product.price,
        descuento: 0,
        subtotal: item.total,
        iva: item.total * 0.19,
        total: item.total * 1.19,
        codigo_producto: item.product.sku,
        unidad_medida: 'UN'
      }));

      const result = await electronicInvoiceService.createInvoice(invoiceData, items);

      if (result.success) {
        // Enviar al SII
        await siiCommunicationService.sendInvoiceToSii(result.data!.id);
        console.log('Boleta en efectivo generada exitosamente');
      } else {
        console.error('Error generando boleta en efectivo:', result.error);
      }
    } catch (error) {
      console.error('Error en generateCashInvoice:', error);
    }
  };

  const handleCardPayment = async () => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    setProcessingPayment(true);

    try {
      const cartData = {
        cart,
        total: stats.totalWithVat,
        subtotal: stats.subtotal,
        iva: stats.vat
      };
      localStorage.setItem('pendingPaymentCart', JSON.stringify(cartData));

      const buyOrder = TransbankService.generateBuyOrder();
      const sessionId = TransbankService.generateSessionId();
      const returnUrl = `${window.location.origin}/payment/return`;

      console.log('Iniciando transacción Transbank:', {
        amount: stats.totalWithVat,
        buyOrder,
        sessionId,
        returnUrl
      });

      const result = await TransbankService.createTransaction(
        stats.totalWithVat,
        buyOrder,
        sessionId,
        returnUrl
      );

      if (!result.success) {
        throw new Error(result.error || 'Error al crear transacción');
      }

      // Para desarrollo, simular el proceso completo sin redirección
      console.log('Proceso simulado - redirigiendo a página de retorno');
      router.push('/payment/return?token_ws=' + result.data!.token);

    } catch (error) {
      console.error('Error iniciando pago con tarjeta:', error);
      toast.error('Error al procesar el pago: ' + (error as Error).message);
      setProcessingPayment(false);
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

  const change = paymentMethod === 'cash' && cashReceived ? cashReceived - stats.totalWithVat : 0;
  const vatPercentage = (userProfile?.country_code ? VAT_RATES[userProfile.country_code] || 0 : 0) * 100;

  if (!user) {
    return (
      <SecurityGuard>
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner />
          </div>
        </Layout>
      </SecurityGuard>
    );
  }

  return (
    <SecurityGuard>
      <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ventas Rápidas</h1>
            <p className="text-gray-600">Sistema de venta rápida para botillería</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Escanear / ingresar código"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleScan(); }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <Button variant="outline" onClick={handleScan}>Agregar por código</Button>
            <Button               onClick={() => {
                setProducts([]);
                setCart([]);
                setLoading(true);
                setTimeout(() => {
                  loadProducts();
                  loadUserProfile();
                }, 100);
              }}
              variant="outline"
              className="px-3"
              title="Recarga forzada"
            >
              🔄
            </Button>
          </div>
        </div>

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
            value={formatCurrency(stats.totalWithVat)}
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
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Productos Disponibles</CardTitle>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
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
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product) => (
                      <Card key={product.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
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
                            <Button                               onClick={() => addToCart(product)}
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

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
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm text-gray-900">{item.product.name}</h4>
                            <p className="text-xs text-gray-500">{formatCurrency(item.product.price)} c/u</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button                               onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              size="sm"
                              variant="outline"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                            <Button                               onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              size="sm"
                              variant="outline"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button                               onClick={() => removeFromCart(item.product.id)}
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

                    <div className="border-t pt-4 mb-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">{formatCurrency(stats.subtotal)}</span>
                        </div>
                        {(userProfile?.country_code ? VAT_RATES[userProfile.country_code] || 0 : 0) > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 flex items-center">
                              <Receipt className="h-3 w-3 mr-1" />
                              IVA ({vatPercentage}%):
                            </span>
                            <span className="font-medium text-red-600">{formatCurrency(stats.vat)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-bold text-lg">Total:</span>
                          <span className="font-bold text-lg">{formatCurrency(stats.totalWithVat)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Método de pago:</p>
                      <div className="flex gap-2">
                        <Button                           onClick={() => setPaymentMethod('cash')}
                          size="sm"
                          variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                          className={paymentMethod === 'cash' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Efectivo
                        </Button>
                        <Button                           onClick={() => setPaymentMethod('card')}
                          size="sm"
                          variant={paymentMethod === 'card' ? 'default' : 'outline'}
                          className={paymentMethod === 'card' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        >
                          <CreditCard className="h-3 w-3 mr-1" />
                          Tarjeta
                        </Button>
                      </div>
                    </div>

                    {paymentMethod === 'cash' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Efectivo recibido:
                        </label>
                        <CurrencyInput
                          value={cashReceived || 0}
                          onChange={(value) => setCashReceived(value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                        {cashReceived && cashReceived > 0 && (
                          <div className="mt-2 text-sm">
                            <p className="text-gray-600">
                              Cambio: <span className="font-medium">{formatCurrency(change)}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <Button                       onClick={handleCheckout}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={
                        cart.length === 0 || 
                        (paymentMethod === 'cash' && (!cashReceived || cashReceived < stats.totalWithVat)) ||
                        processingPayment
                      }
                    >
                      {processingPayment ? (
                        <>
                          <LoadingSpinner />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Completar Venta
                        </>
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </Layout>
    </SecurityGuard>
  );
}
