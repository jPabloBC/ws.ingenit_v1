// Usar el cliente autenticado del usuario para que las políticas RLS (auth.uid()) funcionen
import { supabase } from './client';

// =====================================================
// INTERFACES PARA SII
// =====================================================

export interface SiiConfig {
  id: string;
  user_id: string;
  business_id?: string;
  rut_empresa: string;
  razon_social: string;
  giro_comercial: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  telefono?: string;
  email?: string;
  certificado_digital?: string;
  password_certificado?: string;
  ambiente_sii: 'certificacion' | 'produccion';
  folio_inicial: number;
  folio_actual: number;
  created_at: string;
  updated_at: string;
}

export interface ElectronicInvoice {
  id: string;
  user_id: string;
  sale_id: string;
  tipo_documento: string;
  folio: number;
  fecha_emision: string;
  fecha_vencimiento?: string;
  rut_cliente?: string;
  razon_social_cliente?: string;
  giro_cliente?: string;
  direccion_cliente?: string;
  comuna_cliente?: string;
  ciudad_cliente?: string;
  telefono_cliente?: string;
  email_cliente?: string;
  subtotal: number;
  iva: number;
  total: number;
  forma_pago: string;
  medio_pago?: string;
  estado_sii: 'pendiente' | 'enviado' | 'aceptado' | 'rechazado' | 'anulado';
  track_id?: string;
  codigo_validacion_sii?: string;
  xml_original?: string;
  xml_respuesta?: string;
  errores_sii?: string[];
  observaciones?: string;
  // Campos de Transbank
  transbank_token?: string;
  transbank_buy_order?: string;
  transbank_session_id?: string;
  transbank_authorization_code?: string;
  transbank_card_number?: string;
  transbank_payment_type?: string;
  transbank_installments?: number;
  created_at: string;
  updated_at: string;
  items?: ElectronicInvoiceItem[];
}

export interface ElectronicInvoiceItem {
  id: string;
  invoice_id: string;
  product_id?: string;
  nombre_producto: string;
  descripcion?: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  iva: number;
  total: number;
  codigo_producto?: string;
  unidad_medida: string;
  created_at: string;
}

