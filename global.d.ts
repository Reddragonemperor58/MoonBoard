// This file just patches up the default window object with our custom properties
// This is necessary to avoid TypeScript errors when accessing window.moodboardControls

// Import type if using it from another file
import { MoodboardControls } from './controls';

// The actual Window interface augmentation is done in controls.ts
// This file is kept for documentation purposes

export {};
