'use client';
// Removido: import no usado
import { Download, Printer, Eye } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface InvoiceActionsProps {
  invoiceId: string;
  invoiceData: any;
  onDownload?: () => void;
  onPrint?: () => void;
  onView?: () => void;
}

export default function InvoiceActions({ 
  invoiceId, 
  invoiceData, 
  onDownload, 
  onPrint, 
  onView 
}: InvoiceActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleDownload = async () => {
    if (onDownload) {
      onDownload();
      return;
    }

    setLoading('download');
    try {
      // Simular descarga de boleta
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Crear contenido de la boleta
      const invoiceContent = generateInvoiceContent(invoiceData);
      
      // Crear y descargar archivo
      const blob = new Blob([invoiceContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boleta-${invoiceData.folio || invoiceId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Boleta descargada exitosamente');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Error al descargar boleta');
    } finally {
      setLoading(null);
    }
  };

  const handlePrint = async () => {
    if (onPrint) {
      onPrint();
      return;
    }

    setLoading('print');
    try {
      // Simular impresión
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Crear contenido de la boleta
      const invoiceContent = generateInvoiceContent(invoiceData);
      
      // Abrir ventana de impresión
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(invoiceContent);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
      
      toast.success('Impresión iniciada');
    } catch (error) {
      console.error('Error printing invoice:', error);
      toast.error('Error al imprimir boleta');
    } finally {
      setLoading(null);
    }
  };

  const handleView = async () => {
    if (onView) {
      onView();
      return;
    }

    setLoading('view');
    try {
      // Simular vista previa
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Crear contenido de la boleta
      const invoiceContent = generateInvoiceContent(invoiceData);
      
      // Abrir en nueva ventana
      const viewWindow = window.open('', '_blank');
      if (viewWindow) {
        viewWindow.document.write(invoiceContent);
        viewWindow.document.close();
      }
      
      toast.success('Vista previa abierta');
    } catch (error) {
      console.error('Error viewing invoice:', error);
      toast.error('Error al abrir vista previa');
    } finally {
      setLoading(null);
    }
  };

  const generateInvoiceContent = (data: any) => {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boleta Electrónica ${data.folio || ''}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-info {
            margin-bottom: 20px;
          }
          .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
          }
          .customer-info {
            margin-bottom: 30px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th,
          .items-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          .totals {
            text-align: right;
            margin-top: 20px;
          }
          .total-row {
            font-size: 18px;
            font-weight: bold;
            margin-top: 10px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body { background-color: white; }
            .invoice-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            <h1>BOLETA ELECTRÓNICA</h1>
            <h2>${data.razon_social_cliente || 'Consumidor Final'}</h2>
            <p>Folio: ${data.folio || 'N/A'}</p>
            <p>Fecha: ${new Date(data.fecha_emision).toLocaleDateString('es-CL')}</p>
          </div>

          <div class="company-info">
            <h3>Datos del Emisor</h3>
            <p><strong>RUT:</strong> ${data.rut_empresa || 'N/A'}</p>
            <p><strong>Razón Social:</strong> ${data.razon_social || 'N/A'}</p>
            <p><strong>Dirección:</strong> ${data.direccion || 'N/A'}</p>
            <p><strong>Comuna:</strong> ${data.comuna || 'N/A'}</p>
            <p><strong>Ciudad:</strong> ${data.ciudad || 'N/A'}</p>
          </div>

          <div class="customer-info">
            <h3>Datos del Cliente</h3>
            <p><strong>RUT:</strong> ${data.rut_cliente || 'N/A'}</p>
            <p><strong>Razón Social:</strong> ${data.razon_social_cliente || 'Consumidor Final'}</p>
            <p><strong>Dirección:</strong> ${data.direccion_cliente || 'N/A'}</p>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>Cantidad</th>
                <th>Descripción</th>
                <th>Precio Unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.items ? data.items.map((item: any) => `
                <tr>
                  <td>${item.cantidad}</td>
                  <td>${item.nombre_producto}</td>
                  <td>$${item.precio_unitario?.toLocaleString('es-CL') || '0'}</td>
                  <td>$${item.total?.toLocaleString('es-CL') || '0'}</td>
                </tr>
              `).join('') : '<tr><td colspan="4">No hay items</td></tr>'}
            </tbody>
          </table>

          <div class="totals">
            <p><strong>Subtotal:</strong> $${data.subtotal?.toLocaleString('es-CL') || '0'}</p>
            <p><strong>IVA (19%):</strong> $${data.iva?.toLocaleString('es-CL') || '0'}</p>
            <p class="total-row"><strong>TOTAL:</strong> $${data.total?.toLocaleString('es-CL') || '0'}</p>
          </div>

          <div class="footer">
            <p>Este documento es una representación impresa de una boleta electrónica</p>
            <p>Track ID: ${data.track_id || 'N/A'} | Estado SII: ${data.estado_sii || 'N/A'}</p>
            <p>Generado el ${new Date().toLocaleString('es-CL')}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="flex space-x-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleView}
        disabled={loading !== null}
      >
        <Eye className="h-3 w-3 mr-1" />
        {loading === 'view' ? 'Cargando...' : 'Ver'}
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={handleDownload}
        disabled={loading !== null}
      >
        <Download className="h-3 w-3 mr-1" />
        {loading === 'download' ? 'Descargando...' : 'Descargar'}
      </Button>
      
      <Button
        size="sm"
        variant="outline"
        onClick={handlePrint}
        disabled={loading !== null}
      >
        <Printer className="h-3 w-3 mr-1" />
        {loading === 'print' ? 'Imprimiendo...' : 'Imprimir'}
      </Button>
    </div>
  );
}