export interface Customer {
  id: string;
  user_id: string;
  rut: string;
  razon_social: string;
  nombre_fantasia?: string;
  giro?: string;
  direccion?: string;
  comuna?: string;
  ciudad?: string;
  region?: string;
  codigo_postal?: string;
  telefono?: string;
  email?: string;
  tipo_cliente: 'consumidor_final' | 'contribuyente' | 'extranjero';
  exento_iva: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiiLog {
  id: string;
  user_id: string;
  invoice_id?: string;
  tipo_operacion: string;
  fecha_operacion: string;
  request_data?: any;
  response_data?: any;
  estado: 'exitoso' | 'error' | 'pendiente';
  mensaje_error?: string;
  created_at: string;
}

// =====================================================
// SERVICIO DE CONFIGURACIÓN SII
// =====================================================

export const siiConfigService = {
  // Obtener configuración SII del usuario
  async getConfig(userId: string, businessId?: string): Promise<SiiConfig | null> {
    try {
      // 1) Intentar por business_id si viene (multi-negocio)
      if (businessId) {
        const byBiz = await supabase
          .from('ws_sii_config')
          .select('*')
          .eq('business_id', businessId)
          .maybeSingle();
        // Si devuelve datos, úsalo
        if (byBiz.data) return byBiz.data as any;
        // Si falla por columna inexistente, caemos al filtro por user
      }

      // 2) Fallback por user_id
      const { data, error } = await supabase
        .from('ws_sii_config')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching SII config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getConfig:', error);
      return null;
    }
  },

  // Crear o actualizar configuración SII
  async upsertConfig(config: Partial<SiiConfig>): Promise<{ success: boolean; data?: SiiConfig; error?: string }> {
    try {
      // Log para debugging - verificar longitudes de campos
      console.log('SII Config data being sent:', {
        rut_empresa: config.rut_empresa?.length || 0,
        razon_social: config.razon_social?.length || 0,
        giro_comercial: config.giro_comercial?.length || 0,
        direccion: config.direccion?.length || 0,
        comuna: config.comuna?.length || 0,
        ciudad: config.ciudad?.length || 0,
        telefono: config.telefono?.length || 0,
        email: config.email?.length || 0,
        certificado_digital: config.certificado_digital?.length || 0,
        password_certificado: config.password_certificado?.length || 0
      });

      // Primero verificar si ya existe una configuración para este usuario o negocio
      const query = supabase
        .from('ws_sii_config')
        .select('*')
        .limit(1);

      let existingConfig = null as any;
      if (config.business_id) {
        const { data } = await query.eq('business_id', config.business_id).maybeSingle();
        existingConfig = data;
      } else if (config.user_id) {
        const { data } = await query.eq('user_id', config.user_id).maybeSingle();
        existingConfig = data;
      }

      let result;
      
      if (existingConfig) {
        // Actualizar configuración existente
        const upd = supabase.from('ws_sii_config').update(config);
        const { data, error } = config.business_id
          ? await upd.eq('business_id', config.business_id).select().maybeSingle()
          : await upd.eq('user_id', config.user_id as string).select().maybeSingle();

        if (error) {
          console.error('Error updating SII config:', error);
          return { success: false, error: error.message };
        }

        result = data;
      } else {
        // Crear nueva configuración
        const payload = { ...config } as any;
        if (!payload.user_id) throw new Error('user_id requerido para crear configuración');
        // business_id opcional; si existe, se guardará scoping por negocio
        const { data, error } = await supabase
          .from('ws_sii_config')
          .insert(payload)
          .select()
          .maybeSingle();

        if (error) {
          console.error('Error creating SII config:', error);
          return { success: false, error: error.message };
        }

        result = data;
      }

      return { success: true, data: result };
    } catch (error: any) {
      console.error('Error in upsertConfig:', error);
      return { success: false, error: error.message };
    }
  },

  // Validar configuración SII
  async validateConfig(config: Partial<SiiConfig>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!config.rut_empresa) errors.push('RUT de empresa es requerido');
    if (!config.razon_social) errors.push('Razón social es requerida');
    if (!config.giro_comercial) errors.push('Giro comercial es requerido');
    if (!config.direccion) errors.push('Dirección es requerida');
    if (!config.comuna) errors.push('Comuna es requerida');
    if (!config.ciudad) errors.push('Ciudad es requerida');

    // Validar RUT si está presente
    if (config.rut_empresa && !this.validateRut(config.rut_empresa)) {
      errors.push('RUT de empresa no es válido');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Validar RUT chileno
  validateRut(rut: string): boolean {
    // Implementación básica de validación de RUT
    const rutClean = rut.replace(/[.-]/g, '');
    if (rutClean.length < 2) return false;
    
    const dv = rutClean.slice(-1).toUpperCase();
    const rutNumber = rutClean.slice(0, -1);
    
    if (!/^\d+$/.test(rutNumber)) return false;
    
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = rutNumber.length - 1; i >= 0; i--) {
      suma += parseInt(rutNumber[i]) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const dvCalculado = 11 - (suma % 11);
    const dvEsperado = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'K' : dvCalculado.toString();
    
    return dv === dvEsperado;
  }
};

// =====================================================
// SERVICIO DE BOLETAS ELECTRÓNICAS
// =====================================================

export const electronicInvoiceService = {
  // Crear boleta electrónica
  async createInvoice(invoiceData: Partial<ElectronicInvoice>, items: Partial<ElectronicInvoiceItem>[]): Promise<{ success: boolean; data?: ElectronicInvoice; error?: string }> {
    try {
      const DEFAULT_APP_ID = '550e8400-e29b-41d4-a716-446655440000';
      const generateUUID = (): string => {
        try {
          const g: any = (globalThis as any);
          if (g?.crypto?.randomUUID) return g.crypto.randomUUID();
        } catch (_) {}
        const rnd = (a?: number) => ((a ?? Math.random()) * 16) | 0;
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = rnd();
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };
      // Generar folio automático (prioriza por negocio y tipo)
      const folio = await this.generateFolio({
        businessId: (invoiceData as any).business_id,
        userId: invoiceData.user_id!,
        // En DB la columna suele ser 'tipo_documento' (p.ej. '39' para boleta)
        invoiceType: (invoiceData as any).tipo_documento || '39'
      });
      const baseInvoice: any = {
        ...invoiceData,
        folio,
        estado_sii: 'pendiente'
      };

      // Incluir business_id sólo si viene
      if ((invoiceData as any).business_id) {
        baseInvoice.business_id = (invoiceData as any).business_id;
      }

      // Asegurar app_id (la columna es NOT NULL en DB)
      baseInvoice.app_id = (invoiceData as any).app_id || DEFAULT_APP_ID;

      // Asegurar id (evita primer intento fallido si la columna id es NOT NULL sin default)
      if (!baseInvoice.id) {
        baseInvoice.id = generateUUID();
      }

      let invoice: any = null;
      let invoiceError: any = null;
      // Intento 1: insertar con app_id
      {
        const res = await supabase
          .from('ws_electronic_invoices')
          .insert(baseInvoice)
          .select()
          .maybeSingle();
        invoice = res.data;
        invoiceError = res.error;
      }

      // Ya no realizamos reintento por app_id inexistente, porque no lo enviamos por defecto.

      // Ya no necesitamos reintentar por id nulo: lo generamos antes del insert.

      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        return { success: false, error: invoiceError.message };
      }

      // Crear items de la boleta
      if (items.length > 0) {
        const itemsToCreate = items.map(item => ({
          ...item,
          invoice_id: invoice.id
        }));

        const { error: itemsError } = await supabase
          .from('ws_electronic_invoice_items')
          .insert(itemsToCreate);

        if (itemsError) {
          console.error('Error creating invoice items:', itemsError);
          // Intentar eliminar la boleta si fallan los items
          await supabase.from('ws_electronic_invoices').delete().eq('id', invoice.id);
          return { success: false, error: itemsError.message };
        }
      }

      return { success: true, data: invoice };
    } catch (error: any) {
      console.error('Error in createInvoice:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener boleta por ID
  async getInvoiceById(invoiceId: string): Promise<ElectronicInvoice | null> {
    try {
      const { data, error } = await supabase
        .from('ws_electronic_invoices')
        .select(`
          *,
          items:ws_electronic_invoice_items!ws_electronic_invoice_items_invoice_id_fkey(*)
        `)
        .eq('id', invoiceId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching invoice:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getInvoiceById:', error);
      return null;
    }
  },

  // Obtener boletas del usuario
  async getUserInvoices(userId: string, limit = 50): Promise<ElectronicInvoice[]> {
    try {
      const { data, error } = await supabase
        .from('ws_electronic_invoices')
        .select(`
          *,
          items:ws_electronic_invoice_items!ws_electronic_invoice_items_invoice_id_fkey(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user invoices:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserInvoices:', error);
      return [];
    }
  },

  // Actualizar estado de boleta
  async updateInvoiceStatus(invoiceId: string, status: ElectronicInvoice['estado_sii'], trackId?: string, xmlRespuesta?: string, codigoValidacionSii?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        estado_sii: status,
        updated_at: new Date().toISOString()
      };

  if (trackId) updateData.track_id = trackId;
      if (xmlRespuesta) updateData.xml_respuesta = xmlRespuesta;
  if (codigoValidacionSii) (updateData as any).codigo_validacion_sii = codigoValidacionSii;

      const { error } = await supabase
        .from('ws_electronic_invoices')
        .update(updateData)
        .eq('id', invoiceId);

      if (error) {
        console.error('Error updating invoice status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in updateInvoiceStatus:', error);
      return { success: false, error: error.message };
    }
  },

  // Generar folio automático
  async generateFolio(params: { businessId?: string; userId?: string; invoiceType?: string }): Promise<number> {
    const { businessId, userId, invoiceType = 'boleta' } = params || {} as any;
    try {
      // 1) Intentar vía RPC cuando tenemos businessId
      if (businessId) {
        const { data, error } = await supabase.rpc('generate_electronic_invoice_folio', {
          business_id: businessId,
          invoice_type: invoiceType
        });

        if (!error) {
          // La función puede devolver: number | { folio: number } | Array<{ folio: number }>
          if (typeof data === 'number') return data;
          if (Array.isArray(data) && data.length > 0 && data[0]?.folio != null) return Number(data[0].folio);
          if (data && (data as any).folio != null) return Number((data as any).folio);
        } else {
          // 404 suele indicar que el RPC no está expuesto o cacheado; continuamos con fallback
          console.warn('RPC generate_electronic_invoice_folio failed; falling back. Details:', error);
        }
      }

      // 2) Fallback por negocio: mayor folio del business + 1 y tipo
      if (businessId) {
        const { data: lastByBiz, error: lastBizErr } = await supabase
          .from('ws_electronic_invoices')
          .select('folio')
          .eq('business_id', businessId)
          .eq('tipo_documento', invoiceType)
          .order('folio', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!lastBizErr) {
          const nextBiz = (lastByBiz?.folio as number | undefined) ?? 0;
          return (nextBiz || 0) + 1;
        }
      }

      // 3) Fallback por usuario (compatibilidad con datos antiguos)
      if (userId) {
        const { data: lastByUser, error: lastUserErr } = await supabase
          .from('ws_electronic_invoices')
          .select('folio')
          .eq('user_id', userId)
          .order('folio', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!lastUserErr) {
          const nextUsr = (lastByUser?.folio as number | undefined) ?? 0;
          return (nextUsr || 0) + 1;
        }
      }

      // 4) Último recurso
      return 1;
    } catch (error) {
      console.error('Error in generateFolio:', error);
      return 1; // Fallback
    }
  },

  // Anular boleta
  async cancelInvoice(invoiceId: string, motivo: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ws_electronic_invoices')
        .update({
          estado_sii: 'anulado',
          observaciones: motivo,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);

      if (error) {
        console.error('Error canceling invoice:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in cancelInvoice:', error);
      return { success: false, error: error.message };
    }
  }
};

// =====================================================
// SERVICIO DE CLIENTES
// =====================================================

export const customerService = {
  // Crear cliente
  async createCustomer(customerData: Partial<Customer>): Promise<{ success: boolean; data?: Customer; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('ws_customers')
        .insert(customerData)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error creating customer:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error in createCustomer:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener cliente por RUT
  async getCustomerByRut(userId: string, rut: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('ws_customers')
        .select('*')
        .eq('user_id', userId)
        .eq('rut', rut)
        .maybeSingle();

      if (error) {
        console.error('Error fetching customer by RUT:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCustomerByRut:', error);
      return null;
    }
  },

  // Obtener clientes del usuario
  async getUserCustomers(userId: string): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('ws_customers')
        .select('*')
        .eq('user_id', userId)
        .eq('activo', true)
        .order('razon_social', { ascending: true });

      if (error) {
        console.error('Error fetching user customers:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserCustomers:', error);
      return [];
    }
  }
};

// =====================================================
// SERVICIO DE LOGS SII
// =====================================================

export const siiLogService = {
  // Crear log
  async createLog(logData: Partial<SiiLog>): Promise<{ success: boolean; data?: SiiLog; error?: string }> {
    try {
      const generateUUID = (): string => {
        try {
          const g: any = (globalThis as any);
          if (g?.crypto?.randomUUID) return g.crypto.randomUUID();
        } catch (_) {}
        const rnd = (a?: number) => ((a ?? Math.random()) * 16) | 0;
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = rnd();
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      const DEFAULT_APP_ID = '550e8400-e29b-41d4-a716-446655440000';
      const payload: any = {
        id: (logData as any)?.id || generateUUID(),
        app_id: (logData as any)?.app_id || DEFAULT_APP_ID,
        ...logData
      };

      const { data, error } = await supabase
        .from('ws_sii_logs')
        .insert(payload)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error creating SII log:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Error in createLog:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener logs del usuario
  async getUserLogs(userId: string, limit = 100): Promise<SiiLog[]> {
    try {
      const { data, error } = await supabase
        .from('ws_sii_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserLogs:', error);
      return [];
    }
  }
};

import { createSiiConnection } from '@/services/sii/realSiiConnection';

// Configuración del SII (debes obtener estas credenciales del SII)
const SII_CONFIG = {
  username: process.env.NEXT_PUBLIC_SII_USERNAME || '',
  password: process.env.NEXT_PUBLIC_SII_PASSWORD || '',
  certificate: process.env.NEXT_PUBLIC_SII_CERTIFICATE || '',
  environment: (process.env.NEXT_PUBLIC_SII_ENVIRONMENT as 'development' | 'production') || 'development'
};

// Crear instancia de conexión SII
const siiConnection = createSiiConnection(SII_CONFIG);

// =====================================================
// SERVICIO DE COMUNICACIÓN CON SII
// =====================================================

export const siiCommunicationService = {
  // Enviar boleta al SII
  async sendInvoiceToSii(invoiceId: string): Promise<{ success: boolean; trackId?: string; error?: string }> {
    try {
      // Obtener la boleta
      const invoice = await electronicInvoiceService.getInvoiceById(invoiceId);
      if (!invoice) {
        return { success: false, error: 'Boleta no encontrada' };
      }

  // Nota: no consultamos configuración SII en cliente para evitar 400s en vistas;
  // el endpoint server-side decide simulación/credenciales por negocio.

      // Crear log de inicio
      await siiLogService.createLog({
        user_id: invoice.user_id,
        invoice_id: invoiceId,
        tipo_operacion: 'enviar',
        estado: 'pendiente'
      });

      // Preparar datos para el SII
      const siiData = {
        folio: invoice.folio,
        rut_emisor: 'N/A',
        razon_social_emisor: 'N/A',
        rut_receptor: invoice.rut_cliente || '66666666-6', // Consumidor final
        razon_social_receptor: invoice.razon_social_cliente || 'Consumidor Final',
        items: await this.getInvoiceItems(invoiceId),
        subtotal: invoice.subtotal,
        iva: invoice.iva,
        total: invoice.total
      };

      // Enviar al SII vía API server-side (centralizado y seguro)
      // Incluir token de acceso para que el backend valide la sesión
      const { data: sess } = await supabase.auth.getSession();
      const accessToken = sess?.session?.access_token;
      const resp = await fetch('/api/sii/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        body: JSON.stringify({ invoiceId })
      });
      let apiRes: any = null;
      try {
        apiRes = await resp.json();
      } catch (_) {
        const txt = await resp.text();
        apiRes = { success: false, error: txt || 'Unknown error' };
      }
      const result = resp.ok && apiRes.success
        ? ({ success: true, trackId: apiRes.trackId, codigoValidacionSii: apiRes.validationCode || apiRes.codigoValidacionSii } as const)
        : ({ success: false, error: apiRes.error || `HTTP ${resp.status}` } as const);
      
      if (result.success) {
        // Log de ayuda en cliente para verificar simulación/trackId
        if (typeof window !== 'undefined') {
          // Nota: En producción puede provenir del SII; en simulación lo genera el backend
          console.log('[SII] Envío exitoso. trackId =', result.trackId);
        }
        // Actualizar estado de la boleta
  await electronicInvoiceService.updateInvoiceStatus(invoiceId, 'aceptado', result.trackId!, '<xml>respuesta del SII</xml>', (result as any).codigoValidacionSii);
        
        // Actualizar log
        await siiLogService.createLog({
          user_id: invoice.user_id,
          invoice_id: invoiceId,
          tipo_operacion: 'enviar',
          estado: 'exitoso',
          response_data: { trackId: result.trackId, status: 'aceptado' }
        });
      } else {
        // Actualizar log de error
        await siiLogService.createLog({
          user_id: invoice.user_id,
          invoice_id: invoiceId,
          tipo_operacion: 'enviar',
          estado: 'error',
          mensaje_error: result.error
        });
      }

      return result;
    } catch (error: any) {
      console.error('Error in sendInvoiceToSii:', error);
      
      // Crear log de error
      const invoice = await electronicInvoiceService.getInvoiceById(invoiceId);
      if (invoice) {
        await siiLogService.createLog({
          user_id: invoice.user_id,
          invoice_id: invoiceId,
          tipo_operacion: 'enviar',
          estado: 'error',
          mensaje_error: error.message
        });
      }

      return { success: false, error: error.message };
    }
  },

  // Enviar datos al SII (real o simulado)
  async sendToSii(siiData: any): Promise<{ success: boolean; trackId?: string; error?: string }> {
    try {
      // Si no hay credenciales configuradas, usar simulación
      if (!SII_CONFIG.username || !SII_CONFIG.password) {
        console.log('Usando simulación SII (no hay credenciales configuradas)');
        return await this.simulateSendInvoice(siiData);
      }

      // Enviar al SII real
      const result = await siiConnection.sendInvoice(siiData);
      
      if (result.success) {
        console.log('Boleta enviada al SII exitosamente:', result.trackId);
      } else {
        console.error('Error enviando al SII:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Error en comunicación SII:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  },

  // Consultar estado de boleta en SII
  async checkInvoiceStatus(trackId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      // Si no hay credenciales configuradas, usar simulación
      if (!SII_CONFIG.username || !SII_CONFIG.password) {
        return await this.simulateCheckStatus(trackId);
      }

      // Consultar estado real en el SII
      const result = await siiConnection.getInvoiceStatus(trackId);
      return {
        success: result.status !== 'ERROR',
        status: result.status,
        error: result.status === 'ERROR' ? result.details : undefined
      };
    } catch (error: any) {
      console.error('Error in checkInvoiceStatus:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener items de la boleta
  async getInvoiceItems(invoiceId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ws_electronic_invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);

      if (error) {
        console.error('Error fetching invoice items:', error);
        return [];
      }

      return data?.map(item => ({
        cantidad: item.quantity,
        descripcion: item.product_name,
        precio_unitario: item.unit_price,
        total: item.total_price
      })) || [];
    } catch (error) {
      console.error('Error in getInvoiceItems:', error);
      return [];
    }
  },

  // Métodos de simulación para desarrollo
  async simulateSendInvoice(siiData: any): Promise<{ success: boolean; trackId?: string; error?: string }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const trackId = `SII-SIM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('Boleta enviada al SII (simulado):', trackId);
      return { success: true, trackId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  },

  async simulateCheckStatus(trackId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const statuses = ['ACEPTADO', 'RECHAZADO', 'PENDIENTE'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      return { success: true, status: randomStatus };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }
};
