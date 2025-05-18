import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useMoodboard } from '../../context/MoodboardContext';
import { useToast } from '../../context/ToastContext';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, pointerWithin, rectIntersection } from '@dnd-kit/core';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  ArrowPathIcon, 
  ArrowUturnLeftIcon, 
  ArrowUturnRightIcon, 
  PhotoIcon,
  DocumentTextIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Cog6ToothIcon,
  XMarkIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { generateSegmentId } from '../../utils/id-generator';
import Board from './Board';

interface MoodboardCanvasProps {
  externalControls?: boolean; // When true, controls will be rendered by parent
}

const MoodboardCanvas: React.FC<MoodboardCanvasProps> = ({ externalControls = false }) => {
  const { state, dispatch } = useMoodboard();
  const { addToast } = useToast();
  const [isPanning, setIsPanning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [canvasBackground, setCanvasBackground] = useState('#1a1a1a'); // Default to dark background
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf'>('png');
  const [canvasWidth, setCanvasWidth] = useState(1200);
  const [canvasHeight, setCanvasHeight] = useState(800);
  // Resizing state used to control behaviors during canvas resize
  const [isResizing, setIsResizing] = useState(false);
  // Always use dark mode
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // Setup history for undo/redo functionality
  const [history, setHistory] = useState<Array<any>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const transformRef = useRef<any>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Track if we need to save state
  const saveTimeout = useRef<number | null>(null);
  
  // Background options based on theme
  const lightBackgroundOptions = [
    { label: 'White', value: '#ffffff' },
    { label: 'Light Gray', value: '#f8f8f8' },
    { label: 'Soft Blue', value: '#e6f7ff' },
    { label: 'Warm Beige', value: '#f5f0e6' },
    { label: 'Mint Green', value: '#e6f5ef' },
    { label: 'Lavender', value: '#f0e6f5' },
  ];
  
  const darkBackgroundOptions = [
    { label: 'Dark Gray', value: '#1a1a1a' },
    { label: 'Deep Blue', value: '#10192b' },
    { label: 'Dark Brown', value: '#211a15' },
    { label: 'Dark Green', value: '#162118' },
    { label: 'Dark Purple', value: '#1e1424' },
    { label: 'Charcoal', value: '#262626' },
  ];
  
  const backgroundOptions = isDarkMode ? darkBackgroundOptions : lightBackgroundOptions;
  
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('moodboard-state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'LOAD_STATE', payload: parsedState });
        addToast('Loaded your previous moodboard', 'info');
      }
      
      // Load canvas settings
      const savedSettings = localStorage.getItem('moodboard-settings');
      if (savedSettings) {
        const { background, width, height, darkMode } = JSON.parse(savedSettings);
        if (background) setCanvasBackground(background);
        if (width) setCanvasWidth(width);
        if (height) setCanvasHeight(height);
        if (darkMode !== undefined) setIsDarkMode(darkMode);
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
        
        // Save canvas settings
        localStorage.setItem('moodboard-settings', JSON.stringify({
          background: canvasBackground,
          width: canvasWidth,
          height: canvasHeight,
          darkMode: isDarkMode
        }));
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
  }, [state, addToast, canvasBackground, canvasWidth, canvasHeight, isDarkMode]);
  
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
  
  // Export as image or PDF
  const handleExport = useCallback(async () => {
    try {
      // Dynamically import required modules
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      
      if (canvasRef.current) {
        const canvas = await html2canvas(canvasRef.current);
        const image = canvas.toDataURL('image/png');
        
        if (exportFormat === 'png') {
          // Create download link for PNG
          const link = document.createElement('a');
          link.href = image;
          link.download = 'moodboard-export.png';
          link.click();
          
          addToast('Moodboard exported as PNG image!', 'success');
        } else if (exportFormat === 'pdf') {
          // Import jsPDF dynamically
          const jsPDFModule = await import('jspdf');
          const jsPDF = jsPDFModule.default;
          
          // Create PDF
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
          });
          
          // Calculate aspect ratio and PDF dimensions
          const imgProps = pdf.getImageProperties(image);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          pdf.addImage(image, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save('moodboard-export.pdf');
          
          addToast('Moodboard exported as PDF!', 'success');
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      addToast('Failed to export moodboard', 'error');
    }
  }, [addToast, exportFormat]);
  
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
    // End drag state in global state
    dispatch({ type: 'END_DRAG' });
    
    // Skip if no over target
    if (!event.over) return;
    
    // Get data
    const activeData = event.active.data.current;
    const overData = event.over.data.current;
    
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

  // Layer management functions
  const bringToFront = useCallback(() => {
    if (state.selectedStickerId) {
      // Get current max zIndex and add 1
      const maxZIndex = Object.values(state.stickers).reduce(
        (max, sticker) => Math.max(max, sticker.zIndex), 0
      );
      
      dispatch({
        type: 'UPDATE_STICKER_ZINDEX',
        payload: { 
          id: state.selectedStickerId, 
          zIndex: maxZIndex + 1 
        }
      });
      
      addToast('Sticker brought to front', 'info');
    }
  }, [dispatch, state.selectedStickerId, state.stickers, addToast]);
  
  const sendToBack = useCallback(() => {
    if (state.selectedStickerId) {
      // Get current min zIndex and subtract 1
      const minZIndex = Object.values(state.stickers).reduce(
        (min, sticker) => Math.min(min, sticker.zIndex), 1
      );
      
      dispatch({
        type: 'UPDATE_STICKER_ZINDEX',
        payload: { 
          id: state.selectedStickerId, 
          zIndex: Math.max(minZIndex - 1, 0) 
        }
      });
      
      addToast('Sticker sent to back', 'info');
    }
  }, [dispatch, state.selectedStickerId, state.stickers, addToast]);

  // Handle background change
  const handleBackgroundChange = useCallback((color: string) => {
    setCanvasBackground(color);
    addToast('Background updated', 'info');
  }, [addToast]);
  
  // Canvas resizing is now handled directly in the onMouseDown event of the canvas
  // You can hold Alt key and click near the edges to resize
  
  // Handle theme toggle
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev: boolean) => {
      const newMode = !prev;
      // Update background color when changing modes
      if (newMode) {
        // Switch to dark mode background
        setCanvasBackground('#1a1a1a');
      } else {
        // Switch to light mode background
        setCanvasBackground('#f8f8f8');
      }
      return newMode;
    });
    addToast('Theme updated', 'info');
  }, [addToast]);

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

  // Expose functions and state for external controls
  React.useEffect(() => {
    if (externalControls && window) {
      // @ts-ignore - Add to window for external access
      window.moodboardControls = {
        handleResetZoom,
        handleUndo,
        handleRedo,
        toggleSettings: () => setShowSettings(!showSettings),
        toggleDarkMode,
        handleExport,
        handleAddSegment,
        bringToFront,
        sendToBack,
        isDarkMode,
        exportFormat,
        historyIndex,
        historyLength: history.length,
        hasSelectedSticker: !!state.selectedStickerId
      };
    }
    
    return () => {
      if (externalControls && window) {
        // @ts-ignore - Clean up
        delete window.moodboardControls;
      }
    };
  }, [externalControls, handleResetZoom, handleUndo, handleRedo, toggleDarkMode, 
      handleExport, handleAddSegment, bringToFront, sendToBack, isDarkMode, 
      exportFormat, historyIndex, history.length, state.selectedStickerId]);
  
  return (
    <div className="relative w-full h-full">
      {/* Only show controls if not using external controls */}
      {!externalControls && (
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
              onClick={() => setShowSettings(!showSettings)} 
              className="p-2 bg-white rounded-full shadow hover:bg-gray-100 text-gray-700 transition-colors"
              title="Settings"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleDarkMode} 
              className="p-2 bg-white rounded-full shadow hover:bg-gray-100 text-gray-700 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <SunIcon className="w-5 h-5" />
              ) : (
                <MoonIcon className="w-5 h-5" />
              )}
            </button>
            <button 
              onClick={handleExport} 
              className="p-2 bg-white rounded-full shadow hover:bg-gray-100 text-gray-700 transition-colors"
              title={`Export as ${exportFormat.toUpperCase()}`}
            >
              {exportFormat === 'png' ? (
                <PhotoIcon className="w-5 h-5" />
              ) : (
                <DocumentTextIcon className="w-5 h-5" />
              )}
            </button>
            <button 
              onClick={handleAddSegment} 
              className="p-2 bg-blue-500 rounded-full shadow hover:bg-blue-600 text-white transition-colors"
              title="Add new day"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Layer controls for selected sticker */}
          {state.selectedStickerId && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1 }}
              className="flex gap-2 mt-2 bg-white p-2 rounded-lg shadow"
            >
              <button
                onClick={bringToFront}
                className="p-1.5 bg-gray-100 rounded hover:bg-gray-200 text-gray-700 transition-colors"
                title="Bring to front"
              >
                <ArrowUpIcon className="w-4 h-4" />
              </button>
              <button
                onClick={sendToBack}
                className="p-1.5 bg-gray-100 rounded hover:bg-gray-200 text-gray-700 transition-colors"
                title="Send to back"
              >
                <ArrowDownIcon className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-16 right-4 z-20 bg-white p-4 rounded-lg shadow-lg w-72"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-gray-800">Moodboard Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportFormat('png')}
                  className={`flex-1 py-2 px-3 text-sm rounded-md ${
                    exportFormat === 'png'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  PNG Image
                </button>
                <button
                  onClick={() => setExportFormat('pdf')}
                  className={`flex-1 py-2 px-3 text-sm rounded-md ${
                    exportFormat === 'pdf'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  PDF Document
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="grid grid-cols-3 gap-2">
                {backgroundOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleBackgroundChange(option.value)}
                    className={`w-full h-10 rounded border ${
                      canvasBackground === option.value
                        ? 'ring-2 ring-blue-500'
                        : 'hover:ring-1 hover:ring-gray-300'
                    }`}
                    style={{ backgroundColor: option.value }}
                    title={option.label}
                  />
                ))}
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Canvas Size: {canvasWidth} × {canvasHeight}px
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Drag the canvas edges or corners to resize
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Zoom and Pan Canvas */}
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        collisionDetection={rectIntersection}
      >
        <TransformWrapper
          ref={transformRef}
          disabled={isPanning || isResizing}
          panning={{ disabled: !isPanning || isResizing }}
          wheel={{ step: 0.1 }}
          centerOnInit={true}
          maxScale={2}
          minScale={0.5}
          initialScale={1}
          limitToBounds={false}
          doubleClick={{ disabled: true }}
        >
          <TransformComponent wrapperClass="w-full h-full" contentClass="p-8">
            <div 
              ref={canvasRef} 
              className="moodboard-canvas rounded-xl shadow-lg transition-colors w-full h-full"
              onMouseMove={(e) => {
                // Check edge proximity for cursors
                if (!isResizing) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const edgeDistance = 15;

                  // Remove any existing resize classes
                  e.currentTarget.classList.remove(
                    'resize-e', 'resize-s', 'resize-w', 'resize-n',
                    'resize-se', 'resize-sw', 'resize-ne', 'resize-nw'
                  );
                  
                  // Corners (diagonal resize)
                  if (x < edgeDistance && y < edgeDistance) {
                    e.currentTarget.classList.add('resize-nw');
                  } else if (x > rect.width - edgeDistance && y < edgeDistance) {
                    e.currentTarget.classList.add('resize-ne');
                  } else if (x < edgeDistance && y > rect.height - edgeDistance) {
                    e.currentTarget.classList.add('resize-sw');
                  } else if (x > rect.width - edgeDistance && y > rect.height - edgeDistance) {
                    e.currentTarget.classList.add('resize-se');
                  }
                  // Edges (cardinal resize)
                  else if (x < edgeDistance) {
                    e.currentTarget.classList.add('resize-w');
                  } else if (x > rect.width - edgeDistance) {
                    e.currentTarget.classList.add('resize-e');
                  } else if (y < edgeDistance) {
                    e.currentTarget.classList.add('resize-n');
                  } else if (y > rect.height - edgeDistance) {
                    e.currentTarget.classList.add('resize-s');
                  }
                }
              }}
              onMouseLeave={(e) => {
                // Remove resize cursors when mouse leaves canvas
                if (!isResizing) {
                  e.currentTarget.classList.remove(
                    'resize-e', 'resize-s', 'resize-w', 'resize-n',
                    'resize-se', 'resize-sw', 'resize-ne', 'resize-nw'
                  );
                }
              }}
              style={{ 
                backgroundColor: canvasBackground
              }}
              onMouseDown={(e) => {
                // Start resizing when clicking near edges
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Check if mouse is near the edges
                const edgeDistance = 15; // pixels from edge to trigger resize
                const isNearEdge = {
                  right: x > rect.width - edgeDistance,
                  bottom: y > rect.height - edgeDistance,
                  left: x < edgeDistance,
                  top: y < edgeDistance
                };
                
                // Only start resizing if near an edge
                if (isNearEdge.right || isNearEdge.bottom || isNearEdge.left || isNearEdge.top) {
                  setIsResizing(true);
                  const edge = isNearEdge;
                  
                  // Store the initial positions and dimensions
                  const initialData = {
                    startX: e.clientX,
                    startY: e.clientY,
                    width: canvasWidth,
                    height: canvasHeight,
                    edge
                  };
                  
                  // Add window event listeners for mouse move and up
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    if (isResizing) {
                      const deltaX = moveEvent.clientX - initialData.startX;
                      const deltaY = moveEvent.clientY - initialData.startY;
                      
                      let newWidth = initialData.width;
                      let newHeight = initialData.height;
                      
                      if (initialData.edge.right) newWidth = Math.max(800, initialData.width + deltaX);
                      if (initialData.edge.bottom) newHeight = Math.max(600, initialData.height + deltaY);
                      if (initialData.edge.left) newWidth = Math.max(800, initialData.width - deltaX);
                      if (initialData.edge.top) newHeight = Math.max(600, initialData.height - deltaY);
                      
                      setCanvasWidth(Math.min(newWidth, 3000));
                      setCanvasHeight(Math.min(newHeight, 2000));
                    }
                  };
                  
                  const handleMouseUp = () => {
                    setIsResizing(false);
                    window.removeEventListener('mousemove', handleMouseMove);
                    window.removeEventListener('mouseup', handleMouseUp);
                    addToast('Canvas size updated', 'success');
                  };
                  
                  window.addEventListener('mousemove', handleMouseMove);
                  window.addEventListener('mouseup', handleMouseUp);
                }
              }}
            >
              <Board />
            </div>
          </TransformComponent>
        </TransformWrapper>
      </DndContext>
    </div>
  );
};

export default MoodboardCanvas;
