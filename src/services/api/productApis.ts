// Servicio para integrar APIs públicas de productos

export interface ProductApiResult {
  id: string;
  name: string;
  description?: string;
  price?: number;
  image?: string;
  brand?: string;
  category?: string;
  barcode?: string;
  source: 'api';
  api_name: string;
  // Campos adicionales de OFF
  quantity?: string;
  serving_size?: string;
  labels?: string[];
  categories_list?: string[];
  packaging?: string;
  nutriscore_grade?: string;
  ecoscore_grade?: string;
  nova_group?: number;
  url?: string;
  // Extendidos
  general_name?: string;
  countries_sold?: string[];
  origin_ingredients?: string;
  manufacturing_places?: string;
  traceability_code?: string;
  official_url?: string;
  stores?: string[];
  nutrition_info?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  ingredients?: string[];
  allergens?: string[];
  country?: string;
  off_raw?: any;
}

export interface ProductSearchParams {
  query: string;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  barcode?: string;
  country?: string;
  // When true and query is a barcode, search globally (no Chile-only filter)
  barcodeGlobal?: boolean;
}

// API de productos gratuita (ejemplo con FakeStore API)
export const searchProductsFromApi = async (params: ProductSearchParams): Promise<ProductApiResult[]> => {
  try {
    const { query, limit = 10 } = params;
    
    // Usar FakeStore API (gratuita, no requiere API key)
    const response = await fetch(`https://fakestoreapi.com/products`);
    
    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status}`);
    }
    
    const products = await response.json();
    
    // Filtrar productos por query
    const filteredProducts = products
      .filter((product: any) => 
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit)
      .map((product: any): ProductApiResult => ({
        id: `api_${product.id}`,
        name: product.title,
        description: product.description,
        price: product.price,
        image: product.image,
        brand: 'FakeStore',
        category: product.category,
        source: 'api',
        api_name: 'FakeStore API',
        country: 'Global'
      }));
    
    return filteredProducts;
  } catch (error) {
    console.error('Error buscando productos en API:', error);
    return [];
  }
};

// API alternativa: DummyJSON (también gratuita)
export const searchProductsFromDummyJson = async (params: ProductSearchParams): Promise<ProductApiResult[]> => {
  try {
    const { query, limit = 10 } = params;
    
    const response = await fetch(`https://dummyjson.com/products/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.products.map((product: any): ProductApiResult => ({
      id: `dummy_${product.id}`,
      name: product.title,
      description: product.description,
      price: product.price,
      image: product.images[0],
      brand: product.brand,
      category: product.category,
      source: 'api',
      api_name: 'DummyJSON API',
      country: 'Global'
    }));
  } catch (error) {
    console.error('Error buscando productos en DummyJSON:', error);
    return [];
  }
};

