-- =====================================================
-- SCHEMA DE SUSCRIPCIONES - INGENIT STORE MANAGER
-- =====================================================

-- Tabla de planes de suscripción
CREATE TABLE IF NOT EXISTS ws_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
    max_products INTEGER,
    max_stock_per_product INTEGER,
    features JSONB DEFAULT '[]',
    limitations JSONB DEFAULT '[]',
    is_popular BOOLEAN DEFAULT false,
    discount_percentage INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de suscripciones de usuarios
CREATE TABLE IF NOT EXISTS ws_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES ws_plans(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    next_billing_date TIMESTAMP,
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    amount_paid DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'CLP',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de historial de pagos
CREATE TABLE IF NOT EXISTS ws_payment_history (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES ws_subscriptions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CLP',
    payment_method VARCHAR(50),
    transaction_id VARCHAR(100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de límites de uso por usuario
CREATE TABLE IF NOT EXISTS ws_usage_limits (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES ws_plans(id) ON DELETE RESTRICT,
    current_products INTEGER DEFAULT 0,
    current_stock_total INTEGER DEFAULT 0,
    max_products INTEGER,
    max_stock_per_product INTEGER,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- DATOS INICIALES DE PLANES
-- =====================================================

-- Plan Gratuito
INSERT INTO ws_plans (name, description, price, billing_cycle, max_products, max_stock_per_product, features, limitations, is_popular, is_active) VALUES (
    'Plan Gratuito',
    'Perfecto para empezar y probar la plataforma',
    0.00,
    'monthly',
    5,
    5,
    '["Sin límite de días de uso", "Funcionalidades básicas", "Soporte por email"]',
    '["Máximo 5 productos", "Máximo 5 en stock por producto", "Funcionalidades limitadas"]',
    false,
    true
);

-- Plan Mensual
INSERT INTO ws_plans (name, description, price, billing_cycle, max_products, max_stock_per_product, features, limitations, is_popular, is_active) VALUES (
    'Plan Mensual',
    'Ideal para negocios establecidos que necesitan escalabilidad',
    15000.00,
    'monthly',
    NULL, -- Sin límite
    NULL, -- Sin límite
    '["Productos ilimitados", "Stock ilimitado", "Todas las funcionalidades", "Reportes avanzados", "Soporte prioritario", "Integración WebPay"]',
    '[]',
    true,
    true
);

-- Plan Anual
INSERT INTO ws_plans (name, description, price, billing_cycle, max_products, max_stock_per_product, features, limitations, discount_percentage, is_popular, is_active) VALUES (
    'Plan Anual',
    'La mejor opción para grandes empresas con descuento especial',
    144000.00,
    'annual',
    NULL, -- Sin límite
    NULL, -- Sin límite
    '["Productos ilimitados", "Stock ilimitado", "Todas las funcionalidades", "Reportes avanzados", "Soporte VIP 24/7", "Integración WebPay", "API personalizada"]',
    '[]',
    20,
    false,
    true
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON ws_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON ws_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON ws_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_id ON ws_usage_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_subscription_id ON ws_payment_history(subscription_id);

-- Índices para consultas de facturación
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing ON ws_subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_status ON ws_subscriptions(payment_status);

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para actualizar timestamp de actualización
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON ws_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON ws_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para obtener el plan actual de un usuario
CREATE OR REPLACE FUNCTION get_user_current_plan(user_uuid UUID)
RETURNS TABLE (
    plan_id INTEGER,
    plan_name VARCHAR(50),
    plan_price DECIMAL(10,2),
    billing_cycle VARCHAR(20),
    max_products INTEGER,
    max_stock_per_product INTEGER,
    features JSONB,
    limitations JSONB,
    subscription_status VARCHAR(20),
    next_billing_date TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.price,
        p.billing_cycle,
        p.max_products,
        p.max_stock_per_product,
        p.features,
        p.limitations,
        s.status,
        s.next_billing_date
    FROM ws_subscriptions s
    JOIN ws_plans p ON s.plan_id = p.id
    WHERE s.user_id = user_uuid 
    AND s.status = 'active'
    ORDER BY s.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar límites de uso
CREATE OR REPLACE FUNCTION check_user_limits(user_uuid UUID)
RETURNS TABLE (
    can_add_product BOOLEAN,
    can_add_stock BOOLEAN,
    current_products INTEGER,
    current_stock_total INTEGER,
    max_products INTEGER,
    max_stock_per_product INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN ul.max_products IS NULL THEN true
            WHEN ul.current_products < ul.max_products THEN true
            ELSE false
        END as can_add_product,
        CASE 
            WHEN ul.max_stock_per_product IS NULL THEN true
            WHEN ul.current_stock_total < ul.max_stock_per_product THEN true
            ELSE false
        END as can_add_stock,
        ul.current_products,
        ul.current_stock_total,
        ul.max_products,
        ul.max_stock_per_product
    FROM ws_usage_limits ul
    WHERE ul.user_id = user_uuid
    ORDER BY ul.last_updated DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista de suscripciones activas con información de planes
CREATE OR REPLACE VIEW v_active_subscriptions AS
SELECT 
    s.id as subscription_id,
    s.user_id,
    p.name as plan_name,
    p.price as plan_price,
    p.billing_cycle,
    s.status,
    s.start_date,
    s.end_date,
    s.next_billing_date,
    s.payment_status,
    s.amount_paid
FROM ws_subscriptions s
JOIN ws_plans p ON s.plan_id = p.id
WHERE s.status = 'active';

-- Vista de estadísticas de uso
CREATE OR REPLACE VIEW v_usage_statistics AS
SELECT 
    ul.user_id,
    p.name as plan_name,
    ul.current_products,
    ul.current_stock_total,
    ul.max_products,
    ul.max_stock_per_product,
    CASE 
        WHEN ul.max_products IS NULL THEN 0
        ELSE ROUND((ul.current_products::DECIMAL / ul.max_products::DECIMAL) * 100, 2)
    END as products_usage_percentage
FROM ws_usage_limits ul
JOIN ws_subscriptions s ON ul.user_id = s.user_id
JOIN ws_plans p ON s.plan_id = p.id
WHERE s.status = 'active';

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE ws_plans IS 'Tabla que almacena los diferentes planes de suscripción disponibles';
COMMENT ON TABLE ws_subscriptions IS 'Tabla que almacena las suscripciones activas de los usuarios';
COMMENT ON TABLE ws_payment_history IS 'Tabla que almacena el historial de pagos de las suscripciones';
COMMENT ON TABLE ws_usage_limits IS 'Tabla que almacena los límites de uso actuales de cada usuario';

COMMENT ON COLUMN ws_plans.features IS 'Array JSON con las características incluidas en el plan';
COMMENT ON COLUMN ws_plans.limitations IS 'Array JSON con las limitaciones del plan';
COMMENT ON COLUMN ws_subscriptions.status IS 'Estado de la suscripción: active, cancelled, expired, pending';
COMMENT ON COLUMN ws_subscriptions.payment_status IS 'Estado del pago: pending, completed, failed, refunded';

-- =====================================================
-- FIN DEL SCHEMA
-- ===================================================== 