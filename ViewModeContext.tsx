import React, { createContext, useContext, useState } from 'react';
import { ViewMode, ViewModeConfig } from '../types/view-modes';

interface ViewModeContextType {
  viewMode: ViewMode;
  config: ViewModeConfig;
  setViewMode: (mode: ViewMode) => void;
  updateConfig: (updates: Partial<ViewModeConfig>) => void;
}

const defaultConfigs = {
  standard: {
    mode: 'standard' as const,
    layout: 'horizontal' as const,
    compact: false,
    showLabels: true,
    autoArrange: true
  },
  timeline: {
    mode: 'timeline' as const,
    layout: 'horizontal' as const,
    compact: false,
    showLabels: true,
    autoArrange: true,
    groupByDay: true,
    showEmptyDays: false,
    timeFormat: '12h' as const,
    scale: 'day' as const
  },
  map: {
    mode: 'map' as const,
    layout: 'horizontal' as const,
    compact: false,
    showLabels: true,
    autoArrange: true,
    showAllMarkers: true,
    clusterMarkers: true,
    showRoutes: true
  },
  list: {
    mode: 'list' as const,
    layout: 'vertical' as const,
    compact: true,
    showLabels: true,
    autoArrange: true,
    sortBy: 'date' as const,
    groupBy: 'day' as const,
    showThumbnails: true
  },
  grid: {
    mode: 'grid' as const,
    layout: 'horizontal' as const,
    compact: true,
    showLabels: true,
    autoArrange: true,
    columns: 3,
    aspectRatio: '1:1' as const,
    gap: 'medium' as const
  }
};

const ViewModeContext = createContext<ViewModeContextType>({
  viewMode: 'standard',
  config: defaultConfigs.standard,
  setViewMode: () => {},
  updateConfig: () => {}
});

export const ViewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [config, setConfig] = useState(() => defaultConfigs[viewMode] as ViewModeConfig);
  const updateConfig = (updates: Partial<ViewModeConfig>) => {
    setConfig(current => {
      const updated = {
        ...current,
        ...updates
      };
      return updated as typeof current;
    });
  };

  return (
    <ViewModeContext.Provider value={{ viewMode, config, setViewMode, updateConfig }}>
      {children}
    </ViewModeContext.Provider>
  );
};

export const useViewMode = () => useContext(ViewModeContext);
