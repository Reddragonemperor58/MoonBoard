import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a unique ID for stickers
 */
export const generateStickerId = (): string => {
  return `sticker-${uuidv4()}`;
};

/**
 * Generates a unique ID for time segments
 */
export const generateSegmentId = (): string => {
  return `segment-${uuidv4()}`;
};

/**
 * Generates a unique ID for toasts
 */
export const generateToastId = (): string => {
  return `toast-${uuidv4()}`;
};
