import { MoodboardState } from '../types/moodboard';
import html2canvas, { Html2CanvasOptions } from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ExportError, ImportError, ValidationError } from './errors';

interface ExportMetadata {
  version: number;
  timestamp: number;
  type: 'moodboard-backup';
}

interface MoodboardBackup {
  metadata: ExportMetadata;
  state: MoodboardState;
  settings: {
    background: string;
    width: number;
    height: number;
    darkMode: boolean;
  };
}

// Export state as JSON file
export const exportStateAsJSON = async (
  state: MoodboardState,
  settings: { background: string; width: number; height: number; darkMode: boolean }
): Promise<void> => {
  try {
    // Validate inputs
    if (!state || typeof state !== 'object') {
      throw new ValidationError('Invalid state format');
    }
    if (!settings || typeof settings !== 'object') {
      throw new ValidationError('Invalid settings format');
    }

    const backup: MoodboardBackup = {
      metadata: {
        version: 1,
        timestamp: Date.now(),
        type: 'moodboard-backup'
      },
      state,
      settings
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `moodboard-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    try {
      link.click();
    } catch (error) {
      throw new ExportError('Failed to trigger download');
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Failed to export state:', error);
    throw error instanceof Error ? error : new ExportError('Failed to export moodboard state');
  }
};

// Import state from JSON file
export const importStateFromJSON = async (file: File): Promise<MoodboardBackup> => {
  try {
    if (!file) {
      throw new ValidationError('No file provided');
    }

    if (!file.name.endsWith('.json')) {
      throw new ValidationError('Invalid file type. Please select a JSON file.');
    }

    let text: string;
    try {
      text = await file.text();
    } catch (error) {
      throw new ImportError('Failed to read file contents');
    }

    let backup: MoodboardBackup;
    try {
      backup = JSON.parse(text);
    } catch (error) {
      throw new ValidationError('Invalid JSON format');
    }

    // Validate backup structure
    if (!isValidBackup(backup)) {
      throw new ValidationError('Invalid backup file format');
    }

    // Version check
    if (backup.metadata.version !== 1) {
      throw new ValidationError(`Unsupported backup version: ${backup.metadata.version}`);
    }

    return backup;
  } catch (error) {
    console.error('Failed to import state:', error);
    throw error instanceof Error ? error : new ImportError('Failed to import moodboard state');
  }
};

// Export as PNG
export const exportAsPNG = async (element: HTMLElement): Promise<void> => {
  try {
    if (!element) {
      throw new ValidationError('No element provided for export');
    }

    const options: Html2CanvasOptions = {
      backgroundColor: null,
      useCORS: true,
      scale: 2, // Higher quality
      logging: false, // Disable logging
      allowTaint: true // Allow cross-origin images
    };
    
    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(element, options);
    } catch (error) {
      throw new ExportError('Failed to render canvas');
    }

    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `moodboard-${new Date().toISOString().split('T')[0]}.png`;
    
    try {
      link.click();
    } catch (error) {
      throw new ExportError('Failed to trigger download');
    }
  } catch (error) {
    console.error('Failed to export as PNG:', error);
    throw error instanceof Error ? error : new ExportError('Failed to export moodboard as PNG');
  }
};

// Export as PDF
export const exportAsPDF = async (
  element: HTMLElement,
  width: number,
  height: number
): Promise<void> => {
  try {
    if (!element) {
      throw new ValidationError('No element provided for export');
    }

    if (typeof width !== 'number' || typeof height !== 'number') {
      throw new ValidationError('Invalid dimensions provided');
    }

    const options: Html2CanvasOptions = {
      backgroundColor: null,
      useCORS: true,
      scale: 2, // Higher quality
      logging: false, // Disable logging
      allowTaint: true // Allow cross-origin images
    };
    
    let canvas: HTMLCanvasElement;
    try {
      canvas = await html2canvas(element, options);
    } catch (error) {
      throw new ExportError('Failed to render canvas');
    }

    const image = canvas.toDataURL('image/png');
    
    try {
      const pdf = new jsPDF({
        orientation: width > height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width, height]
      });

      const imgProps = pdf.getImageProperties(image);
      const pdfWidth = pdf.internal.pageSize.width;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(image, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`moodboard-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      throw new ExportError('Failed to generate PDF');
    }
  } catch (error) {
    console.error('Failed to export as PDF:', error);
    throw error instanceof Error ? error : new ExportError('Failed to export moodboard as PDF');
  }
};

// Validate backup file structure
const isValidBackup = (backup: any): backup is MoodboardBackup => {
  if (!backup || typeof backup !== 'object') {
    throw new ValidationError('Invalid backup format');
  }

  if (!backup.metadata || typeof backup.metadata !== 'object') {
    throw new ValidationError('Missing or invalid metadata');
  }

  if (backup.metadata.type !== 'moodboard-backup') {
    throw new ValidationError('Invalid backup type');
  }

  if (typeof backup.metadata.version !== 'number') {
    throw new ValidationError('Invalid version format');
  }

  if (typeof backup.metadata.timestamp !== 'number') {
    throw new ValidationError('Invalid timestamp format');
  }

  if (!backup.state || typeof backup.state !== 'object') {
    throw new ValidationError('Missing or invalid state data');
  }

  if (!backup.settings || typeof backup.settings !== 'object') {
    throw new ValidationError('Missing or invalid settings');
  }

  const { background, width, height, darkMode } = backup.settings;
  if (typeof background !== 'string' ||
      typeof width !== 'number' ||
      typeof height !== 'number' ||
      typeof darkMode !== 'boolean') {
    throw new ValidationError('Invalid settings properties');
  }

  return true;
}; 