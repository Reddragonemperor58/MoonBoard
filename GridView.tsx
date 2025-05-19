import React from 'react';
import { motion } from 'framer-motion';
import { Sticker } from '../../types/moodboard';
import { useViewMode } from '../../context/ViewModeContext';
import { GridViewConfig } from '../../types/view-modes';
import StickerComponent from '../Sticker/StickerNew';

interface GridViewProps {
  stickers: Record<string, Sticker>;
}

export const GridView: React.FC<GridViewProps> = ({ stickers }) => {
  const { config } = useViewMode();
  const gridConfig = config as GridViewConfig;

  const allStickers = Object.values(stickers);

  const gapSizes = {
    small: 'gap-2',
    medium: 'gap-4',
    large: 'gap-6'
  };

  const aspectRatios = {
    '1:1': 'aspect-square',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-[16/9]'
  };

  return (
    <div className="w-full p-4">
      <ul 
        role="list"
        data-testid="grid-view"
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-${gridConfig.columns} ${gapSizes[gridConfig.gap]}`}
      >
        {allStickers.map((sticker) => (
          <li key={sticker.id}>
            <motion.div
              data-testid={sticker.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`relative bg-gray-50 dark:bg-gray-700 rounded overflow-hidden ${aspectRatios[gridConfig.aspectRatio]}`}
            >
              <StickerComponent sticker={sticker} />
            </motion.div>
          </li>
        ))}
      </ul>
    </div>
  );
};
