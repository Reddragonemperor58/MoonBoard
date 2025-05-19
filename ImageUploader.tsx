import React, { useCallback, useState } from 'react';
import { ImageSticker } from '../../types/moodboard';
import { v4 as uuidv4 } from 'uuid';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface ImageUploaderProps {
  onUpload: (sticker: ImageSticker) => void;
  timeSegmentId: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onUpload, timeSegmentId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressionLevel, setCompressionLevel] = useState<number>(0.8);

  const optimizeImage = async (file: File): Promise<{ dataUrl: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;

          // Calculate new dimensions (max 1200px width/height)
          let width = img.width;
          let height = img.height;
          const maxSize = 1200;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP format for better compression
          const dataUrl = canvas.toDataURL('image/webp', compressionLevel);
          resolve({ dataUrl, width, height });
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];    if (!file) return;

    setIsLoading(true);
    setError(null);
    setPreview(null);

    try {
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      const { dataUrl, width, height } = await optimizeImage(file);
      
      const imageSticker: ImageSticker = {
        id: uuidv4(),
        type: 'image',
        content: dataUrl,
        timeSegmentId,
        x: 0,
        y: 0,
        width: Math.min(300, width), // Default display width
        height: Math.min(300 * (height / width), height), // Maintain aspect ratio
        rotation: 0,
        zIndex: 1,
        originalSize: { width, height },
        alt: file.name
      };

      onUpload(imageSticker);    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup preview URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);
  return (    <div className="relative space-y-4">
      <div 
        className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors
          ${isLoading ? 'cursor-wait' : 'hover:border-blue-500 cursor-pointer'}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isLoading) e.currentTarget.classList.add('border-blue-500');
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.classList.remove('border-blue-500');
        }}
        onDrop={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.classList.remove('border-blue-500');
          
          const file = e.dataTransfer.files[0];
          if (file && file.type.startsWith('image/')) {
            await handleFileChange({ target: { files: [file] } } as any);
          } else {
            setError('Please drop an image file');
          }
        }}
        onClick={() => document.getElementById('image-upload')?.click()}>
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-h-48 mx-auto object-contain"
              loading="lazy"
            />
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="text-gray-500">
            <PhotoIcon className="w-12 h-12 mx-auto mb-2" />
            <p>Drag and drop an image or click to browse</p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="image-upload"
          disabled={isLoading}
        />
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm text-gray-600">
          Image Quality: {Math.round(compressionLevel * 100)}%
        </label>
        <input
          type="range"
          min="0.3"
          max="1"
          step="0.1"
          value={compressionLevel}
          onChange={(e) => setCompressionLevel(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <button
        onClick={() => document.getElementById('image-upload')?.click()}
        className={`
          w-full flex items-center justify-center px-4 py-2 rounded-md
          ${isLoading
            ? 'bg-gray-300 cursor-wait'
            : 'bg-blue-500 hover:bg-blue-600 cursor-pointer'}
          text-white transition-colors
        `}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Upload Image'}
      </button>

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  );
};

export default ImageUploader;
