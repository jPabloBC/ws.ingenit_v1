/*
  Stable realtime subscription per business (singleton per window)
  - Avoids duplicate channels and resub loops
  - Resubscribes on CLOSED/TIMED_OUT with backoff
  - Notifies all registered callbacks on relevant events
*/
'use client';
import { useEffect } from 'react';
import { supabase } from '@/services/supabase/client';

type BizRealtimeEntry = {
  key: string;
  bizId: string;
  channel: ReturnType<typeof supabase.channel> | null;
  refs: number;
  callbacks: Set<() => void>;
  status: string | null;
  resubTimer: any;
  ttlTimer: any;
};

const getRegistry = () => {
  if (typeof window === 'undefined') return null as any;
  const w = window as any;
  if (!w.__bizRealtimeRegistry) w.__bizRealtimeRegistry = {} as Record<string, BizRealtimeEntry>;
  return w.__bizRealtimeRegistry as Record<string, BizRealtimeEntry>;
};

const createChannel = (entry: BizRealtimeEntry) => {
  const { bizId, key } = entry;
  // Handlers
  const onAnyChange = () => {
    entry.callbacks.forEach(cb => {
      try { cb(); } catch {}
    });
  };

  const ch = supabase
    .channel(key)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ws_products', filter: `business_id=eq.${bizId}` }, () => {
      // console.log('[useBizRealtime] ws_products change');
      onAnyChange();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ws_sales', filter: `business_id=eq.${bizId}` }, () => {
      // console.log('[useBizRealtime] ws_sales change');
      onAnyChange();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ws_customers', filter: `business_id=eq.${bizId}` }, () => {
      // console.log('[useBizRealtime] ws_customers change');
      onAnyChange();
    })
    .on('broadcast', { event: 'inventory_updated' }, (payload: any) => {
      if (payload?.payload?.businessId === bizId) {
        // console.log('[useBizRealtime] broadcast inventory_updated');
        onAnyChange();
      }
    })
    .subscribe((status) => {
      entry.status = status as any;
      console.log('[RT]', key, status);
      if (status === 'CLOSED' || status === 'TIMED_OUT') {
        // Resubscribe with short backoff if there are listeners
        if (entry.resubTimer) clearTimeout(entry.resubTimer);
        entry.resubTimer = setTimeout(() => {
          if (entry.refs > 0) {
            console.log('[RT] Reconectando canal tras desconexión');
            try { if (entry.channel) supabase.removeChannel(entry.channel); } catch {}
            entry.channel = createChannel(entry);
          }
        }, 500); // Reducido de 800ms a 500ms para reconexión más rápida
      }
    });

  return ch;
};

export function useBizRealtime(businessId: string | null, onChange: () => void) {
  useEffect(() => {
    const registry = getRegistry();
    if (!registry) return;
    if (!businessId) return;
    const key = `biz-${businessId}`;

    let entry = registry[key] as BizRealtimeEntry | undefined;
    if (!entry) {
      entry = {
        key,
        bizId: businessId,
        channel: null,
        refs: 0,
        callbacks: new Set(),
        status: null,
        resubTimer: null,
        ttlTimer: null,
      };
      registry[key] = entry;
      // create immediately
      entry.channel = createChannel(entry);
    } else {
      // Cancel pending TTL removal if any
      if (entry.ttlTimer) { clearTimeout(entry.ttlTimer); entry.ttlTimer = null; }
      // Ensure channel exists
      if (!entry.channel) entry.channel = createChannel(entry);
    }

    // Register listener
    entry.refs += 1;
    entry.callbacks.add(onChange);

    return () => {
      // Unregister listener
      entry!.callbacks.delete(onChange);
      entry!.refs = Math.max(0, entry!.refs - 1);
      // Schedule channel removal if no listeners after a short TTL (keeps connection when navigating briefly)
      if (entry!.refs === 0 && !entry!.ttlTimer) {
        entry!.ttlTimer = setTimeout(() => {
          console.log('[RT] Removiendo canal por falta de listeners');
          try { if (entry!.channel) supabase.removeChannel(entry!.channel); } catch {}
          entry!.channel = null;
          entry!.status = null;
          entry!.ttlTimer = null;
          // Keep registry entry for quick reuse; do not delete to preserve callbacks set object reuse
        }, 30000); // Aumentado de 15s a 30s para mantener conexión más tiempo
      }
    };
  }, [businessId, onChange]);
}
