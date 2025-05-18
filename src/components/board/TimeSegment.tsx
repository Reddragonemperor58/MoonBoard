import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Resizable } from 're-resizable';
import { Z_INDEX } from '../../utils/z-index';
import { v4 as uuidv4 } from 'uuid';
import { TimeSegment as TimeSegmentType, Sticker as StickerType } from '../../types/moodboard';
import { useMoodboard } from '../../context/MoodboardContext';
import { TrashIcon } from '@heroicons/react/24/outline';
import SimpleEditableText from '../SimpleEditableText';
import Sticker from '../Sticker/StickerNew';

interface TimeSegmentProps {
  segment: TimeSegmentType;
  onUpdate: (segmentId: string, updates: Partial<TimeSegmentType>) => void;
  onDelete: (segmentId: string) => void;
}

export const TimeSegment: React.FC<TimeSegmentProps> = ({ segment, onUpdate, onDelete }) => {
  const { state, dispatch } = useMoodboard();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(segment.title);
  const [isHovered, setIsHovered] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef(title); // Reference to store current title
  
  // Update local title state when segment title changes from props
  useEffect(() => {
    setTitle(segment.title);
    titleRef.current = segment.title;
  }, [segment.title]);
  
  // Update the title reference whenever title state changes
  useEffect(() => {
    titleRef.current = title;
  }, [title]);
  
  // Track resize in progress to prevent dimension flicker
  const [isResizing, setIsResizing] = useState(false);
  const [currentDimensions, setCurrentDimensions] = useState({
    width: segment.width,
    height: segment.height
  });

  // Update current dimensions when segment prop changes (but only if not resizing)
  useEffect(() => {
    if (!isResizing) {
      setCurrentDimensions({
        width: segment.width,
        height: segment.height
      });
    }
  }, [segment.width, segment.height, isResizing]);

  const { setNodeRef, isOver } = useDroppable({
    id: segment.id,
    data: {
      accepts: ['STICKER'],
      type: 'SEGMENT',
      segmentId: segment.id,
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up
    
    // Check if we're dragging an existing sticker (moving it)
    const isMovingExistingSticker = localStorage.getItem('dragging-existing-sticker') === 'true';
    
    // If we're moving an existing sticker, let the sticker component handle it
    // and don't create a new sticker
    if (isMovingExistingSticker) {
      return;
    }
    
    try {
      // Try getting data from dataTransfer
      let stickerData: any = null;
      
      try {
        // First try the standard way
        stickerData = JSON.parse(e.dataTransfer.getData('application/json'));
      } catch (parseError) {
        // If standard way fails, check if we have a fallback data in localStorage
        const fallbackData = localStorage.getItem('dragging-sticker-data');
        if (fallbackData) {
          stickerData = JSON.parse(fallbackData);
          localStorage.removeItem('dragging-sticker-data'); // Clean up after use
        } else {
          throw parseError; // Re-throw if no fallback found
        }
      }
      
      // Skip if this is an existing sticker being moved
      if (stickerData && stickerData.isExistingStickerMove) {
        return;
      }
      
      if (stickerData && contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Log successful drop
        console.log(`Dropped new sticker at x:${x}, y:${y} in segment ${segment.id}`);
        
        // For icon stickers, ensure we set content to empty string if not provided
        const content = stickerData.type === 'icon' ? (stickerData.content || '') : stickerData.content;
        
        // Create a complete sticker object with all required fields
        const completeSticker = {
          ...stickerData,
          id: uuidv4(),
          timeSegmentId: segment.id,
          x,
          y,
          width: stickerData.width || 150,
          height: stickerData.height || 100,
          rotation: 0,
          zIndex: Z_INDEX.STICKER_BASE,
          content
        };
        
        dispatch({
          type: 'ADD_STICKER',
          payload: completeSticker
        });
        
        // Show visual feedback
        contentRef.current.classList.add('drop-success');
        setTimeout(() => {
          if (contentRef.current) {
            contentRef.current.classList.remove('drop-success');
          }
        }, 300);
      }
    } catch (error) {
      console.error('Error processing dropped sticker:', error);
    }
  }, [dispatch, segment.id]);

  // Get stickers for this segment
  const stickers = Object.values(state.stickers).filter(
    (sticker: StickerType) => sticker.timeSegmentId === segment.id
  );

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Add a visual indication
    if (contentRef.current) {
      contentRef.current.classList.add('drag-over');
    }
  }, []);
  
  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    // Remove the visual indication
    if (contentRef.current) {
      contentRef.current.classList.remove('drag-over');
    }
  }, []);
  
  // Handle resize start
  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);
  
  // Handle resize
  const handleResize = useCallback((_: any, __: any, ref: HTMLElement) => {
    // Update current dimensions during resize
    const width = ref.offsetWidth;
    const height = ref.offsetHeight;
    
    setCurrentDimensions({
      width,
      height
    });
    
    // Update segment in real-time for smoother resizing
    dispatch({
      type: 'UPDATE_SEGMENT',
      payload: {
        id: segment.id,
        width,
        height
      }
    });
  }, [dispatch, segment.id]);
  
  // Handle resize stop
  const handleResizeStop = useCallback((_: any, __: any, ref: HTMLElement, delta: { width: number; height: number }) => {
    // Get the actual dimensions directly from the DOM to ensure accuracy
    const newWidth = ref.offsetWidth;
    const newHeight = ref.offsetHeight;
    
    console.log(`Resize stopped: new dimensions ${newWidth}x${newHeight}, delta: ${JSON.stringify(delta)}`);
    
    // Only update if dimensions actually changed
    if (newWidth !== segment.width || newHeight !== segment.height) {
      // Update current dimensions first to prevent flickering
      setCurrentDimensions({
        width: newWidth,
        height: newHeight
      });
      
      // Dispatch the UPDATE_SEGMENT action directly to ensure dimensions are saved
      dispatch({
        type: 'UPDATE_SEGMENT',
        payload: {
          id: segment.id,
          width: newWidth,
          height: newHeight
        }
      });
      
      // Also call the onUpdate prop to maintain compatibility
      onUpdate(segment.id, {
        width: newWidth,
        height: newHeight,
      });
      
      console.log(`Updated segment ${segment.id}: new dimensions ${newWidth}x${newHeight}`);
    }
    
    // Reset resize state
    setIsResizing(false);
  }, [segment, onUpdate, dispatch]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => e.stopPropagation()} // Prevent click from propagating to canvas
      style={{ zIndex: Z_INDEX.SEGMENT }}
      className="relative time-segment" // Added time-segment class
      data-segment-id={segment.id}
    >
      <Resizable
        size={{ 
          width: currentDimensions.width || segment.width, 
          height: currentDimensions.height || segment.height 
        }}
        defaultSize={{ 
          width: segment.width, 
          height: segment.height 
        }}
        minWidth={200}
        minHeight={150}
        handleClasses={{
          right: 'border-r-4 border-blue-500 hover:border-blue-600',
          bottom: 'border-b-4 border-blue-500 hover:border-blue-600',
          bottomRight: 'border-r-4 border-b-4 border-blue-500 hover:border-blue-600'
        }}
        onResizeStart={(e) => {
          // Prevent the click from propagating to parent elements
          e.stopPropagation();
          handleResizeStart();
        }}
        onResize={handleResize}
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
        className={`
          flex flex-col h-full 
          bg-white dark:bg-gray-800
          shadow-lg rounded-lg
          border-2 transition-all duration-200
          ${isOver ? 'border-blue-500 ring-4 ring-blue-300 ring-opacity-50' : 'border-gray-200 dark:border-gray-700'}
          ${isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
        `}
      >
        {/* Header */}
        <div 
          ref={setNodeRef}
          className="flex items-center justify-between p-4"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Title with SimpleEditableText component */}
          <div 
            className="flex-grow cursor-text"
            onClick={(e) => {
              if (!isEditing) {
                e.stopPropagation();
                setIsEditing(true);
              }
            }}
          > 
            <SimpleEditableText
              text={title}
              isEditing={isEditing}
              onTextChange={(newText: string) => {
                console.log(`Title changed to: ${newText}`);
                // Update both state and ref
                setTitle(newText);
                titleRef.current = newText;
              }}
              onEditComplete={() => {
                // Use the ref for the most recent value
                const currentTitle = titleRef.current;
                console.log(`Completing edit with title: ${currentTitle}`);
                
                // Save changes to context
                dispatch({
                  type: 'UPDATE_SEGMENT',
                  payload: { id: segment.id, title: currentTitle }
                });
                
                // Call the update prop
                onUpdate(segment.id, { title: currentTitle });
                
                // Close the edit mode
                setIsEditing(false);
              }}
              onEditCancel={() => {
                setIsEditing(false);
                // Reset to segment's original title
                setTitle(segment.title);
                titleRef.current = segment.title;
              }}
              textClassName="font-medium text-gray-800 dark:text-gray-100 cursor-text hover:text-blue-600 dark:hover:text-blue-400"
            />
          </div>

          {/* Controls */}
          <AnimatePresence>
            {(isHovered || isEditing) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-2 z-50"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onDelete(segment.id);
                  }}
                  className="p-2 bg-red-100 dark:bg-red-900/20 rounded text-red-500 hover:bg-red-200 dark:hover:bg-red-800/50 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  title="Delete segment"
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
          className="flex-1 p-4 relative time-segment-content"
          data-segment-id={segment.id}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Empty State */}
          {stickers.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p className="text-center">Drop stickers here</p>
            </div>
          )}

          {/* Drop Zone Indicator */}
          {isOver && (
            <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-lg bg-blue-50 bg-opacity-50 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          )}

          {/* Stickers */}
          {stickers.map((sticker: StickerType) => (
            <Sticker key={sticker.id} sticker={sticker} />
          ))}
        </div>
      </Resizable>
    </motion.div>
  );
};

