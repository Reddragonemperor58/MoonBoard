import React from 'react';
import { useDraggable } from '@dnd-kit/core';

const STICKER_TYPES = [
  { type: 'text', content: 'Text Note', icon: '📝' },
  { type: 'icon', icon: '❤️' },
  { type: 'icon', icon: '⭐' },
  { type: 'icon', icon: '🔥' },
  { type: 'icon', icon: '🎯' },
  { type: 'icon', icon: '💡' },
  { type: 'icon', icon: '👍' },
];

interface DraggableStickerProps {
  type: 'text' | 'image' | 'icon';
  content?: string;
  icon?: string;
  children: React.ReactNode;
}

const DraggableSticker: React.FC<DraggableStickerProps> = ({ type, content, icon, children }) => {
  // Create the sticker data for DnD
  const stickerData = {
    type,
    content,
    icon,
    width: 150,
    height: 100,
  };

  // Handle native HTML5 drag start
  const handleDragStart = (e: React.DragEvent) => {
    // Set multiple data formats for better compatibility
    e.dataTransfer.setData('application/json', JSON.stringify(stickerData));
    e.dataTransfer.setData('text', JSON.stringify(stickerData));
    e.dataTransfer.effectAllowed = 'copy';
    
    // Provide visual feedback during drag
    const dragImage = new Image();
    dragImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100"><rect width="100%" height="100%" fill="white" stroke="#ddd" stroke-width="2" rx="4" /></svg>');
    e.dataTransfer.setDragImage(dragImage, 75, 50);
  };

  return (
    <div
      className="flex items-center justify-center p-2 bg-gray-800 border border-gray-700 rounded shadow-sm cursor-move hover:border-blue-500 transition-colors text-white"
      draggable
      onDragStart={handleDragStart}
    >
      {children}
    </div>
  );
};

const StickerPalette: React.FC = () => {
  return (
    <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg shadow-md text-white">
      <h2 className="text-lg font-semibold mb-3">Stickers</h2>
      <div className="grid grid-cols-3 gap-2">
        {STICKER_TYPES.map((sticker, index) => (
          <DraggableSticker
            key={index}
            type={sticker.type}
            content={sticker.content}
            icon={sticker.icon}
          >
            {sticker.type === 'text' ? (
              <div className="text-sm">{sticker.content}</div>
            ) : (
              <div className="text-xl">{sticker.icon}</div>
            )}
          </DraggableSticker>
        ))}
      </div>
    </div>
  );
};

export default StickerPalette;
