export type ViewMode = 'standard' | 'timeline' | 'map' | 'list' | 'grid';

export interface ViewModeConfig {
  mode: ViewMode;
  layout: 'horizontal' | 'vertical';
  compact: boolean;
  showLabels: boolean;
  autoArrange: boolean;
}

export interface TimelineViewConfig extends ViewModeConfig {
  groupByDay: boolean;
  showEmptyDays: boolean;
  timeFormat: '12h' | '24h';
  scale: 'hour' | 'day' | 'week';
}

export interface MapViewConfig extends ViewModeConfig {
  showAllMarkers: boolean;
  clusterMarkers: boolean;
  showRoutes: boolean;
}

export interface ListViewConfig extends ViewModeConfig {
  sortBy: 'date' | 'type' | 'name';
  groupBy: 'day' | 'type' | 'none';
  showThumbnails: boolean;
}

export interface GridViewConfig extends ViewModeConfig {
  columns: number;
  aspectRatio: '1:1' | '4:3' | '16:9';
  gap: 'small' | 'medium' | 'large';
}