// Add global styles for better input visibility
const addGlobalStyle = () => {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
      /* Force override for input visibility */
      .editable-text-input {
        caret-color: black !important;
        color: #000000 !important;
        background-color: white !important;
        z-index: 9999 !important;
        position: relative !important;
        opacity: 1 !important;
        visibility: visible !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        min-height: 28px !important;
      }
      
      .editable-text-input::selection {
        background-color: #3b82f6 !important;
        color: white !important;
      }
      
      .editable-text-input:focus {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5) !important;
        border-color: #3b82f6 !important;
      }
      
      /* Container styles to ensure proper stacking */
      .editable-text-container {
        position: relative !important;
        z-index: 9999 !important;
        width: 100% !important;
      }
      
      /* Dark mode specific styles */
      @media (prefers-color-scheme: dark) {
        .editable-text-input {
          background-color: #1f2937 !important;
          color: #ffffff !important;
          caret-color: white !important;
          border-color: #4b5563 !important;
        }
        
        .editable-text-input:focus {
          border-color: #60a5fa !important;
        }
      }
      
      /* Extra protection to ensure appearance */
      .time-segment .editable-text-input {
        -webkit-appearance: none !important;
        appearance: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
  }
};

// Call once on component import
addGlobalStyle();

export default TimeSegment;
