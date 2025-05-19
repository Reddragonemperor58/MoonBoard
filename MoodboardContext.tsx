import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  MoodboardState, 
  MoodboardAction, 
  Sticker, 
  TimeSegment,
  TextSticker,
  ImageSticker,
  IconSticker,
  LinkSticker,
  MapSticker,
  CustomSticker
} from '../types/moodboard';
import { v4 as uuidv4 } from 'uuid';

// Initial state for the moodboard
const initialState: MoodboardState = {
  segments: {
    'day-1': {
      id: 'day-1',
      title: 'Day 1',
      order: 0,
      width: 300,
      height: 300,
      childrenIds: [],
      timeRange: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 86400000).toISOString()
      }
    }
  },
  stickers: {},
  segmentOrder: ['day-1'],
  isDragging: false,
  selectedStickerIds: [],
  selectedStickerId: null,
  stickerGroups: {},
  viewMode: {
    type: 'board',
    scale: 1,
    position: { x: 0, y: 0 }
  },
  templates: {},
  isMultiSelectMode: false
};

// Reducer to handle all moodboard actions
function moodboardReducer(state: MoodboardState, action: MoodboardAction): MoodboardState {
  switch (action.type) {
    case 'ADD_SEGMENT': {
      const { id, title, order, width, height, parentId, timeRange, color, collapsed } = action.payload;
      const newSegment: TimeSegment = {
        id,
        title: title || 'New Segment',
        order: order || 0,
        width: width || 300,
        height: height || 300,
        childrenIds: [],
        parentId,
        timeRange,
        color,
        collapsed: collapsed || false
      };
      return {
        ...state,
        segments: {
          ...state.segments,
          [id]: newSegment
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
    
    case 'UPDATE_SEGMENT': {
      const { id, ...updates } = action.payload;
      return {
        ...state,
        segments: {
          ...state.segments,
          [id]: {
            ...state.segments[id],
            ...updates
          }
        }
      };
    }
    
    case 'ADD_STICKER': {
      const sticker = action.payload;
      let validatedSticker: Sticker;

      switch (sticker.type) {
        case 'text':
          validatedSticker = {
            ...sticker,
            type: 'text',
            content: sticker.content || ''
          } as TextSticker;
          break;
        case 'image':
          validatedSticker = {
            ...sticker,
            type: 'image',
            content: sticker.content || '',
            originalSize: (sticker as ImageSticker).originalSize || { width: 0, height: 0 }
          } as ImageSticker;
          break;
        case 'icon':
          validatedSticker = {
            ...sticker,
            type: 'icon',
            content: sticker.content || '',
            icon: sticker.icon || '⭐' // Use icon from payload or default to star
          } as IconSticker;
          break;
        case 'icon':
          validatedSticker = {
            ...sticker,
            type: 'icon',
            content: (sticker as IconSticker).content || '',
            icon: (sticker as IconSticker).icon || sticker.icon || '⭐' // Use icon from payload or default to star
          } as IconSticker;
          break;
        case 'link':
          validatedSticker = {
            ...sticker,
            type: 'link',
            content: sticker.content || '',
            title: (sticker as LinkSticker).title || ''
          } as LinkSticker;
          break;
        case 'map':
          validatedSticker = {
            ...sticker,
            type: 'map',
            content: sticker.content || '',
            location: (sticker as MapSticker).location || { lat: 0, lng: 0, zoom: 1 }
          } as MapSticker;
          break;
        case 'custom':
          validatedSticker = {
            ...sticker,
            type: 'custom',
            content: sticker.content || '',
            template: (sticker as CustomSticker).template || '',
            data: (sticker as CustomSticker).data || {}
          } as CustomSticker;
          break;
        default:
          throw new Error(`Invalid sticker type: ${(sticker as any).type}`);
      }

      return {
        ...state,
        stickers: {
          ...state.stickers,
          [sticker.id]: validatedSticker
        }
      };
    }
    
    case 'REMOVE_STICKER': {
      const { id } = action.payload;
      const newStickers = { ...state.stickers };
      delete newStickers[id];
      
      // Remove from groups if needed
      const newGroups = { ...state.stickerGroups };
      Object.keys(newGroups).forEach(groupId => {
        newGroups[groupId] = {
          ...newGroups[groupId],
          stickerIds: newGroups[groupId].stickerIds.filter(sid => sid !== id)
        };
      });

      return {
        ...state,
        stickers: newStickers,
        stickerGroups: newGroups,
        selectedStickerIds: state.selectedStickerIds.filter(sid => sid !== id)
      };
    }
    
    case 'UPDATE_STICKER': {
      const { id, ...updates } = action.payload;
      const existingSticker = state.stickers[id];
      if (!existingSticker) return state;

      let updatedSticker: Sticker;

      switch (existingSticker.type) {
        case 'text':
          updatedSticker = {
            ...existingSticker,
            ...updates,
            type: 'text'
          } as TextSticker;
          break;
        case 'image':
          updatedSticker = {
            ...existingSticker,
            ...updates,
            type: 'image',
            originalSize: ('originalSize' in updates)
              ? (updates as ImageSticker).originalSize
              : (existingSticker as ImageSticker).originalSize
          } as ImageSticker;
          break;
        case 'link':
          updatedSticker = {
            ...existingSticker,
            ...updates,
            type: 'link',
            title: ('title' in updates)
              ? (updates as LinkSticker).title
              : (existingSticker as LinkSticker).title
          } as LinkSticker;
          break;
        case 'map':
          updatedSticker = {
            ...existingSticker,
            ...updates,
            type: 'map',
            location: ('location' in updates)
              ? (updates as MapSticker).location
              : (existingSticker as MapSticker).location
          } as MapSticker;
          break;
        case 'custom':
          updatedSticker = {
            ...existingSticker,
            ...updates,
            type: 'custom',
            template: ('template' in updates)
              ? (updates as CustomSticker).template
              : (existingSticker as CustomSticker).template,
            data: ('data' in updates)
              ? (updates as CustomSticker).data
              : (existingSticker as CustomSticker).data
          } as CustomSticker;
          break;
        default:
          throw new Error(`Invalid sticker type: ${(existingSticker as any).type}`);
      }

      return {
        ...state,
        stickers: {
          ...state.stickers,
          [id]: updatedSticker
        }
      };
    }
     case 'MOVE_STICKER': {
      const { id, x, y, timeSegmentId } = action.payload;
      const existingSticker = state.stickers[id];
      if (!existingSticker) return state;

      return {
        ...state,
        stickers: {
          ...state.stickers,
          [id]: { ...existingSticker, x, y, timeSegmentId }
        }
      };
    }

    case 'RESIZE_STICKER': {
      const { id, width, height } = action.payload;
      const existingSticker = state.stickers[id];
      if (!existingSticker) return state;

      return {
        ...state,
        stickers: {
          ...state.stickers,
          [id]: { ...existingSticker, width, height }
        }
      };
    }

    case 'ROTATE_STICKER': {
      const { id, rotation } = action.payload;
      const existingSticker = state.stickers[id];
      if (!existingSticker) return state;

      return {
        ...state,
        stickers: {
          ...state.stickers,
          [id]: { ...existingSticker, rotation }
        }
      };
    }

    case 'SET_STICKER_ZINDEX': {
      const { id, zIndex } = action.payload;
      if (!state.stickers[id]) return state;
      
      return {
        ...state,
        stickers: {
          ...state.stickers,
          [id]: {
            ...state.stickers[id],
            zIndex
          }
        }
      };
    }
    
    case 'SELECT_STICKER': {
      const { id } = action.payload;
      return {
        ...state,
        selectedStickerIds: state.isMultiSelectMode 
          ? [...state.selectedStickerIds, id]
          : [id]
      };
    }
    
    case 'DESELECT_STICKER': {
      const { id } = action.payload;
      return {
        ...state,
        selectedStickerIds: state.selectedStickerIds.filter(sid => sid !== id)
      };
    }
    
    case 'CLEAR_SELECTION': {
      return {
        ...state,
        selectedStickerIds: []
      };
    }
    
    case 'SET_MULTI_SELECT_MODE': {
      return {
        ...state,
        isMultiSelectMode: action.payload.enabled
      };
    }
    
    case 'TOGGLE_MULTI_SELECT': {
      return {
        ...state,
        isMultiSelectMode: action.payload.enabled,
        selectedStickerIds: action.payload.enabled ? state.selectedStickerIds : []
      };
    }

    case 'SELECT_STICKERS': {
      return {
        ...state,
        selectedStickerIds: action.payload.stickerIds
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
    
    case 'CREATE_STICKER_GROUP': {
      const group = action.payload;
      return {
        ...state,
        stickerGroups: {
          ...state.stickerGroups,
          [group.id]: group
        }
      };
    }
    
    case 'DELETE_STICKER_GROUP': {
      const { id } = action.payload;
      const newGroups = { ...state.stickerGroups };
      delete newGroups[id];
      return {
        ...state,
        stickerGroups: newGroups
      };
    }
    
    case 'ADD_TO_GROUP': {
      const { groupId, stickerId } = action.payload;
      return {
        ...state,
        stickerGroups: {
          ...state.stickerGroups,
          [groupId]: {
            ...state.stickerGroups[groupId],
            stickerIds: [...state.stickerGroups[groupId].stickerIds, stickerId]
          }
        }
      };
    }
    
    case 'REMOVE_FROM_GROUP': {
      const { groupId, stickerId } = action.payload;
      return {
        ...state,
        stickerGroups: {
          ...state.stickerGroups,
          [groupId]: {
            ...state.stickerGroups[groupId],
            stickerIds: state.stickerGroups[groupId].stickerIds.filter(id => id !== stickerId)
          }
        }
      };
    }
    
    case 'SET_VIEW_MODE': {
      return {
        ...state,
        viewMode: action.payload
      };
    }
    
    case 'ADD_TEMPLATE': {
      const { id, template } = action.payload;
      return {
        ...state,
        templates: {
          ...state.templates,
          [id]: template
        }
      };
    }
    
    case 'REMOVE_TEMPLATE': {
      const { id } = action.payload;
      const newTemplates = { ...state.templates };
      delete newTemplates[id];
      return {
        ...state,
        templates: newTemplates
      };
    }
    
    case 'SET_DRAGGING': {
      return {
        ...state,
        isDragging: action.payload.isDragging
      };
    }
    
    case 'LOAD_STATE': {
      // When loading a state from history, completely replace the state
      // This ensures all aspects of the state are properly restored
      return action.payload;
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
    const baseSticker = { ...data, id };

    switch (data.type) {
      case 'text':
        return { ...baseSticker, type: 'text' } as TextSticker;
      case 'image':
        return {
          ...baseSticker,
          type: 'image',
          originalSize: (data as ImageSticker).originalSize || { width: 0, height: 0 }
        } as ImageSticker;
      case 'link':
        return {
          ...baseSticker,
          type: 'link',
          title: (data as LinkSticker).title || ''
        } as LinkSticker;
      case 'map':
        return {
          ...baseSticker,
          type: 'map',
          location: (data as MapSticker).location || { lat: 0, lng: 0, zoom: 1 }
        } as MapSticker;
      case 'custom':
        return {
          ...baseSticker,
          type: 'custom',
          template: (data as CustomSticker).template || '',
          data: (data as CustomSticker).data || {}
        } as CustomSticker;
      default:
        throw new Error(`Invalid sticker type: ${(data as any).type}`);
    }
  };
  
  const value = { state, dispatch, createSticker };
  
  return (
    <MoodboardContext.Provider value={value}>
      {children}
    </MoodboardContext.Provider>
  );
};

export default MoodboardContext;