// API especializada para productos de almacén - OpenFoodFacts
export const searchGroceryProducts = async (params: ProductSearchParams): Promise<ProductApiResult[]> => {
  try {
    const { query, limit = 10 } = params;
    const country = params.country || 'Chile';
    
    // OpenFoodFacts API con filtro por país (solo Chile por defecto)
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}` +
      `&tagtype_0=countries&tag_contains_0=contains&tag_0=${encodeURIComponent(country)}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error en OpenFoodFacts API: ${response.status}`);
    }
    
    const data = await response.json();
    
    return data.products
      .filter((product: any) => product.product_name && product.product_name.trim())
      // asegurar país Chile cuando se pida explícito
      .filter((product: any) => {
        if (!country) return true;
        const tags: string[] = product.countries_tags || [];
        return tags.some((t: string) => t.toLowerCase().includes('chile'));
      })
      .map((product: any): ProductApiResult => ({
        id: `food_${product.code || Math.random().toString(36).substr(2, 9)}`,
        name: product.product_name || 'Producto sin nombre',
        description: product.generic_name || product.product_name,
        price: product.price ? parseFloat(product.price) : undefined,
        image: product.image_front_url || product.image_url,
        brand: product.brands || 'Sin marca',
        category: product.categories_tags?.[0]?.replace('en:', '') || 'Alimentos',
        barcode: product.code,
        source: 'api',
        api_name: 'OpenFoodFacts',
        nutrition_info: product.nutriments ? {
          calories: product.nutriments['energy-kcal_100g'],
          protein: product.nutriments.proteins_100g,
          carbs: product.nutriments.carbohydrates_100g,
          fat: product.nutriments.fat_100g
        } : undefined,
        ingredients: product.ingredients_text_es ? 
          product.ingredients_text_es.split(',').map((i: string) => i.trim()) : 
          product.ingredients_text ? 
          product.ingredients_text.split(',').map((i: string) => i.trim()) : undefined,
        allergens: product.allergens_tags?.map((a: string) => a.replace('en:', '')),
        country: product.countries_tags?.[0]?.replace('en:', '') || 'Global'
      }));
  } catch (error) {
    console.error('Error buscando productos de almacén:', error);
    return [];
  }
};

// Base de datos de productos chilenos simulada
const chileanProductsDatabase = [
  // Bebidas
  {
    id: 'cl_1',
    name: 'Coca Cola',
    description: 'Bebida gaseosa Coca Cola, 2L',
    price: 2.50,
    image: 'https://via.placeholder.com/300x300?text=Coca+Cola',
    brand: 'Coca-Cola',
    category: 'Bebidas',
    barcode: '7800000000001',
    source: 'api' as const,
    api_name: 'Base de Datos Chilena',
    country: 'Chile'
  },
  {
    id: 'cl_2',
    name: 'Cerveza Cristal',
    description: 'Cerveza Cristal, 350ml',
    price: 1.20,
    image: 'https://via.placeholder.com/300x300?text=Cristal',
    brand: 'Cristal',
    category: 'Bebidas Alcohólicas',
    barcode: '7800000000002',
    source: 'api' as const,
    api_name: 'Base de Datos Chilena',
    country: 'Chile'
  },
  {
    id: 'cl_3',
    name: 'Leche Colun',
    description: 'Leche entera Colun, 1L',
    price: 1.80,
    image: 'https://via.placeholder.com/300x300?text=Colun',
    brand: 'Colun',
    category: 'Lácteos',
    barcode: '7800000000003',
    source: 'api' as const,
    api_name: 'Base de Datos Chilena',
    country: 'Chile',
    nutrition_info: {
      calories: 65,
      protein: 3.2,
      carbs: 4.8,
      fat: 3.6
    }
  },
  // Alimentos
  {
    id: 'cl_4',
    name: 'Pan de Molde Ideal',
    description: 'Pan de molde Ideal, 500g',
    price: 1.50,
    image: 'https://via.placeholder.com/300x300?text=Pan+Ideal',
    brand: 'Ideal',
    category: 'Panadería',
    barcode: '7800000000004',
    source: 'api' as const,
    api_name: 'Base de Datos Chilena',
    country: 'Chile'
  },
  {
    id: 'cl_5',
    name: 'Arroz Miraflores',
    description: 'Arroz Miraflores, 1kg',
    price: 2.20,
    image: 'https://via.placeholder.com/300x300?text=Arroz+Miraflores',
    brand: 'Miraflores',
    category: 'Alimentos',
    barcode: '7800000000005',
    source: 'api' as const,
    api_name: 'Base de Datos Chilena',
    country: 'Chile'
  },
  // Limpieza
  {
    id: 'cl_6',
    name: 'Detergente Omo',
    description: 'Detergente Omo líquido, 2L',
    price: 8.50,
    image: 'https://via.placeholder.com/300x300?text=Omo',
    brand: 'Omo',
    category: 'Limpieza',
    barcode: '7800000000006',
    source: 'api' as const,
    api_name: 'Base de Datos Chilena',
    country: 'Chile'
  },
  {
    id: 'cl_7',
    name: 'Jabón Lux',
    description: 'Jabón Lux, 90g',
    price: 1.30,
    image: 'https://via.placeholder.com/300x300?text=Lux',
    brand: 'Lux',
    category: 'Cuidado Personal',
    barcode: '7800000000007',
    source: 'api' as const,
    api_name: 'Base de Datos Chilena',
    country: 'Chile'
  },
  // Snacks
  {
    id: 'cl_8',
    name: 'Papas Lays',
    description: 'Papas fritas Lays, 150g',
    price: 2.80,
    image: 'https://via.placeholder.com/300x300?text=Lays',
    brand: 'Lays',
    category: 'Snacks',
    barcode: '7800000000008',
    source: 'api' as const,
    api_name: 'Base de Datos Chilena',
    country: 'Chile'
  },
  {
    id: 'cl_9',
    name: 'Chocolate Nestlé',
    description: 'Chocolate Nestlé, 100g',
    price: 3.50,
    image: 'https://via.placeholder.com/300x300?text=Nestle',
    brand: 'Nestlé',
    category: 'Snacks',
    barcode: '7800000000009',
    source: 'api' as const,
    api_name: 'Base de Datos Chilena',
    country: 'Chile'
  },
  // Bebidas
  {
    id: 'cl_10',
    name: 'Agua Vital',
    description: 'Agua mineral Vital, 1.5L',
    price: 1.00,
    image: 'https://via.placeholder.com/300x300?text=Vital',
    brand: 'Vital',
    category: 'Bebidas',
    barcode: '7800000000010',
    source: 'api' as const,
    api_name: 'Base de Datos Chilena',
    country: 'Chile'
  },
  // Productos adicionales para pruebas
  {
    id: 'cl_11',
    name: 'Aceite Chef',
    description: 'Aceite de cocina Chef, 1L',
    price: 3.20,
    image: 'https://via.placeholder.com/300x300?text=Chef',
    brand: 'Chef',
    category: 'Alimentos',
    barcode: '1234567890123',
    source: 'api' as const,
    api_name: 'Base de Datos Chilena',
    country: 'Chile'
  },
  {
    id: 'cl_12',
    name: 'Azúcar Iansa',
    description: 'Azúcar granulada Iansa, 1kg',
    price: 1.80,
    image: 'https://via.placeholder.com/300x300?text=Iansa',
    brand: 'Iansa',
    category: 'Alimentos',
    barcode: '1234567890124',
    source: 'api' as const,
    api_name: 'Base de Datos Chilena',
    country: 'Chile'
  },
  {
    id: 'cl_13',
    name: 'Harina Blanca Flor',
    description: 'Harina de trigo Blanca Flor, 1kg',
    price: 2.10,
    image: 'https://via.placeholder.com/300x300?text=Blanca+Flor',
    brand: 'Blanca Flor',
    category: 'Alimentos',
    barcode: '1234567890125',
    source: 'api' as const,
    api_name: 'Base de Datos Chilena',
    country: 'Chile'
  },
  {
    id: 'cl_14',
    name: 'Atún Camanchaca',
    description: 'Atún en agua Camanchaca, 170g',
    price: 2.50,
    image: 'https://via.placeholder.com/300x300?text=Camanchaca',
    brand: 'Camanchaca',
    category: 'Enlatados',
    barcode: '1234567890126',
    source: 'api' as const,
    api_name: 'Base de Datos Chilena',
    country: 'Chile'
  },
  {
    id: 'cl_15',
    name: 'Cerveza Austral',
    description: 'Cerveza Austral, 350ml',
    price: 1.50,
    image: 'https://via.placeholder.com/300x300?text=Austral',
    brand: 'Austral',
    category: 'Bebidas Alcohólicas',
    barcode: '1234567890127',
    source: 'api' as const,
    api_name: 'Base de Datos Chilena',
    country: 'Chile'
  }
];

// Sugerencias locales por prefijo de código de barras (para búsqueda interactiva)
export const searchLocalBarcodes = (prefix: string, limit: number = 5): ProductApiResult[] => {
  try {
    const clean = (prefix || '').trim().replace(/[^0-9]/g, '');
    if (!clean) return [];
    return chileanProductsDatabase
      .filter(p => (p.barcode || '').startsWith(clean))
      .slice(0, limit);
  } catch (error) {
    return [];
  }
};

// API para productos chilenos
export const searchChileanProducts = async (params: ProductSearchParams): Promise<ProductApiResult[]> => {
  try {
    const { query, limit = 10 } = params;
    
    // Filtrar productos chilenos por query
    const filteredProducts = chileanProductsDatabase
      .filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.brand.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
    
    return filteredProducts;
  } catch (error) {
    console.error('Error buscando productos chilenos:', error);
    return [];
  }
};

// Búsqueda por código de barras mejorada
export const searchProductByBarcode = async (barcode: string, opts?: { global?: boolean }): Promise<ProductApiResult | null> => {
  try {
    console.log('🔍 Iniciando búsqueda por código de barras:', barcode);
    console.log('📊 Total de productos en base de datos chilena:', chileanProductsDatabase.length);
    
    // Limpiar el código de barras (eliminar espacios y caracteres especiales)
    const cleanBarcode = barcode.trim().replace(/[^0-9]/g, '');
    console.log('🧹 Código de barras limpio:', cleanBarcode);
    
    // Primero buscar en la base de datos chilena
    console.log('🇨🇱 Buscando en base de datos chilena...');
    const chileanProduct = chileanProductsDatabase.find(p => p.barcode === cleanBarcode);
    
    if (chileanProduct) {
      console.log('✅ Producto encontrado en base de datos chilena:', chileanProduct.name);
      console.log('📦 Detalles del producto:', {
        id: chileanProduct.id,
        name: chileanProduct.name,
        brand: chileanProduct.brand,
        category: chileanProduct.category,
        price: chileanProduct.price
      });
      return chileanProduct;
    }
    
    console.log('❌ Producto no encontrado en base de datos chilena');
    console.log('🔍 Códigos disponibles en base chilena:', chileanProductsDatabase.map(p => p.barcode));
    
    // Si no está en la base chilena, buscar en OpenFoodFacts (alimentos)
    console.log('🌍 Buscando en OpenFoodFacts...');
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`);
    
    if (!response.ok) {
      console.log('❌ Error en OpenFoodFacts API:', response.status, response.statusText);
      // Intentar en Open Beauty Facts (aseo personal)
      console.log('🔁 Probando en OpenBeautyFacts...');
      const beautyRes = await fetch(`https://world.openbeautyfacts.org/api/v0/product/${cleanBarcode}.json`);
      if (beautyRes.ok) {
        const bdata = await beautyRes.json();
        if (bdata.status === 1 && bdata.product) {
          const p = bdata.product;
          const hasChile = opts?.global ? true : ((p.countries_tags || []).some((t: string) => t.toLowerCase().includes('chile')) || String(p.code||'').startsWith('780'));
          if (hasChile) {
            return {
              id: `beauty_${p.code}`,
              name: p.product_name || 'Producto sin nombre',
              description: p.generic_name || p.product_name,
              image: p.image_front_url || p.image_url,
              brand: p.brands || 'Sin marca',
              category: (p.categories_tags?.[0] || '').replace('en:','') || 'Cuidado Personal',
              barcode: p.code,
              source: 'api',
              api_name: 'OpenBeautyFacts',
              quantity: p.quantity,
              packaging: p.packaging,
              labels: (p.labels_tags || []).map((l: string) => l.replace(/^\w+:/,'')),
              categories_list: (p.categories_tags || []).map((c: string) => c.replace(/^\w+:/,'')),
              country: (p.countries_tags?.[0] || '').replace('en:','') || 'Chile',
              off_raw: p
            };
          }
        }
      }
      // Intentar en Open Product Facts (hogar/limpieza)
      console.log('🔁 Probando en OpenProductFacts...');
      const prodRes = await fetch(`https://world.openproductsfacts.org/api/v0/product/${cleanBarcode}.json`);
      if (prodRes.ok) {
        const pdata = await prodRes.json();
        if (pdata.status === 1 && pdata.product) {
          const p = pdata.product;
          const hasChile = opts?.global ? true : ((p.countries_tags || []).some((t: string) => t.toLowerCase().includes('chile')) || String(p.code||'').startsWith('780'));
          if (hasChile) {
            return {
              id: `nonfood_${p.code}`,
              name: p.product_name || 'Producto sin nombre',
              description: p.generic_name || p.product_name,
              image: p.image_front_url || p.image_url,
              brand: p.brands || 'Sin marca',
              category: (p.categories_tags?.[0] || '').replace('en:','') || 'Limpieza',
              barcode: p.code,
              source: 'api',
              api_name: 'OpenProductFacts',
              quantity: p.quantity,
              packaging: p.packaging,
              labels: (p.labels_tags || []).map((l: string) => l.replace(/^\w+:/,'')),
              categories_list: (p.categories_tags || []).map((c: string) => c.replace(/^\w+:/,'')),
              country: (p.countries_tags?.[0] || '').replace('en:','') || 'Chile',
              off_raw: p
            };
          }
        }
      }
      return null;
    }
    
    const data = await response.json();
    
    if (data.status === 0 || !data.product) {
      console.log('❌ Producto no encontrado en OpenFoodFacts');
      return null;
    }
    
    const product = data.product;
    // Solo Chile: aceptar si OFF marca Chile o si el código empieza con 780 (GS1 Chile)
    const offTags: string[] = product.countries_tags || [];
    const hasChileTag = offTags.some((t: string) => t.toLowerCase().includes('chile'));
    const isChilePrefix = String(product.code || '').startsWith('780');
    const isChile = opts?.global ? true : (hasChileTag || isChilePrefix);
    if (!isChile) {
      console.log('Producto encontrado no es de Chile, ignorando');
      return null;
    }
    console.log('✅ Producto encontrado en OpenFoodFacts:', product.product_name);
    
    return {
      id: `food_${product.code}`,
      name: product.product_name || 'Producto sin nombre',
      description: product.generic_name || product.product_name,
      price: product.price ? parseFloat(product.price) : undefined,
      image: product.image_front_url || product.image_url,
      brand: product.brands || 'Sin marca',
      category: product.categories_tags?.[0]?.replace('en:', '') || 'Alimentos',
      barcode: product.code,
      source: 'api',
      api_name: 'OpenFoodFacts',
      quantity: product.quantity,
      serving_size: product.serving_size,
      labels: (product.labels_tags || []).map((l: string) => l.replace(/^\w+:/, '')),
      categories_list: (product.categories_tags || []).map((c: string) => c.replace(/^\w+:/, '')),
      packaging: product.packaging,
      nutriscore_grade: product.nutriscore_grade,
      ecoscore_grade: product.ecoscore_grade,
      nova_group: product.nova_group,
      url: product.url,
      nutrition_info: product.nutriments ? {
        calories: product.nutriments['energy-kcal_100g'],
        protein: product.nutriments.proteins_100g,
        carbs: product.nutriments.carbohydrates_100g,
        fat: product.nutriments.fat_100g
      } : undefined,
      ingredients: product.ingredients_text_es ? 
        product.ingredients_text_es.split(',').map((i: string) => i.trim()) : 
        product.ingredients_text ? 
        product.ingredients_text.split(',').map((i: string) => i.trim()) : undefined,
      allergens: product.allergens_tags?.map((a: string) => a.replace('en:', '')),
      country: product.countries_tags?.[0]?.replace('en:', '') || 'Global',
      off_raw: product
    };
  } catch (error) {
    console.error('💥 Error buscando producto por código de barras:', error);
    return null;
  }
};
// Aseo personal (Open Beauty Facts) solo Chile
export const searchBeautyProducts = async (params: ProductSearchParams): Promise<ProductApiResult[]> => {
  try {
    const { query, limit = 10 } = params;
    const country = params.country || 'Chile';
    const url = `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}&tagtype_0=countries&tag_contains_0=contains&tag_0=${encodeURIComponent(country)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('OBF error');
    const data = await res.json();
    return (data.products || [])
      .filter((p: any) => p.product_name)
      .map((p: any): ProductApiResult => ({
        id: `beauty_${p.code || Math.random().toString(36).slice(2)}`,
        name: p.product_name,
        description: p.generic_name || p.product_name,
        image: p.image_front_url || p.image_url,
        brand: p.brands || 'Sin marca',
        category: (p.categories_tags?.[0] || '').replace('en:','') || 'Cuidado Personal',
        barcode: p.code,
        source: 'api',
        api_name: 'OpenBeautyFacts',
        quantity: p.quantity,
        packaging: p.packaging,
        labels: (p.labels_tags || []).map((l: string) => l.replace(/^\w+:/,'')),
        categories_list: (p.categories_tags || []).map((c: string) => c.replace(/^\w+:/,'')),
        country: (p.countries_tags?.[0] || '').replace('en:','') || 'Chile',
        off_raw: p
      }));
  } catch (error) {
    return [];
  }
};

// No alimentarios (hogar/limpieza) desde Open Product Facts solo Chile
export const searchNonFoodProducts = async (params: ProductSearchParams): Promise<ProductApiResult[]> => {
  try {
    const { query, limit = 10 } = params;
    const country = params.country || 'Chile';
    const url = `https://world.openproductsfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}&tagtype_0=countries&tag_contains_0=contains&tag_0=${encodeURIComponent(country)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('OPF error');
    const data = await res.json();
    return (data.products || [])
      .filter((p: any) => p.product_name)
      .map((p: any): ProductApiResult => ({
        id: `nonfood_${p.code || Math.random().toString(36).slice(2)}`,
        name: p.product_name,
        description: p.generic_name || p.product_name,
        image: p.image_front_url || p.image_url,
        brand: p.brands || 'Sin marca',
        category: (p.categories_tags?.[0] || '').replace('en:','') || 'Limpieza',
        barcode: p.code,
        source: 'api',
        api_name: 'OpenProductFacts',
        quantity: p.quantity,
        packaging: p.packaging,
        labels: (p.labels_tags || []).map((l: string) => l.replace(/^\w+:/,'')),
        categories_list: (p.categories_tags || []).map((c: string) => c.replace(/^\w+:/,'')),
        country: (p.countries_tags?.[0] || '').replace('en:','') || 'Chile',
        off_raw: p
      }));
  } catch (error) {
    return [];
  }
};

