export class MoodboardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoodboardError';
  }
}

export class StateError extends MoodboardError {
  constructor(message: string) {
    super(message);
    this.name = 'StateError';
  }
}

export class ImportError extends MoodboardError {
  constructor(message: string) {
    super(message);
    this.name = 'ImportError';
  }
}

export class ExportError extends MoodboardError {
  constructor(message: string) {
    super(message);
    this.name = 'ExportError';
  }
}

export class ValidationError extends MoodboardError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class StorageError extends MoodboardError {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// Helper function to get user-friendly error messages
export const getUserFriendlyError = (error: unknown): string => {
  if (error instanceof MoodboardError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    // Handle specific error types
    if (error.name === 'QuotaExceededError') {
      return 'Storage space is full. Try clearing some space or exporting your work.';
    }
    if (error.name === 'SecurityError') {
      return 'Access to storage was denied. Check your browser settings.';
    }
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export interface ErrorLogEntry {
  timestamp: string;
  error: unknown;
  componentStack?: string;
  additionalInfo?: Record<string, unknown>;
}

// Error logging utility
export const logError = (
  error: unknown,
  componentStack?: string,
  additionalInfo?: Record<string, unknown>
): void => {
  const errorLog: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    error,
    componentStack,
    additionalInfo,
  };

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorLog);
  }

  // Store in localStorage for debugging
  try {
    const errorLogs = JSON.parse(localStorage.getItem('moodboard_error_logs') || '[]');
    errorLogs.push(errorLog);
    // Keep only last 50 errors
    if (errorLogs.length > 50) errorLogs.shift();
    localStorage.setItem('moodboard_error_logs', JSON.stringify(errorLogs));
  } catch (e) {
    console.error('Failed to store error log:', e);
  }

  // Here you could add additional error reporting service integration
  // sendToErrorReportingService(errorLog);
};