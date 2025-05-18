import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { MoodboardState, MoodboardAction, Sticker, TimeSegment } from '../types/moodboard';
import { v4 as uuidv4 } from 'uuid';

// Initial state for the moodboard
const initialState: MoodboardState = {
  segments: {
    'day-1': { id: 'day-1', title: 'Day 1', order: 0, width: 300, height: 300 },
    'day-2': { id: 'day-2', title: 'Day 2', order: 1, width: 300, height: 300 }
  },
  stickers: {},
  segmentOrder: ['day-1', 'day-2'],
  isDragging: false,
  selectedStickerId: null,
};

// Reducer to handle all moodboard actions
function moodboardReducer(state: MoodboardState, action: MoodboardAction): MoodboardState {
  switch (action.type) {
    case 'ADD_SEGMENT': {
      const { id, title, order, width, height } = action.payload;
      return {
        ...state,
        segments: {
          ...state.segments,
          [id]: { id, title, order, width, height }
        },
        segmentOrder: [...state.segmentOrder, id]
      };
    }
    
    case 'REMOVE_SEGMENT': {
      const { id } = action.payload;
      const newSegments = { ...state.segments };
      delete newSegments[id];
      
      // Also remove stickers in this segment
      const newStickers = { ...state.stickers };
      Object.keys(newStickers).forEach(stickerId => {
        if (newStickers[stickerId].timeSegmentId === id) {
          delete newStickers[stickerId];
        }
      });
      
      return {
        ...state,
        segments: newSegments,
        stickers: newStickers,
        segmentOrder: state.segmentOrder.filter(segId => segId !== id)
      };
    }
    
    case 'RENAME_SEGMENT': {
      const { id, title } = action.payload;
      return {
        ...state,
        segments: {
          ...state.segments,
          [id]: {
            ...state.segments[id],
            title
          }
        }
      };
    }
    
    case 'RESIZE_SEGMENT': {
      const { id, width, height } = action.payload;
      return {
        ...state,
        segments: {
          ...state.segments,
          [id]: {
            ...state.segments[id],
            width,
            height
          }
        }
      };
    }
    
    case 'REORDER_SEGMENTS': {
      return {
        ...state,
        segmentOrder: action.payload.segmentOrder
      };
    }
    
    case 'ADD_STICKER': {
      const sticker = action.payload;
      return {
        ...state,
        stickers: {
          ...state.stickers,
          [sticker.id]: sticker
        }
      };
    }
    
    case 'REMOVE_STICKER': {
      const { stickerId } = action.payload;
      const newStickers = { ...state.stickers };
      delete newStickers[stickerId];
      
      return {
        ...state,
        stickers: newStickers,
        selectedStickerId: state.selectedStickerId === stickerId ? null : state.selectedStickerId
      };
    }
    
    case 'MOVE_STICKER': {
      const { stickerId, x, y } = action.payload;
      
      if (!state.stickers[stickerId]) {
        return state;
      }
      
      return {
        ...state,
        stickers: {
          ...state.stickers,
          [stickerId]: {
            ...state.stickers[stickerId],
            x,
            y
          }
        }
      };
    }
    
    case 'RESIZE_STICKER': {
      const { id, width, height } = action.payload;
      
      if (!state.stickers[id]) {
        return state;
      }
      
      return {
        ...state,
        stickers: {
          ...state.stickers,
          [id]: {
            ...state.stickers[id],
            width,
            height
          }
        }
      };
    }
    
    case 'ROTATE_STICKER': {
      const { id, rotation } = action.payload;
      
      if (!state.stickers[id]) {
        return state;
      }
      
      return {
        ...state,
        stickers: {
          ...state.stickers,
          [id]: {
            ...state.stickers[id],
            rotation
          }
        }
      };
    }
    
    case 'SELECT_STICKER': {
      return {
        ...state,
        selectedStickerId: action.payload.stickerId
      };
    }
    
    case 'START_DRAG': {
      return {
        ...state,
        isDragging: true
      };
    }
    
    case 'END_DRAG': {
      return {
        ...state,
        isDragging: false
      };
    }
    
    default:
      return state;
  }
}

// Context for the moodboard
interface MoodboardContextType {
  state: MoodboardState;
  dispatch: React.Dispatch<MoodboardAction>;
  createSticker: (data: Omit<Sticker, 'id'>) => Sticker;
}

const MoodboardContext = createContext<MoodboardContextType | undefined>(undefined);

// Custom hook to use the moodboard context
export const useMoodboard = () => {
  const context = useContext(MoodboardContext);
  if (!context) {
    throw new Error('useMoodboard must be used within a MoodboardProvider');
  }
  return context;
};

// Provider component
interface MoodboardProviderProps {
  children: ReactNode;
}

export const MoodboardProvider: React.FC<MoodboardProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(moodboardReducer, initialState);
  
  // Helper function to create a new sticker with a unique ID
  const createSticker = (data: Omit<Sticker, 'id'>): Sticker => {
    const id = uuidv4();
    return { ...data, id };
  };
  
  const value = { state, dispatch, createSticker };
  
  return (
    <MoodboardContext.Provider value={value}>
      {children}
    </MoodboardContext.Provider>
  );
};

export default MoodboardContext;
