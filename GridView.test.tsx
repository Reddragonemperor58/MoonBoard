import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GridView } from '../board/GridView';
import { ViewModeProvider } from '../../context/ViewModeContext';
import { Sticker } from '../../types/moodboard';

describe('GridView', () => {
  const mockStickers: Record<string, Sticker> = {
    'sticker-1': {
      id: 'sticker-1',
      type: 'text',
      content: 'Grid Item 1',
      timeSegmentId: 'segment-1',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      zIndex: 1
    },
    'sticker-2': {
      id: 'sticker-2',
      type: 'text',
      content: 'Grid Item 2',
      timeSegmentId: 'segment-1',
      x: 100,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      zIndex: 1
    }
  };

  it('renders all stickers in a grid layout', () => {
    render(
      <ViewModeProvider>
        <GridView stickers={mockStickers} />
      </ViewModeProvider>
    );

    expect(screen.getByText('Grid Item 1')).toBeInTheDocument();
    expect(screen.getByText('Grid Item 2')).toBeInTheDocument();
  });

  it('applies correct grid classes', () => {
    render(
      <ViewModeProvider>
        <GridView stickers={mockStickers} />
      </ViewModeProvider>
    );

    const gridContainer = screen.getByRole('list');
    expect(gridContainer).toHaveClass('grid');
    expect(gridContainer).toHaveAttribute('data-testid', 'grid-view');
  });
});
