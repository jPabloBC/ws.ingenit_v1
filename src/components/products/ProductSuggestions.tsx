'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, Package, TrendingUp } from 'lucide-react';
// Removido: import no usado
// Removido: import no usado
import { ProductApiResult, searchProductsFromAllApis } from '@/services/api/productApis';
import Button from '@/components/ui/Button';

interface ProductSuggestionsProps {
  onProductSelect: (product: ProductApiResult) => void;
}

const popularCategories = [
  'Alimentos',
  'Limpieza',
  'Bebidas',
  'Lácteos',
  'Panadería',
  'Frutas y Verduras',
  'Carnes',
  'Congelados'
];

export default function ProductSuggestions({ onProductSelect }: ProductSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<{ [category: string]: ProductApiResult[] }>({});
  const [loading, setLoading] = useState<{ [category: string]: boolean }>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const loadCategorySuggestions = async (category: string) => {
    if (suggestions[category]) return; // Ya cargados

    setLoading(prev => ({ ...prev, [category]: true }));

    try {
      const products = await searchProductsFromAllApis({
        query: category,
        limit: 6
      });
      setSuggestions(prev => ({
        ...prev,
        [category]: products
      }));
    } catch (error) {
      console.error(`Error cargando sugerencias para ${category}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [category]: false }));
    }
  };

  const handleCategoryClick = (category: string) => {
    if (expandedCategory === category) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(category);
      loadCategorySuggestions(category);
    }
  };

  const handleProductSelect = (product: ProductApiResult) => {
    onProductSelect(product);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-5 w-5 text-blue8" />
        <h3 className="text-lg font-semibold text-gray-900">
          Productos Sugeridos
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {popularCategories.map((category) => (
          <div key={category} className="border border-gray-200 rounded-lg p-4">
            <button
              onClick={() => handleCategoryClick(category)}
              className="w-full text-left space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 capitalize">
                  {category.replace('-', ' ')}
                </h4>
                <Package className="h-4 w-4 text-gray-400" />
              </div>
              
              {loading[category] && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 text-blue8 animate-spin" />
                </div>
              )}

              {expandedCategory === category && suggestions[category] && (
                <div className="space-y-2">
                  {suggestions[category].slice(0, 3).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProductSelect(product);
                      }}
                    >
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-8 h-8 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/placeholder-product.png';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        {product.price && (
                          <p className="text-xs text-blue8 font-medium">
                            ${product.price}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {suggestions[category].length > 3 && (
                    <div className="text-xs text-gray-500 text-center pt-2">
                      +{suggestions[category].length - 3} más productos
                    </div>
                  )}
                </div>
              )}

              {expandedCategory !== category && !loading[category] && (
                <p className="text-sm text-gray-600">
                  Haz clic para ver productos populares
                </p>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          💡 Estas sugerencias provienen de APIs públicas gratuitas
        </p>
      </div>
    </div>
  );
}
