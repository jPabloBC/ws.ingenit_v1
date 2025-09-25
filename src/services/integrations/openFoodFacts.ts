import { createProduct, CreateProductData } from '@/services/supabase/products';
import { getCategories, createCategory, Category } from '@/services/supabase/categories';
import { searchProductByBarcode, ProductApiResult } from '@/services/api/productApis';

// TODO: Implement usageService
const usageService = {
  canAddProduct: async (userId: string) => true
};

interface OpenFoodFactsProduct {
  product_name?: string;
  brands?: string;
  categories?: string;
  image_url?: string;
  image_front_url?: string;
  code?: string;
  quantity?: string;
}

interface OpenFoodFactsResponse {
  products: OpenFoodFactsProduct[];
}

export async function fetchChileProducts(pageSize: number = 50): Promise<OpenFoodFactsProduct[]> {
  const url = `https://world.openfoodfacts.org/country/chile.json?page_size=${pageSize}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`OFF request failed: ${res.status}`);
  }
  const data: OpenFoodFactsResponse = await res.json();
  return data.products || [];
}

export async function fetchProductByBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
  const clean = (barcode || '').trim();
  if (!clean) return null;
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(clean)}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    return null;
  }
  const data = await res.json();
  if (data && data.status === 1 && data.product) {
    const p = data.product as OpenFoodFactsProduct;
    return {
      product_name: p.product_name,
      brands: p.brands,
      categories: p.categories,
      image_url: p.image_url,
      image_front_url: p.image_front_url,
      code: p.code,
      quantity: p.quantity,
    };
  }
  return null;
}

function pickCategoryName(offCategories?: string): string {
  if (!offCategories) return 'Alimentos';
  const first = offCategories.split(',').map(s => s.trim()).filter(Boolean)[0];
  return first || 'Alimentos';
}

async function ensureCategory(categoryName: string, storeType?: string): Promise<Category> {
  const categories = await getCategories(storeType);
  const existing = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
  if (existing) return existing;
  const created = await createCategory({
    name: categoryName,
    description: `Importado desde Open Food Facts`,
    color: '#10B981',
    store_type: storeType || 'almacen',
  });
  if (!created) {
    // fallback: return any existing or a stub to avoid breaking
    return categories[0] ?? { id: '', name: categoryName, description: '', color: '#10B981', created_at: '', updated_at: '' };
  }
  return created;
}

function mapToCreateProduct(off: OpenFoodFactsProduct, categoryId: string): CreateProductData | null {
  const name = off.product_name?.trim();
  if (!name) return null;
  const descriptionParts = [off.brands?.trim(), off.quantity?.trim()].filter(Boolean);
  const description = descriptionParts.join(' · ');
  const image_url = off.image_url || off.image_front_url;
  const product: CreateProductData = {
    name,
    description,
    price: 0,
    cost: 0,
    stock: 0,
    min_stock: 0,
    category_id: categoryId,
    image_url: image_url || undefined,
  };
  return product;
}



export async function importProductByBarcode(userId: string, businessId: string, barcode: string): Promise<{ success: boolean; productId?: string; productName?: string; reason?: string; }>{
  // 1) Intentar en OpenFoodFacts (OFF)
  const product = await fetchProductByBarcode(barcode);
  
  // 2) Si OFF no lo tiene, intentar con nuestro buscador (base CL + OFF fallback)
  let apiFallback: ProductApiResult | null = null;
  if (!product) {
    try {
      apiFallback = await searchProductByBarcode(barcode);
    } catch (error) {
      apiFallback = null;
    }
  }
  
  if (!product && !apiFallback) {
    return { success: false, reason: 'No encontrado en APIs públicas' };
  }

  const categoryName = product ? pickCategoryName(product.categories) : (apiFallback?.category || 'Alimentos');
  const category = await ensureCategory(categoryName);

  const canAdd = await usageService.canAddProduct(userId);
  if (!canAdd) return { success: false, reason: 'Límite de productos alcanzado' };

  // Construir el producto a crear, ya sea desde OFF o desde el fallback
  let mapped: CreateProductData | null = null;
  if (product) {
    mapped = mapToCreateProduct(product, category.id);
    if (product.code && mapped) (mapped as any).barcode = product.code;
    // Mapear metadatos extendidos
    Object.assign(mapped as any, {
      general_name: (product as any).generic_name || undefined,
      quantity: product.quantity || undefined,
      packaging: (product as any).packaging || undefined,
      brand: product.brands || undefined,
      labels: (product as any).labels ? String((product as any).labels).split(',').map((s: string) => s.trim()) : undefined,
      categories_list: (product as any).categories ? String((product as any).categories).split(',').map((s: string) => s.trim()) : undefined,
      countries_sold: (product as any).countries ? String((product as any).countries).split(',').map((s: string) => s.trim()) : undefined,
      origin_ingredients: (product as any).origins || undefined,
      manufacturing_places: (product as any).manufacturing_places || undefined,
      traceability_code: (product as any).trace || undefined,
      official_url: (product as any).url || undefined,
      off_metadata: product,
    });
  } else if (apiFallback) {
    const descriptionParts = [apiFallback.brand, apiFallback.category].filter(Boolean) as string[];
    const description = descriptionParts.join(' · ');
    mapped = {
      name: apiFallback.name,
      description,
      price: apiFallback.price || 0,
      cost: 0,
      stock: 0,
      min_stock: 0,
      category_id: category.id,
      image_url: apiFallback.image || undefined,
    };
    if (apiFallback.barcode) (mapped as any).barcode = apiFallback.barcode;
  }
  if (!mapped) return { success: false, reason: 'Producto inválido' };

  const result = await createProduct(mapped, { businessId });
  if (!result.success) return { success: false, reason: result.error || 'Error al crear producto' };
  return { success: true, productId: result.data?.id, productName: mapped.name };
}


