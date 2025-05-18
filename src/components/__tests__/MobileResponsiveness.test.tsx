import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../../App';
import { ToastProvider } from '../../context/ToastContext';
import { TourProvider } from '../../context/TourContext';
import { MoodboardProvider } from '../../context/MoodboardContext';
import { ViewModeProvider } from '../../context/ViewModeContext';

// mocks
window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener: () => {}, removeListener: () => {} }));
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

describe('Mobile Responsiveness', () => {
  const originalInnerWidth = window.innerWidth;
  const resizeWindow = (w: number) => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: w });
    window.dispatchEvent(new Event('resize'));
  };
  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
  });

  it('should render mobile layout on small screens', () => {
    act(() => resizeWindow(375));
    render(
      <ToastProvider>
        <TourProvider>
          <MoodboardProvider>
            <ViewModeProvider>
              <App />
            </ViewModeProvider>
          </MoodboardProvider>
        </TourProvider>
      </ToastProvider>
    );
    // no desktop header text
    expect(screen.queryByText(/plan your dream trip, visually/i)).not.toBeInTheDocument();
  });

  it('should show/hide mobile menu when clicking menu button', () => {
    // enable menu button
    // @ts-ignore
    window.moodboardControls = { hasSelectedSticker: false, toggleDarkMode: vi.fn() };
    act(() => resizeWindow(375));
    render(
      <ToastProvider>
        <TourProvider>
          <MoodboardProvider>
            <ViewModeProvider>
              <App />
            </ViewModeProvider>
          </MoodboardProvider>
        </TourProvider>
      </ToastProvider>
    );
    const btn = screen.getByRole('button', { name: /menu/i });
    expect(screen.queryByText('Reset Zoom')).not.toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.getByText('Reset Zoom')).toBeInTheDocument();
    expect(screen.getByText('Add Day')).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.queryByText('Reset Zoom')).not.toBeInTheDocument();
  });

  it('should render desktop layout on large screens', () => {
    act(() => resizeWindow(1024));
    render(
      <ToastProvider>
        <TourProvider>
          <MoodboardProvider>
            <ViewModeProvider>
              <App />
            </ViewModeProvider>
          </MoodboardProvider>
        </TourProvider>
      </ToastProvider>
    );
    expect(screen.queryByRole('button', { name: /menu/i })).toBeNull();
    expect(screen.getByText(/plan your dream trip, visually/i)).toBeInTheDocument();
  });

  it('should handle window resize events', () => {
    render(
      <ToastProvider>
        <TourProvider>
          <MoodboardProvider>
            <ViewModeProvider>
              <App />
            </ViewModeProvider>
          </MoodboardProvider>
        </TourProvider>
      </ToastProvider>
    );
    act(() => resizeWindow(1024));
    expect(screen.queryByRole('button', { name: /menu/i })).toBeNull();
    act(() => resizeWindow(375));
    expect(screen.queryByRole('button', { name: /menu/i })).toBeNull();
    act(() => resizeWindow(1024));
    expect(screen.queryByRole('button', { name: /menu/i })).toBeNull();
  });

  it('should maintain sticker selection state in mobile view', () => {
    // enable menu button
    // @ts-ignore
    window.moodboardControls = { hasSelectedSticker: true, toggleDarkMode: vi.fn() };
    act(() => resizeWindow(375));
    render(
      <ToastProvider>
        <TourProvider>
          <MoodboardProvider>
            <ViewModeProvider>
              <App />
            </ViewModeProvider>
          </MoodboardProvider>
        </TourProvider>
      </ToastProvider>
    );
    const menuBtn = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuBtn);
    expect(screen.getByText('Bring to Front')).toBeInTheDocument();
    expect(screen.getByText('Send to Back')).toBeInTheDocument();
  });
});