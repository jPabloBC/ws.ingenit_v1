"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { siiLogService, electronicInvoiceService } from '@/services/supabase/sii';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import SiiLogsTable from '@/components/invoices/SiiLogsTable';

interface SiiLogRow {
  id: string;
  created_at: string;
  user_id: string;
  invoice_id?: string | null;
  tipo_operacion?: string | null;
  estado?: string | null;
  mensaje_error?: string | null;
  response_data?: any;
  // Decorated
  folio?: number | null;
  business_id?: string | null;
  track_id?: string | null;
}

export default function SiiLogsPage() {
  const { user } = useAuth();
  const { currentBusiness } = useStore();

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<SiiLogRow[]>([]);

  const businessId = currentBusiness?.id;

  const fetchLogs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const rows = await siiLogService.getUserLogs(user.id, 200);
      // Optional filter by business based on joined invoice
      const decorated: SiiLogRow[] = await Promise.all((rows || []).map(async (row: any) => {
        let folio: number | null = null;
        let invBiz: string | null = null;
        let track_id: string | null = null;

        if (row.invoice_id) {
          const inv = await electronicInvoiceService.getInvoiceById(row.invoice_id);
          if (inv) {
            folio = inv.folio ?? null;
            invBiz = (inv as any).business_id ?? null;
            track_id = (inv as any).track_id ?? null;
          }
        }

        return { ...row, folio, business_id: invBiz, track_id } as SiiLogRow;
      }));

      const filtered = businessId ? decorated.filter(d => d.business_id === businessId) : decorated;
      setLogs(filtered);
    } catch (e) {
      console.error('Error loading SII logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, businessId]);

  const byDate = useMemo(() => logs.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)), [logs]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Historial de envíos SII</h1>
        <div className="flex items-center gap-2">
          <Button onClick={fetchLogs} disabled={loading}>{loading ? 'Actualizando…' : 'Actualizar'}</Button>
          <Link className="text-blue-600 underline" href="/">Volver</Link>
        </div>
      </div>

      <SiiLogsTable rows={byDate} loading={loading} />
    </div>
  );
}
