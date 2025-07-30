'use client';

import { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/services/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  onImageUpload: (url: string) => void;
  currentImage?: string | null;
  className?: string;
}

export default function ImageUpload({ onImageUpload, currentImage, className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const { storeType } = useStore();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      
      if (!file) {
        toast.error('No se seleccionó ningún archivo');
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error('Solo se permiten archivos de imagen');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('El archivo es demasiado grande. Máximo 5MB');
        return;
      }

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Determinar el bucket basado en el tipo de tienda
      const bucketName = storeType ? `${storeType}-products` : 'products';
      
      console.log('Uploading to bucket:', bucketName);
      console.log('File:', file.name, file.size, file.type);

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Subir archivo a Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading file:', error);
        
        // Si el bucket no existe, intentar con el bucket por defecto
        if (error.message.includes('bucket') || error.message.includes('not found')) {
          console.log('Bucket not found, trying default bucket...');
          const { data: fallbackData, error: fallbackError } = await supabase.storage
            .from('products')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (fallbackError) {
            console.error('Error uploading to fallback bucket:', fallbackError);
            toast.error('Error al subir la imagen');
            return;
          }

          const { data: urlData } = supabase.storage
            .from('products')
            .getPublicUrl(filePath);

          onImageUpload(urlData.publicUrl);
          toast.success('Imagen subida exitosamente');
          return;
        }

        toast.error('Error al subir la imagen');
        return;
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      onImageUpload(urlData.publicUrl);
      toast.success('Imagen subida exitosamente');

    } catch (error) {
      console.error('Error in handleFileUpload:', error);
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setPreview(null);
    onImageUpload('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview */}
      {preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Button */}
      {!preview && (
        <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
          <label className="cursor-pointer flex flex-col items-center space-y-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
            {uploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-500">Subir imagen</span>
              </>
            )}
          </label>
        </div>
      )}

      {/* Current Image Display */}
      {currentImage && !preview && (
        <div className="relative inline-block">
          <img
            src={currentImage}
            alt="Current"
            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
          />
          <button
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
} 