import { useState, useEffect } from 'react';
import './styles.css';
import MoodboardCanvas from './components/board/MoodboardCanvas';
import StickerPalette from './components/StickerPalette';
import { ViewModeToggle } from './components/ViewModeToggle';
import { ViewModeProvider } from './context/ViewModeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  Cog6ToothIcon,
  PhotoIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  QuestionMarkCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useTour } from './context/TourContext';

// MoodboardControls component to render the controls outside the canvas
const MoodboardControls = ({ darkMode, isMobile }: { darkMode: boolean; isMobile: boolean }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const buttonBaseStyle = darkMode
    ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
    : "bg-white hover:bg-gray-100 text-gray-700";
  const [controls, setControls] = useState<any>(null);
  const [hasSelectedSticker, setHasSelectedSticker] = useState(false);
  const { startTour } = useTour();
  
  useEffect(() => {
    const checkControls = () => {
      // @ts-ignore - Access the exposed moodboardControls
      if (window.moodboardControls) {
        // @ts-ignore
        setControls({
          ...window.moodboardControls,
          // Ensure we're always accessing fresh values for these properties
          historyIndex: window.moodboardControls.historyIndex,
          historyLength: window.moodboardControls.historyLength
        });
        // @ts-ignore
        setHasSelectedSticker(window.moodboardControls.hasSelectedSticker);
      }
    };
    
    checkControls();
    // Poll more frequently to ensure responsive undo/redo buttons
    const intervalId = setInterval(checkControls, 200);
    return () => clearInterval(intervalId);
  }, []);
  
  if (!controls) return null;

  // Fixed conditional rendering that was causing buttons not to appear
  /*
  if (isMobile) {
     <button
       onClick={() => setIsMenuOpen(true)}
       className="fixed right-4 bottom-20 z-40 p-4 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors"
       aria-label="Open menu"
     >
       <Bars3Icon className="w-6 h-6" />
     </button>
  }
  */

  const controlButtons = (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}
      >
        <button
          onClick={() => controls.handleResetZoom()}
          className={`p-4 rounded-full shadow transition-colors ${buttonBaseStyle} ${isMobile ? 'w-full flex items-center justify-center gap-2' : ''}`}
          title="Reset zoom"
        >
          <ArrowPathIcon className="w-6 h-6" />
          {isMobile && <span>Reset Zoom</span>}
        </button>
        <button
          onClick={() => controls.handleUndo()}
          disabled={controls.historyIndex <= 0}
          className={`p-2 rounded-full shadow transition-colors ${controls.historyIndex <= 0 ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : buttonBaseStyle} ${isMobile ? 'w-full flex items-center justify-center gap-2' : ''}`}
          title="Undo (Ctrl+Z)"
        >
          <ArrowUturnLeftIcon className="w-5 h-5" />
          {isMobile && <span>Undo</span>}
        </button>
        <button
          onClick={() => controls.handleRedo()}
          disabled={controls.historyLength === 0 || controls.historyIndex >= controls.historyLength - 1}
          className={`p-2 rounded-full shadow transition-colors ${controls.historyLength === 0 || controls.historyIndex >= controls.historyLength - 1 ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : buttonBaseStyle} ${isMobile ? 'w-full flex items-center justify-center gap-2' : ''}`}
          title="Redo (Ctrl+Y)"
        >
          <ArrowUturnRightIcon className="w-5 h-5" />
          {isMobile && <span>Redo</span>}
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}
      >
        <button
          onClick={() => controls.toggleSettings()}
          className={`p-2 rounded-full shadow transition-colors ${buttonBaseStyle} ${isMobile ? 'w-full flex items-center justify-center gap-2' : ''}`}
          title="Settings"
        >
          <Cog6ToothIcon className="w-5 h-5" />
          {isMobile && <span>Settings</span>}
        </button>
        <button
          onClick={() => controls.handleExport()}
          className={`p-2 rounded-full shadow transition-colors ${buttonBaseStyle} ${isMobile ? 'w-full flex items-center justify-center gap-2' : ''}`}
          title={`Export as ${controls.exportFormat?.toUpperCase()}`}
        >
          {controls.exportFormat === 'png' ? (
            <PhotoIcon className="w-5 h-5" />
          ) : (
            <DocumentTextIcon className="w-5 h-5" />
          )}
          {isMobile && <span>Export</span>}
        </button>
        <button
          onClick={() => controls.handleAddSegment()}
          className={`p-2 bg-blue-500 rounded-full shadow hover:bg-blue-600 text-white transition-colors ${isMobile ? 'w-full flex items-center justify-center gap-2' : ''}`}
          title="Add new day"
        >
          <PlusIcon className="w-5 h-5" />
          {isMobile && <span>Add Day</span>}
        </button>
      </motion.div>

      <AnimatePresence>
        {hasSelectedSticker && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.1 }}
            className={`flex ${isMobile ? 'flex-col' : ''} gap-2 ${darkMode ? 'bg-gray-700' : 'bg-white'} p-2 rounded-lg shadow`}
          >
            <button
              onClick={() => controls.bringToFront()}
              className={`p-1.5 bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-colors ${isMobile ? 'w-full flex items-center justify-center gap-2' : ''}`}
              title="Bring to front"
            >
              <ArrowUpIcon className="w-4 h-4" />
              {isMobile && <span>Bring to Front</span>}
            </button>
            <button
              onClick={() => controls.sendToBack()}
              className={`p-1.5 bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-colors ${isMobile ? 'w-full flex items-center justify-center gap-2' : ''}`}
              title="Send to back"
            >
              <ArrowDownIcon className="w-4 h-4" />
              {isMobile && <span>Send to Back</span>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`${isMobile ? 'w-full' : 'mt-2'}`}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className={`px-3 py-2 rounded-md ${buttonBaseStyle} flex items-center justify-center shadow-sm help-btn ${isMobile ? 'w-full' : ''}`}
          onClick={startTour}
          title="Help & Tour"
        >
          <QuestionMarkCircleIcon className="h-5 w-5 mr-1" />
          Help & Tour
        </motion.button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        <button
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`fixed bottom-4 right-4 z-50 p-4 rounded-full shadow-lg ${buttonBaseStyle}`}
        >
          {isMenuOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-20 right-4 left-4 z-50 bg-gray-800 rounded-lg shadow-lg p-4 space-y-2"
            >
              {controlButtons}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return controlButtons;
};

