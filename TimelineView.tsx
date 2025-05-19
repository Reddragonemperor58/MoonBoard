import React from 'react';
import { motion } from 'framer-motion';
import { TimeSegment, Sticker } from '../../types/moodboard';
import { useViewMode } from '../../context/ViewModeContext';
import { TimelineViewConfig } from '../../types/view-modes';
import StickerComponent from '../Sticker/StickerNew';

interface TimelineViewProps {
  segments: Record<string, TimeSegment>;
  stickers: Record<string, Sticker>;
  segmentOrder: string[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ segments, stickers, segmentOrder }) => {
  const { config } = useViewMode();
  const timelineConfig = config as TimelineViewConfig;

  const renderTimeSegment = (segmentId: string) => {
    const segment = segments[segmentId];
    if (!segment || !segment.timeRange) return null;

    const segmentStickers = Object.values(stickers).filter(
      sticker => sticker.timeSegmentId === segmentId
    );

    const startDate = new Date(segment.timeRange.start);
    const endDate = new Date(segment.timeRange.end);
    const duration = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <motion.div
        key={segment.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`
          bg-white dark:bg-gray-800 rounded-lg shadow-lg
          border border-gray-200 dark:border-gray-700
          ${timelineConfig.layout === 'horizontal' ? 'mb-6' : 'mr-6 inline-block align-top'}
        `}
        style={{
          width: timelineConfig.layout === 'horizontal' ? '100%' : '300px',
          minHeight: '200px'
        }}
      >
        {/* Segment Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {segment.title}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span>
              {startDate.toLocaleDateString('en-US', {
                month: 'long',
                day:   'numeric',
                year:  'numeric'
              })} - {endDate.toLocaleDateString('en-US', {
                month: 'long',
                day:   'numeric',
                year:  'numeric'
              })}
            </span>
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded">
              {duration} {duration === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        {/* Stickers Grid */}
        <div className={`p-4 ${timelineConfig.compact ? 'grid grid-cols-2 gap-4' : 'space-y-4'}`}>
          {segmentStickers.map(sticker => (
            <motion.div
              key={sticker.id}
              data-testid={sticker.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`
                relative bg-gray-50 dark:bg-gray-700 rounded
                ${timelineConfig.compact ? 'p-2' : 'p-4'}
              `}
            >
              <StickerComponent sticker={sticker} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full p-4">
      <ul
        role="list"
        className={`
          timeline-view
          ${timelineConfig.layout === 'horizontal' ? 'flex flex-col' : 'flex overflow-x-auto'}
        `}
      >
        {segmentOrder.map(segmentId => (
          <li key={segmentId}>
            {renderTimeSegment(segmentId)}
          </li>
        ))}
      </ul>
    </div>
  );
};
