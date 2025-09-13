'use client';
// Removido: import no usado
import { Check, CheckCircle, CreditCard, Download, FileText, Printer, X, XCircle, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { 
  electronicInvoiceService, 
  siiConfigService,
  siiCommunicationService,
  ElectronicInvoice
} from '@/services/supabase/sii';
import toast from 'react-hot-toast';
interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    sku: string;
  };
  quantity: number;
  total: number;
}

interface CardPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  subtotal: number;
  iva: number;
  onPaymentSuccess: (invoiceId: string) => void;
}

interface PaymentFormData {
  cardNumber: string;
  cardHolder: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  installments: number;
}

export default function CardPaymentModal({
  isOpen,
  onClose,
  cart,
  total,
  subtotal,
  iva,
  onPaymentSuccess
}: CardPaymentModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'payment' | 'processing' | 'success' | 'error'>('payment');
  const [loading, setLoading] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<ElectronicInvoice | null>(null);
  
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    installments: 1
  });

  useEffect(() => {
    if (isOpen && user) {
      // TODO: Load SII config
    }
  }, [isOpen, user]);

  const loadSiiConfig = async () => {
    // TODO: Implement SII config loading
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };
















  const handlePaymentFormChange = (field: keyof PaymentFormData, value: string | number) => {
    setPaymentForm(prev => ({ ...prev, [field]: value }));
  };

  const validatePaymentForm = (): boolean => {
    if (!paymentForm.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) {
      toast.error('Número de tarjeta inválido');
      return false;
    }
    if (!paymentForm.cardHolder.trim()) {
      toast.error('Nombre del titular es requerido');
      return false;
    }
    if (!paymentForm.expiryMonth || !paymentForm.expiryYear) {
      toast.error('Fecha de vencimiento es requerida');
      return false;
    }
    if (!paymentForm.cvv.match(/^\d{3,4}$/)) {
      toast.error('CVV inválido');
      return false;
    }
    return true;
  };

  const handlePaymentSubmit = async () => {
    if (!validatePaymentForm()) return;
    if (!user) return;

    setStep('processing');
    setLoading(true);

    try {
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Crear boleta electrónica (sin datos del cliente - boleta anónima)
      const invoiceData = {
        user_id: user.id,
        sale_id: '', // Se generará automáticamente
        tipo_documento: '39', // Boleta electrónica
        fecha_emision: new Date().toISOString(),
        rut_cliente: '', // Boleta anónima
        razon_social_cliente: 'Consumidor Final',
        email_cliente: '',
        telefono_cliente: '',
        direccion_cliente: '',
        comuna_cliente: '',
        ciudad_cliente: '',
        subtotal: subtotal,
        iva: iva,
        total: total,
        forma_pago: 'tarjeta',
        medio_pago: 'crédito'
      };

      const items = cart.map(item => ({
        product_id: item.product.id,
        nombre_producto: item.product.name,
        cantidad: item.quantity,
        precio_unitario: item.product.price,
        descuento: 0,
        subtotal: item.total,
        iva: item.total * 0.19, // 19% IVA
        total: item.total * 1.19,
        codigo_producto: item.product.sku,
        unidad_medida: 'UN'
      }));

      const result = await electronicInvoiceService.createInvoice(invoiceData, items);

      if (!result.success) {
        throw new Error(result.error || 'Error al crear boleta');
      }

      setCreatedInvoice(result.data!);

      // Enviar al SII
      const siiResult = await siiCommunicationService.sendInvoiceToSii(result.data!.id);

      if (siiResult.success) {
        setStep('success');
        onPaymentSuccess(result.data!.id);
      } else {
        setStep('error');
        toast.error('Error al enviar al SII: ' + siiResult.error);
      }

    } catch (error: any) {
      console.error('Error processing payment:', error);
      setStep('error');
      toast.error('Error al procesar el pago: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const downloadInvoice = async () => {
    if (!createdInvoice) return;
    
    // TODO: Implementar descarga de PDF
    toast.success('Descarga iniciada');
  };

  const printInvoice = async () => {
    if (!createdInvoice) return;
    
    // TODO: Implementar impresión
    toast.success('Impresión iniciada');
  };

  const viewInvoice = async () => {
    if (!createdInvoice) return;
    
    // TODO: Implementar vista previa
    toast.success('Vista previa abierta');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Pago con Tarjeta - Boleta</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'payment' || step === 'processing' || step === 'success' 
                  ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                <CreditCard className="h-4 w-4" />
              </div>
              <div className={`w-16 h-1 ${
                step === 'processing' || step === 'success' 
                  ? 'bg-blue-600' : 'bg-gray-300'
              }`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'success' 
                  ? 'bg-green-600 text-white' : step === 'error'
                  ? 'bg-red-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {step === 'success' ? <CheckCircle className="h-4 w-4" /> : 
                 step === 'error' ? <XCircle className="h-4 w-4" /> : 
                 <FileText className="h-4 w-4" />}
              </div>
            </div>
          </div>

          {/* Step 1: Payment Information */}
          {step === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Información de Pago
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Se generará una boleta electrónica anónima para esta venta.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Tarjeta *
                    </label>
                    <input
                      type="text"
                      value={paymentForm.cardNumber}
                      onChange={(e) => handlePaymentFormChange('cardNumber', formatCardNumber(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Titular *
                    </label>
                    <input
                      type="text"
                      value={paymentForm.cardHolder}
                      onChange={(e) => handlePaymentFormChange('cardHolder', e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="NOMBRE APELLIDO"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mes de Vencimiento *
                    </label>
                    <select
                      value={paymentForm.expiryMonth}
                      onChange={(e) => handlePaymentFormChange('expiryMonth', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">MM</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                        <option key={month} value={month.toString().padStart(2, '0')}>
                          {month.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año de Vencimiento *
                    </label>
                    <select
                      value={paymentForm.expiryYear}
                      onChange={(e) => handlePaymentFormChange('expiryYear', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">YYYY</option>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV *
                    </label>
                    <input
                      type="text"
                      value={paymentForm.cvv}
                      onChange={(e) => handlePaymentFormChange('cvv', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="123"
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cuotas
                    </label>
                    <select
                      value={paymentForm.installments}
                      onChange={(e) => handlePaymentFormChange('installments', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(installment => (
                        <option key={installment} value={installment}>
                          {installment} {installment === 1 ? 'cuota' : 'cuotas'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-3">Resumen de la Orden</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (19%):</span>
                      <span>{formatCurrency(iva)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handlePaymentSubmit}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? <LoadingSpinner /> : 'Pagar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Processing */}
          {step === 'processing' && (
            <Card>
              <CardContent className="text-center py-12">
                <LoadingSpinner />
                <h3 className="text-lg font-medium text-gray-900 mt-4">
                  Procesando Pago...
                </h3>
                <p className="text-gray-600 mt-2">
                  Por favor espere mientras procesamos su pago y generamos la boleta electrónica.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Success */}
          {step === 'success' && createdInvoice && (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  ¡Pago Exitoso!
                </h3>
                <p className="text-gray-600 mb-6">
                  Su pago ha sido procesado correctamente y la boleta electrónica ha sido enviada al SII.
                </p>
                
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                  <div className="text-sm text-green-800">
                    <p><strong>Folio:</strong> {createdInvoice.folio}</p>
                    <p><strong>Track ID:</strong> {createdInvoice.track_id}</p>
                    <p><strong>Estado SII:</strong> {createdInvoice.estado_sii}</p>
                    <p><strong>Total:</strong> {formatCurrency(createdInvoice.total)}</p>
                  </div>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={downloadInvoice}
                    variant="outline"
                    className="flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                  <Button
                    onClick={printInvoice}
                    variant="outline"
                    className="flex items-center"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button
                    onClick={viewInvoice}
                    variant="outline"
                    className="flex items-center"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                </div>

                <div className="mt-6">
                  <Button
                    onClick={onClose}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Finalizar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Error */}
          {step === 'error' && (
            <Card>
              <CardContent className="text-center py-8">
                <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Error en el Pago
                </h3>
                <p className="text-gray-600 mb-6">
                  Ha ocurrido un error al procesar su pago. Por favor, inténtelo nuevamente.
                </p>
                
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={() => setStep('payment')}
                    variant="outline"
                  >
                    Reintentar
                  </Button>
                  <Button
                    onClick={onClose}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