// API para productos de limpieza y hogar
export const searchHouseholdProducts = async (params: ProductSearchParams): Promise<ProductApiResult[]> => {
  try {
    const { query, limit = 10 } = params;
    
    // Simular productos de limpieza (en un caso real usarías una API específica)
    const householdProducts = [
      {
        id: 'clean_1',
        name: 'Detergente Líquido',
        description: 'Detergente para ropa, 2L',
        price: 8.99,
        image: 'https://via.placeholder.com/300x300?text=Detergente',
        brand: 'LimpiezaMax',
        category: 'Limpieza',
        barcode: '1234567890123',
        source: 'api' as const,
        api_name: 'Productos Simulados',
        country: 'Global'
      },
      {
        id: 'clean_2',
        name: 'Jabón Líquido',
        description: 'Jabón para manos, 500ml',
        price: 3.50,
        image: 'https://via.placeholder.com/300x300?text=Jabon',
        brand: 'LimpiezaMax',
        category: 'Limpieza',
        barcode: '1234567890124',
        source: 'api' as const,
        api_name: 'Productos Simulados',
        country: 'Global'
      },
      {
        id: 'clean_3',
        name: 'Desinfectante',
        description: 'Desinfectante multiuso, 1L',
        price: 5.99,
        image: 'https://via.placeholder.com/300x300?text=Desinfectante',
        brand: 'LimpiezaMax',
        category: 'Limpieza',
        barcode: '1234567890125',
        source: 'api' as const,
        api_name: 'Productos Simulados',
        country: 'Global'
      }
    ];
    
    return householdProducts
      .filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
  } catch (error) {
    console.error('Error buscando productos de limpieza:', error);
    return [];
  }
};

