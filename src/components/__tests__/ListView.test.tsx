import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ListView } from '../board/ListView';
import { ViewModeProvider } from '../../context/ViewModeContext';
import { TimeSegment, Sticker } from '../../types/moodboard';

describe('ListView', () => {
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
        end:   '2025-05-19T00:00:00.000Z',
      },
    },
    'segment-2': {
      id: 'segment-2',
      title: 'Day 2',
      order: 1,
      width: 300,
      height: 300,
      childrenIds: [],
      timeRange: {
        start: '2025-05-19T00:00:00.000Z',
        end:   '2025-05-20T00:00:00.000Z',
      },
    },
  };

  const mockStickers: Record<string, Sticker> = {
    'sticker-1': {
      id: 'sticker-1',
      type: 'text',
      content: 'Day 1 Sticker',
      timeSegmentId: 'segment-1',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      zIndex: 1,
    },
    'sticker-2': {
      id: 'sticker-2',
      type: 'text',
      content: 'Day 2 Sticker',
      timeSegmentId: 'segment-2',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      zIndex: 1,
    },
  };

  const mockSegmentOrder = ['segment-1', 'segment-2'];

  const renderWithProvider = () =>
    render(
      <ViewModeProvider>
        <ListView
          segments={mockSegments}
          stickers={mockStickers}
          segmentOrder={mockSegmentOrder}
        />
      </ViewModeProvider>
    );

  it('renders all segments in order', () => {
    renderWithProvider();
    const headings = screen.getAllByRole('heading');
    expect(headings[0]).toHaveTextContent('Day 1');
    expect(headings[1]).toHaveTextContent('Day 2');
  });

  it('displays stickers within their segments', () => {
    renderWithProvider();
    expect(screen.getByText('Day 1 Sticker')).toBeInTheDocument();
    expect(screen.getByText('Day 2 Sticker')).toBeInTheDocument();
  });

  it('shows date ranges for segments', () => {
    renderWithProvider();

    const dateOptions: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    const start1 = new Date(mockSegments['segment-1']?.timeRange?.start ?? '')
      .toLocaleDateString('en-US', dateOptions);
    const end1 = new Date(mockSegments['segment-1']?.timeRange?.end ?? '')
      .toLocaleDateString('en-US', dateOptions);
    const start2 = new Date(mockSegments['segment-2']?.timeRange?.start ?? '')
      .toLocaleDateString('en-US', dateOptions);
    const end2 = new Date(mockSegments['segment-2']?.timeRange?.end ?? '')
      .toLocaleDateString('en-US', dateOptions);

    // verify that each date appears somewhere in the rendered output
    const segment1 = screen.getByText('Day 1').closest('li');
    expect(segment1).toHaveTextContent(start1);
    expect(segment1).toHaveTextContent(end1);

    const segment2 = screen.getByText('Day 2').closest('li');
    expect(segment2).toHaveTextContent(start2);
    expect(segment2).toHaveTextContent(end2);
  });
});