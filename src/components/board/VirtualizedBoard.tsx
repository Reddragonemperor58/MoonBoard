import React, { useCallback } from 'react';
import { useMoodboard } from '../../context/MoodboardContext';
import { TimeSegment as TimeSegmentType } from '../../types/moodboard';
import { Virtuoso } from 'react-virtuoso';
import TimeSegment from './TimeSegment';
import { motion } from 'framer-motion';

interface VirtualizedBoardProps {
  onSegmentUpdate: (id: string, updates: Partial<TimeSegmentType>) => void;
  onSegmentDelete: (id: string) => void;
}

export const VirtualizedBoard: React.FC<VirtualizedBoardProps> = ({
  onSegmentUpdate,
  onSegmentDelete,
}) => {
  const { state } = useMoodboard();
  
  const renderSegment = useCallback((index: number) => {
    const segmentId = state.segmentOrder[index];
    const segment = state.segments[segmentId];
    
    if (!segment) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="mb-4"
      >
        <TimeSegment
          key={segment.id}
          segment={segment}
          onUpdate={(id, updates) => onSegmentUpdate(id, updates)}
          onDelete={(id) => onSegmentDelete(id)}
        />
      </motion.div>
    );
  }, [state.segments, state.segmentOrder, onSegmentUpdate, onSegmentDelete]);

  return (
    <Virtuoso
      style={{ height: '100%', width: '100%' }}
      totalCount={state.segmentOrder.length}
      itemContent={renderSegment}
      computeItemKey={(index: number) => state.segmentOrder[index]}
      overscan={5}
      className="p-4"
    />
  );
};

export default VirtualizedBoard;