// API para bebidas (botillería)
export const searchBeverageProducts = async (params: ProductSearchParams): Promise<ProductApiResult[]> => {
  try {
    const { query, limit = 10 } = params;
    
    // Simular productos de bebidas
    const beverageProducts = [
      {
        id: 'bev_1',
        name: 'Coca Cola',
        description: 'Bebida gaseosa, 2L',
        price: 2.50,
        image: 'https://via.placeholder.com/300x300?text=Coca+Cola',
        brand: 'Coca-Cola',
        category: 'Bebidas',
        barcode: '1234567890126',
        source: 'api' as const,
        api_name: 'Productos Simulados',
        country: 'Global'
      },
      {
        id: 'bev_2',
        name: 'Agua Mineral',
        description: 'Agua mineral natural, 1.5L',
        price: 1.20,
        image: 'https://via.placeholder.com/300x300?text=Agua',
        brand: 'AguaPura',
        category: 'Bebidas',
        barcode: '1234567890127',
        source: 'api' as const,
        api_name: 'Productos Simulados',
        country: 'Global'
      },
      {
        id: 'bev_3',
        name: 'Jugo de Naranja',
        description: 'Jugo natural, 1L',
        price: 3.99,
        image: 'https://via.placeholder.com/300x300?text=Jugo',
        brand: 'FrutasFrescas',
        category: 'Bebidas',
        barcode: '1234567890128',
        source: 'api' as const,
        api_name: 'Productos Simulados',
        country: 'Global'
      }
    ];
    
    return beverageProducts
      .filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, limit);
  } catch (error) {
    console.error('Error buscando productos de bebidas:', error);
    return [];
  }
};

