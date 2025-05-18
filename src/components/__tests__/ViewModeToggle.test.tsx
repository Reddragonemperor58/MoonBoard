import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ViewModeToggle } from '../ViewModeToggle';
import { ViewModeProvider } from '../../context/ViewModeContext';

describe('ViewModeToggle', () => {
  const renderWithProvider = () => {
    return render(
      <ViewModeProvider>
        <ViewModeToggle />
      </ViewModeProvider>
    );
  };
  it('renders all view mode buttons', () => {
    renderWithProvider();
    
    // Get all buttons
    const buttons = screen.getAllByRole('button');
    
    // Check if we have all five view mode buttons
    expect(buttons).toHaveLength(5);
    
    // Check if each button has the correct title
    expect(buttons[0]).toHaveAttribute('title', 'Switch to Canvas view');
    expect(buttons[1]).toHaveAttribute('title', 'Switch to Timeline view');
    expect(buttons[2]).toHaveAttribute('title', 'Switch to Map view');
    expect(buttons[3]).toHaveAttribute('title', 'Switch to List view');
    expect(buttons[4]).toHaveAttribute('title', 'Switch to Grid view');
    
    // Check if each button has an icon
    buttons.forEach(button => {
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });it('highlights the active view mode', () => {
    renderWithProvider();
    
    // Find buttons by their accessible names (including hidden text)
    const standardButton = screen.getByRole('button', { name: /Canvas/i });
    const timelineButton = screen.getByRole('button', { name: /Timeline/i });
    
    // Check initial state
    expect(standardButton.className).toMatch(/bg-blue-100/);
    expect(timelineButton.className).not.toMatch(/bg-blue-100/);
    
    // Click timeline button
    fireEvent.click(timelineButton);
    
    // Check updated state
    expect(standardButton.className).not.toMatch(/bg-blue-100/);
    expect(timelineButton.className).toMatch(/bg-blue-100/);
  });
  it('changes view mode when clicked', () => {
    renderWithProvider();
    
    // Get all buttons
    const buttons = screen.getAllByRole('button');
    const standardButton = buttons[0];
    const timelineButton = buttons[1];
    
    // Check initial state (standard view)
    expect(standardButton.className).toMatch(/bg-blue-100/);
    expect(timelineButton.className).not.toMatch(/bg-blue-100/);
    
    // Click timeline button
    fireEvent.click(timelineButton);
    
    // Check that timeline is now active
    expect(standardButton.className).not.toMatch(/bg-blue-100/);
    expect(timelineButton.className).toMatch(/bg-blue-100/);
    
    // Click standard button again
    fireEvent.click(standardButton);
    
    // Check that standard is now active again
    expect(standardButton.className).toMatch(/bg-blue-100/);
    expect(timelineButton.className).not.toMatch(/bg-blue-100/);
  });
});
