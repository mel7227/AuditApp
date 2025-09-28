import React, { useState, useRef } from 'react';
import { X, Upload, Camera, CheckCircle, FileText } from 'lucide-react';
import { Issue } from '../types';
import { resizeImage } from '../utils/imageUtils';

interface SignOffModalProps {
  issue: Issue;
  onClose: () => void;
  onSignOff: (signOffData: {
    notes: string;
    photo?: {
      id: string;
      url: string;
      fileName: string;
      uploadDate: string;
    };
  }) => void;
}

export const SignOffModal: React.FC<SignOffModalProps> = ({ issue, onClose, onSignOff }) => {
  const [notes, setNotes] = useState(issue.signOffNotes || '');
  const [photo, setPhoto] = useState<{
    id: string;
    url: string;
    fileName: string;
    uploadDate: string;
  } | null>(issue.signOffPhoto || null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    setIsProcessing(true);
    try {
      const resizedUrl = await resizeImage(file);
      const newPhoto = {
        id: Date.now().toString(),
        url: resizedUrl,
        fileName: file.name,
        uploadDate: new Date().toISOString()
      };
      setPhoto(newPhoto);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoUpload(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignOff({
      notes: notes.trim(),
      photo: photo || undefined
    });
  };

  const handleRemoveSignOff = () => {
    if (window.confirm('Are you sure you want to remove the sign-off? This will mark the issue as incomplete.')) {
      onSignOff({
        notes: '',
        photo: undefined
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {issue.signedOff ? 'Update Sign-off' : 'Sign Off Issue'}
              </h2>
              <p className="text-sm text-gray-600">Issue #{issue.order}: {issue.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Current Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Current Status</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Completion:</strong> {issue.completed ? 'Completed' : 'Pending'}</p>
              <p><strong>Sign-off:</strong> {issue.signedOff ? `Signed off on ${new Date(issue.signOffDate!).toLocaleDateString()}` : 'Not signed off'}</p>
              {issue.assignedTo && <p><strong>Assigned to:</strong> {issue.assignedTo}</p>}
            </div>
          </div>

          {/* Close-out Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText size={16} className="inline mr-1" />
              Close-out Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what was done to resolve this issue..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Document the actions taken to resolve this issue
            </p>
          </div>

          {/* Close-out Photo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Camera size={16} className="inline mr-1" />
              Close-out Photo (Optional)
            </label>
            
            {!photo ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Upload size={20} className="text-green-600" />
                    </div>
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Camera size={20} className="text-blue-600" />
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Upload evidence photo</p>
                    <p className="text-sm text-gray-600">Show the completed work or resolution</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                    >
                      <Upload size={14} />
                      Browse Files
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                    >
                      <Camera size={14} />
                      Take Photo
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <img
                    src={photo.url}
                    alt={photo.fileName}
                    className="w-20 h-20 object-cover rounded border"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">
                      {photo.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded: {new Date(photo.uploadDate).toLocaleDateString()}
                    </p>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-red-600 hover:text-red-700 text-xs mt-1"
                    >
                      Remove photo
                    </button>
                  </div>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="camera"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600">Processing image...</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            {issue.signedOff && (
              <button
                type="button"
                onClick={handleRemoveSignOff}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Remove Sign-off
              </button>
            )}
            
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {issue.signedOff ? 'Update Sign-off' : 'Sign Off Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};