// Función principal que combina múltiples APIs para almacén
export const searchProductsFromAllApis = async (params: ProductSearchParams): Promise<ProductApiResult[]> => {
  try {
    const { query, limit = 20, category, country = 'Chile' } = params;
    const q = (query || '').trim();
    const looksLikeBarcode = /^\d{8,14}$/.test(q);
    
    // Si hay una categoría específica, buscar en esa categoría
    if (category) {
      switch (category.toLowerCase()) {
        case 'alimentos':
        case 'food':
          return await searchGroceryProducts(params);
        case 'limpieza':
        case 'cleaning':
          return await searchHouseholdProducts(params);
        case 'bebidas':
        case 'beverages':
          return await searchBeverageProducts(params);
        default:
          break;
      }
    }
    
    // Si parece código de barras, priorizar búsqueda directa por código
    if (looksLikeBarcode) {
      const byCode = await searchProductByBarcode(q, { global: !!params.barcodeGlobal });
      if (byCode) {
        return [byCode];
      }
    }

    // Búsqueda general combinando APIs, priorizando/limitando a Chile
    const tasks: PromiseSettledResult<ProductApiResult[]>[] = await Promise.allSettled([
      searchChileanProducts({ ...params, country }),
      searchGroceryProducts({ ...params, country }),
      searchBeautyProducts({ ...params, country }),
      searchNonFoodProducts({ ...params, country })
    ] as any);
    
    const allProducts: ProductApiResult[] = tasks
      .filter(t => t.status === 'fulfilled')
      .flatMap((t: any) => t.value as ProductApiResult[]);
    
    // Eliminar duplicados basados en nombre similar
    const uniqueProducts = allProducts.filter((product, index, self) => 
      index === self.findIndex(p => 
        p.name.toLowerCase() === product.name.toLowerCase()
      )
    );
    
    // Solo Chile: filtrar por country cuando esté presente
    const filtered = uniqueProducts.filter(p => !country || (p.country || '').toLowerCase().includes('chile'));
    return filtered.slice(0, params.limit || 20);
  } catch (error) {
    console.error('Error buscando productos en todas las APIs:', error);
    return [];
  }
};

