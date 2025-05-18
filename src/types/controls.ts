// Define type for the global moodboard controls
interface IMoodboardControls {
  handleUndo: () => void;
  handleRedo: () => void;
  handleAddSegment: () => void;
  handleResetZoom: () => void;
  historyIndex: number;
  historyLength: number;
  isDarkMode: boolean;
  hasSelectedSticker: boolean;
  exportFormat: 'png' | 'pdf';
  handleExport: () => void;
  handleBringToFront?: () => void;
  handleSendToBack?: () => void;
  toggleSettings: () => void;
}

// Must use type for window augmentation to avoid issues
export type MoodboardControls = IMoodboardControls;

// Extend the Window interface to include our custom property
declare global {
  interface Window {
    moodboardControls?: MoodboardControls;
  }
}
