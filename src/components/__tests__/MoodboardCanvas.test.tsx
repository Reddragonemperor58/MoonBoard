import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MoodboardCanvas from '../board/MoodboardCanvas';
import { ViewModeToggle } from '../ViewModeToggle';
import { ViewModeProvider } from '../../context/ViewModeContext';
import { MoodboardProvider, useMoodboard } from '../../context/MoodboardContext';
import { ToastProvider } from '../../context/ToastContext';
import { Z_INDEX } from '../../utils/z-index';

const TestComponent = () => {
  const { dispatch } = useMoodboard();

  React.useEffect(() => {
    dispatch({
      type: 'ADD_STICKER',
      payload: {
        id: 'test-sticker',
        type: 'text' as const,
        content: 'Test Sticker',
        x: 100,
        y: 100,
        width: 200,
        height: 100,
        rotation: 0,
        zIndex: Z_INDEX.STICKER_BASE,
        timeSegmentId: 'day-1',
        style: {
          backgroundColor: '#ffffff',
          textColor: '#000000'
        }
      }
    });
  }, [dispatch]);

  return (
    <div>
      <ViewModeToggle />
      <MoodboardCanvas />
    </div>
  );
};

describe('MoodboardCanvas View Integration', () => {
  const renderWithProviders = () => {
    return render(
      <ToastProvider>
        <MoodboardProvider>
          <ViewModeProvider>
            <TestComponent />
          </ViewModeProvider>
        </MoodboardProvider>
      </ToastProvider>
    );
  };

  it('starts with standard view', () => {
    renderWithProviders();
    expect(screen.getByRole('complementary')).toHaveClass('moodboard-canvas');
  });

  it('switches to timeline view', async () => {
    renderWithProviders();
    fireEvent.click(screen.getByTitle('Switch to Timeline view'));
    const timelineView = await screen.findByRole('list');
    expect(timelineView).toHaveClass('timeline-view');
  });

  it('switches to map view', async () => {
    renderWithProviders();
    fireEvent.click(screen.getByTitle('Switch to Map view'));
    expect(await screen.findByRole('region')).toHaveClass('bg-gray-100');
  });

  it('switches to list view', async () => {
    renderWithProviders();
    fireEvent.click(screen.getByTitle('Switch to List view'));
    expect(await screen.findByRole('list')).toHaveClass('space-y-4');
  });

  it('switches to grid view', async () => {
    renderWithProviders();
    fireEvent.click(screen.getByTitle('Switch to Grid view'));
    const gridElement = await screen.findByRole('list');
    expect(gridElement).toHaveAttribute('data-testid', 'grid-view');
  });

  it('maintains sticker data across view changes', async () => {
    renderWithProviders();

    // wait for canvas
    await screen.findByRole('complementary');

    // standard view: at least one sticker
    const stickers = await screen.findAllByTestId('test-sticker');
    expect(stickers.length).toBeGreaterThan(0);
    expect(stickers[0]).toHaveTextContent('Test Sticker');

    // timeline view: sticker persists
    fireEvent.click(screen.getByTitle('Switch to Timeline view'));
    const tlStickers = await screen.findAllByTestId('test-sticker');
    expect(tlStickers.length).toBeGreaterThan(0);
    expect(tlStickers[0]).toHaveTextContent('Test Sticker');

    // verify timeline container
    const timelineView = await screen.findByRole('list');
    expect(timelineView).toHaveClass('timeline-view');

    // grid view: sticker persists
    fireEvent.click(screen.getByTitle('Switch to Grid view'));
    const gridStickers = await screen.findAllByTestId('test-sticker');
    expect(gridStickers.length).toBeGreaterThan(0);
    expect(gridStickers[0]).toHaveTextContent('Test Sticker');
  });
});