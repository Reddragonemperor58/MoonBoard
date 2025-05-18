import React from 'react';
import { motion } from 'framer-motion';
import { Sticker, MapSticker } from '../../types/moodboard';
import { useViewMode } from '../../context/ViewModeContext';
import StickerComponent from '../Sticker/StickerNew';

interface MapViewProps {
  stickers: Record<string, Sticker>;
}

export const MapView: React.FC<MapViewProps> = ({ stickers }) => {
  useViewMode(); // Keep the hook to maintain context subscription

  // Filter for map stickers
  const mapStickers = Object.values(stickers).filter(
    (sticker): sticker is MapSticker => sticker.type === 'map' && 'location' in sticker
  );

  return (
    <div className="w-full h-full p-4">
      <div
        role="region"
        aria-label="Map view"
        className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner overflow-hidden"
      >
        {/* Map Placeholder - Replace with actual map implementation */}
        <div className="w-full h-full min-h-[600px] relative">
          {mapStickers.map((sticker) => (
            <motion.div
              key={sticker.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute"
              style={{
                left: `${sticker.location.lng}%`,
                top: `${sticker.location.lat}%`,
              }}
            >
              <StickerComponent sticker={sticker} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
