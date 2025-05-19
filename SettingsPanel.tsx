import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  onDarkModeToggle?: () => void;
  exportFormat: 'png' | 'pdf';
  onExportFormatChange: (format: 'png' | 'pdf') => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  onDarkModeToggle,
  exportFormat,
  onExportFormatChange
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`fixed right-0 top-0 h-full w-80 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-lg z-50 p-5 overflow-y-auto`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Settings</h2>
              <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Appearance */}
              <div>
                <h3 className="font-medium text-lg mb-2">Appearance</h3>
                <div className="flex items-center justify-between">
                  <span>Dark Mode</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={isDarkMode}
                      onChange={onDarkModeToggle}
                      className="sr-only peer"
                    />
                    <div className={`w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600`}></div>
                  </label>
                </div>
              </div>
              
              {/* Export Settings */}
              <div>
                <h3 className="font-medium text-lg mb-2">Export Settings</h3>
                <div className="flex flex-col gap-2">
                  <span>Export Format</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onExportFormatChange('png')}
                      className={`px-4 py-2 rounded-md ${exportFormat === 'png' ? 'bg-blue-500 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                    >
                      PNG
                    </button>
                    <button 
                      onClick={() => onExportFormatChange('pdf')}
                      className={`px-4 py-2 rounded-md ${exportFormat === 'pdf' ? 'bg-blue-500 text-white' : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                    >
                      PDF
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Other settings can be added here */}
              
              <div className="pt-4 mt-8 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">MoonBoard v1.0</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Made with ❤️</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
