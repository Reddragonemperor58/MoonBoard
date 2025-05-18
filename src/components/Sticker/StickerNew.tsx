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
  const [currentDimensions, setCurrentDimensions] = useState({
    width: sticker.width,
    height: sticker.height
  });
  
  // References for mouse drag calculations
  const stickerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartStickerPos = useRef({ x: sticker.x, y: sticker.y });
  // Handle mouse down to start moving the sticker
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only handle primary mouse button (left click)
    if (e.button !== 0) return;
    
    // Stop event from bubbling up to parent elements
    e.preventDefault();
    e.stopPropagation();
    
    // Initialize drag state
    setIsDragging(true);
    
    // Mark the current sticker as selected
    dispatch({ type: 'SELECT_STICKER', payload: { id: sticker.id } });
    
    // Store starting positions for calculations
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartStickerPos.current = { x: sticker.x, y: sticker.y };
    
    // Notify the moodboard that we're dragging
    dispatch({ type: 'START_DRAG', payload: undefined });
    
    // Increase z-index during dragging
    dispatch({
      type: 'SET_STICKER_ZINDEX',
      payload: {
        id: sticker.id,
        zIndex: Z_INDEX.STICKER_DRAGGING
      }
    });
    
    // Add global event listeners for mouse move and mouse up
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Add a special flag to indicate we're dragging a sticker
    // This will help prevent parent TimeSegment from being affected
    document.body.classList.add('sticker-dragging');
  }, [sticker, dispatch]);
  
  // Handle mouse move to update position during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate the movement delta
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    
    // Update the sticker position in the DOM immediately for smooth movement
    if (contentRef.current) {
      contentRef.current.style.transform = 
        `translate(${dx}px, ${dy}px)`;
    }
  }, [isDragging]);
    // Handle mouse up to finalize position
  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Calculate the final position
    const dx = dragStartPos.current.x ? (window.event as MouseEvent).clientX - dragStartPos.current.x : 0;
    const dy = dragStartPos.current.y ? (window.event as MouseEvent).clientY - dragStartPos.current.y : 0;
    
    // Reset inline transform
    if (contentRef.current) {
      contentRef.current.style.transform = '';
    }
    
    // Calculate new position with boundaries
    const newX = Math.max(0, dragStartStickerPos.current.x + dx);
    const newY = Math.max(0, dragStartStickerPos.current.y + dy);
    
    console.log(`Moving sticker to x:${newX}, y:${newY}`);
    
    // Update sticker position in the state
    dispatch({
      type: 'MOVE_STICKER',
      payload: {
        id: sticker.id,
        x: newX,
        y: newY,
        timeSegmentId: sticker.timeSegmentId
      }
    });
    
    // Reset z-index after dragging
    const newZIndex = sticker.isSelected ? Z_INDEX.STICKER_SELECTED : Z_INDEX.STICKER_BASE;
    dispatch({
      type: 'SET_STICKER_ZINDEX',
      payload: {
        id: sticker.id,
        zIndex: newZIndex
      }
    });
    
    // Notify the moodboard that we're no longer dragging
    dispatch({ type: 'END_DRAG', payload: undefined });
    
    // End dragging state
    setIsDragging(false);
    
    // Remove the sticker dragging indicator class
    document.body.classList.remove('sticker-dragging');
  }, [dispatch, isDragging, sticker.id, sticker.isSelected, sticker.timeSegmentId, handleMouseMove, dragStartPos, dragStartStickerPos]);

  // Clean up event listeners when the component unmounts
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

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
  }, [dispatch, sticker.id, sticker.isSelected]);

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
          ref={contentRef}
          className="w-full h-full select-none touch-manipulation flex justify-center items-center relative"
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
                : 'none',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Sticker content */}
          {renderStickerContent()}
          
          {/* Controls that appear on hover */}
          {isHovered && !isDragging && (
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
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleResizeStart();
                }}
              >
                <ArrowsPointingOutIcon className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
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
