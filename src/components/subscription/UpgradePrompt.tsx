'use client';
import { AlertTriangle, Crown, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface UpgradePromptProps {
  currentUsage: {
    products: number;
    stock: number;
  };
  limits: {
    maxProducts: number;
    maxStockPerProduct: number;
  };
  onClose?: () => void;
}

export default function UpgradePrompt({ 
  currentUsage, 
  limits, 
  onClose 
}: UpgradePromptProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Mostrar prompt si está cerca de los límites (80% o más)
    const productsPercentage = (currentUsage.products / limits.maxProducts) * 100;
    const stockPercentage = (currentUsage.stock / limits.maxStockPerProduct) * 100;
    
    if (productsPercentage >= 80 || stockPercentage >= 80) {
      setShowPrompt(true);
    }
  }, [currentUsage, limits]);

  const handleUpgrade = () => {
    router.push('/plans');
  };

  const handleClose = () => {
    setShowPrompt(false);
    onClose?.();
  };

  if (!showPrompt || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full bg-white shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <Crown className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                ¡Actualiza tu plan!
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
              <p className="text-sm text-gray-600">
                Estás cerca de alcanzar los límites de tu plan gratuito
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Productos:</span>
                <span className="font-medium">
                  {currentUsage.products} / {limits.maxProducts}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stock por producto:</span>
                <span className="font-medium">
                  {currentUsage.stock} / {limits.maxStockPerProduct}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Con un plan premium:</strong> Productos ilimitados, stock ilimitado y todas las funcionalidades avanzadas.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Ver Planes
            </Button>
            <Button
              onClick={handleClose}
              variant="outline"
              className="flex-1"
            >
              Más tarde
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
