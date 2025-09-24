-- =====================================================
-- FUNCIONES RPC PARA SUSCRIPCIONES - INGENIT STORE MANAGER
-- =====================================================

-- Nota: Solo creamos las funciones RPC faltantes que causan el bucle infinito

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
    FROM app_ws.ws_subscriptions s
    JOIN app_ws.ws_plans p ON s.plan_id = p.id
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
    -- La tabla ws_usage_limits no existe, devolver límites por defecto (sin límites)
    RETURN QUERY SELECT
        true as can_add_product,
        true as can_add_stock,
        0 as current_products,
        0 as current_stock_total,
        NULL as max_products,
        NULL as max_stock_per_product;
END;
$$ LANGUAGE plpgsql;

-- Función para crear suscripción gratuita
CREATE OR REPLACE FUNCTION create_free_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    free_plan_id INTEGER;
    existing_subscription INTEGER;
BEGIN
    -- Obtener el ID del plan gratuito (asumiendo que es el primero)
    SELECT id INTO free_plan_id FROM app_ws.ws_plans WHERE price = 0.00 LIMIT 1;

    -- Verificar si ya existe una suscripción activa para este usuario
    SELECT COUNT(*) INTO existing_subscription
    FROM app_ws.ws_subscriptions
    WHERE user_id = user_uuid AND status = 'active';

    -- Si ya tiene suscripción activa, no crear otra
    IF existing_subscription > 0 THEN
        RETURN TRUE;
    END IF;

    -- Crear suscripción gratuita
    INSERT INTO app_ws.ws_subscriptions (
        user_id,
        plan_id,
        status,
        start_date,
        payment_status,
        amount_paid,
        currency
    ) VALUES (
        user_uuid,
        free_plan_id,
        'active',
        NOW(),
        'completed',
        0.00,
        'CLP'
    );

    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql; 