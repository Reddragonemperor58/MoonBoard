import { MoodboardState } from '../types/moodboard';
import { StateError, StorageError, ValidationError } from './errors';

const STATE_VERSION = 1; // Increment this when making breaking changes to state schema
const STATE_KEY = 'moodboard-state';
const SETTINGS_KEY = 'moodboard-settings';

interface StoredState {
  version: number;
  state: MoodboardState;
  timestamp: number;
}

interface MoodboardSettings {
  background: string;
  width: number;
  height: number;
  darkMode: boolean;
}

// Validate state structure
const isValidMoodboardState = (state: any): state is MoodboardState => {
  if (!state || typeof state !== 'object') {
    throw new ValidationError('Invalid state format');
  }

  if (!('segments' in state) || typeof state.segments !== 'object') {
    throw new ValidationError('Missing or invalid segments in state');
  }

  if (!('stickers' in state) || typeof state.stickers !== 'object') {
    throw new ValidationError('Missing or invalid stickers in state');
  }

  if (!('segmentOrder' in state) || !Array.isArray(state.segmentOrder)) {
    throw new ValidationError('Missing or invalid segment order in state');
  }

  return true;
};

// Save state with versioning and validation
export const saveState = (state: MoodboardState): void => {
  try {
    // Validate state before saving
    if (!isValidMoodboardState(state)) {
      throw new ValidationError('Invalid state structure');
    }

    const storedState: StoredState = {
      version: STATE_VERSION,
      state,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(storedState));
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError') {
          throw new StorageError('Storage space is full. Try clearing some space or exporting your work.');
        }
        if (error.name === 'SecurityError') {
          throw new StorageError('Access to storage was denied. Check your browser settings.');
        }
      }
      throw new StorageError('Failed to save state to storage');
    }
  } catch (error) {
    console.error('Failed to save state:', error);
    throw error instanceof Error ? error : new StateError('Failed to save state');
  }
};

// Save settings
export const saveSettings = (settings: MoodboardSettings): void => {
  try {
    // Validate settings
    if (!settings || typeof settings !== 'object') {
      throw new ValidationError('Invalid settings format');
    }

    if (typeof settings.background !== 'string' ||
        typeof settings.width !== 'number' ||
        typeof settings.height !== 'number' ||
        typeof settings.darkMode !== 'boolean') {
      throw new ValidationError('Missing or invalid settings properties');
    }

    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError') {
          throw new StorageError('Storage space is full. Try clearing some space.');
        }
        if (error.name === 'SecurityError') {
          throw new StorageError('Access to storage was denied. Check your browser settings.');
        }
      }
      throw new StorageError('Failed to save settings to storage');
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error instanceof Error ? error : new StateError('Failed to save settings');
  }
};

// Load state with version checking and validation
export const loadState = (): MoodboardState | null => {
  try {
    const savedData = localStorage.getItem(STATE_KEY);
    if (!savedData) return null;

    let storedState: StoredState;
    try {
      storedState = JSON.parse(savedData);
    } catch (error) {
      throw new ValidationError('Corrupted state data in storage');
    }

    // Version check
    if (storedState.version !== STATE_VERSION) {
      throw new StateError(`Unsupported state version: ${storedState.version}. Current version: ${STATE_VERSION}`);
    }

    // Validate state structure
    if (!isValidMoodboardState(storedState.state)) {
      throw new ValidationError('Invalid state structure in storage');
    }

    return storedState.state;
  } catch (error) {
    console.error('Failed to load state:', error);
    throw error instanceof Error ? error : new StateError('Failed to load state');
  }
};

// Load settings with defaults
export const loadSettings = (): MoodboardSettings => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (!savedSettings) return getDefaultSettings();

    let settings: MoodboardSettings;
    try {
      settings = JSON.parse(savedSettings);
    } catch (error) {
      throw new ValidationError('Corrupted settings data in storage');
    }

    // Validate settings
    if (!settings || typeof settings !== 'object') {
      throw new ValidationError('Invalid settings format in storage');
    }

    return {
      ...getDefaultSettings(),
      ...settings,
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    // Return defaults on error instead of throwing
    return getDefaultSettings();
  }
};

// Get default settings
const getDefaultSettings = (): MoodboardSettings => ({
  background: '#1a1a1a',
  width: 1200,
  height: 800,
  darkMode: true,
});

// Clear all stored data
export const clearStoredData = (): void => {
  try {
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error('Failed to clear stored data:', error);
    throw new StorageError('Failed to clear stored data');
  }
};

// Auto-save functionality with debounce
let saveTimeout: number | null = null;
const SAVE_DELAY = 2000; // 2 seconds

export const debouncedSaveState = (state: MoodboardState): void => {
  if (saveTimeout) {
    window.clearTimeout(saveTimeout);
  }

  saveTimeout = window.setTimeout(() => {
    try {
      saveState(state);
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't throw here as this is an automatic operation
      // The error will be shown via toast notifications
    }
  }, SAVE_DELAY);
}; 