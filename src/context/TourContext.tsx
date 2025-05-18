import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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

  // Check if it's the first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('moodboard_tour_completed');
    if (!hasVisited) {
      setIsFirstVisit(true);
      // Set a flag to prevent immediate re-showing
      localStorage.setItem('moodboard_tour_started', 'true');
    }
  }, []);

  // Tour steps with correct selectors and improved content
  const steps: Step[] = [
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

  // Start the tour
  const startTour = useCallback(() => {
    console.group('Starting Tour');
    console.log('Total steps:', steps.length);
    console.log('Step 0 target:', steps[0]?.target);
    console.log('Step 1 target:', steps[1]?.target);
    console.log('Step 2 target:', steps[2]?.target);
    console.groupEnd();
    
    setStepIndex(0);
    setRun(true);
    setShowTour(true);
    setTourKey(prev => prev + 1);
  }, [steps]);

  // End the tour
  const endTour = useCallback(() => {
    console.log('Ending tour');
    setRun(false);
    setShowTour(false);
    setStepIndex(0);
    // Mark as completed when explicitly ended
    localStorage.setItem('moodboard_tour_completed', 'true');
    setIsFirstVisit(false);
  }, []);



  // Handle tour callbacks with better error handling
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, index, status, type, step } = data;
    
    // Skip logging in production
    if (process.env.NODE_ENV !== 'production') {
      console.group('Tour Callback');
      console.log('Current Step:', step?.title || 'N/A', `(Index: ${index})`);
      console.log('Action:', action);
      console.log('Status:', status);
      console.log('Type:', type);
      console.log('Current step index:', index);
      console.log('Total steps:', steps.length);
      console.groupEnd();
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      endTour();
      return;
    }

    // Handle step transitions
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      // For TARGET_NOT_FOUND, we'll try to proceed to the next step
      if (type === EVENTS.TARGET_NOT_FOUND && process.env.NODE_ENV !== 'production') {
        console.warn('Target not found for step:', step?.title || 'unknown', 'Selector:', step?.target);
      }
      
      const nextIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      
      // If we've reached the end of the tour
      if (nextIndex >= steps.length) {
        endTour();
        return;
      }
      
      // Get the next step
      const nextStep = steps[nextIndex];
      
      // If the target is 'body', we can always show it
      if (nextStep.target === 'body') {
        setStepIndex(nextIndex);
        return;
      }
      
      // Check if the target exists in the DOM
      try {
        const targetElement = typeof nextStep.target === 'string' 
          ? document.querySelector(nextStep.target)
          : nextStep.target;
          
        if (targetElement) {
          setStepIndex(nextIndex);
          return;
        }
      } catch (error) {
        console.error('Error checking target element:', error);
      }
      
      // If we get here, the target wasn't found - try to find the next valid step
      let validNextIndex = nextIndex + 1;
      while (validNextIndex < steps.length) {
        const validStep = steps[validNextIndex];
        
        // Always allow body target
        if (validStep.target === 'body') {
          setStepIndex(validNextIndex);
          return;
        }
        
        // Check if the target exists
        try {
          const targetExists = typeof validStep.target === 'string' 
            ? document.querySelector(validStep.target)
            : validStep.target;
            
          if (targetExists) {
            setStepIndex(validNextIndex);
            return;
          }
        } catch (error) {
          console.error('Error checking target element:', error);
        }
        
        validNextIndex++;
      }
      
      // If we've checked all remaining steps and none are valid, end the tour
      endTour();
    }
  }, [endTour, steps]);

  // Auto-start tour on first visit
  useEffect(() => {
    const hasTourStarted = localStorage.getItem('moodboard_tour_started');
    const hasCompletedTour = localStorage.getItem('moodboard_tour_completed');
    
    console.group('Auto-start Check');
    console.log('isFirstVisit:', isFirstVisit);
    console.log('hasTourStarted:', hasTourStarted);
    console.log('hasCompletedTour:', hasCompletedTour);
    console.log('showTour:', showTour);
    console.groupEnd();
    
    if (isFirstVisit && !showTour && hasTourStarted === 'true' && !hasCompletedTour) {
      console.log('Auto-starting tour...');
      const timer = setTimeout(() => {
        startTour();
        // Clear the started flag to prevent auto-starting again
        localStorage.removeItem('moodboard_tour_started');
      }, 1500);
      return () => clearTimeout(timer);
    }
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
        steps={steps}
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
