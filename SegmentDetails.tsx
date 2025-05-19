import React, { useState } from 'react';
import { TimeRange, TimeSegment } from '../../types/moodboard';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarEvent, CalendarProvider } from '../../types/calendar';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface SegmentDetailsProps {
  segment: TimeSegment;
  onUpdate: (updates: Partial<TimeSegment>) => void;
  onAddChild?: (parentId: string) => void;
  allSegments: Record<string, TimeSegment>;
  className?: string;
}

export const SegmentDetails: React.FC<SegmentDetailsProps> = ({
  segment,
  onUpdate,
  onAddChild,
  allSegments,
  className = ''
}) => {
  const [startDate, setStartDate] = useState<Date | null>(
    segment.timeRange ? new Date(segment.timeRange.start) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    segment.timeRange ? new Date(segment.timeRange.end) : null
  );
  const [showCalendarOptions, setShowCalendarOptions] = useState(false);

  const handleDateChange = (start: Date | null, end: Date | null) => {
    if (start && end) {
      const timeRange: TimeRange = {
        start: start.toISOString(),
        end: end.toISOString()
      };
      onUpdate({ timeRange });
    }
  };

  const calculateDuration = () => {
    if (!segment.timeRange) return null;
    const start = new Date(segment.timeRange.start);
    const end = new Date(segment.timeRange.end);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getChildSegments = () => {
    return Object.values(allSegments).filter(s => s.parentId === segment.id);
  };

  // Calendar integration functions
  const createCalendarEvent = (): CalendarEvent => {
    if (!startDate || !endDate) throw new Error('Start and end dates are required');
    
    return {
      id: segment.id,
      title: segment.title || 'Trip Segment',
      description: segment.description || '',
      startDate: startDate,
      endDate: endDate,
      color: segment.color || '#3b82f6',
      isAllDay: true,
    };
  };

  const exportToCalendar = async (provider: CalendarProvider) => {
    try {
      const event = createCalendarEvent();
      
      switch (provider) {
        case 'google':
          const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate?.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate?.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(event.description || '')}`;
          window.open(googleUrl, '_blank');
          break;
        
        case 'outlook':
          const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(event.title)}&startdt=${startDate?.toISOString()}&enddt=${endDate?.toISOString()}&body=${encodeURIComponent(event.description || '')}`;
          window.open(outlookUrl, '_blank');
          break;
        
        case 'ical':
          // Create iCal file content
          const icalContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `SUMMARY:${event.title}`,
            `DTSTART:${startDate?.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
            `DTEND:${endDate?.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
            `DESCRIPTION:${event.description}`,
            'END:VEVENT',
            'END:VCALENDAR'
          ].join('\n');

          // Create and download file
          const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = `${event.title.replace(/\s+/g, '-')}.ics`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          break;
      }
    } catch (error) {
      console.error('Failed to export calendar event:', error);
      // You might want to show an error message to the user here
    }
  };

  return (
    <div className={`p-4 space-y-4 ${className}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Time Range</h3>
          <button
            onClick={() => setShowCalendarOptions(!showCalendarOptions)}
            className="p-2 text-gray-600 hover:text-blue-600 rounded-full transition-colors"
            title="Calendar options"
          >
            <CalendarIcon className="w-5 h-5" />
          </button>
        </div>

        {showCalendarOptions && startDate && endDate && (
          <div className="p-3 bg-gray-50 rounded-md space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Export to Calendar</h4>
            <div className="flex gap-2">
              <button
                onClick={() => exportToCalendar('google')}
                className="px-3 py-1 bg-white border rounded-md hover:bg-gray-50 text-sm transition-colors"
              >
                Google Calendar
              </button>
              <button
                onClick={() => exportToCalendar('outlook')}
                className="px-3 py-1 bg-white border rounded-md hover:bg-gray-50 text-sm transition-colors"
              >
                Outlook
              </button>
              <button
                onClick={() => exportToCalendar('ical')}
                className="px-3 py-1 bg-white border rounded-md hover:bg-gray-50 text-sm transition-colors"
              >
                iCal
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <div>
            <label className="block text-sm text-gray-600">Start Date</label>
            <DatePicker
              selected={startDate}
              onChange={(date: Date | null) => {
                setStartDate(date);
                handleDateChange(date, endDate);
              }}
              className="w-full px-3 py-2 border rounded"
              dateFormat="MMM d, yyyy"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">End Date</label>
            <DatePicker
              selected={endDate}
              onChange={(date: Date) => {
                setEndDate(date);
                handleDateChange(startDate, date);
              }}
              minDate={startDate}
              className="w-full px-3 py-2 border rounded"
              dateFormat="MMM d, yyyy"
            />
          </div>
        </div>
        {calculateDuration() !== null && (
          <p className="text-sm text-gray-600">
            Duration: {calculateDuration()} days
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Description</h3>
        <textarea
          value={segment.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="w-full px-3 py-2 border rounded"
          rows={3}
          placeholder="Add a description..."
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Styling</h3>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={segment.color || '#ffffff'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            className="w-10 h-10 rounded border"
          />
          <span className="text-sm text-gray-600">Segment Color</span>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Sub-segments</h3>
        {getChildSegments().map(child => (
          <div
            key={child.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded"
          >
            <span>{child.title}</span>
            <button
              onClick={() => onUpdate({ childrenIds: segment.childrenIds.filter(id => id !== child.id) })}
              className="text-red-500 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        ))}
        {onAddChild && (
          <button
            onClick={() => onAddChild(segment.id)}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Add Sub-segment
          </button>
        )}
      </div>
    </div>
  );
};

export default SegmentDetails;
