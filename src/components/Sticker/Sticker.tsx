import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Sticker as StickerType } from '../../types/moodboard';
import { Resizable } from 're-resizable';
import { motion } from 'framer-motion';
import { TrashIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { useMoodboard } from '../../context/MoodboardContext';
import { Z_INDEX } from '../../utils/z-index';

interface StickerProps {
  sticker: StickerType;
}

export const Sticker: React.FC<StickerProps> = ({ sticker }) => {
  const { dispatch } = useMoodboard();
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // Track if sticker is being actively interacted with - used for styling
  const isActive = isResizing || isDragging || isHovered;
  const [currentDimensions, setCurrentDimensions] = useState({
    width: sticker.width,
    height: sticker.height
  });
  
  // References for drag calculations
  const stickerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartStickerPos = useRef({ x: sticker.x, y: sticker.y });

  // Handle drag start for both internal and external drag operations
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    // Set a special flag to identify sticker drags vs new sticker creation
    localStorage.setItem('dragging-existing-sticker', 'true');
    
    // Store the initial cursor position
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartStickerPos.current = { x: sticker.x, y: sticker.y };
    
    // Store sticker data in dataTransfer with an identifier
    try {
      // Include a special field to mark this as an existing sticker move operation
      const stickerData = {
        ...sticker,
        isExistingStickerMove: true
      };
      
      e.dataTransfer.setData('application/json', JSON.stringify(stickerData));
      // For browsers with issues, also store in localStorage as fallback
      localStorage.setItem('dragging-sticker-data', JSON.stringify(stickerData));
      
      // Set a custom drag image that's smaller and offset from the cursor
      const dragImg = new Image();
      dragImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>';
      e.dataTransfer.setDragImage(dragImg, 0, 0);
    } catch (err) {
      console.error('Error setting drag data:', err);
    }
    
    // Notify the moodboard that we're dragging
    dispatch({ type: 'START_DRAG', payload: undefined });
    
    // Select this sticker
    dispatch({ type: 'SELECT_STICKER', payload: { id: sticker.id } });
  }, [sticker, dispatch]);

  // Handle drag over for positioning within segment
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
  }, [isDragging]);

  // Handle drag end to finalize position
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    // Clean up localStorage
    localStorage.removeItem('dragging-sticker-data');
    localStorage.removeItem('dragging-existing-sticker');
    
    // Notify the moodboard that we're no longer dragging
    dispatch({ type: 'END_DRAG', payload: undefined });
    
    // If we have a valid reference and position changed, update the position
    if (stickerRef.current) {
      const dx = e.clientX - dragStartPos.current.x;
      const dy = e.clientY - dragStartPos.current.y;
      
      // Calculate new position and constrain within parent
      const unconstrained = {
        x: Math.max(0, dragStartStickerPos.current.x + dx),
        y: Math.max(0, dragStartStickerPos.current.y + dy)
      };
      
      const { x: newX, y: newY } = constrainToParent(unconstrained.x, unconstrained.y);
      
      console.log(`Moving sticker to x:${newX}, y:${newY}`);
      
      // Only update if position actually changed
      if (newX !== sticker.x || newY !== sticker.y) {
        dispatch({
          type: 'MOVE_STICKER',
          payload: {
            id: sticker.id,
            x: newX,
            y: newY,
            timeSegmentId: sticker.timeSegmentId
          }
        });
      }
    }
  }, [dispatch, sticker.id, sticker.timeSegmentId, sticker.x, sticker.y, isDragging]);

  // Handle manual deleting of sticker
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    dispatch({
      type: 'REMOVE_STICKER',
      payload: { id: sticker.id }
    });
  }, [dispatch, sticker.id]);

  // Handle resize start
  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
    
    // Bring the sticker to front while resizing
    dispatch({
      type: 'SET_STICKER_ZINDEX',
      payload: {
        id: sticker.id,
        zIndex: Z_INDEX.STICKER_DRAGGING
      }
    });
  }, [dispatch, sticker.id]);

  // Handle resize
  const handleResize = useCallback((_e: any, _direction: any, ref: HTMLElement) => {
    const width = ref.offsetWidth;
    const height = ref.offsetHeight;
    
    setCurrentDimensions({ width, height });
    
    // Update in real-time for smoother resizing
    dispatch({
      type: 'RESIZE_STICKER',
      payload: {
        id: sticker.id,
        width,
        height
      }
    });
  }, [dispatch, sticker.id]);

  // Handle resize stop
  const handleResizeStop = useCallback((_e: any, _direction: any, ref: HTMLElement) => {
    const width = ref.offsetWidth;
    const height = ref.offsetHeight;
    
    // Update dimensions one last time to ensure accuracy
    dispatch({
      type: 'RESIZE_STICKER',
      payload: {
        id: sticker.id,
        width,
        height
      }
    });
    
    // Reset z-index after resize (if selected keep STICKER_SELECTED, otherwise STICKER_BASE)
    const newZIndex = sticker.isSelected ? Z_INDEX.STICKER_SELECTED : Z_INDEX.STICKER_BASE;
    dispatch({
      type: 'SET_STICKER_ZINDEX',
      payload: {
        id: sticker.id,
        zIndex: newZIndex
      }
    });
    
    setIsResizing(false);
  }, [dispatch, sticker.id]);

  // Helper to ensure sticker stays within parent TimeSegment boundaries
  const constrainToParent = useCallback((x: number, y: number): { x: number, y: number } => {
    const timeSegmentEl = document.querySelector(`[data-segment-id="${sticker.timeSegmentId}"]`);
    
    if (timeSegmentEl) {
      const contentArea = timeSegmentEl.querySelector('.time-segment-content');
      if (contentArea) {
        const contentRect = contentArea.getBoundingClientRect();
        const maxX = contentRect.width - currentDimensions.width;
        const maxY = contentRect.height - currentDimensions.height;
        
        return {
          x: Math.max(0, Math.min(maxX, x)),
          y: Math.max(0, Math.min(maxY, y))
        };
      }
    }
    
    return { x, y };
  }, [sticker.timeSegmentId, currentDimensions]);

  // Determine the content to display based on sticker type
  const renderStickerContent = () => {
    switch (sticker.type) {
      case 'icon':
        return sticker.icon;
      case 'image':
        return (
          <img
            src={sticker.content}
            alt={sticker.alt || 'Sticker image'}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%', 
              objectFit: 'contain'
            }}
          />
        );
      case 'link':
        return (
          <div className="flex flex-col items-center">
            {sticker.thumbnail && (
              <img src={sticker.thumbnail} alt={sticker.title} className="mb-2 w-full h-auto" />
            )}
            <div className="text-blue-600 underline">{sticker.title || sticker.content}</div>
          </div>
        );
      default:
        return sticker.content;
    }
  };

  // Handle click on sticker (for selection)
  const handleStickerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Toggle selection
    if (sticker.isSelected) {
      dispatch({
        type: 'DESELECT_STICKER',
        payload: { id: sticker.id }
      });
    } else {
      dispatch({
        type: 'SELECT_STICKER',
        payload: { id: sticker.id }
      });
    }
  }, [dispatch, sticker.id, sticker.isSelected]);
  
  return (
    <motion.div
      ref={stickerRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      data-testid={sticker.id}
      className="absolute sticker-element"
      style={{
        left: sticker.x,
        top: sticker.y,
        zIndex: sticker.zIndex,
        pointerEvents: 'auto', // Ensure sticker captures all pointer events
        position: 'absolute' // Reinforce absolute positioning
      }}
      onClick={handleStickerClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Resizable
        size={{ 
          width: currentDimensions.width, 
          height: currentDimensions.height 
        }}
        onResizeStart={(e) => {
          e.stopPropagation();
          handleResizeStart();
        }}
        onResize={handleResize}
        onResizeStop={handleResizeStop}
        handleClasses={{
          right: 'resize-handle-right',
          bottom: 'resize-handle-bottom',
          bottomRight: 'resize-handle-corner'
        }}
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
      >
        <div
          className="w-full h-full select-none touch-manipulation cursor-move flex justify-center items-center relative"
          style={{
            transform: `rotate(${sticker.rotation}deg)`,
            backgroundColor: sticker.style?.backgroundColor,
            color: sticker.style?.textColor,
            fontSize: sticker.type === 'icon' ? '2rem' : sticker.style?.fontSize || 'inherit',
            border: sticker.isSelected 
              ? '2px solid #3b82f6' 
              : isHovered 
                ? '1px dashed #2563eb' 
                : '1px solid transparent',
            borderRadius: '4px',
            boxShadow: sticker.isSelected 
              ? '0 0 0 2px rgba(59, 130, 246, 0.3)' 
              : isHovered 
                ? '0 2px 4px rgba(0, 0, 0, 0.1)' 
                : 'none'
          }}
          draggable={true}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Sticker content */}
          {renderStickerContent()}
          
          {/* Controls that appear on hover */}
          {isHovered && (
            <div className="absolute top-0 right-0 flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-bl-lg shadow-sm p-1 z-10">
              <button
                onClick={handleDelete}
                className="p-1 hover:bg-red-100 rounded text-red-500 hover:text-red-600"
                title="Delete sticker"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
              <button
                className="p-1 hover:bg-blue-100 rounded text-blue-500 hover:text-blue-600 cursor-se-resize"
                title="Resize sticker"
                onMouseDown={() => handleResizeStart()}
              >
                <ArrowsPointingOutIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  // Rotate sticker by 15 degrees clockwise
                  const newRotation = (sticker.rotation + 15) % 360;
                  dispatch({
                    type: 'ROTATE_STICKER',
                    payload: {
                      id: sticker.id,
                      rotation: newRotation
                    }
                  });
                }}
                className="p-1 hover:bg-green-100 rounded text-green-500 hover:text-green-600"
                title="Rotate sticker"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </Resizable>
    </motion.div>
  );
};

export default Sticker;