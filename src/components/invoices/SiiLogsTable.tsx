'use client';

interface SiiLogRow {
  id: string;
  created_at: string;
  user_id: string;
  invoice_id?: string | null;
  tipo_operacion?: string | null;
  estado?: string | null;
  mensaje_error?: string | null;
  response_data?: any;
  folio?: number | null;
  business_id?: string | null;
  track_id?: string | null;
}

export default function SiiLogsTable({ rows, loading }: { rows: SiiLogRow[]; loading?: boolean }) {
  return (
    <div className="overflow-auto rounded border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left">Fecha</th>
            <th className="px-3 py-2 text-left">Folio</th>
            <th className="px-3 py-2 text-left">Track ID</th>
            <th className="px-3 py-2 text-left">Operación</th>
            <th className="px-3 py-2 text-left">Estado</th>
            <th className="px-3 py-2 text-left">Mensaje/Error</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td className="px-3 py-4" colSpan={6}>{loading ? 'Cargando…' : 'Sin registros'}</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2">{new Date(row.created_at).toLocaleString('es-CL')}</td>
              <td className="px-3 py-2">{row.folio ?? '—'}</td>
              <td className="px-3 py-2">{row.track_id ?? row.response_data?.trackId ?? '—'}</td>
              <td className="px-3 py-2">{row.tipo_operacion ?? '—'}</td>
              <td className="px-3 py-2">{row.estado ?? '—'}</td>
              <td className="px-3 py-2 text-red-600">{row.mensaje_error ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
