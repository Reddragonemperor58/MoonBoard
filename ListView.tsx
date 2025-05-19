import React from 'react';
import { motion } from 'framer-motion';
import { TimeSegment, Sticker } from '../../types/moodboard';
import { useViewMode } from '../../context/ViewModeContext';
import { ListViewConfig } from '../../types/view-modes';
import StickerComponent from '../Sticker/StickerNew';

interface ListViewProps {
  segments: Record<string, TimeSegment>;
  stickers: Record<string, Sticker>;
  segmentOrder: string[];
}

export const ListView: React.FC<ListViewProps> = ({
  segments,
  stickers,
  segmentOrder
}) => {
  const { config } = useViewMode();
  const listConfig = config as ListViewConfig;

  const sortedSegments = [...segmentOrder].sort((a, b) => {
    const segmentA = segments[a];
    const segmentB = segments[b];
    if (listConfig.sortBy === 'date') {
      return (
        new Date(segmentA.timeRange?.start || '').getTime() -
        new Date(segmentB.timeRange?.start || '').getTime()
      );
    }
    return segmentA.order - segmentB.order;
  });

  return (
    <div className="w-full p-4">
      <ul role="list" className="space-y-4">
        {sortedSegments.map((segmentId) => {
          const segment = segments[segmentId];
          const segmentStickers = Object.values(stickers).filter(
            (sticker) => sticker.timeSegmentId === segmentId
          );

          return (
            <li
              key={segmentId}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
            >
              {/* Title + date range */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">
                  {segment.title}
                </h3>
                {segment.timeRange && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(segment.timeRange.start).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })} –{' '}
                    {new Date(segment.timeRange.end).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>

              {/* Stickers */}
              <div className="space-y-4">
                {segmentStickers.map((sticker) => (
                  <motion.div
                    key={sticker.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                  >
                    <StickerComponent sticker={sticker} />
                  </motion.div>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};