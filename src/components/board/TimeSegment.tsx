import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import StickerComponent from '../Sticker/Sticker';
import type { Sticker as StickerType } from '../../types/moodboard';
import { Resizable } from 're-resizable';
import { TimeSegment as TimeSegmentType } from '../../types/moodboard';
import { useMoodboard } from '../../context/MoodboardContext';
import { PencilIcon, TrashIcon, PlusIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

type StickerPayload = Omit<StickerType, 'id' | 'timeSegmentId'> & {
  timeSegmentId: string;
  id?: string; // Make id optional since we'll generate a new one
};

interface TimeSegmentProps {
  segment: TimeSegmentType;
  onUpdate: (id: string, updates: Partial<TimeSegmentType>) => void;
  onDelete: (id: string) => void;
  onAddSticker?: (sticker: StickerPayload) => void;
}

export const TimeSegment: React.FC<TimeSegmentProps> = ({ segment, onUpdate, onDelete, onAddSticker }) => {
  const { dispatch, state } = useMoodboard();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(segment.title);
  const [isHovered, setIsHovered] = useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: segment.id,
    data: {
      accepts: ['STICKER'],
      type: 'SEGMENT',
      segmentId: segment.id,
    },
  });

  // Add a ref to the content area for accurate drop positioning
  const contentRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleTitleBlur = () => {
    setIsEditing(false);
    if (title !== segment.title) {
      dispatch({
        type: 'RENAME_SEGMENT',
        payload: { id: segment.id, title },
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      if (title !== segment.title) {
        dispatch({
          type: 'RENAME_SEGMENT',
          payload: { id: segment.id, title },
        });
      }
    } else if (e.key === 'Escape') {
      setTitle(segment.title);
      setIsEditing(false);
    }
  };

  const startEditing = useCallback(() => {
    setIsEditing(true);
    // Focus the input field after rendering
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, 10);
  }, []);

  // Filter stickers for this segment
  const stickers = useMemo(() => {
    return Object.values(state.stickers).filter(
      (sticker) => sticker.timeSegmentId === segment.id
    );
  }, [state.stickers, segment.id]);

  // Handle sticker drop from palette or another segment
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      // Try to parse the sticker data from dataTransfer
      const stickerData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (stickerData && (stickerData.type === 'text' || stickerData.type === 'icon' || stickerData.type === 'image')) {
        // Calculate position relative to the content area
        if (contentRef.current) {
          const rect = contentRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Create sticker at the drop position
          const newSticker: StickerPayload = {
            ...stickerData,
            timeSegmentId: segment.id,
            x,
            y,
            zIndex: 1,
            rotation: 0,
          };
          
          // Add the sticker to the board through context
          dispatch({
            type: 'ADD_STICKER',
            payload: {
              ...newSticker,
              id: `sticker-${Date.now()}`, // Generate unique ID
            }
          });
        }
      }
    } catch (error) {
      console.error('Error processing dropped sticker:', error);
    }
  };

  // Handle drag over to prevent default behavior
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Handle the resizing of the segment
  const handleResizeStop = (e: MouseEvent | TouchEvent, direction: any, ref: HTMLElement, delta: { width: number, height: number }) => {
    dispatch({
      type: 'RESIZE_SEGMENT',
      payload: {
        id: segment.id,
        width: segment.width + delta.width,
        height: segment.height + delta.height,
      }
    });
  };

  // Calculate the day number from the title (if it contains "Day X")
  const dayNumber = useMemo(() => {
    const match = segment.title.match(/Day\s+(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
  }, [segment.title]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative z-10"
    >
      <Resizable
        size={{ width: segment.width, height: segment.height }}
        minWidth={200}
        minHeight={150}
        onResizeStop={handleResizeStop}
        enable={{
          top: false,
          right: true,
          bottom: true,
          left: false,
          topRight: false,
          bottomRight: true,
          bottomLeft: false,
          topLeft: false,
        }}
        handleClasses={{
          right: "w-3 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors",
          bottom: "h-3 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors",
          bottomRight: "w-5 h-5 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors rounded-br-lg",
        }}
      >
        <div
          ref={setNodeRef}
          className={`
            flex flex-col h-full 
            bg-white dark:bg-gray-800
            shadow-lg rounded-lg
            border-2 transition-all duration-200
            ${isOver ? 'border-blue-500 ring-4 ring-blue-300 ring-opacity-50' : 'border-gray-200 dark:border-gray-700'}
            ${isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {/* Header/Title Section */}
          <div 
            className={`
              px-3 py-2 flex items-center justify-between
              border-b border-gray-200 dark:border-gray-700
              transition-all duration-200
              ${isOver ? 'bg-blue-100 dark:bg-blue-800/30' : 'bg-gray-50 dark:bg-gray-800/50'}
            `}
          >
            <div className="flex items-center space-x-2">
              {dayNumber !== null && (
                <div className="flex items-center justify-center bg-blue-600 text-white dark:bg-blue-500 rounded-full w-7 h-7 text-xs font-bold">
                  {dayNumber}
                </div>
              )}
              
              {!isEditing ? (
                <h3 
                  className="font-medium text-gray-800 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                  onClick={startEditing}
                >
                  {title}
                </h3>
              ) : (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleKeyDown}
                  className="text-sm bg-white dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded p-1 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Day title"
                />
              )}
            </div>
            
            {/* Controls */}
            <AnimatePresence>
              {(isHovered || isEditing) && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center space-x-1"
                >
                  <button
                    onClick={startEditing}
                    className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Edit title"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(segment.id)}
                    className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Delete day"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Content Area */}
          <div 
            ref={contentRef}
            className={`
              flex-1 p-4 relative overflow-hidden
              ${isOver ? 'bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800/50' : ''}
            `}
          >
            {/* Stickers */}
            {stickers.map(sticker => (
              <StickerComponent
                key={sticker.id}
                sticker={sticker}
              />
            ))}
            
            {/* Empty State / Drop Indicator */}
            {stickers.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-400 transition-colors duration-200">
                <CalendarDaysIcon className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-medium">Drop stickers here</p>
                <p className="text-xs mt-1">Drag items from the sticker panel</p>
              </div>
            )}
            
            {/* Drop Indicator Overlay */}
            <AnimatePresence>
              {isOver && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-md pointer-events-none"
                >
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white rounded-full p-2">
                    <PlusIcon className="w-6 h-6" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Resizable>
    </motion.div>
  );
};

export default TimeSegment;
