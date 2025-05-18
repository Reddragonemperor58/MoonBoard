import React, { useState, useCallback, useRef } from 'react';
import { useMoodboard } from '../../context/MoodboardContext';
import { useToast } from '../../context/ToastContext';
import type { Sticker as StickerType } from '../../types/moodboard';
import { Rnd, RndDragCallback, RndResizeCallback } from 'react-rnd';
import { TrashIcon } from '@heroicons/react/24/outline';

interface StickerProps {
  sticker: StickerType;
}

const Sticker: React.FC<StickerProps> = ({ sticker }) => {
  const { state, dispatch } = useMoodboard();
  const { addToast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const isSelected = state.selectedStickerId === sticker.id;
  
  // Create refs to track position and size properly
  const rndRef = useRef<Rnd>(null);
  const positionRef = useRef({ x: sticker.x, y: sticker.y });
  
  // Handle sticker selection
  const handleSelect = useCallback(() => {
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
      disableDragging={false}
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
    >
      <div className="w-full h-full bg-white rounded shadow p-2 relative">
        {/* Delete Button */}
        {(isHovered || isSelected) && (
          <button
            onClick={handleDelete}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-50"
            aria-label="Delete sticker"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
        
        {/* Sticker Content */}
        {sticker.type === 'text' ? (
          <div className="w-full h-full">
            {sticker.content}
          </div>
        ) : sticker.type === 'icon' ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl">{sticker.icon}</span>
          </div>
        ) : (
          <img
            src={sticker.imageUrl}
            alt="Sticker"
            className="w-full h-full object-cover rounded"
          />
        )}
      </div>
    </Rnd>
  );
};

export default Sticker;
