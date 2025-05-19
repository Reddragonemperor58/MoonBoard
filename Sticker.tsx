import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Rnd, RndDragCallback } from 'react-rnd';
import { TrashIcon, PencilIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useMoodboard } from '../../context/MoodboardContext';
import { useToast } from '../../context/ToastContext';
import { Z_INDEX } from '../../utils/z-index';
import { Sticker as StickerType } from '../../types/moodboard';

type ResizableDelta = { width: number; height: number };
type Position = { x: number; y: number };
type ResizeDirection = 'top' | 'right' | 'bottom' | 'left' | 'topRight' | 'bottomRight' | 'bottomLeft' | 'topLeft';

interface StickerProps {
  sticker: StickerType;
}

export const Sticker: React.FC<StickerProps> = ({ sticker }) => {
  const { state, dispatch } = useMoodboard();
  const { addToast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(sticker.content || '');
  const [isTouching, setIsTouching] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(sticker.rotation || 0);
  const [showRotateControls, setShowRotateControls] = useState(false);
  
  const rndRef = useRef<Rnd>(null);
  const positionRef = useRef({ x: sticker.x, y: sticker.y });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const isSelected = state.selectedStickerId === sticker.id;

  // Update local rotation state when sticker prop changes
  useEffect(() => {
    setRotationDegree(sticker.rotation);
  }, [sticker.rotation]);

  // Update content when sticker prop changes
  useEffect(() => {
    setEditText(sticker.content || '');
  }, [sticker.content]);
  
  // Focus the textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Handle content updates
  const handleContentUpdate = useCallback((newContent: string) => {
    dispatch({
      type: 'UPDATE_STICKER',
      payload: {
        id: sticker.id,
        content: newContent
      }
    });
  }, [dispatch, sticker.id]);

  // Handle text editing controls
  const handleStartEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setShowRotateControls(false);
  }, []);

  const handleSaveText = useCallback(() => {
    setIsEditing(false);
    handleContentUpdate(editText);
  }, [editText, handleContentUpdate]);

  const handleCancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditText(sticker.content || '');
  }, [sticker.content]);
  
  // Handle sticker selection
  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      dispatch({
        type: 'SELECT_STICKER',
        payload: { id: sticker.id }
      });
    }
  }, [dispatch, sticker.id, isEditing]);

  // Handle sticker deletion
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'REMOVE_STICKER',
      payload: { id: sticker.id }
    });
    addToast('Sticker removed', 'info');
  }, [dispatch, sticker.id, addToast]);

  // Handle drag start
  const handleDragStart: RndDragCallback = useCallback(() => {
    setIsDragging(true);
    dispatch({
      type: 'SET_STICKER_ZINDEX',
      payload: { id: sticker.id, zIndex: Z_INDEX.STICKER_DRAGGING }
    });
    if (rndRef.current) {
      const { x, y } = rndRef.current.getDraggablePosition();
      positionRef.current = { x, y };
    }
  }, [dispatch, sticker.id]);

  // Handle drag stop
  const handleDragStop: RndDragCallback = useCallback((_e, d) => {
    setIsDragging(false);
    dispatch({
      type: 'SET_STICKER_ZINDEX',
      payload: { id: sticker.id, zIndex: Z_INDEX.STICKER_BASE }
    });
    const newPosition = { x: d.x, y: d.y };
    if (newPosition.x !== positionRef.current.x || newPosition.y !== positionRef.current.y) {
      dispatch({
        type: 'MOVE_STICKER',
        payload: { 
          id: sticker.id, 
          x: newPosition.x, 
          y: newPosition.y,
          timeSegmentId: sticker.timeSegmentId
        }
      });
    }
  }, [dispatch, sticker.id, sticker.timeSegmentId]);

  // Handle resize stop
  const handleResizeStop = useCallback(
    (
      _e: MouseEvent | TouchEvent,
      _direction: ResizeDirection,
      ref: HTMLElement,
      _delta: ResizableDelta,
      position: Position
    ) => {
      const newSize = {
        width: parseInt(ref.style.width),
        height: parseInt(ref.style.height),
      };

      // First update the size
      dispatch({
        type: 'RESIZE_STICKER',
        payload: {
          id: sticker.id,
          ...newSize
        }
      });
      
      // Then update the position
      dispatch({
        type: 'MOVE_STICKER',
        payload: {
          id: sticker.id,
          x: position.x,
          y: position.y,
          timeSegmentId: sticker.timeSegmentId
        }
      });
    },
    [dispatch, sticker.id, sticker.timeSegmentId]
  );

  // Helper function to snap rotation to nearest multiple of provided angle
  const snapRotation = useCallback((angle: number) => {
    dispatch({
      type: 'ROTATE_STICKER',
      payload: {
        id: sticker.id,
        rotation: angle
      }
    });
    setRotationDegree(angle);
  }, [dispatch, sticker.id]);

  // Handle mouse-based rotation
  const handleRotationStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!showRotateControls) return;

    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let startAngle: number;
    if ('touches' in e) {
      const touch = e.touches[0];
      startAngle = Math.atan2(touch.clientY - centerY, touch.clientX - centerX);
    } else {
      startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    }

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentAngle = 'touches' in moveEvent 
        ? Math.atan2(moveEvent.touches[0].clientY - centerY, moveEvent.touches[0].clientX - centerX)
        : Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      
      const rotation = (currentAngle - startAngle) * (180 / Math.PI);
      const newRotation = (rotationDegree + rotation) % 360;

      dispatch({
        type: 'ROTATE_STICKER',
        payload: {
          id: sticker.id,
          rotation: newRotation
        }
      });
    };

    const handleEnd = () => {
      document.removeEventListener('mousemove', handleMove as (e: Event) => void);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove as (e: Event) => void);
      document.removeEventListener('touchend', handleEnd);
      setIsTouching(false);
    };

    // Add non-passive listeners to prevent scrolling during rotation
    if ('touches' in e) {
      setIsTouching(true);
      document.addEventListener('touchmove', handleMove as (e: Event) => void, { passive: false });
      document.addEventListener('touchend', handleEnd);
    } else {
      document.addEventListener('mousemove', handleMove as (e: Event) => void);
      document.addEventListener('mouseup', handleEnd);
    }
  }, [dispatch, rotationDegree, showRotateControls, sticker.id]);

  // Render sticker content based on type
  const renderStickerContent = () => {
    switch (sticker.type) {
      case 'text':
        return (
          <div className="w-full h-full p-2">
            {isEditing ? (
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onBlur={handleSaveText}
                className="w-full h-full resize-none border-none bg-transparent focus:outline-none"
              />
            ) : (
              <div 
                onClick={handleStartEditing}
                className="w-full h-full cursor-text whitespace-pre-wrap"
              >
                {sticker.content}
              </div>
            )}
          </div>
        );
      case 'image':
        return (
          <img
            src={sticker.content}
            alt="Image sticker"
            className="w-full h-full object-contain"
          />
        );
      case 'link':
        return (
          <a 
            href={sticker.content}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-full flex items-center justify-center p-2"
          >
            {sticker.title}
          </a>
        );
      case 'map':
        return (
          <div className="w-full h-full p-2 flex items-center justify-center">
            {sticker.content}
          </div>
        );
      case 'custom':
        return (
          <div className="w-full h-full p-2" dangerouslySetInnerHTML={{ __html: sticker.content }} />
        );
      default:
        return <div>Unsupported sticker type</div>;
    }
  };

  // Render the full component
  return (
    <Rnd
      ref={rndRef}
      default={{
        x: sticker.x,
        y: sticker.y,
        width: sticker.width,
        height: sticker.height
      }}
      minWidth={44}
      minHeight={44}
      bounds="parent"
      enableResizing={!isEditing}
      enableUserSelectHack={false}
      disableDragging={isEditing}
      onClick={handleSelect}
      onDragStart={handleDragStart}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      style={{
        transform: `rotate(${rotationDegree}deg)`,
        zIndex: isDragging 
          ? Z_INDEX.STICKER_DRAGGING 
          : isSelected 
            ? Z_INDEX.STICKER_SELECTED 
            : sticker.zIndex || Z_INDEX.STICKER_BASE
      }}
      className={`group transition-shadow duration-200 ${
        isDragging ? 'shadow-xl ring-2 ring-blue-500' : ''
      } ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''} ${
        isTouching ? 'ring-2 ring-blue-300' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      
      <div className="relative w-full h-full">
        {/* Controls overlay */}
        {(isHovered || isSelected || isTouching) && !isEditing && (
          <div className="absolute -top-8 left-0 flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-md shadow-md p-1" style={{ zIndex: Z_INDEX.CONTROLS }}>
            <button
              onClick={handleDelete}
              className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              title="Delete sticker"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
            
            {sticker.type === 'text' && (
              <button
                onClick={handleStartEditing}
                className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                title="Edit text"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setShowRotateControls(!showRotateControls)}
              className={`p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 ${
                showRotateControls ? 'text-blue-600 dark:text-blue-400' : ''
              }`}
              title="Toggle rotation controls"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Editing controls */}
        {isEditing && (
          <div className="absolute -top-8 left-0 flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-md shadow-md p-1">
            <button
              onClick={handleSaveText}
              className="px-2 py-1 text-sm text-white bg-green-500 hover:bg-green-600 rounded"
            >
              Save
            </button>
            <button
              onClick={handleCancelEditing}
              className="px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Rotation controls */}
        {showRotateControls && !isEditing && (
          <div className="absolute -top-8 right-0 flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-md shadow-md p-1">
            <button
              onClick={() => snapRotation(0)}
              className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              title="Reset rotation"
            >
              0°
            </button>
            <button
              onClick={() => snapRotation(90)}
              className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              title="Rotate 90°"
            >
              90°
            </button>
            <button
              onClick={() => snapRotation(180)}
              className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              title="Rotate 180°"
            >
              180°
            </button>
            <button
              onClick={() => snapRotation(270)}
              className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
              title="Rotate 270°"
            >
              270°
            </button>
          </div>
        )}

        {/* Rotation handle */}
        {showRotateControls && !isEditing && (
          <div 
            className="absolute -top-6 right-1/2 transform translate-x-1/2 cursor-grab active:cursor-grabbing"
            onMouseDown={handleRotationStart}
            onTouchStart={handleRotationStart}
          >
            <div className="w-4 h-4 bg-blue-500 rounded-full shadow-md" />
          </div>
        )}

        {/* Main content */}
        {renderStickerContent()}
      </div>
    </Rnd>
  );
};

export default Sticker;
