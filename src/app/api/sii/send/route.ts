import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/admin';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const invoiceId: string | undefined = body?.invoiceId;
    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'invoiceId is required' }, { status: 400 });
    }

    // Requerir usuario autenticado vía Authorization: Bearer <token>
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const token = authHeader?.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7)
      : undefined;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const requesterUserId = userData.user.id;

    // Cargar boleta desde Supabase usando la vista pública (evitar .schema no permitido)
    const { data: invoice, error: invErr } = await supabaseAdmin
      .from('ws_electronic_invoices')
      .select('*')
      .eq('id', invoiceId)
      .maybeSingle();
    if (invErr) {
      return NextResponse.json({ success: false, error: invErr.message }, { status: 400 });
    }
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });
    }

    // Validar ownership: la boleta debe pertenecer al usuario autenticado
    if (invoice.user_id !== requesterUserId) {
      return NextResponse.json({ success: false, error: 'Forbidden: invoice does not belong to user' }, { status: 403 });
    }

    // Cargar configuración SII priorizando negocio si existe, usando vista pública si está disponible
    const businessId = (invoice as any).business_id as string | undefined;
    let config: any = null;
    try {
      if (businessId) {
        const { data } = await supabaseAdmin
          .from('ws_sii_config')
          .select('*')
          .eq('business_id', businessId)
          .maybeSingle();
        config = data || null;
      }
      if (!config) {
        const { data } = await supabaseAdmin
          .from('ws_sii_config')
          .select('*')
          .eq('user_id', invoice.user_id)
          .maybeSingle();
        config = data || null;
      }
    } catch (_) {
      // Si la vista pública no existe o no está expuesta, continuamos sin config y simulamos
      config = null;
    }
    // Si no hay config, simulamos para no bloquear pruebas locales
    if (!config) {
      const trackId = `SII-SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const folio = (invoice as any).folio as number | undefined;
      const validationCode = folio ? `SII-${folio}-${trackId.slice(-6).toUpperCase()}` : `SII-${trackId.slice(-10).toUpperCase()}`;
      // Persistir en DB
      await supabaseAdmin
        .from('ws_electronic_invoices')
        .update({ estado_sii: 'aceptado', track_id: trackId, codigo_validacion_sii: validationCode, updated_at: new Date().toISOString() })
        .eq('id', invoiceId);
      return NextResponse.json({ success: true, simulated: true, reason: 'no-config', environment: 'development', trackId, validationCode, codigoValidacionSii: validationCode }, { status: 200 });
    }

  // Variables de entorno (solo toggles globales, no credenciales)
  const forceSimulation = process.env.SII_SIMULATION === 'true' || !!config?.simulate;

    // Determinar ambiente por configuración de negocio: 'certificacion' | 'produccion'
    const cfgEnv = (config?.ambiente_sii === 'produccion') ? 'production' : 'development';

    // Validar que la configuración tenga credenciales requeridas por negocio
    const hasPerTenantCreds = !!(config?.certificado_digital && config?.password_certificado && config?.rut_empresa);

    // Hasta cablear SOAP real: siempre simulamos si forceSimulation o faltan credenciales.
    if (forceSimulation || !hasPerTenantCreds) {
      const reason = forceSimulation ? 'forced' : 'missing-credentials';
      const trackId = `SII-SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const folio = (invoice as any).folio as number | undefined;
      const validationCode = folio ? `SII-${folio}-${trackId.slice(-6).toUpperCase()}` : `SII-${trackId.slice(-10).toUpperCase()}`;
      await supabaseAdmin
        .from('ws_electronic_invoices')
        .update({ estado_sii: 'aceptado', track_id: trackId, codigo_validacion_sii: validationCode, updated_at: new Date().toISOString() })
        .eq('id', invoiceId);
      return NextResponse.json({ success: true, simulated: true, reason, environment: cfgEnv, trackId, validationCode, codigoValidacionSii: validationCode }, { status: 200 });
    }

    // TODO (real): Implementar integración con SII según cfgEnv usando certificado del negocio (config.certificado_digital/password_certificado)
    // Por ahora, devolver stub indicando que hay credenciales por negocio presentes
    const trackId = `SII-CERT-STUB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const folio = (invoice as any).folio as number | undefined;
    const validationCode = folio ? `SII-${folio}-${trackId.slice(-6).toUpperCase()}` : `SII-${trackId.slice(-10).toUpperCase()}`;
    await supabaseAdmin
      .from('ws_electronic_invoices')
      .update({ estado_sii: 'aceptado', track_id: trackId, codigo_validacion_sii: validationCode, updated_at: new Date().toISOString() })
      .eq('id', invoiceId);
    return NextResponse.json({ success: true, simulated: true, environment: cfgEnv, trackId, validationCode, codigoValidacionSii: validationCode }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Unexpected error' }, { status: 500 });
  }
}
