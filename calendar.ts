export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  color?: string;
  isAllDay?: boolean;
  // Optional fields for specific calendar providers
  googleCalendarId?: string;
  outlookCalendarId?: string;
}

export type CalendarProvider = 'google' | 'outlook' | 'ical';

export interface CalendarExportOptions {
  provider: CalendarProvider;
  includeTimeSegments?: boolean;
  includeStickers?: boolean;
}

export interface CalendarIntegrationConfig {
  enabled: boolean;
  provider?: CalendarProvider;
  defaultColor?: string;
  syncTimeSegments?: boolean;
  exportAsEvents?: boolean;
}
