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
}

const defaultContext: TourContextType = {
  isFirstVisit: true,
  startTour: () => {},
  endTour: () => {},
  showTour: false,
  stepIndex: 0,
  run: false,
  setRun: () => {},
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
        content: 'Welcome to Moodboard! Let\'s take a quick tour of the features!',
        placement: 'center' as const,
        title: '👋 Welcome',
        disableBeacon: true,
        disableOverlayClose: true,
        hideCloseButton: true,
      },
      {
        target: '.moodboard-canvas',
        content: 'This is your main canvas where you\'ll organize your trip timeline. You can pan around by clicking and dragging.',
        placement: 'center' as const,
        title: 'Your Trip Canvas',
        disableOverlay: true,
      },
      {
        target: 'button[title="Add Sticker"]',
        content: 'Click here to open the sticker palette and add different types of content to your board.',
        placement: 'right' as const,
        title: 'Add Stickers',
        disableBeacon: true,
      },
      {
        target: 'button[title="Add Day"]',
        content: 'Click here to add a new day segment to organize your trip timeline.',
        placement: 'right' as const,
        title: 'Add Day Segments',
        disableBeacon: true,
      },
      {
        target: '.time-segment',
        content: 'This is a time segment. You can drag it to move or resize it to adjust the duration.',
        placement: 'bottom' as const,
        title: 'Time Segments',
        disableBeacon: true,
      },
      {
        target: 'button[title="Reset zoom"]',
        content: 'Use these controls to zoom in, zoom out, or reset the zoom level of your board.',
        placement: 'left' as const,
        title: 'Zoom Controls',
        disableBeacon: true,
      },
      {
        target: 'button[title="Export as Image"]',
        content: 'When you\'re happy with your moodboard, click here to export it as an image.',
        placement: 'left' as const,
        title: 'Export Your Board',
        disableBeacon: true,
      },
      {
        target: 'body',
        content: 'All set! You can now start creating your perfect trip moodboard. Have fun! ✈️',
        placement: 'center' as const,
        title: 'Enjoy!',
        disableOverlayClose: false,
        hideCloseButton: false,
      },
    ];
  }, []);

  // Check if it's the first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('moodboard_tour_completed');
    if (!hasVisited) {
      setIsFirstVisit(true);
      localStorage.setItem('moodboard_tour_started', 'true');
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
    localStorage.setItem('moodboard_tour_completed', 'true');
    setIsFirstVisit(false);
    
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
    const hasTourStarted = localStorage.getItem('moodboard_tour_started');
    const hasCompletedTour = localStorage.getItem('moodboard_tour_completed');
    
    if (isFirstVisit && !showTour && hasTourStarted === 'true' && !hasCompletedTour) {
      autoStartTimeoutRef.current = window.setTimeout(() => {
        startTour();
        localStorage.removeItem('moodboard_tour_started');
      }, 1500);
    }

    return () => {
      window.clearTimeout(autoStartTimeoutRef.current);
    };
  }, [isFirstVisit, showTour, startTour]);

  // Styles for the tour
  const joyrideStyles = {
    options: {
      zIndex: 10000,
      primaryColor: '#6366f1',
      textColor: '#1f2937',
      backgroundColor: '#6366f1',
      color: 'white',
      borderRadius: 4,
      padding: '8px 16px',
    },
    buttonBack: {
      color: '#6366f1',
      marginRight: 8,
    },
    buttonSkip: {
      color: '#6b7280',
    },
  };

  const floaterProps = {
    disableAnimation: false,
    disableFlip: true,
    styles: {
      floater: {
        filter: 'none',
        maxWidth: '400px',
      },
    },
  };

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
      }}
    >
      {children}
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
