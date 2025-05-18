import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useMoodboard } from '../../context/MoodboardContext';
import { useToast } from '../../context/ToastContext';
import type { Sticker as StickerType } from '../../types/moodboard';
import { Rnd, RndDragCallback, RndResizeCallback } from 'react-rnd';
import { TrashIcon, ArrowPathIcon, PencilIcon } from '@heroicons/react/24/outline';

interface StickerProps {
  sticker: StickerType;
}

const Sticker: React.FC<StickerProps> = ({ sticker }) => {
  const { state, dispatch } = useMoodboard();
  const { addToast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [showRotateControls, setShowRotateControls] = useState(false);
  const [rotationDegree, setRotationDegree] = useState(sticker.rotation);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(sticker.content || '');
  const isSelected = state.selectedStickerId === sticker.id;
  
  // Create refs to track position and size properly
  const rndRef = useRef<Rnd>(null);
  const positionRef = useRef({ x: sticker.x, y: sticker.y });
  const rotationStartRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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
  
  // Handle sticker selection
  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'SELECT_STICKER',
      payload: { stickerId: sticker.id },
    });
  }, [dispatch, sticker.id]);

  // Handle sticker deletion
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({
      type: 'REMOVE_STICKER',
      payload: { stickerId: sticker.id },
    });
    addToast('Sticker removed', 'info');
  }, [dispatch, sticker.id, addToast]);

  // Handle drag start to record the initial position
  const handleDragStart: RndDragCallback = useCallback(() => {
    if (rndRef.current) {
      const { x, y } = rndRef.current.getDraggablePosition();
      positionRef.current = { x, y };
    }
  }, []);

  // Handle drag to update position in real-time (for visual feedback only)
  const handleDrag: RndDragCallback = useCallback(() => {
    // Just allow the drag to happen naturally without interfering
  }, []);

  // Handle drag stop to update the redux store
  const handleDragStop: RndDragCallback = useCallback((e, d) => {
    const newPosition = { x: d.x, y: d.y };
    
    // Only dispatch if position actually changed
    if (newPosition.x !== positionRef.current.x || newPosition.y !== positionRef.current.y) {
      dispatch({
        type: 'MOVE_STICKER',
        payload: {
          stickerId: sticker.id,
          x: newPosition.x,
          y: newPosition.y
        }
      });
      positionRef.current = newPosition;
    }
  }, [dispatch, sticker.id]);

  // Handle resize stop to update the redux store
  const handleResizeStop: RndResizeCallback = useCallback((e, direction, ref, delta, position) => {
    const width = parseInt(ref.style.width);
    const height = parseInt(ref.style.height);
    
    // Update both position and size
    dispatch({
      type: 'RESIZE_STICKER',
      payload: { 
        id: sticker.id, 
        width, 
        height 
      }
    });
    
    dispatch({
      type: 'MOVE_STICKER',
      payload: {
        stickerId: sticker.id,
        x: position.x,
        y: position.y
      }
    });
    
    // Update ref for future comparisons
    positionRef.current = position;
  }, [dispatch, sticker.id]);

  // Toggle rotation controls
  const toggleRotationControls = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowRotateControls(prev => !prev);
  }, []);

  // Handle mouse down for rotation
  const handleRotationStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Record initial rotation and mouse position
    rotationStartRef.current = rotationDegree;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!rndRef.current) return;
      
      // Get center of element
      const rect = rndRef.current.resizableElement.current?.getBoundingClientRect();
      if (!rect) return;
      
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate angle between center and mouse position
      const angle = Math.atan2(
        moveEvent.clientY - centerY,
        moveEvent.clientX - centerX
      ) * (180 / Math.PI);
      
      // Add 90 degrees to make it feel more natural (rotate with top of element)
      const newRotation = Math.round(angle + 90);
      setRotationDegree(newRotation);
    };
    
    const handleMouseUp = () => {
      // Save rotation
      dispatch({
        type: 'ROTATE_STICKER',
        payload: {
          id: sticker.id,
          rotation: rotationDegree
        }
      });
      
      // Clean up event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [dispatch, sticker.id, rotationDegree]);

  // Snap rotation to common angles (0, 90, 180, 270 degrees)
  const snapRotation = useCallback((targetAngle: number) => {
    setRotationDegree(targetAngle);
    dispatch({
      type: 'ROTATE_STICKER',
      payload: {
        id: sticker.id,
        rotation: targetAngle
      }
    });
  }, [dispatch, sticker.id]);

  // Start editing text
  const handleStartEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    // Also select the sticker
    dispatch({
      type: 'SELECT_STICKER',
      payload: { stickerId: sticker.id },
    });
  }, [dispatch, sticker.id]);

  // Handle text change
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value);
  }, []);

  // Save edited text
  const handleSaveText = useCallback(() => {
    dispatch({
      type: 'UPDATE_STICKER_CONTENT',
      payload: {
        id: sticker.id,
        content: editText
      }
    });
    setIsEditing(false);
    addToast('Text updated', 'success');
  }, [dispatch, sticker.id, editText, addToast]);

  // Cancel editing
  const handleCancelEditing = useCallback(() => {
    setEditText(sticker.content || '');
    setIsEditing(false);
  }, [sticker.content]);

  // Handle keyboard shortcuts while editing
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Save on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveText();
    }
    // Cancel on Escape
    else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEditing();
    }
  }, [handleSaveText, handleCancelEditing]);

  return (
    <Rnd
      ref={rndRef}
      default={{
        x: sticker.x,
        y: sticker.y,
        width: sticker.width,
        height: sticker.height
      }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      className={`group ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
      bounds="parent"
      disableDragging={isEditing}
      onClick={handleSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      enableResizing={{
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true
      }}
      style={{
        zIndex: sticker.zIndex,
        transform: `rotate(${rotationDegree}deg)`,
      }}
    >
      <div className="w-full h-full bg-gray-800 rounded shadow p-2 relative text-white">
        {/* Sticker Actions (Delete and Rotate) */}
        {(isHovered || isSelected) && !isEditing && (
          <div className="absolute -top-3 -right-3 flex space-x-1 z-50">
            {sticker.type === 'text' && (
              <button
                onClick={handleStartEditing}
                className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600"
                aria-label="Edit text"
                title="Edit text"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={toggleRotationControls}
              className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
              aria-label="Rotate sticker"
              title="Rotate"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              aria-label="Delete sticker"
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Editing Controls */}
        {isEditing && sticker.type === 'text' && (
          <div className="absolute -top-10 left-0 right-0 flex justify-center space-x-2 z-50">
            <button
              onClick={handleSaveText}
              className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
              title="Save (Ctrl+Enter)"
            >
              Save
            </button>
            <button
              onClick={handleCancelEditing}
              className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
              title="Cancel (Esc)"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Rotation Controls */}
        {showRotateControls && !isEditing && (
          <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-1 flex items-center space-x-2 z-50">
            <button 
              onClick={() => snapRotation(0)}
              className="w-6 h-6 flex items-center justify-center text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="0°"
            >
              0°
            </button>
            <button 
              onClick={() => snapRotation(90)}
              className="w-6 h-6 flex items-center justify-center text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="90°"
            >
              90°
            </button>
            <button 
              onClick={() => snapRotation(180)}
              className="w-6 h-6 flex items-center justify-center text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="180°"
            >
              180°
            </button>
            <button 
              onClick={() => snapRotation(270)}
              className="w-6 h-6 flex items-center justify-center text-xs bg-gray-100 hover:bg-gray-200 rounded"
              title="270°"
            >
              270°
            </button>
          </div>
        )}

        {/* Rotation Handle */}
        {(isHovered || isSelected) && !isEditing && (
          <div
            className="absolute top-1/2 -right-8 w-6 h-6 bg-blue-500 rounded-full cursor-move border-2 border-white"
            onMouseDown={handleRotationStart}
            title="Drag to rotate"
          />
        )}
        
        {/* Sticker Content */}
        {sticker.type === 'text' ? (
          isEditing ? (
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              className="w-full h-full p-1 border-0 focus:ring-0 focus:outline-none resize-none bg-white text-gray-800"
              placeholder="Enter your text..."
              style={{
                fontFamily: 'inherit',
                fontSize: 'inherit',
                lineHeight: 'inherit',
              }}
              autoFocus
            />
          ) : (
            <div 
              className="w-full h-full overflow-auto cursor-text"
              onDoubleClick={handleStartEditing}
              title="Double-click to edit"
            >
              {sticker.content || <span className="text-gray-400 italic">Double-click to add text</span>}
            </div>
          )
        ) : sticker.type === 'icon' ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl">{sticker.icon}</span>
          </div>
        ) : (
          <img
            src={sticker.imageUrl}
            alt="Sticker"
            className="w-full h-full object-cover rounded"
            draggable={false}
          />
        )}
      </div>
    </Rnd>
  );
};

export default Sticker;
