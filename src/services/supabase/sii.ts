import { supabaseAdmin as supabase } from './admin';

// =====================================================
// INTERFACES PARA SII
// =====================================================

export interface SiiConfig {
  id: string;
  user_id: string;
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
  async getConfig(userId: string): Promise<SiiConfig | null> {
    try {
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

      // Primero verificar si ya existe una configuración para este usuario
      const { data: existingConfig } = await supabase
        .from('ws_sii_config')
        .select('*')
        .eq('user_id', config.user_id)
        .maybeSingle();

      let result;
      
      if (existingConfig) {
        // Actualizar configuración existente
        const { data, error } = await supabase
          .from('ws_sii_config')
          .update(config)
          .eq('user_id', config.user_id)
          .select()
          .maybeSingle();

        if (error) {
          console.error('Error updating SII config:', error);
          return { success: false, error: error.message };
        }

        result = data;
      } else {
        // Crear nueva configuración
        const { data, error } = await supabase
          .from('ws_sii_config')
          .insert(config)
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
      // Generar folio automático
      const folio = await this.generateFolio(invoiceData.user_id!);
      const resolvedAppId = (invoiceData as any).app_id || DEFAULT_APP_ID;
      const baseInvoice: any = {
        ...invoiceData,
        app_id: resolvedAppId,
        folio,
        estado_sii: 'pendiente'
      };

      // Incluir business_id sólo si viene
      if ((invoiceData as any).business_id) {
        baseInvoice.business_id = (invoiceData as any).business_id;
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

      // Si la columna app_id no existe, reintentar sin app_id
      if (invoiceError) {
        const code0 = invoiceError.code || '';
        const message0 = invoiceError.message || '';
        const noAppId = code0 === '42703' || /app_id|column .* does not exist/i.test(message0);
        if (noAppId && 'app_id' in baseInvoice) {
          const { app_id, ...withoutApp } = baseInvoice;
          const res2 = await supabase
            .from('ws_electronic_invoices')
            .insert(withoutApp)
            .select()
            .maybeSingle();
          invoice = res2.data;
          invoiceError = res2.error;
        }
      }

      // Si id es NOT NULL sin default, reintentar con UUID local
      if (invoiceError) {
        const code1 = invoiceError.code || '';
        const message1 = invoiceError.message || '';
        const nullId = code1 === '23502' && /column "id"|columna "id"|null value in column "id"/i.test(message1);
        if (nullId) {
          const payloadWithId = { ...baseInvoice, id: generateUUID() };
          const res3 = await supabase
            .from('ws_electronic_invoices')
            .insert(payloadWithId)
            .select()
            .maybeSingle();
          invoice = res3.data;
          invoiceError = res3.error;
        }
      }

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
          items:ws_electronic_invoice_items(*)
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
          items:ws_electronic_invoice_items(*)
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
  async updateInvoiceStatus(invoiceId: string, status: ElectronicInvoice['estado_sii'], trackId?: string, xmlRespuesta?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        estado_sii: status,
        updated_at: new Date().toISOString()
      };

      if (trackId) updateData.track_id = trackId;
      if (xmlRespuesta) updateData.xml_respuesta = xmlRespuesta;

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
  async generateFolio(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('generate_electronic_invoice_folio', { user_uuid: userId });

      if (!error && typeof data === 'number') {
        return data;
      }

      // Fallback: usar el mayor folio del usuario + 1
      const { data: last, error: lastErr } = await supabase
        .from('ws_electronic_invoices')
        .select('folio')
        .eq('user_id', userId)
        .order('folio', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastErr) {
        console.error('Folio fallback query error:', lastErr);
        return 1;
      }
      const next = (last?.folio as number | undefined) ?? 0;
      return (next || 0) + 1;
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
      const { data, error } = await supabase
        .from('ws_sii_logs')
        .insert(logData)
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

      // Obtener configuración SII
      const config = await siiConfigService.getConfig(invoice.user_id);
      if (!config) {
        return { success: false, error: 'Configuración SII no encontrada' };
      }

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
        rut_emisor: config.rut_empresa,
        razon_social_emisor: config.razon_social,
        rut_receptor: invoice.rut_cliente || '66666666-6', // Consumidor final
        razon_social_receptor: invoice.razon_social_cliente || 'Consumidor Final',
        items: await this.getInvoiceItems(invoiceId),
        subtotal: invoice.subtotal,
        iva: invoice.iva,
        total: invoice.total
      };

      // Enviar al SII (real o simulado)
      const result = await this.sendToSii(siiData);
      
      if (result.success) {
        // Actualizar estado de la boleta
        await electronicInvoiceService.updateInvoiceStatus(invoiceId, 'aceptado', result.trackId!, '<xml>respuesta del SII</xml>');
        
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
