import React, { useState } from 'react';
import { CustomSticker } from '../../types/moodboard';
import { v4 as uuidv4 } from 'uuid';

interface StickerTemplateProps {
  onSave: (template: CustomSticker) => void;
  existingTemplates: Record<string, CustomSticker>;
}

export const StickerTemplateEditor: React.FC<StickerTemplateProps> = ({ onSave, existingTemplates }) => {
  const [templateName, setTemplateName] = useState('');
  const [content, setContent] = useState('');
  const [style, setStyle] = useState({
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    textColor: '#1a202c',
    fontSize: 14,
    opacity: 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const template: CustomSticker = {
      id: uuidv4(),
      type: 'custom',
      content,
      template: templateName,
      timeSegmentId: '', // This will be set when the template is used
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      rotation: 0,
      zIndex: 1,
      style,
      data: {
        fields: [], // Template can define custom fields
        validation: {} // Template can define validation rules
      }
    };

    onSave(template);
    
    // Reset form
    setTemplateName('');
    setContent('');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Create Sticker Template</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Name
          </label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Style</h4>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600">Background</label>
              <input
                type="color"
                value={style.backgroundColor}
                onChange={(e) => setStyle(s => ({ ...s, backgroundColor: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600">Border</label>
              <input
                type="color"
                value={style.borderColor}
                onChange={(e) => setStyle(s => ({ ...s, borderColor: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600">Text Color</label>
              <input
                type="color"
                value={style.textColor}
                onChange={(e) => setStyle(s => ({ ...s, textColor: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600">Font Size</label>
              <input
                type="number"
                value={style.fontSize}
                onChange={(e) => setStyle(s => ({ ...s, fontSize: parseInt(e.target.value) || 14 }))}
                className="w-full px-2 py-1 border border-gray-300 rounded"
                min="8"
                max="32"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-600">Opacity</label>
            <input
              type="range"
              value={style.opacity}
              onChange={(e) => setStyle(s => ({ ...s, opacity: parseFloat(e.target.value) }))}
              min="0"
              max="1"
              step="0.1"
              className="w-full"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Save Template
        </button>
      </form>

      {/* Preview */}
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
        <div
          className="p-4 rounded border"
          style={{
            backgroundColor: style.backgroundColor,
            borderColor: style.borderColor,
            color: style.textColor,
            fontSize: `${style.fontSize}px`,
            opacity: style.opacity
          }}
        >
          {content || 'Template Preview'}
        </div>
      </div>

      {/* Existing Templates */}
      {Object.keys(existingTemplates).length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Saved Templates</h4>
          <div className="space-y-2">
            {Object.values(existingTemplates).map(template => (
              <div
                key={template.id}
                className="p-2 border rounded flex items-center justify-between"
              >
                <span>{template.template}</span>
                <button
                  onClick={() => {/* Handle template edit */}}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StickerTemplateEditor;
