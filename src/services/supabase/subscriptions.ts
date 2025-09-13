import { supabaseAdmin as supabase } from './admin';

// =====================================================
// TIPOS DE DATOS PARA SUSCRIPCIONES
// =====================================================

export interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  billing_cycle: 'monthly' | 'annual';
  max_products: number | null;
  max_stock_per_product: number | null;
  features: string[];
  limitations: string[];
  is_popular: boolean;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: number;
  user_id: string;
  plan_id: number;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  start_date: string;
  end_date: string | null;
  next_billing_date: string | null;
  payment_method: string | null;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount_paid: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface UsageLimits {
  id: string;
  user_id: string;
  current_stores: number;
  current_products: number;
  total_stock: number;
  last_updated: string;
}

export interface PaymentHistory {
  id: number;
  subscription_id: number;
  amount: number;
  currency: string;
  payment_method: string | null;
  transaction_id: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_date: string;
  created_at: string;
}

export interface UserCurrentPlan {
  plan_id: number;
  plan_name: string;
  plan_price: number;
  billing_cycle: string;
  max_products: number | null;
  max_stock_per_product: number | null;
  features: string[];
  limitations: string[];
  subscription_status: string;
  next_billing_date: string | null;
}

export interface UserLimits {
  can_add_product: boolean;
  can_add_stock: boolean;
  current_products: number;
  current_stock_total: number;
  max_products: number | null;
  max_stock_per_product: number | null;
}

// =====================================================
// SERVICIO DE PLANES
// =====================================================

export const plansService = {
  // Obtener todos los planes activos
  async getAllPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('ws_plans')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      throw new Error('Error al obtener los planes');
    }

    return data || [];
  },

  // Obtener un plan específico por ID
  async getPlanById(planId: number): Promise<Plan | null> {
    const { data, error } = await supabase
      .from('ws_plans')
      .select('*')
      .eq('id', planId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching plan:', error);
      return null;
    }

    return data;
  },

  // Obtener el plan gratuito
  async getFreePlan(): Promise<Plan | null> {
    const { data, error } = await supabase
      .from('ws_plans')
      .select('*')
      .eq('price', 0)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching free plan:', error);
      return null;
    }

    return data;
  },

  // Obtener el plan más popular
  async getPopularPlan(): Promise<Plan | null> {
    const { data, error } = await supabase
      .from('ws_plans')
      .select('*')
      .eq('is_popular', true)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching popular plan:', error);
      return null;
    }

    return data;
  }
};

// =====================================================
// SERVICIO DE SUSCRIPCIONES
// =====================================================

export const subscriptionService = {
  // Obtener la suscripción actual del usuario
  async getCurrentSubscription(userId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('ws_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching current subscription:', error);
      return null;
    }

    return data;
  },

  // Obtener el plan actual del usuario con información completa
  async getCurrentUserPlan(userId: string): Promise<UserCurrentPlan | null> {
    const { data, error } = await supabase
      .rpc('get_user_current_plan', { user_uuid: userId });

    if (error) {
      console.error('Error fetching user current plan:', error);
      return null;
    }

    return data?.[0] || null;
  },

  // Crear una nueva suscripción
  async createSubscription(
    userId: string,
    planId: number,
    paymentMethod?: string
  ): Promise<Subscription | null> {
    const plan = await plansService.getPlanById(planId);
    if (!plan) {
      throw new Error('Plan no encontrado');
    }

    // Calcular fechas
    const startDate = new Date();
    const endDate = plan.billing_cycle === 'annual' 
      ? new Date(startDate.getFullYear() + 1, startDate.getMonth(), startDate.getDate())
      : new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate());

    const { data, error } = await supabase
      .from('ws_subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'pending',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        next_billing_date: endDate.toISOString(),
        payment_method: paymentMethod,
        payment_status: 'pending',
        amount_paid: plan.price,
        currency: 'CLP'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      throw new Error('Error al crear la suscripción');
    }

    return data;
  },

  // Actualizar el estado de una suscripción
  async updateSubscriptionStatus(
    subscriptionId: number,
    status: Subscription['status'],
    paymentStatus?: Subscription['payment_status']
  ): Promise<Subscription | null> {
    const updateData: any = { status };
    if (paymentStatus) {
      updateData.payment_status = paymentStatus;
    }

    const { data, error } = await supabase
      .from('ws_subscriptions')
      .update(updateData)
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      throw new Error('Error al actualizar la suscripción');
    }

    return data;
  },

  // Cancelar una suscripción
  async cancelSubscription(subscriptionId: number): Promise<Subscription | null> {
    return this.updateSubscriptionStatus(subscriptionId, 'cancelled');
  },

  // Obtener historial de suscripciones del usuario
  async getUserSubscriptionHistory(userId: string): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('ws_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscription history:', error);
      return [];
    }

    return data || [];
  }
};

