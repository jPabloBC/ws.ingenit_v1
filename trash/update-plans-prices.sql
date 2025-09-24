-- =====================================================
-- ACTUALIZACIÓN DE PRECIOS DE PLANES
-- =====================================================
-- Script para actualizar los precios de los planes según los precios mostrados en la página principal

-- Actualizar Plan Mensual: de $15.000 a $9.990
UPDATE ws_plans 
SET 
    price = 9990.00,
    updated_at = NOW()
WHERE name = 'Plan Mensual' AND billing_cycle = 'monthly';

-- Actualizar Plan Anual: de $144.000 a $99.990
UPDATE ws_plans 
SET 
    price = 99990.00,
    updated_at = NOW()
WHERE name = 'Plan Anual' AND billing_cycle = 'annual';

-- Verificar los cambios
SELECT 
    id,
    name,
    price,
    billing_cycle,
    discount_percentage,
    is_popular,
    updated_at
FROM ws_plans 
WHERE is_active = true
ORDER BY price ASC;
