'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface LogoUploadProps {
  currentLogo?: string;
  onUpload: (file: File) => void;
  uploading?: boolean;
}

export function LogoUpload({ currentLogo, onUpload, uploading }: LogoUploadProps) {
  const t = useTranslations('mobile-branding.logo');
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('invalidFileType'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(t('fileTooLarge'));
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    onUpload(file);
  };

  const handleRemoveLogo = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // You might want to call an API to remove the logo from the server
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Current Logo Preview */}
      {preview && (
        <div className="relative inline-block">
          <div 
            className="w-24 h-24 rounded-lg border overflow-hidden flex items-center justify-center"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-primary)'
            }}
          >
            <img
              src={preview}
              alt="Logo preview"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <button
            onClick={handleRemoveLogo}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        className="relative border-2 border-dashed rounded-lg p-6 transition-colors"
        style={{
          backgroundColor: dragActive ? 'var(--bg-hover)' : 'var(--bg-tertiary)',
          borderColor: dragActive ? 'var(--accent-primary)' : 'var(--border-primary)',
          opacity: uploading ? 0.5 : 1,
          pointerEvents: uploading ? 'none' : 'auto'
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="text-center">
          {uploading ? (
            <div className="flex flex-col items-center">
              <div 
                className="animate-spin rounded-full h-8 w-8 border-b-2 mb-3"
                style={{ borderColor: 'var(--accent-primary)' }}
              ></div>
              <p 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t('uploading')}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: 'var(--bg-secondary)' }}
              >
                {dragActive ? (
                  <Upload className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
                ) : (
                  <ImageIcon className="h-6 w-6" style={{ color: 'var(--text-secondary)' }} />
                )}
              </div>
              
              <p 
                className="text-sm mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {dragActive ? t('dropHere') : t('dragAndDrop')}
              </p>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={openFileDialog}
                className="px-4 py-2 text-sm rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--text-primary)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
              >
                {t('selectFile')}
              </motion.button>
              
              <p 
                className="text-xs mt-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {t('supportedFormats')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          {t('guidelines.title')}
        </h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• {t('guidelines.size')}</li>
          <li>• {t('guidelines.format')}</li>
          <li>• {t('guidelines.background')}</li>
          <li>• {t('guidelines.quality')}</li>
        </ul>
      </div>
    </div>
  );
}