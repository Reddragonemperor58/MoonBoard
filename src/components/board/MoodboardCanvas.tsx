import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useMoodboard } from '../../context/MoodboardContext';
import { useToast } from '../../context/ToastContext';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, pointerWithin, rectIntersection } from '@dnd-kit/core';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, ArrowPathIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { generateSegmentId, generateStickerId } from '../../utils/id-generator';
import Board from './Board';

const MoodboardCanvas: React.FC = () => {
  const { state, dispatch } = useMoodboard();
  const { addToast } = useToast();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Setup history for undo/redo functionality
  const [history, setHistory] = useState<Array<any>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const transformRef = useRef<any>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Track if we need to save state
  const saveTimeout = useRef<number | null>(null);
  
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('moodboard-state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'LOAD_STATE', payload: parsedState });
        addToast('Loaded your previous moodboard', 'info');
      }
    } catch (error) {
      console.error('Error loading state:', error);
      addToast('Could not load previous work', 'error');
    }
  }, [dispatch, addToast]);
  
  // Save state to localStorage with debounce
  useEffect(() => {
    if (saveTimeout.current) {
      window.clearTimeout(saveTimeout.current);
    }
    
    saveTimeout.current = window.setTimeout(() => {
      try {
        localStorage.setItem('moodboard-state', JSON.stringify(state));
      } catch (error) {
        console.error('Error saving state:', error);
        addToast('Failed to save your work', 'error');
      }
    }, 1000);
    
    return () => {
      if (saveTimeout.current) {
        window.clearTimeout(saveTimeout.current);
      }
    };
  }, [state, addToast]);
  
  // Update history for undo/redo
  useEffect(() => {
    // Skip initial render
    if (historyIndex === -1) {
      setHistory([state]);
      setHistoryIndex(0);
      return;
    }
    
    // If we're not at the end of history (user did an undo), truncate
    if (historyIndex < history.length - 1) {
      setHistory(prev => prev.slice(0, historyIndex + 1));
    }
    
    // Add current state to history
    setHistory(prev => [...prev, state]);
    setHistoryIndex(prev => prev + 1);
  }, [state.stickers, state.segments, state.segmentOrder]); // Only trigger on meaningful state changes

  // Handle zoom reset
  const handleResetZoom = useCallback(() => {
    if (transformRef.current) {
      transformRef.current.resetTransform();
    }
  }, []);
  
  // Handle undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      dispatch({ type: 'LOAD_STATE', payload: history[newIndex] });
      addToast('Undo successful', 'info');
    }
  }, [historyIndex, history, dispatch, addToast]);
  
  // Handle redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      dispatch({ type: 'LOAD_STATE', payload: history[newIndex] });
      addToast('Redo successful', 'info');
    }
  }, [historyIndex, history, dispatch, addToast]);
  
  // Export as image
  const handleExport = useCallback(async () => {
    try {
      // Dynamically import html2canvas to reduce bundle size
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      
      if (canvasRef.current) {
        const canvas = await html2canvas(canvasRef.current);
        const image = canvas.toDataURL('image/png');
        
        // Create download link
        const link = document.createElement('a');
        link.href = image;
        link.download = 'moodboard-export.png';
        link.click();
        
        addToast('Moodboard exported as image!', 'success');
      }
    } catch (error) {
      console.error('Export failed:', error);
      addToast('Failed to export moodboard', 'error');
    }
  }, [addToast]);
  
  // Add a new day/segment
  const handleAddSegment = useCallback(() => {
    const id = generateSegmentId();
    const newSegment = {
      id,
      title: `Day ${Object.keys(state.segments).length + 1}`,
      order: state.segmentOrder.length,
      width: 300,
      height: 300,
    };
    
    dispatch({
      type: 'ADD_SEGMENT',
      payload: newSegment,
    });
    
    addToast(`Added new day: ${newSegment.title}`, 'success');
  }, [dispatch, state.segments, state.segmentOrder, addToast]);
  
  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveDragId(active.id as string);
    setIsPanning(false);
    
    // Dispatch drag start
    dispatch({ type: 'START_DRAG' });
  }, [dispatch]);

  // Handle drag over
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    // Skip if no over target or same target
    if (!over || active.id === over.id) return;
    
    // Get data
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // Handle sticker over time segment
    if (activeData?.type === 'STICKER' && overData?.type === 'SEGMENT') {
      // Visual feedback is handled by CSS classes in the TimeSegment component
      // through the isOver prop from useDroppable
    }
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    // Reset active drag ID
    setActiveDragId(null);
    
    // End drag state in global state
    dispatch({ type: 'END_DRAG' });
    
    // Skip if no over target
    if (!over) return;
    
    // Get data
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // Handle sticker dropped on time segment
    if (activeData?.type === 'STICKER' && overData?.type === 'SEGMENT') {
      const segmentId = overData.segmentId;
      const sticker = activeData.sticker;
      
      // Check if valid sticker data
      if (sticker && segmentId) {
        // Add sticker to the time segment
        dispatch({
          type: 'ADD_STICKER',
          payload: {
            ...sticker,
            id: `sticker-${Date.now()}`,
            timeSegmentId: segmentId,
            x: 50, // Default initial position
            y: 50,
            zIndex: 1,
            rotation: 0,
          }
        });
        
        addToast('Sticker added to board', 'success');
      }
    }
  }, [dispatch, addToast]);

  // Key event handlers for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Z / Cmd+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Check for Ctrl+Y / Cmd+Y or Ctrl+Shift+Z for redo
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      // Delete key for selected stickers
      else if (e.key === 'Delete' && state.selectedStickerId) {
        e.preventDefault();
        dispatch({
          type: 'REMOVE_STICKER',
          payload: { stickerId: state.selectedStickerId },
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, state.selectedStickerId, dispatch]);

  return (
    <div className="relative w-full h-full">
      {/* Canvas Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2">
          <button 
            onClick={handleResetZoom} 
            className="p-2 bg-white rounded-full shadow hover:bg-gray-100 text-gray-700 transition-colors"
            title="Reset zoom"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={handleUndo} 
            disabled={historyIndex <= 0}
            className={`p-2 rounded-full shadow transition-colors ${historyIndex <= 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-gray-700'}`}
            title="Undo (Ctrl+Z)"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={handleRedo} 
            disabled={historyIndex >= history.length - 1}
            className={`p-2 rounded-full shadow transition-colors ${historyIndex >= history.length - 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white hover:bg-gray-100 text-gray-700'}`} 
            title="Redo (Ctrl+Y)"
          >
            <ArrowUturnRightIcon className="w-5 h-5" />
          </button>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2"
        >
          <button 
            onClick={handleExport} 
            className="p-2 bg-white rounded-full shadow hover:bg-gray-100 text-gray-700 transition-colors"
            title="Export as image"
          >
            <PhotoIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={handleAddSegment} 
            className="p-2 bg-blue-500 rounded-full shadow hover:bg-blue-600 text-white transition-colors"
            title="Add new day"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
      
      {/* Zoom and Pan Canvas */}
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        collisionDetection={rectIntersection}
      >
        <TransformWrapper
          ref={transformRef}
          disabled={isPanning}
          panning={{ disabled: !isPanning }}
          wheel={{ step: 0.1 }}
          centerOnInit={true}
          maxScale={2}
          minScale={0.5}
          initialScale={1}
          limitToBounds={false}
          doubleClick={{ disabled: true }}
        >
          <TransformComponent wrapperClass="w-full h-full" contentClass="p-8">
            <div ref={canvasRef} className="moodboard-canvas min-h-[600px]">
              <AnimatePresence>
                <Board />
              </AnimatePresence>
            </div>
          </TransformComponent>
        </TransformWrapper>
      </DndContext>
    </div>
  );
};

export default MoodboardCanvas;
