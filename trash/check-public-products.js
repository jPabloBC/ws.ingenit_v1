#!/usr/bin/env node

// Script para verificar datos en ws_public_products
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://juupotamdjqzpxuqdtco.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dXBvdGFtZGpxenB4dXFkdGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MDIyMTgsImV4cCI6MjA2NTI3ODIxOH0.8aXgTBg4vhs0DmTKPg9WGTvQ9hHBd_uCGHgt89ZfM_E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPublicProducts() {
  console.log('🔍 Verificando datos en ws_public_products...\n');

  try {
    // Verificar si la tabla existe y tiene datos
    const { data: wsData, error: wsError } = await supabase
      .from('ws_public_products')
      .select('*')
      .limit(5);

    if (wsError) {
      console.error('❌ Error accediendo a ws_public_products:', wsError.message);
    } else {
      console.log(`✅ ws_public_products existe. Registros encontrados: ${wsData?.length || 0}`);
      if (wsData && wsData.length > 0) {
        console.log('📋 Muestra de datos:');
        wsData.forEach((item, index) => {
          console.log(`${index + 1}. ${item.name} - ${item.barcode || 'Sin código'}`);
        });
      }
    }

    console.log('');

    // Verificar si la vista public_products existe
    const { data: viewData, error: viewError } = await supabase
      .from('public_products')
      .select('*')
      .limit(5);

    if (viewError) {
      console.error('❌ Error accediendo a public_products (vista):', viewError.message);
    } else {
      console.log(`✅ public_products (vista) existe. Registros encontrados: ${viewData?.length || 0}`);
      if (viewData && viewData.length > 0) {
        console.log('📋 Muestra de datos de la vista:');
        viewData.forEach((item, index) => {
          console.log(`${index + 1}. ${item.name} - ${item.barcode || 'Sin código'}`);
        });
      }
    }

    console.log('');

    // Probar búsqueda específica
    const testSearchTerm = '7806500241430';
    console.log(`🔍 Probando búsqueda con término: "${testSearchTerm}"`);

    const { data: searchData, error: searchError } = await supabase
      .from('public_products')
      .select('*')
      .or(`name.ilike.%${testSearchTerm}%,description.ilike.%${testSearchTerm}%,brand.ilike.%${testSearchTerm}%,category.ilike.%${testSearchTerm}%,barcode.eq.${testSearchTerm}`)
      .limit(10);

    if (searchError) {
      console.error('❌ Error en búsqueda:', searchError.message);
    } else {
      console.log(`🔍 Resultados de búsqueda: ${searchData?.length || 0}`);
      if (searchData && searchData.length > 0) {
        searchData.forEach((item, index) => {
          console.log(`${index + 1}. ${item.name} - ${item.barcode || 'Sin código'} - ${item.brand || 'Sin marca'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkPublicProducts();