
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TimelineView } from '../board/TimelineView';
import { ViewModeProvider } from '../../context/ViewModeContext';
import { TimeSegment, Sticker } from '../../types/moodboard';

describe('TimelineView', () => {
  const mockSegments: Record<string, TimeSegment> = {
    'segment-1': {
      id: 'segment-1',
      title: 'Day 1',
      order: 0,
      width: 300,
      height: 300,
      childrenIds: [],
      timeRange: {
        start: '2025-05-18T00:00:00.000Z',
        end: '2025-05-19T00:00:00.000Z'
      }
    }
  };

  const mockStickers: Record<string, Sticker> = {
    'sticker-1': {
      id: 'sticker-1',
      type: 'text',
      content: 'Test Sticker',
      timeSegmentId: 'segment-1',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      zIndex: 1
    }
  };

  const mockSegmentOrder = ['segment-1'];

  const renderWithProvider = () => {
    return render(
      <ViewModeProvider>
        <TimelineView
          segments={mockSegments}
          stickers={mockStickers}
          segmentOrder={mockSegmentOrder}
        />
      </ViewModeProvider>
    );
  };

  it('renders segment title', () => {
    renderWithProvider();
    expect(screen.getByText('Day 1')).toBeInTheDocument();
  });

  it('renders date range', () => {
    renderWithProvider();
    expect(screen.getByText(/May 18, 2025/)).toBeInTheDocument();
  });

  it('renders stickers within segments', () => {
    renderWithProvider();
    expect(screen.getByText('Test Sticker')).toBeInTheDocument();
  });
});
