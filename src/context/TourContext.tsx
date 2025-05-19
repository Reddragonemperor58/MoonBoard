import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import Joyride, { CallBackProps, EVENTS, ACTIONS, STATUS, Step } from 'react-joyride';

interface TourContextType {
  isFirstVisit: boolean;
  startTour: () => void;
  endTour: () => void;
  showTour: boolean;
  stepIndex: number;
  run: boolean;
  setRun: (run: boolean) => void;
  resetTourState?: () => void; // Optional for production
}

const defaultContext: TourContextType = {
  isFirstVisit: true,
  startTour: () => {},
  endTour: () => {},
  showTour: false,
  stepIndex: 0,
  run: false,
  setRun: () => {},
  resetTourState: undefined,
};

const TourContext = createContext<TourContextType>(defaultContext);

export const useTour = () => useContext(TourContext);

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [run, setRun] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [tourKey, setTourKey] = useState(0);
  
  // Use refs for mutable values that shouldn't trigger re-renders
  const stepsRef = useRef<Step[]>([]);
  const autoStartTimeoutRef = useRef<number>();
  const targetCheckTimeoutRef = useRef<number>();

  // Initialize steps once
  useEffect(() => {
    stepsRef.current = [
      {
        target: 'body',
        content: 'Welcome to MoonBoard! Let\'s take a quick tour of the features!',
        placement: 'center' as const,
        title: '👋 Welcome',
        disableBeacon: true,
        disableOverlayClose: true,
        hideCloseButton: true,
      },
      {
        target: '.max-w-7xl .flex-1',
        content: 'This is your main canvas where you\'ll organize your trip timeline. You can pan around by clicking and dragging.',
        placement: 'center' as const,
        title: 'Your Trip Canvas',
        disableOverlay: true,
      },
      {
        target: '.p-4.bg-gray-800.border.border-gray-700.rounded-lg',
        content: 'This is the sticker palette where you can find different types of content to add to your board.',
        placement: 'left' as const,
        title: 'Sticker Palette',
        disableBeacon: true,
      },
      {
        target: '.grid.grid-cols-3.gap-2',
        content: 'Drag these stickers and drop them onto time segments to add content. You can add text notes, icons, images, and more.',
        placement: 'bottom' as const,
        title: 'Drag & Drop Stickers',
        disableBeacon: true,
      },
      {
        target: 'button[title="Add new day"]',
        content: 'Click here to add a new day segment to organize your trip timeline.',
        placement: 'right' as const,
        title: 'Add Day Segments',
        disableBeacon: true,
      },
      {
        target: '.time-segment',
        content: 'This is a time segment. You can drag it to move or resize it to adjust the duration. You can also edit the title by clicking on it.',
        placement: 'bottom' as const,
        title: 'Time Segments',
        disableBeacon: true,
      },
      {
        target: '.flex.gap-2 button:first-child',
        content: 'Use these controls to zoom in, zoom out, or reset the zoom level of your board.',
        placement: 'left' as const,
        title: 'Zoom Controls',
        disableBeacon: true,
      },
      {
        target: 'button[title="Open Settings"]',
        content: 'Configure settings like dark mode and export options here.',
        placement: 'left' as const,
        title: 'Settings',
        disableBeacon: true,
      },
      {
        target: 'button[title="Export"]',
        content: 'When you\'re happy with your moodboard, click here to export it as an image or PDF.',
        placement: 'left' as const,
        title: 'Export Your Board',
        disableBeacon: true,
      },
      {
        target: 'body',
        content: 'All set! You can now start creating your perfect MoonBoard by dragging stickers onto time segments, organizing your content, and exporting your creation when you\'re done. Have fun! ✈️',
        placement: 'center' as const,
        title: 'Ready to Create!',
        disableOverlayClose: false,
        hideCloseButton: false,
      },
    ];
  }, []);

  // Check if it's the first visit
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('moodboard_tour_completed');
    // Consider it a first visit if the tour has never been completed
    if (!hasCompletedTour) {
      setIsFirstVisit(true);
    } else {
      setIsFirstVisit(false);
    }
    
    // Cleanup function
    return () => {
      window.clearTimeout(autoStartTimeoutRef.current);
      window.clearTimeout(targetCheckTimeoutRef.current);
    };
  }, []);

  // Start the tour with optimized logging
  const startTour = useCallback(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.group('Starting Tour');
      console.log('Total steps:', stepsRef.current.length);
      console.groupEnd();
    }
    
    setStepIndex(0);
    setRun(true);
    setShowTour(true);
    setTourKey(prev => prev + 1);
  }, []);

  // End the tour and cleanup
  const endTour = useCallback(() => {
    setRun(false);
    setShowTour(false);
    setStepIndex(0);
    
    // Mark the tour as completed in localStorage so it won't auto-start again
    localStorage.setItem('moodboard_tour_completed', 'true');
    localStorage.setItem('moonboard_has_visited', 'true');
    setIsFirstVisit(false);
    
    console.log('Tour completed and marked in localStorage');
    
    // Clean up any pending timeouts
    window.clearTimeout(autoStartTimeoutRef.current);
    window.clearTimeout(targetCheckTimeoutRef.current);
  }, []);

  // Optimized target checking with debounce
  const checkTarget = useCallback((target: string | Element): boolean => {
    if (target === 'body') return true;
    if (typeof target !== 'string') return document.body.contains(target);
    
    try {
      const element = document.querySelector(target);
      return !!element && document.body.contains(element);
    } catch {
      return false;
    }
  }, []);

  // Handle tour callbacks with optimized error handling and target checking
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, index, status, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      endTour();
      return;
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      window.clearTimeout(targetCheckTimeoutRef.current);
      
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      
      if (nextIndex >= stepsRef.current.length) {
        endTour();
        return;
      }

      // Use debounced target checking
      targetCheckTimeoutRef.current = window.setTimeout(() => {
        let validNextIndex = nextIndex;
        while (validNextIndex < stepsRef.current.length) {
          const validStep = stepsRef.current[validNextIndex];
          if (checkTarget(validStep.target)) {
            setStepIndex(validNextIndex);
            return;
          }
          validNextIndex++;
        }
        endTour();
      }, 150);
    }
  }, [endTour, checkTarget]);

  // Auto-start tour on first visit with cleanup
  useEffect(() => {
    // Check for first time visit based on lack of any tour-related item in localStorage
    const hasEverVisited = localStorage.getItem('moonboard_has_visited');
    const hasCompletedTour = localStorage.getItem('moodboard_tour_completed');
    
    // Only auto-start if this is the very first visit (no record of previous visits)
    if (!hasEverVisited && !hasCompletedTour && !showTour) {
      console.log('First time user detected, starting tour automatically');
      // Mark that the user has visited the site
      localStorage.setItem('moonboard_has_visited', 'true');
      
      // Start the tour after a short delay to let the UI load completely
      autoStartTimeoutRef.current = window.setTimeout(() => {
        startTour();
      }, 1000);
    }

    return () => {
      window.clearTimeout(autoStartTimeoutRef.current);
    };
  }, [showTour, startTour]);

  // Styles for the tour
  const joyrideStyles = {
    options: {
      zIndex: 10000,
      primaryColor: '#3b82f6',
      textColor: '#1f2937',
      overlayColor: 'rgba(0, 0, 0, 0.75)',
      backgroundColor: '#3b82f6',
      color: 'white',
      borderRadius: 6,
      padding: '10px 20px',
      width: 350,
    },
    tooltip: {
      backgroundColor: 'white',
      borderRadius: 8,
      boxShadow: '0 5px 25px rgba(0, 0, 0, 0.2)',
      padding: '16px',
    },
    tooltipTitle: {
      fontSize: '18px',
      fontWeight: 600,
      marginBottom: '8px',
      color: '#111827',
    },
    tooltipContent: {
      fontSize: '15px',
      lineHeight: 1.5,
    },
    buttonNext: {
      backgroundColor: '#3b82f6',
      borderRadius: 4,
      fontWeight: 500,
    },
    buttonBack: {
      color: '#64748b',
      marginRight: 12,
    },
    buttonSkip: {
      color: '#64748b',
    },
  };

  const floaterProps = {
    disableAnimation: false,
    disableFlip: false,
    hideArrow: false,
    offset: 10,
    styles: {
      floater: {
        filter: 'drop-shadow(0 4px 15px rgba(0, 0, 0, 0.15))',
        maxWidth: '450px',
        zIndex: 10001,
      },
      arrow: {
        color: '#fff',
        length: 8,
        spread: 10,
      },
    },
  };

  // Helper function to reset tour state (for development purposes)
  const resetTourState = useCallback(() => {
    localStorage.removeItem('moodboard_tour_completed');
    localStorage.removeItem('moonboard_has_visited');
    setIsFirstVisit(true);
    console.log('Tour state reset - will auto-start on next refresh');
  }, []);

  // Only show debug UI in development mode
  const isDevMode = process.env.NODE_ENV === 'development';
  
  return (
    <TourContext.Provider
      value={{
        isFirstVisit,
        startTour,
        endTour,
        showTour,
        stepIndex,
        run,
        setRun,
        resetTourState: isDevMode ? resetTourState : undefined,
      }}
    >
      {children}
      {isDevMode && (
        <div
          style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            zIndex: 9999,
            opacity: 0.7,
            display: 'none', // Hidden by default, change to 'block' for testing
          }}
        >
          <button
            onClick={resetTourState}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              backgroundColor: '#f87171',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reset Tour (Dev Only)
          </button>
        </div>
      )}
      <Joyride
        key={`tour-${tourKey}`}
        steps={stepsRef.current}
        run={run}
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        continuous
        showProgress
        showSkipButton
        scrollToFirstStep
        disableOverlayClose
        disableCloseOnEsc
        styles={joyrideStyles}
        floaterProps={floaterProps}
      />
    </TourContext.Provider>
  );
};

export default TourProvider;
