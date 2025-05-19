import React, { useCallback, useEffect, useState } from 'react';
import { useMoodboard } from '../../context/MoodboardContext';
import { StickerGroup } from '../../types/moodboard';
import { v4 as uuidv4 } from 'uuid';

export const StickerGroupManager: React.FC = () => {  const { state, dispatch } = useMoodboard();
  const [newGroupName, setNewGroupName] = useState('');
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  // Handle multi-select mode
  const toggleMultiSelect = useCallback(() => {
    dispatch({ type: 'TOGGLE_MULTI_SELECT', payload: { enabled: !state.isMultiSelectMode } });
  }, [dispatch, state.isMultiSelectMode]);
  // Handle selection box drawing
  useEffect(() => {
    if (!state.isMultiSelectMode) return;

    let startingMousePosition = { x: 0, y: 0 };
    let isDrawing = false;

    const handleMouseDown = (e: MouseEvent) => {
      const canvas = document.querySelector('.moodboard-canvas');
      if (!canvas || !(e.target as Element).closest('.moodboard-canvas')) return;

      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      startingMousePosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      isDrawing = true;
      setSelectionBox({
        startX: startingMousePosition.x,
        startY: startingMousePosition.y,
        endX: startingMousePosition.x,
        endY: startingMousePosition.y
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing || !selectionBox) return;
      const canvas = document.querySelector('.moodboard-canvas');
      if (!canvas) return;

      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const currentPosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      setSelectionBox({
        startX: startingMousePosition.x,
        startY: startingMousePosition.y,
        endX: currentPosition.x,
        endY: currentPosition.y
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDrawing || !selectionBox) return;
      isDrawing = false;

      e.preventDefault();
      // Find stickers within selection box
      const selectedStickers = Object.values(state.stickers).filter(sticker => {
        const stickerRect = {
          left: sticker.x,
          right: sticker.x + sticker.width,
          top: sticker.y,
          bottom: sticker.y + sticker.height
        };

        const selectionRect = {
          left: Math.min(selectionBox.startX, selectionBox.endX),
          right: Math.max(selectionBox.startX, selectionBox.endX),
          top: Math.min(selectionBox.startY, selectionBox.endY),
          bottom: Math.max(selectionBox.startY, selectionBox.endY)
        };

        return (
          stickerRect.left < selectionRect.right &&
          stickerRect.right > selectionRect.left &&
          stickerRect.top < selectionRect.bottom &&
          stickerRect.bottom > selectionRect.top
        );
      });

      if (selectedStickers.length > 0) {
        dispatch({
          type: 'SELECT_STICKERS',
          payload: { stickerIds: selectedStickers.map(s => s.id) }
        });
      }

      setSelectionBox(null);
    };    // Add events
    const canvas = document.querySelector('.moodboard-canvas');
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown as EventListener);
      document.addEventListener('mousemove', handleMouseMove as EventListener);
      document.addEventListener('mouseup', handleMouseUp as EventListener);
    }

    return () => {
      // Clean up events
      if (canvas) {
        canvas.removeEventListener('mousedown', handleMouseDown as EventListener);
      }
      document.removeEventListener('mousemove', handleMouseMove as EventListener);
      document.removeEventListener('mouseup', handleMouseUp as EventListener);
    };
  }, [state.isMultiSelectMode, selectionBox, dispatch, state.stickers]);
  const createGroup = useCallback(() => {
    if (!newGroupName.trim() || state.selectedStickerIds.length === 0) return;

    const group: StickerGroup = {
      id: uuidv4(),
      name: newGroupName,
      stickerIds: state.selectedStickerIds
    };

    dispatch({
      type: 'CREATE_STICKER_GROUP',
      payload: group
    });    setNewGroupName('');
  }, [newGroupName, state.selectedStickerIds, dispatch]);
  const addToGroup = useCallback((groupId: string) => {
    if (state.selectedStickerIds.length === 0) return;

    // Add each selected sticker to the group one by one
    state.selectedStickerIds.forEach(stickerId => {
      dispatch({
        type: 'ADD_TO_GROUP',
        payload: {
          groupId,
          stickerId
        }
      });
    });
  }, [state.selectedStickerIds, dispatch]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMultiSelect}
          className={`px-3 py-1 rounded ${
            state.isMultiSelectMode
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Multi-Select Mode
        </button>
        <span className="text-sm text-gray-500">
          {state.selectedStickerIds.length} selected
        </span>
      </div>

      {state.selectedStickerIds.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New group name..."
              className="flex-1 px-2 py-1 border rounded"
            />
            <button
              onClick={createGroup}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Create Group
            </button>
          </div>

          {Object.entries(state.stickerGroups).length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Add to existing group:</h4>
              {Object.entries(state.stickerGroups).map(([id, group]) => (
                <button
                  key={id}
                  onClick={() => addToGroup(id)}
                  className="block w-full text-left px-2 py-1 hover:bg-gray-100 rounded"
                >
                  {group.name} ({group.stickerIds.length})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {selectionBox && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.endX),
            top: Math.min(selectionBox.startY, selectionBox.endY),
            width: Math.abs(selectionBox.endX - selectionBox.startX),
            height: Math.abs(selectionBox.endY - selectionBox.startY)
          }}
        />
      )}
    </div>
  );
};

export default StickerGroupManager;