function App() {
  const [darkMode] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    localStorage.setItem('moodboard-dark-mode', 'true');
    
    // @ts-ignore
    if (window.moodboardControls?.toggleDarkMode && !window.moodboardControls.isDarkMode) {
      // @ts-ignore
      window.moodboardControls.toggleDarkMode();
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ViewModeProvider>
      <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 text-2xl font-bold">✈️ MoodBoard</span>
                </div>
                {!isMobile && (
                  <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    Plan your dream trip, visually
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Your Trip Moodboard</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1 transition-colors duration-200">
              Create a visual plan for your next adventure. Drag stickers onto the canvas and organize them by day.
            </p>
            
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <ViewModeToggle />
              {/* Show MoodboardControls for all devices, but with different styling based on mobile */}
              <MoodboardControls darkMode={darkMode} isMobile={isMobile} />
            </div>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col' : 'flex-col lg:flex-row'} gap-6`}>
            <aside className={`${isMobile ? 'w-full' : 'w-full lg:w-72'} shrink-0 ${isMobile ? 'order-2' : ''}`}>
              <StickerPalette />
            </aside>
            
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <MoodboardCanvas />
            </div>
          </div>
        </main>
        
        <footer className="mt-12 py-6 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Moodboard • {new Date().getFullYear()} • Made with ❤️
            </p>
          </div>
        </footer>
      </div>
    </ViewModeProvider>
  );
}

export default App;
