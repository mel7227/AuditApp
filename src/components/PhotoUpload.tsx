import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Image, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { resizeImage } from '../utils/imageUtils';

interface PhotoUploadProps {
  onClose: () => void;
  onUpload: (photos: Array<{ file: File; url: string }>) => void;
}

interface UploadedPhoto {
  file: File;
  url: string;
  id: string;
  order: number;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ onClose, onUpload }) => {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    if (!files) return;

    setIsProcessing(true);
    const newPhotos: UploadedPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const resizedUrl = await resizeImage(file);
          newPhotos.push({
            file,
            url: resizedUrl,
            id: `${Date.now()}-${i}`,
            order: photos.length + i + 1
          });
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    setIsProcessing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const filtered = prev.filter(photo => photo.id !== id);
      // Reorder remaining photos
      return filtered.map((photo, index) => ({
        ...photo,
        order: index + 1
      }));
    });
  };

  const deletePhoto = (id: string) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      removePhoto(id);
    }
  };
  const movePhoto = (id: string, direction: 'up' | 'down') => {
    setPhotos(prev => {
      const index = prev.findIndex(photo => photo.id === id);
      if (index === -1) return prev;

      const newPhotos = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= newPhotos.length) return prev;

      // Swap positions
      [newPhotos[index], newPhotos[targetIndex]] = [newPhotos[targetIndex], newPhotos[index]];

      // Update order numbers
      return newPhotos.map((photo, idx) => ({
        ...photo,
        order: idx + 1
      }));
    });
  };

  const updatePhotoOrder = (id: string, newOrder: number) => {
    if (newOrder < 1 || newOrder > photos.length) return;

    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (!photo) return prev;

      const otherPhotos = prev.filter(p => p.id !== id);
      const updatedPhotos = [...otherPhotos];
      
      updatedPhotos.splice(newOrder - 1, 0, { ...photo, order: newOrder });
      
      return updatedPhotos.map((p, index) => ({
        ...p,
        order: index + 1
      }));
    });
  };

  const handleSubmit = () => {
    if (photos.length === 0) return;
    
    const sortedPhotos = photos.sort((a, b) => a.order - b.order);
    onUpload(sortedPhotos);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Upload Photos</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Upload size={24} className="text-green-600" />
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Camera size={24} className="text-blue-600" />
                </div>
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">Upload or capture photos</p>
                <p className="text-gray-600 mt-1">Drag and drop files here, or click to browse</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Image size={16} />
                  Browse Files
                </button>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Camera size={16} />
                  Take Photo
                </button>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e.target.files!)}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="camera"
            onChange={(e) => handleFileSelect(e.target.files!)}
            className="hidden"
          />

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Processing images...</span>
            </div>
          )}

          {/* Photos Grid */}
          {photos.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-4">
                Selected Photos ({photos.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {photos
                  .sort((a, b) => a.order - b.order)
                  .map((photo) => (
                  <div key={photo.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <img
                        src={photo.url}
                        alt={photo.file.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {photo.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(photo.file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">Order:</span>
                          <input
                            type="number"
                            min="1"
                            max={photos.length}
                            value={photo.order}
                            onChange={(e) => updatePhotoOrder(photo.id, parseInt(e.target.value))}
                            className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => movePhoto(photo.id, 'up')}
                          disabled={photo.order === 1}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          onClick={() => movePhoto(photo.id, 'down')}
                          disabled={photo.order === photos.length}
                          className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          onClick={() => deletePhoto(photo.id)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={photos.length === 0 || isProcessing}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create Issue ({photos.length} photos)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};