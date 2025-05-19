import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StickerPalette from '../StickerPalette';
import { DndContext } from '@dnd-kit/core';

// Mock the drag and drop functionality
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core');
  return {
    ...actual,
    useDraggable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      isDragging: false,
    }),
  };
});

describe('StickerPalette', () => {
  it('renders the sticker palette component', () => {
    render(
      <DndContext>
        <StickerPalette />
      </DndContext>
    );
    
    expect(screen.getByText('Stickers')).toBeInTheDocument();
  });
  
  it('renders the correct number of stickers', () => {
    render(
      <DndContext>
        <StickerPalette />
      </DndContext>
    );
    
    // Text sticker
    expect(screen.getByText('Text Note')).toBeInTheDocument();
    
    // Icon stickers (check for a few)
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('⭐')).toBeInTheDocument();
  });
  
  it('makes stickers draggable', () => {
    render(
      <DndContext>
        <StickerPalette />
      </DndContext>
    );
    
    // Check that draggable attribute is set
    const draggableElements = document.querySelectorAll('[draggable="true"]');
    expect(draggableElements.length).toBeGreaterThan(0);
  });
  
  it('sets data transfer on drag start', () => {
    render(
      <DndContext>
        <StickerPalette />
      </DndContext>
    );
    
    const textSticker = screen.getByText('Text Note').closest('div');
    expect(textSticker).not.toBeNull();
    
    if (textSticker) {
      // Mock dataTransfer
      const dataTransfer = {
        setData: vi.fn(),
        effectAllowed: '',
        setDragImage: vi.fn(),
      };
      
      // Trigger dragStart
      fireEvent.dragStart(textSticker, { dataTransfer });
      
      // Check that setData was called
      expect(dataTransfer.setData).toHaveBeenCalled();
      expect(dataTransfer.effectAllowed).toBe('copy');
    }
  });
});
