'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  description?: string;
}

const PRESET_COLORS = [
  '#007AFF', // iOS Blue
  '#5856D6', // iOS Purple
  '#FF3B30', // iOS Red
  '#FF9500', // iOS Orange
  '#FFCC00', // iOS Yellow
  '#34C759', // iOS Green
  '#00C7BE', // iOS Teal
  '#AF52DE', // iOS Purple
  '#FF2D92', // iOS Pink
  '#A2845E', // iOS Brown
  '#8E8E93', // iOS Gray
  '#000000', // Black
  '#FFFFFF', // White
  '#F2F2F7', // iOS Light Gray
  '#1C1C1E', // iOS Dark
  '#2C2C2E', // iOS Dark Gray
];

export function ColorPicker({ label, value, onChange, description }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomColor(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setCustomColor(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    onChange(color);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white hover:border-gray-400 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-md border border-gray-200 shadow-sm"
              style={{ backgroundColor: value }}
            />
            <span className="text-sm font-mono text-gray-700">
              {value.toUpperCase()}
            </span>
          </div>
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
            >
              {/* Custom Color Input */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Custom Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    placeholder="#000000"
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded font-mono"
                  />
                </div>
              </div>

              {/* Preset Colors */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Preset Colors
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleColorSelect(color)}
                      className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                        value === color 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}