// Obtener detalles de un producto específico
export const getProductDetails = async (productId: string): Promise<ProductApiResult | null> => {
  try {
    // Determinar qué API usar basado en el ID
    if (productId.startsWith('api_')) {
      const id = productId.replace('api_', '');
      const response = await fetch(`https://fakestoreapi.com/products/${id}`);
      
      if (!response.ok) return null;
      
      const product = await response.json();
      
      return {
        id: productId,
        name: product.title,
        description: product.description,
        price: product.price,
        image: product.image,
        brand: 'FakeStore',
        category: product.category,
        source: 'api',
        api_name: 'FakeStore API',
        country: 'Global'
      };
    }
    
    if (productId.startsWith('dummy_')) {
      const id = productId.replace('dummy_', '');
      const response = await fetch(`https://dummyjson.com/products/${id}`);
      
      if (!response.ok) return null;
      
      const product = await response.json();
      
      return {
        id: productId,
        name: product.title,
        description: product.description,
        price: product.price,
        image: product.images[0],
        brand: product.brand,
        category: product.category,
        source: 'api',
        api_name: 'DummyJSON API',
        country: 'Global'
      };
    }
    
    if (productId.startsWith('food_')) {
      const barcode = productId.replace('food_', '');
      return await searchProductByBarcode(barcode);
    }
    
    if (productId.startsWith('cl_')) {
      const id = productId.replace('cl_', '');
      return chileanProductsDatabase.find(p => p.id === productId) || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo detalles del producto:', error);
    return null;
  }
};

// Obtener categorías disponibles para almacén
  // Removido: función no usada
















// Buscar productos por categoría específica de almacén
export const searchProductsByCategory = async (category: string, limit = 10): Promise<ProductApiResult[]> => {
  try {
    const params: ProductSearchParams = { query: category, limit };
    
    switch (category.toLowerCase()) {
      case 'alimentos':
      case 'food':
        return await searchGroceryProducts(params);
      case 'limpieza':
      case 'cleaning':
        return await searchHouseholdProducts(params);
      case 'bebidas':
      case 'beverages':
        return await searchBeverageProducts(params);
      default:
        // Búsqueda general
        const response = await fetch(`https://fakestoreapi.com/products/category/${encodeURIComponent(category)}`);
        
        if (!response.ok) {
          throw new Error(`Error obteniendo productos por categoría: ${response.status}`);
        }
        
        const products = await response.json();
        
        return products.slice(0, limit).map((product: any): ProductApiResult => ({
          id: `api_${product.id}`,
          name: product.title,
          description: product.description,
          price: product.price,
          image: product.image,
          brand: 'FakeStore',
          category: product.category,
          source: 'api',
          api_name: 'FakeStore API',
          country: 'Global'
        }));
    }
  } catch (error) {
    console.error('Error buscando productos por categoría:', error);
    return [];
  }
};

// Función de prueba para verificar la búsqueda por código de barras
export const testBarcodeSearch = async (): Promise<void> => {
  console.log('🧪 Iniciando pruebas de búsqueda por código de barras...');
  
  const testCodes = [
    '7800000000001', // Coca Cola
    '7800000000003', // Leche Colun
    '1234567890123', // Aceite Chef
    '9999999999999'  // Código inexistente
  ];
  
  for (const code of testCodes) {
    console.log(`\n🔍 Probando código: ${code}`);
    const result = await searchProductByBarcode(code);
    
    if (result) {
      console.log(`✅ ÉXITO: Encontrado "${result.name}" (${result.brand})`);
    } else {
      console.log(`❌ FALLO: No se encontró producto con código ${code}`);
    }
  }
  
  console.log('\n📊 Resumen de productos disponibles:');
  chileanProductsDatabase.forEach(product => {
    console.log(`- ${product.barcode}: ${product.name} (${product.brand})`);
  });
};

// Función de prueba simple para verificar códigos de barras
export const testBarcodeFunction = (): void => {
  console.log('🧪 === PRUEBA DE CÓDIGOS DE BARRAS ===');
  console.log('📊 Productos en base de datos:', chileanProductsDatabase.length);
  
  // Mostrar todos los códigos disponibles
  console.log('🔍 Códigos disponibles:');
  chileanProductsDatabase.forEach((product, index) => {
    console.log(`${index + 1}. ${product.barcode} - ${product.name} (${product.brand})`);
  });
  
  // Probar algunos códigos específicos
  const testCodes = ['7800000000001', '7800000000003', '1234567890123'];
  
  console.log('\n🔍 Probando códigos específicos:');
  testCodes.forEach(code => {
    const found = chileanProductsDatabase.find(p => p.barcode === code);
    if (found) {
      console.log(`✅ ${code} - ENCONTRADO: ${found.name}`);
    } else {
      console.log(`❌ ${code} - NO ENCONTRADO`);
    }
  });
  
  console.log('🧪 === FIN DE PRUEBA ===');
};
