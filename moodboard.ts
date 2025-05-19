export type StickerType = 'text' | 'image' | 'icon' | 'link' | 'map' | 'custom';

export interface BaseStickerData {
  id: string;
  type: StickerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  timeSegmentId: string;
  groupId?: string;
  isSelected?: boolean;
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    fontSize?: number;
    opacity?: number;
  };
}

export interface TextSticker extends BaseStickerData {
  type: 'text';
  content: string;
}

export interface ImageSticker extends BaseStickerData {
  type: 'image';
  content: string; // image URL
  originalSize: { width: number; height: number };
  alt?: string;
}

export interface LinkSticker extends BaseStickerData {
  type: 'link';
  content: string; // URL
  title: string;
  thumbnail?: string;
}

export interface MapSticker extends BaseStickerData {
  type: 'map';
  location: {
    lat: number;
    lng: number;
    zoom: number;
  };
  content: string; // address or place name
}

export interface IconSticker extends BaseStickerData {
  type: 'icon';
  content: string; // This can be the icon character or empty
  icon: string;    // The actual emoji/icon character
}

export interface CustomSticker extends BaseStickerData {
  type: 'custom';
  content: string;
  template: string;
  data: Record<string, any>;
}

export type Sticker = TextSticker | ImageSticker | LinkSticker | MapSticker | CustomSticker | IconSticker;

export interface StickerGroup {
  id: string;
  name: string;
  stickerIds: string[];
}

export interface ViewMode {
  type: 'board' | 'timeline' | 'grid';
  scale: number;
  position: { x: number; y: number };
}

export interface MoodboardState {
  segments: Record<string, TimeSegment>;
  stickers: Record<string, Sticker>;
  segmentOrder: string[];
  isDragging: boolean;
  selectedStickerIds: string[];
  selectedStickerId: string | null;
  stickerGroups: Record<string, StickerGroup>;
  viewMode: ViewMode;
  templates: Record<string, CustomSticker>;
  isMultiSelectMode: boolean;
  isLoading?: boolean;
}

export interface TimeRange {
  start: string; // ISO date string
  end: string;   // ISO date string
}

export interface TimeSegment {
  id: string;
  title: string;
  order: number;
  width: number;
  height: number;
  parentId?: string;
  childrenIds: string[];
  timeRange?: TimeRange;
  color?: string;
  collapsed?: boolean;
  description?: string;
}

export type MoodboardAction =
  | { type: 'ADD_SEGMENT'; payload: Partial<TimeSegment> & { id: string } }
  | { type: 'REMOVE_SEGMENT'; payload: { id: string } }
  | { type: 'RENAME_SEGMENT'; payload: { id: string; title: string } }
  | { type: 'RESIZE_SEGMENT'; payload: { id: string; width: number; height: number } }
  | { type: 'REORDER_SEGMENTS'; payload: { segmentOrder: string[] } }
  | { type: 'UPDATE_SEGMENT'; payload: Partial<TimeSegment> & { id: string } }
  | { type: 'ADD_STICKER'; payload: Sticker }
  | { type: 'REMOVE_STICKER'; payload: { id: string } }
  | { type: 'UPDATE_STICKER'; payload: Partial<Sticker> & { id: string } }
  | { type: 'UPDATE_STICKER_ZINDEX'; payload: { id: string; zIndex: number } }
  | { type: 'MOVE_STICKER'; payload: { id: string; x: number; y: number; timeSegmentId: string } }
  | { type: 'RESIZE_STICKER'; payload: { id: string; width: number; height: number } }
  | { type: 'ROTATE_STICKER'; payload: { id: string; rotation: number } }
  | { type: 'SET_STICKER_ZINDEX'; payload: { id: string; zIndex: number } }
  | { type: 'SELECT_STICKER'; payload: { id: string } }
  | { type: 'DESELECT_STICKER'; payload: { id: string } }
  | { type: 'CLEAR_SELECTION'; payload: undefined }
  | { type: 'SET_MULTI_SELECT_MODE'; payload: { enabled: boolean } }
  | { type: 'TOGGLE_MULTI_SELECT'; payload: { enabled: boolean } }
  | { type: 'SELECT_STICKERS'; payload: { stickerIds: string[] } }
  | { type: 'START_DRAG'; payload: undefined }
  | { type: 'END_DRAG'; payload: undefined }
  | { type: 'CREATE_STICKER_GROUP'; payload: StickerGroup }
  | { type: 'DELETE_STICKER_GROUP'; payload: { id: string } }
  | { type: 'ADD_TO_GROUP'; payload: { groupId: string; stickerId: string } }
  | { type: 'REMOVE_FROM_GROUP'; payload: { groupId: string; stickerId: string } }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'ADD_TEMPLATE'; payload: { id: string; template: CustomSticker } }
  | { type: 'REMOVE_TEMPLATE'; payload: { id: string } }
  | { type: 'SET_DRAGGING'; payload: { isDragging: boolean } }
  | { type: 'LOAD_STATE'; payload: MoodboardState }
  | { type: 'BATCH_UPDATE'; payload: Partial<MoodboardState> }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean } };
