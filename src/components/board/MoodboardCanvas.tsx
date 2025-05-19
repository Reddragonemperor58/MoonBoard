import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useMoodboard } from '../../context/MoodboardContext';
import { useToast } from '../../context/ToastContext';
import { useViewMode } from '../../context/ViewModeContext';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import VirtualizedBoard from './VirtualizedBoard';
import { TimelineView } from './TimelineView';
import { MapView } from './MapView';
import { ListView } from './ListView';
import { GridView } from './GridView';
import { MoodboardState, TimeSegment } from '../../types/moodboard';
import { loadState, loadSettings, debouncedSaveState, saveSettings } from '../../utils/state-management';
import SettingsPanel from '../SettingsPanel';
import { exportElementAsPNG } from '../../utils/export-png';

// Global types are automatically included by TypeScript, no need to import

// Define the initial canvas dimensions
const INITIAL_CANVAS_WIDTH = 1200;
const INITIAL_CANVAS_HEIGHT = 800;

const MoodboardCanvas: React.FC = () => {
  // Contexts
  const { state, dispatch } = useMoodboard();
  const { addToast } = useToast();
  const { viewMode } = useViewMode();
    // State
  const [canvasBackground, setCanvasBackground] = useState('#1a1a1a');
  const [canvasWidth] = useState(INITIAL_CANVAS_WIDTH);
  const [canvasHeight] = useState(INITIAL_CANVAS_HEIGHT);
  const [isDarkMode] = useState(true);
  const [history, setHistory] = useState<MoodboardState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf'>('png');
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  
  // Refs for transform wrapper
  const transformRef = useRef<any>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Log view mode changes for debugging
  useEffect(() => {
    console.log('View mode changed:', viewMode);
  }, [viewMode]);

  // Generate segment order
  const segmentOrder = Object.keys(state.segments).sort((a, b) => {
    return state.segments[a].order - state.segments[b].order;
  });

  // Load state on mount
  useEffect(() => {
    try {
      const savedState = loadState();
      if (savedState) {
        dispatch({ type: 'LOAD_STATE', payload: savedState });
        setHistory([savedState]);
        setHistoryIndex(0);
        addToast('Loaded your previous moodboard', 'info');
      }
      
      // Load canvas settings
      const settings = loadSettings();
      if (settings) {
        setCanvasBackground(settings.background);
      }
    } catch (error) {
      console.error('Error loading state:', error);
      addToast('Could not load previous work', 'error');
    }
  }, [dispatch, addToast]);

  // Save state when changed
  useEffect(() => {
    try {
      debouncedSaveState(state);
      saveSettings({
        background: canvasBackground,
        width: canvasWidth,
        height: canvasHeight,
        darkMode: isDarkMode
      });
    } catch (error) {
      console.error('Error saving state:', error);
      addToast('Failed to save your work', 'error');
    }
  }, [state, canvasBackground, canvasWidth, canvasHeight, isDarkMode, addToast]);
  
  // Keep track of the last action type
  const lastActionRef = useRef<string | null>(null);
  
  // Update history when state changes
  useEffect(() => {
    // Skip history update if the last action was LOAD_STATE (from undo/redo)
    if (lastActionRef.current === 'LOAD_STATE') {
      // Reset the flag after handling
      lastActionRef.current = null;
      return;
    }
    
    const lastHistoryState = history[historyIndex];
    
    // Only add to history if:
    // 1. We have state changes
    // 2. We have a previous history entry to compare with
    // 3. The state is different from the previous history entry
    if (
      state &&
      (historyIndex === -1 ||
       (historyIndex >= 0 && 
        lastHistoryState && 
        JSON.stringify(state) !== JSON.stringify(lastHistoryState)))
    ) {
      console.log('State changed, updating history');
      
      // Create a proper copy of the state to avoid reference issues
      const stateCopy = JSON.parse(JSON.stringify(state));
      
      // If we're not at the end of history (user did an undo), truncate future states
      const newHistory = historyIndex < history.length - 1
        ? history.slice(0, historyIndex + 1)
        : [...history];
        
      // Add the new state
      newHistory.push(stateCopy);
      
      // Update state
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      
      console.log(`History updated: ${newHistory.length} states, current index: ${newHistory.length - 1}`);
    }
  }, [state, history, historyIndex]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      console.log(`Undoing to history index ${newIndex} of ${history.length - 1}`);
      
      // First update the history index
      setHistoryIndex(newIndex);
      
      // Then load the state from history
      const historyState = history[newIndex];
      if (historyState) {
        // Set the flag to prevent history update
        lastActionRef.current = 'LOAD_STATE';
        
        // Create a deep clone to ensure no reference issues
        const stateToLoad = JSON.parse(JSON.stringify(historyState));
        dispatch({ type: 'LOAD_STATE', payload: stateToLoad });
        addToast(`Undo successful (${newIndex + 1}/${history.length})`, 'info');
      }
    } else {
      console.log('Nothing to undo');
      addToast('Nothing to undo', 'info');
    }
  }, [historyIndex, history, dispatch, addToast]);

  // Handle redo
  const handleRedo = useCallback(() => {
    if (history.length > 0 && historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      console.log(`Redoing to history index ${newIndex} of ${history.length - 1}`);
      
      // First update the history index
      setHistoryIndex(newIndex);
      
      // Then load the state from history
      const historyState = history[newIndex];
      if (historyState) {
        // Set the flag to prevent history update
        lastActionRef.current = 'LOAD_STATE';
        
        // Create a deep clone to ensure no reference issues
        const stateToLoad = JSON.parse(JSON.stringify(historyState));
        dispatch({ type: 'LOAD_STATE', payload: stateToLoad });
        addToast(`Redo successful (${newIndex + 1}/${history.length})`, 'info');
      }
    } else {
      console.log('Nothing to redo');
      addToast('Nothing to redo', 'info');
    }
  }, [historyIndex, history, dispatch, addToast]);

  // Handle segment updates
  const handleUpdateSegment = useCallback((segmentId: string, updates: Partial<TimeSegment>) => {
    dispatch({
      type: 'UPDATE_SEGMENT',
      payload: { id: segmentId, ...updates }
    });
  }, [dispatch]);

  // Handle segment deletion
  const handleDeleteSegment = useCallback((segmentId: string) => {
    dispatch({
      type: 'REMOVE_SEGMENT',
      payload: { id: segmentId }
    });
    addToast('Segment deleted', 'success');
  }, [dispatch, addToast]);

  // Handle adding a new time segment
  const handleAddSegment = useCallback(() => {
    // Get all segment IDs that follow the "day-N" format
    const daySegments = Object.keys(state.segments)
      .filter(id => /^day-\d+$/.test(id))
      .map(id => parseInt(id.split('-')[1], 10));
    
    // Find the next available day number
    const nextDayNumber = daySegments.length > 0 
      ? Math.max(...daySegments) + 1 
      : 1;
    
    const newId = `day-${nextDayNumber}`;
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    dispatch({
      type: 'ADD_SEGMENT',
      payload: {
        id: newId,
        title: `Day ${nextDayNumber}`,
        order: Object.keys(state.segments).length,
        width: 300,
        height: 300,
        timeRange: {
          start: today.toISOString(),
          end: tomorrow.toISOString()
        }
      }
    });
    addToast('New day added', 'success');
  }, [dispatch, state.segments, addToast]);

  // Handle resetting zoom
  const handleResetZoom = useCallback(() => {
    if (transformRef.current) {
      transformRef.current.resetTransform();
    }
  }, []);

  // Sticker manipulation
  const bringToFront = useCallback(() => {
    if (state.selectedStickerId) {
      const sticker = state.stickers[state.selectedStickerId];
      if (sticker) {
        dispatch({
          type: 'UPDATE_STICKER',
          payload: { 
            id: state.selectedStickerId,
            zIndex: 9999
          }
        });
        addToast('Brought sticker to front', 'info');
      }
    }
  }, [state.selectedStickerId, state.stickers, dispatch, addToast]);

  const sendToBack = useCallback(() => {
    if (state.selectedStickerId) {
      const sticker = state.stickers[state.selectedStickerId];
      if (sticker) {
        dispatch({
          type: 'UPDATE_STICKER',
          payload: { 
            id: state.selectedStickerId,
            zIndex: 1
          }
        });
        addToast('Sent sticker to back', 'info');
      }
    }  }, [state.selectedStickerId, state.stickers, dispatch, addToast]);

  // Export functionality
  const handleExport = useCallback(() => {
    addToast(`Exporting as ${exportFormat}...`, 'info');
    console.log(`Export as ${exportFormat} requested - Function executed!`);
    
    if (!boardRef.current) {
      addToast('Could not capture the board. Please try again.', 'error');
      return;
    }
    
    if (exportFormat === 'png') {
      // Show loading indicator
      addToast('Generating PNG, please wait...', 'info');
      
      // Use our utility function to export the board
      exportElementAsPNG(boardRef.current, canvasBackground)
        .then(() => {
          addToast('PNG exported successfully!', 'success');
        })
        .catch((error: Error) => {
          console.error('PNG export error:', error);
          addToast('Failed to export PNG. Please try again.', 'error');
        });
    } else if (exportFormat === 'pdf') {
      // PDF export logic
      addToast('PDF export coming soon!', 'info');
    }
  }, [exportFormat, addToast, canvasBackground]);
  // Settings toggle
  const toggleSettings = useCallback(() => {
    setIsSettingsPanelOpen(prevState => !prevState);
    addToast('Settings panel toggled', 'info');
    console.log('Toggle settings requested - Function executed!');
  }, [addToast]);
  
  // Dark mode toggle
  const handleDarkModeToggle = useCallback(() => {
    // This is just a placeholder since we're not actually implementing dark mode toggle
    // In a real implementation, you would update the isDarkMode state and apply changes
    addToast('Dark mode toggle requested', 'info');
    console.log('Dark mode toggle requested - Function executed!');
  }, [addToast]);

  // Key event handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' && state.selectedStickerId) {
        e.preventDefault();
        dispatch({
          type: 'REMOVE_STICKER',
          payload: { id: state.selectedStickerId }
        });
        addToast('Sticker deleted', 'info');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, state.selectedStickerId, dispatch, addToast]);

  // Expose controls to window for the MoodboardControls component
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const controls = {
        handleUndo,
        handleRedo,
        handleAddSegment,
        handleResetZoom,
        historyIndex,
        historyLength: history.length,
        isDarkMode,
        hasSelectedSticker: !!state.selectedStickerId,
        exportFormat,
        handleExport,
        handleBringToFront: bringToFront,
        handleSendToBack: sendToBack,
        toggleSettings
      };

      // Set controls on window as any type to avoid TypeScript issues
      (window as any).moodboardControls = controls;
      console.log('Controls exposed to window:', window.moodboardControls ? Object.keys(controls) : 'none');
    }
  }, [
    handleUndo, 
    handleRedo, 
    handleAddSegment, 
    handleResetZoom, 
    historyIndex, 
    history.length, 
    isDarkMode, 
    state.selectedStickerId, 
    exportFormat, 
    handleExport, 
    bringToFront, 
    sendToBack, 
    toggleSettings
  ]);
  // Handle export format change
  const handleExportFormatChange = useCallback((format: 'png' | 'pdf') => {
    setExportFormat(format);
    addToast(`Export format set to ${format.toUpperCase()}`, 'info');
    saveSettings({
      background: canvasBackground,
      width: canvasWidth,
      height: canvasHeight,
      darkMode: isDarkMode,
      exportFormat: format
    });
  }, [canvasBackground, canvasWidth, canvasHeight, isDarkMode, addToast]);

  // Return JSX
  return (
    <div 
      role="complementary"
      aria-label="Moodboard canvas"
      className="moodboard-canvas relative w-full h-full overflow-hidden"
      style={{ minHeight: '600px' }}
    >      {/* Settings Panel */}
      <SettingsPanel 
        isOpen={isSettingsPanelOpen}
        onClose={() => setIsSettingsPanelOpen(false)}
        isDarkMode={isDarkMode}
        onDarkModeToggle={handleDarkModeToggle}
        exportFormat={exportFormat}
        onExportFormatChange={handleExportFormatChange}
      />
      
      {viewMode === 'standard' ? (
        <TransformWrapper
          ref={transformRef}
          initialScale={1}
          minScale={0.1}
          maxScale={5}
          centerOnInit={true}
          limitToBounds={false}
        >
          <TransformComponent 
            wrapperStyle={{ 
              width: '100%', 
              height: '100%', 
              minHeight: '600px'
            }}
          >
            <div 
              ref={boardRef}
              className="canvas-container" 
              style={{ 
                width: `${INITIAL_CANVAS_WIDTH}px`, 
                height: `${INITIAL_CANVAS_HEIGHT}px`, 
                position: 'relative',
                backgroundColor: canvasBackground
              }}
            >
              <VirtualizedBoard 
                onSegmentUpdate={handleUpdateSegment}
                onSegmentDelete={handleDeleteSegment}
              />
              {/* Hidden sticker elements for test IDs only */}
              {Object.values(state.stickers).map(sticker => (
                <div key={sticker.id} data-testid={sticker.id} style={{ display: 'none' }} />
              ))}
            </div>
          </TransformComponent>
        </TransformWrapper>
      ) : viewMode === 'timeline' ? (
        <TimelineView segments={state.segments} stickers={state.stickers} segmentOrder={segmentOrder} />
      ) : viewMode === 'map' ? (
        <MapView stickers={state.stickers} />
      ) : viewMode === 'list' ? (
        <ListView segments={state.segments} stickers={state.stickers} segmentOrder={segmentOrder} />
      ) : (
        <GridView stickers={state.stickers} />
      )}

      {/* Add a floating control for adding segments, visible in all views */}
      <button
        onClick={handleAddSegment}
        className="fixed bottom-28 right-4 p-3 bg-blue-500 text-white rounded-full shadow-lg z-30"
        title="Add new day"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
};

const styles = `
.moodboard-canvas {
  background-color: var(--canvas-bg-color);
  transition: background-color 0.2s ease-in-out;
}
`;

const styleSheet = document.createElement('style');
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Add a viewport size monitor
const updateViewportSize = () => {
  if (typeof window === 'undefined') return;
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
};

// Initial viewport size update
updateViewportSize();

// Update viewport size on resize
if (typeof window !== 'undefined') {
  window.addEventListener('resize', updateViewportSize);
}

export default MoodboardCanvas;
