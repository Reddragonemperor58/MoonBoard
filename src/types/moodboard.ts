export interface Sticker {
  id: string;
  timeSegmentId: string;
  type: 'text' | 'image' | 'icon';
  content?: string;
  imageUrl?: string;
  icon?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface MoodboardState {
  segments: Record<string, TimeSegment>;
  stickers: Record<string, Sticker>;
  segmentOrder: string[];
  isDragging: boolean;
  selectedStickerId: string | null;
}

export interface TimeSegment {
  id: string;
  title: string;
  order: number;
  width: number;
  height: number;
}

export type MoodboardAction =
  | { type: 'ADD_SEGMENT'; payload: TimeSegment }
  | { type: 'REMOVE_SEGMENT'; payload: { id: string } }
  | { type: 'RENAME_SEGMENT'; payload: { id: string; title: string } }
  | { type: 'RESIZE_SEGMENT'; payload: { id: string; width: number; height: number } }
  | { type: 'REORDER_SEGMENTS'; payload: { segmentOrder: string[] } }
  | { type: 'ADD_STICKER'; payload: Sticker }
  | { type: 'REMOVE_STICKER'; payload: { stickerId: string } }
  | { type: 'MOVE_STICKER'; payload: { stickerId: string; x: number; y: number } }
  | { type: 'RESIZE_STICKER'; payload: { id: string; width: number; height: number } }
  | { type: 'ROTATE_STICKER'; payload: { id: string; rotation: number } }
  | { type: 'SELECT_STICKER'; payload: { stickerId: string | null } } 
  | { type: 'START_DRAG' }
  | { type: 'END_DRAG' };
