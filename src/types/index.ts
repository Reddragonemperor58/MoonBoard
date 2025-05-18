export interface TimeSegment {
  id: string;
  title: string;
  order: number;
  width: number;
  height: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}
