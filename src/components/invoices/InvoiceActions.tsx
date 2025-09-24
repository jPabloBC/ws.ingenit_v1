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
      
  // Crear contenido de la boleta (con QR)
  const invoiceContent = await generateInvoiceContent(invoiceData);
      
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
      
  // Crear contenido de la boleta (con QR)
  const invoiceContent = await generateInvoiceContent(invoiceData);
      
      // Abrir ventana de impresión
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(invoiceContent);
        printWindow.document.close();
        // Dar tiempo a que cargue la imagen QR antes de imprimir
        const maybePrint = () => {
          try { printWindow.focus(); printWindow.print(); } catch (_) {}
          setTimeout(() => { try { printWindow.close(); } catch (_) {} }, 300);
        };
        // Intentar esperar a la carga
        setTimeout(maybePrint, 350);
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
      
  // Crear contenido de la boleta (con QR)
  const invoiceContent = await generateInvoiceContent(invoiceData);
      
      // Abrir en nueva ventana
      const viewWindow = window.open('', '_blank');
      if (viewWindow) {
        viewWindow.document.open();
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

  const generateInvoiceContent = async (data: any) => {
    const fmt = (n?: number) => Math.round(n ?? 0).toLocaleString('es-CL');
    const nowStr = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });
    const fecha = data?.fecha_emision ? new Date(data.fecha_emision).toLocaleString('es-CL', { timeZone: 'America/Santiago' }) : nowStr;
    const businessName = data?.razon_social || data?.business_name || 'NEGOCIO';
    const rutEmisor = data?.rut_empresa || 'N/A';
    const direccion = [data?.direccion, data?.comuna, data?.ciudad].filter(Boolean).join(', ');
    const pago = data?.forma_pago || data?.medio_pago || 'Efectivo';
    const validationCode = data?.codigo_validacion_sii || (data?.folio && data?.track_id ? `SII-${data.folio}-${String(data.track_id).slice(-6).toUpperCase()}` : 'SII-PENDIENTE');
    const verificationUrl = data?.track_id
      ? `https://www4.sii.cl/consltuDte?trackId=${encodeURIComponent(data.track_id)}&rut_emisor=${encodeURIComponent(rutEmisor)}&folio=${encodeURIComponent(data.folio || '')}`
      : `https://www.sii.cl/`;
    // Generar QR como DataURL (preferimos URL de verificación; si no, el propio código)
    let qrDataUrl = '';
    try {
      const QR = await import('qrcode');
      const toDataURL = (QR as any)?.toDataURL || (QR as any)?.default?.toDataURL;
      if (typeof toDataURL === 'function') {
        qrDataUrl = await toDataURL(verificationUrl || String(validationCode), { width: 128, margin: 1 });
      }
    } catch (_) {
      // sin dependencia o error, dejamos vacío y solo mostramos el código
      qrDataUrl = '';
    }

    const itemsHtml = Array.isArray(data?.items) && data.items.length > 0
      ? data.items.map((item: any) => {
          const nombre = item.nombre_producto || item.descripcion || item.product_name || 'Item';
          const cantidad = item.cantidad ?? item.quantity ?? 1;
          const precio = item.precio_unitario ?? item.unit_price ?? 0;
          const total = item.total ?? item.total_price ?? (cantidad * precio);
          return `
            <div>
              <div>${nombre}</div>
              <div class="row small"><div>${cantidad} x $${fmt(precio)}</div><div>$${fmt(total)}</div></div>
            </div>
          `;
        }).join('')
      : '<div class="small">(Sin items)</div>';

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boleta ${data.folio || ''}</title>
        <style>
          @page { size: 58mm auto; margin: 0; }
          body { margin: 0; padding: 0; background: #fff; }
          .ticket { width: 58mm; padding: 2mm; font-family: "Courier New", monospace; font-size: 11px; color: #000; }
          .center { text-align: center; }
          .right { text-align: right; }
          .bold { font-weight: bold; }
          .small { font-size: 10px; }
          .row { display: flex; justify-content: space-between; gap: 6px; }
          hr { border: 0; border-top: 1px dashed #000; margin: 4px 0; }
          .mt-2 { margin-top: 8px; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="center bold">${businessName}</div>
          <div class="center">RUT ${rutEmisor}</div>
          ${direccion ? `<div class="center small">${direccion}</div>` : ''}
          <hr />
          <div class="center bold">BOLETA ELECTRÓNICA</div>
          <div class="center">FOLIO: ${data.folio || 'N/A'}</div>
          <div class="center small">${fecha}</div>
          <hr />
          ${itemsHtml}
          <hr />
          <div class="row"><div>SUBTOTAL</div><div>$${fmt(data.subtotal)}</div></div>
          <div class="row"><div>IVA 19%</div><div>$${fmt(data.iva)}</div></div>
          <div class="row bold"><div>TOTAL</div><div>$${fmt(data.total)}</div></div>
          <hr />
          <div class="small">Medio de pago: ${pago}</div>
          <hr />
          <div class="center bold">TIMBRE SII</div>
          <div class="center small">Código de validación</div>
          <pre class="center small" style="white-space: pre-wrap; word-break: break-word;">${validationCode}</pre>
          ${qrDataUrl ? `<div class="center"><img src="${qrDataUrl}" alt="QR" style="width:120px;height:auto;" /></div>` : ''}
          <div class="small">Verifica en: ${verificationUrl}</div>
          <div class="center small">TrackID: ${data.track_id || 'N/A'}</div>
          <div class="center small mb-2">Estado SII: ${data.estado_sii || 'pendiente'}</div>
          <div class="center small">Gracias por su compra</div>
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
