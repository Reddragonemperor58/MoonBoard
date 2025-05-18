import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import StickerComponent from '../Sticker/Sticker';
import type { Sticker as StickerType } from '../../types/moodboard';
import { Resizable } from 're-resizable';
import { TimeSegment as TimeSegmentType } from '../../types/moodboard';
import { useMoodboard } from '../../context/MoodboardContext';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

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
      handleTitleBlur();
    }
  };

  const handleEditTitle = () => {
    setIsEditing(true);
  };

  const handleDeleteSegment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(segment.id);
  };

  const handleResizeStop = (e: any, direction: any, ref: HTMLElement, d: any) => {
    const newWidth = parseInt(ref.style.width, 10);
    const newHeight = parseInt(ref.style.height, 10);

    if (!isNaN(newWidth) && !isNaN(newHeight)) {
      dispatch({
        type: 'RESIZE_SEGMENT',
        payload: {
          id: segment.id,
          width: newWidth,
          height: newHeight,
        },
      });
    }
  };

  // Filter stickers for this segment
  const segmentStickers = useMemo(() => {
    return Object.values(state.stickers).filter(sticker => sticker.timeSegmentId === segment.id);
  }, [state.stickers, segment.id]);

  // Handle drop event with proper error handling
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    try {
      // Try multiple data transfer methods
      let stickerData;
      
      // First try getting the data from dataTransfer
      const jsonData = e.dataTransfer.getData('application/json');
      const textData = e.dataTransfer.getData('text');
      
      // Try to parse JSON data if available
      if (jsonData) {
        try {
          stickerData = JSON.parse(jsonData);
        } catch (err) {
          console.log('Error parsing JSON data:', err);
        }
      }
      
      // If no valid JSON data, try with text data
      if (!stickerData && textData) {
        try {
          stickerData = JSON.parse(textData);
        } catch (err) {
          console.log('Error parsing text data:', err);
        }
      }
      
      // If we have valid sticker data
      if (stickerData && typeof stickerData === 'object') {
        // Calculate drop position relative to the content area
        const contentRect = contentRef.current?.getBoundingClientRect();
        
        if (contentRect) {
          const x = Math.max(0, e.clientX - contentRect.left);
          const y = Math.max(0, e.clientY - contentRect.top);
          
          // Create sticker payload with the time segment id and position
          const payload: StickerPayload = {
            ...stickerData,
            timeSegmentId: segment.id,
            x,
            y,
          };
          
          // If onAddSticker callback is provided, use it
          if (onAddSticker) {
            onAddSticker(payload);
          } else {
            // Otherwise, directly dispatch to the state
            const sticker: StickerType = {
              id: crypto.randomUUID(),
              ...payload,
              zIndex: 1,
              rotation: 0,
            };
            
            dispatch({
              type: 'ADD_STICKER',
              payload: sticker,
            });
          }
        }
      } else {
        console.log('Invalid or missing sticker data');
      }
    } catch (error) {
      console.log('Error processing sticker data:', error);
      
      // Fallback: create a default text sticker at mouse position
      if (contentRef.current) {
        const contentRect = contentRef.current.getBoundingClientRect();
        const x = Math.max(0, e.clientX - contentRect.left);
        const y = Math.max(0, e.clientY - contentRect.top);
        
        const defaultSticker: StickerType = {
          id: crypto.randomUUID(),
          timeSegmentId: segment.id,
          type: 'text',
          content: 'New sticker',
          x,
          y,
          width: 150,
          height: 100,
          rotation: 0,
          zIndex: 1,
        };
        
        dispatch({
          type: 'ADD_STICKER',
          payload: defaultSticker,
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <Resizable
      size={{ width: segment.width, height: segment.height }}
      onResizeStop={handleResizeStop}
      minWidth={300}
      minHeight={200}
      className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-700 p-4 border-2 border-dashed transition-colors border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500"
      style={{
        zIndex: isOver ? 2 : 1,
      }}
    >
      <div
        id={segment.id}
        ref={setNodeRef}
        className="w-full h-full flex flex-col relative"
        style={{ minHeight: '100%', position: 'relative', overflow: 'hidden' }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="flex items-center justify-between mb-4">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="text-xl font-bold border-b-2 border-blue-500 focus:outline-none bg-transparent"
            />
          ) : (
            <h3 
              className="text-xl font-bold cursor-pointer hover:text-blue-500 dark:text-white dark:hover:text-blue-400"
              onClick={handleEditTitle}
            >
              {segment.title}
            </h3>
          )}
          
          <div className="flex gap-2">
            <button
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              title="Edit Title"
              onClick={handleEditTitle}
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500 dark:text-red-400"
              title="Delete Day"
              onClick={handleDeleteSegment}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div 
          ref={contentRef}
          className="flex-1 relative"
          style={{ minHeight: '200px' }}
        >
          {/* Stickers */}
          {segmentStickers.map(sticker => (
            <StickerComponent key={sticker.id} sticker={sticker} />
          ))}
        </div>
      </div>
    </Resizable>
  );
};

export default TimeSegment;
