'use client';
import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { supabase } from '@/services/supabase/client';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void;
  currentImage?: string | null;
  className?: string;
}

export default function ImageUpload({ onFileSelect, currentImage, className = '' }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
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
    } else {
      setPreview(null);
    }
    onFileSelect(file);
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
        </div>
      )}

      {/* Upload Button */}
      {!preview && (
        <div className={className.includes('!w-9') ? 'border-2 border-dashed border-gray-300 rounded-md p-0 flex items-center justify-center w-9 h-9' : "flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"}>
          <label className={className.includes('!w-9') ? 'cursor-pointer flex items-center justify-center w-9 h-9' : 'cursor-pointer flex flex-col items-center space-y-2'}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className={className.includes('!w-9') ? 'w-5 h-5 text-gray-400' : 'w-8 h-8 text-gray-400'} />
            {!className.includes('!w-9') && <span className="text-sm text-gray-500">Subir imagen</span>}
          </label>
        </div>
      )}
    </div>
  );
}