import { useState, useEffect } from 'react';
import './styles.css';
import MoodboardCanvas from './components/board/MoodboardCanvas';
import StickerPalette from './components/StickerPalette';
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
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { useTour } from './context/TourContext';

// MoodboardControls component to render the controls outside the canvas
const MoodboardControls = ({ darkMode }: { darkMode: boolean }) => {
  // Use darkMode to conditionally generate button styles
  const buttonBaseStyle = darkMode
    ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
    : "bg-white hover:bg-gray-100 text-gray-700";
  // State to track if controls are available
  const [controls, setControls] = useState<any>(null);
  const [hasSelectedSticker, setHasSelectedSticker] = useState(false);
  // Get tour functions
  const { startTour } = useTour();
  
  // Check for controls on interval
  useEffect(() => {
    const checkControls = () => {
      // @ts-ignore - Access the exposed moodboardControls
      if (window.moodboardControls) {
        // @ts-ignore
        setControls(window.moodboardControls);
        // @ts-ignore
        setHasSelectedSticker(window.moodboardControls.hasSelectedSticker);
      }
    };
    
    // Check immediately
    checkControls();
    
    // Set up interval to check for controls and selected sticker state
    const intervalId = setInterval(() => {
      checkControls();
    }, 500);
    
    return () => clearInterval(intervalId);
  }, []);
  
  if (!controls) return null;
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2"
      >
        <button
          onClick={() => controls.handleResetZoom()}
          className="p-2 bg-white dark:bg-gray-700 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
          title="Reset zoom"
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => controls.handleUndo()}
          disabled={controls.historyIndex <= 0}
          className={`p-2 rounded-full shadow transition-colors ${controls.historyIndex <= 0 ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : buttonBaseStyle}`}
          title="Undo (Ctrl+Z)"
        >
          <ArrowUturnLeftIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => controls.handleRedo()}
          disabled={controls.historyIndex >= controls.historyLength - 1}
          className={`p-2 rounded-full shadow transition-colors ${controls.historyIndex >= controls.historyLength - 1 ? 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : buttonBaseStyle}`}
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
          onClick={() => controls.toggleSettings()}
          className="p-2 bg-white dark:bg-gray-700 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
          title="Settings"
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => controls.handleExport()}
          className="p-2 bg-white dark:bg-gray-700 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
          title={`Export as ${controls.exportFormat?.toUpperCase()}`}
        >
          {controls.exportFormat === 'png' ? (
            <PhotoIcon className="w-5 h-5" />
          ) : (
            <DocumentTextIcon className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={() => controls.handleAddSegment()}
          className="p-2 bg-blue-500 rounded-full shadow hover:bg-blue-600 text-white transition-colors"
          title="Add new day"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Layer controls for selected sticker */}
      <AnimatePresence>
        {hasSelectedSticker && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.1 }}
            className={`flex gap-2 ${darkMode ? 'bg-gray-700' : 'bg-white'} p-2 rounded-lg shadow`}
          >
            <button
              onClick={() => controls.bringToFront()}
              className="p-1.5 bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-colors"
              title="Bring to front"
            >
              <ArrowUpIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => controls.sendToBack()}
              className="p-1.5 bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-colors"
              title="Send to back"
            >
              <ArrowDownIcon className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Help/Tour button */}
      <div className="mt-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className={`px-3 py-2 rounded-md ${buttonBaseStyle} flex items-center shadow-sm help-btn`}
          onClick={startTour}
          title="Help & Tour"
        >
          <QuestionMarkCircleIcon className="h-5 w-5 mr-1" />
          Help & Tour
        </motion.button>
      </div>
    </>
  );
};

function App() {
  // Force dark mode always
  const [darkMode] = useState(true); // setDarkMode not used as we always force dark mode
  
  // Set dark mode in local storage on first load
  useEffect(() => {
    localStorage.setItem('moodboard-dark-mode', 'true');
    
    // Update canvas dark mode if controls are available
    // @ts-ignore
    if (window.moodboardControls?.toggleDarkMode && !window.moodboardControls.isDarkMode) {
      // @ts-ignore
      window.moodboardControls.toggleDarkMode();
    }
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-blue-600 dark:text-blue-400 text-2xl font-bold">✈️ MoodBoard</span>
              </div>
              <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                Plan your dream trip, visually
              </div>
            </div>
            {/* Dark mode is now permanently enabled */}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Your Trip Moodboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1 transition-colors duration-200">
            Create a visual plan for your next adventure. Drag stickers onto the canvas and organize them by day.
          </p>
          
          {/* Moodboard Canvas Controls */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <MoodboardControls darkMode={darkMode} />
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="w-full lg:w-72 shrink-0">
            <StickerPalette />
          </aside>
          
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <MoodboardCanvas externalControls={true} />
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
  );
}

export default App;
