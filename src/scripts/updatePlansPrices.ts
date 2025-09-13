import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

/**
 * Script para actualizar los precios de los planes en la base de datos
 * para que coincidan con los precios mostrados en la página principal
 */
export async function updatePlansPrices() {
  try {
    console.log('🔄 Actualizando precios de planes...');

    // Actualizar Plan Mensual: de $15.000 a $9.990
    const { error: monthlyError } = await supabase
      .from('ws_plans')
      .update({
        price: 9990.00,
        updated_at: new Date().toISOString()
      })
      .eq('name', 'Plan Mensual')
      .eq('billing_cycle', 'monthly');

    if (monthlyError) {
      console.error('❌ Error actualizando Plan Mensual:', monthlyError);
      return { success: false, error: monthlyError };
    }

    console.log('✅ Plan Mensual actualizado: $9.990');

    // Actualizar Plan Anual: de $144.000 a $99.990
    const { error: annualError } = await supabase
      .from('ws_plans')
      .update({
        price: 99990.00,
        updated_at: new Date().toISOString()
      })
      .eq('name', 'Plan Anual')
      .eq('billing_cycle', 'annual');

    if (annualError) {
      console.error('❌ Error actualizando Plan Anual:', annualError);
      return { success: false, error: annualError };
    }

    console.log('✅ Plan Anual actualizado: $99.990');

    // Verificar los cambios
    const { data: plans, error: fetchError } = await supabase
      .from('ws_plans')
      .select('id, name, price, billing_cycle, discount_percentage, is_popular, updated_at')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (fetchError) {
      console.error('❌ Error verificando planes:', fetchError);
      return { success: false, error: fetchError };
    }

    console.log('📋 Planes actualizados:');
    plans?.forEach(plan => {
      console.log(`  - ${plan.name}: $${plan.price.toLocaleString('es-CL')} (${plan.billing_cycle})`);
    });

    return { success: true, plans };

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return { success: false, error };
  }
}

// Función para ejecutar desde la consola del navegador
export function runUpdatePlansPrices() {
  return updatePlansPrices();
}
