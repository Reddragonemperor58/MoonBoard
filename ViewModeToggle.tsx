import React from 'react';
import {
  ViewColumnsIcon,
  CalendarIcon,
  MapIcon,
  ListBulletIcon as ViewListIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import { useViewMode } from '../context/ViewModeContext';
import { ViewMode } from '../types/view-modes';

const viewModeIcons: Record<ViewMode, React.ReactElement> = {
  standard: <ViewColumnsIcon className="w-5 h-5" />,
  timeline: <CalendarIcon className="w-5 h-5" />,
  map: <MapIcon className="w-5 h-5" />,
  list: <ViewListIcon className="w-5 h-5" />,
  grid: <TableCellsIcon className="w-5 h-5" />
};

const viewModeLabels: Record<ViewMode, string> = {
  standard: 'Canvas',
  timeline: 'Timeline',
  map: 'Map',
  list: 'List',
  grid: 'Grid'
};

export const ViewModeToggle: React.FC = () => {
  const { viewMode, setViewMode } = useViewMode();

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(viewModeIcons).map(([mode, icon]) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode as ViewMode)}
          className={`
            inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm
            transition-colors duration-200
            ${viewMode === mode
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
              : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }
          `}
          title={`Switch to ${viewModeLabels[mode as ViewMode]} view`}
        >
          {icon}
          <span className="hidden sm:inline">{viewModeLabels[mode as ViewMode]}</span>
        </button>
      ))}
    </div>
  );
};
