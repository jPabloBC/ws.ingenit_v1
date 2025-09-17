'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Download, Printer, Eye, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import TransbankService, { TransbankCommitResponse } from '@/services/payments/transbank';
import { 
  electronicInvoiceService, 
  siiCommunicationService 
} from '@/services/supabase/sii';
import toast from 'react-hot-toast';

interface PaymentReturnData {
  token_ws?: string;
  tbk_token?: string;
  tbk_orden_compra?: string;
  tbk_id_sesion?: string;
}

export default function PaymentReturnPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [transactionData, setTransactionData] = useState<TransbankCommitResponse | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    handlePaymentReturn();
  }, [user, router]);

  const handlePaymentReturn = async () => {
    try {
      setLoading(true);
      
      // Obtener parámetros de la URL
      const tokenWs = searchParams.get('token_ws');
      const tbkToken = searchParams.get('tbk_token');
      
      if (!tokenWs && !tbkToken) {
        setStatus('error');
        setErrorMessage('No se encontraron parámetros de pago válidos');
        setLoading(false);
        return;
      }
      
      // Simular confirmación de pago para desarrollo
      const mockTransactionData: TransbankCommitResponse = {
        buyOrder: 'ORDER-' + Date.now(),
        sessionId: 'SESSION-' + Date.now(),
        amount: 10000,
        status: 'AUTHORIZED',
        responseCode: 0,
        authorizationCode: 'AUTH-' + Date.now(),
        paymentTypeCode: 'VN',
        installmentsNumber: 1,
        transactionDate: new Date().toISOString(),
        vci: 'TSY',
        accountingDate: new Date().toISOString().split('T')[0],
        cardDetail: {
          cardNumber: '**** **** **** 1234'
        }
      };
      
      setTransactionData(mockTransactionData);
      
      // Generar boleta electrónica
      await generateElectronicInvoice(mockTransactionData, tokenWs || tbkToken || '');
      
    } catch (error) {
      console.error('Error processing payment:', error);
      setStatus('error');
      setErrorMessage('Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

















































                const generateElectronicInvoice = async (transactionResponse: TransbankCommitResponse, token: string) => {
    try {
      // Obtener datos del carrito desde localStorage (o desde la sesión)
      const cartData = localStorage.getItem('pendingPaymentCart');
      if (!cartData) {
        throw new Error('No se encontraron datos del carrito');
      }

      const { cart, total, subtotal, iva } = JSON.parse(cartData);

                        // Crear boleta electrónica
                  const invoiceData = {
                    user_id: user!.id,
                    sale_id: transactionResponse.buyOrder,
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
                    medio_pago: 'crédito',
                    // Campos de Transbank
                    transbank_token: token,
                    transbank_buy_order: transactionResponse.buyOrder,
                    transbank_session_id: transactionResponse.sessionId,
                    transbank_authorization_code: transactionResponse.authorizationCode,
                    transbank_card_number: transactionResponse.cardDetail.cardNumber,
                    transbank_payment_type: transactionResponse.paymentTypeCode,
                    transbank_installments: transactionResponse.installmentsNumber
                  };

      const items = cart.map((item: any) => ({
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

      if (!result.success) {
        throw new Error(result.error || 'Error al crear boleta');
      }

      setInvoiceData(result.data);

      // Enviar al SII
      const siiResult = await siiCommunicationService.sendInvoiceToSii(result.data!.id);

      if (siiResult.success) {
        setStatus('success');
        // Limpiar carrito pendiente
        localStorage.removeItem('pendingPaymentCart');
        toast.success('Pago procesado y boleta generada exitosamente');
      } else {
        setStatus('error');
        setErrorMessage('Error al enviar boleta al SII: ' + siiResult.error);
      }

    } catch (error) {
      console.error('Error generando boleta:', error);
      setStatus('error');
      setErrorMessage('Error al generar boleta: ' + (error as Error).message);
    }
  };

  const downloadInvoice = async () => {
    if (!invoiceData) return;
    toast.success('Descarga iniciada');
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };


  const printInvoice = async () => {
    if (!invoiceData) return;
    toast.success('Impresión iniciada');
  };

  const viewInvoice = async () => {
    if (!invoiceData) return;
    toast.success('Vista previa abierta');
  };

  const goBackToSales = () => {
    router.push('/quick-sales');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <LoadingSpinner />
            <h3 className="text-lg font-medium text-gray-900 mt-4">
              Procesando Pago...
            </h3>
            <p className="text-gray-600 mt-2">
              Por favor espere mientras confirmamos su pago.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          {status === 'success' && transactionData && invoiceData && (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Pago Exitoso!
              </h2>
              <p className="text-gray-600 mb-6">
                Su pago ha sido procesado correctamente y la boleta electrónica ha sido enviada al SII.
              </p>

              {/* Información de la transacción */}
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <h4 className="font-medium text-green-800 mb-3">Detalles de la Transacción</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <p><strong>Orden de Compra:</strong> {transactionData.buyOrder}</p>
                  <p><strong>Monto:</strong> {formatCurrency(transactionData.amount)}</p>
                  <p><strong>Código de Autorización:</strong> {transactionData.authorizationCode}</p>
                  <p><strong>Fecha:</strong> {new Date(transactionData.transactionDate).toLocaleString('es-CL')}</p>
                </div>
              </div>

              {/* Información de la boleta */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <h4 className="font-medium text-blue-800 mb-3">Boleta Electrónica</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Folio:</strong> {invoiceData.folio}</p>
                  <p><strong>Track ID:</strong> {invoiceData.track_id}</p>
                  <p><strong>Estado SII:</strong> {invoiceData.estado_sii}</p>
                  <p><strong>Total:</strong> {formatCurrency(invoiceData.total)}</p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex justify-center space-x-4 mb-6">
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

              <Button
                onClick={goBackToSales}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Ventas
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Error en el Pago
              </h2>
              <p className="text-gray-600 mb-6">
                {errorMessage}
              </p>

              {transactionData && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <h4 className="font-medium text-red-800 mb-3">Detalles del Error</h4>
                  <div className="text-sm text-red-800 space-y-1">
                    <p><strong>Orden de Compra:</strong> {transactionData.buyOrder}</p>
                    <p><strong>Código de Respuesta:</strong> {transactionData.responseCode}</p>
                    <p><strong>Estado:</strong> {transactionData.status}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={goBackToSales}
                className="bg-red-600 hover:bg-red-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Ventas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
