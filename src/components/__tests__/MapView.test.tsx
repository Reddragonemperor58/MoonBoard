import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MapView } from '../board/MapView';
import { ViewModeProvider } from '../../context/ViewModeContext';
import { MapSticker } from '../../types/moodboard';

describe('MapView', () => {
  const mockStickers: Record<string, MapSticker> = {
    'sticker-1': {
      id: 'sticker-1',
      type: 'map',
      content: 'Test Location',
      timeSegmentId: 'segment-1',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      zIndex: 1,
      location: { lat: 50, lng: 50, zoom: 10 }
    }
  };

  it('renders the map container', () => {
    render(
      <ViewModeProvider>
        <MapView stickers={mockStickers} />
      </ViewModeProvider>
    );

    expect(screen.getByRole('region')).toHaveClass('bg-gray-100');
  });

  it('renders map markers for locations', () => {
    render(
      <ViewModeProvider>
        <MapView stickers={mockStickers} />
      </ViewModeProvider>
    );

    expect(screen.getByText('Test Location')).toBeInTheDocument();
  });
});