// =====================================================
// SERVICIO DE LÍMITES DE USO
// =====================================================

export const usageService = {
  // Obtener límites de uso del usuario
  async getUserLimits(userId: string): Promise<UserLimits | null> {
    const { data, error } = await supabase
      .rpc('check_user_limits', { user_uuid: userId });

    if (error) {
      console.error('Error fetching user limits:', error);
      return null;
    }

    return data?.[0] || null;
  },

  // Obtener estadísticas de uso
  async getUsageStatistics(userId: string): Promise<UsageLimits | null> {
    const { data, error } = await supabase
      .from('ws_usage')
      .select('*')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching usage statistics:', error);
      return null;
    }

    return data;
  },

  // Actualizar uso de productos
  async updateProductUsage(userId: string, productCount: number): Promise<void> {
    const { error } = await supabase
      .from('ws_usage')
      .upsert({
        user_id: userId,
        current_products: productCount,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating product usage:', error);
      throw new Error('Error al actualizar el uso de productos');
    }
  },

  // Actualizar uso de stock
  async updateStockUsage(userId: string, stockTotal: number): Promise<void> {
    const { error } = await supabase
      .from('ws_usage')
      .upsert({
        user_id: userId,
        current_stock_total: stockTotal,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating stock usage:', error);
      throw new Error('Error al actualizar el uso de stock');
    }
  },

  // Verificar si el usuario puede agregar más productos
  async canAddProduct(userId: string): Promise<boolean> {
    const limits = await this.getUserLimits(userId);
    return limits?.can_add_product || false;
  },

  // Verificar si el usuario puede agregar más stock
  async canAddStock(userId: string): Promise<boolean> {
    const limits = await this.getUserLimits(userId);
    return limits?.can_add_stock || false;
  }
};

// =====================================================
// SERVICIO DE HISTORIAL DE PAGOS
// =====================================================

export const paymentService = {
  // Obtener historial de pagos de una suscripción
  async getPaymentHistory(subscriptionId: number): Promise<PaymentHistory[]> {
    const { data, error } = await supabase
      .from('ws_payment_history')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }

    return data || [];
  },

  // Registrar un nuevo pago
  async recordPayment(
    subscriptionId: number,
    amount: number,
    paymentMethod: string,
    transactionId?: string
  ): Promise<PaymentHistory | null> {
    const { data, error } = await supabase
      .from('ws_payment_history')
      .insert({
        subscription_id: subscriptionId,
        amount,
        currency: 'CLP',
        payment_method: paymentMethod,
        transaction_id: transactionId,
        status: 'completed',
        payment_date: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording payment:', error);
      throw new Error('Error al registrar el pago');
    }

    return data;
  },

  // Actualizar estado de un pago
  async updatePaymentStatus(
    paymentId: number,
    status: PaymentHistory['status']
  ): Promise<PaymentHistory | null> {
    const { data, error } = await supabase
      .from('ws_payment_history')
      .update({ status })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment status:', error);
      throw new Error('Error al actualizar el estado del pago');
    }

    return data;
  }
};

// =====================================================
// FUNCIONES DE UTILIDAD
// =====================================================

export const subscriptionUtils = {
  // Formatear precio para mostrar
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  },

  // Calcular precio con descuento
  calculateDiscountedPrice(originalPrice: number, discountPercentage: number): number {
    return originalPrice * (1 - discountPercentage / 100);
  },

  // Verificar si un plan es gratuito
  isFreePlan(plan: Plan): boolean {
    return plan.price === 0;
  },

  // Verificar si un plan tiene límites
  hasLimits(plan: Plan): boolean {
    return plan.max_products !== null || plan.max_stock_per_product !== null;
  },

  // Obtener descripción de límites
  getLimitsDescription(plan: Plan): string {
    if (!this.hasLimits(plan)) {
      return 'Sin límites';
    }

    const limits = [];
    if (plan.max_products !== null) {
      limits.push(`${plan.max_products} productos máximo`);
    }
    if (plan.max_stock_per_product !== null) {
      limits.push(`${plan.max_stock_per_product} stock por producto`);
    }

    return limits.join(', ');
  }
};

// =====================================================
// FIN DEL ARCHIVO
// ===================================================== 