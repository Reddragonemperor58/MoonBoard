import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

interface EditableTextProps {
  text: string;
  isEditing: boolean;
  onTextChange: (newText: string) => void;
  onEditComplete: () => void;
  onEditCancel?: () => void;
  className?: string;
  inputClassName?: string;
  textClassName?: string;
}

// Helper function to calculate cursor position based on text width and click position
const calculateCursorPosition = (text: string, inputEl: HTMLInputElement, clickX: number): number => {
  // Create a temporary element to measure text width
  const tempEl = document.createElement('span');
  tempEl.style.font = window.getComputedStyle(inputEl).font;
  tempEl.style.position = 'absolute';
  tempEl.style.whiteSpace = 'pre';
  tempEl.style.visibility = 'hidden';
  document.body.appendChild(tempEl);

  // Binary search to find the closest character position to clickX
  let left = 0;
  let right = text.length;
  let best = 0;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    tempEl.textContent = text.substring(0, mid);
    const width = tempEl.getBoundingClientRect().width;

    if (width <= clickX) {
      best = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  // Clean up
  document.body.removeChild(tempEl);

  return best;
};

const EditableTextWithCursor: React.FC<EditableTextProps> = ({
  text,
  isEditing,
  onTextChange,
  onEditComplete,
  onEditCancel,
  className = '',
  inputClassName = '',
  textClassName = '',
}) => {
  const [editText, setEditText] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);
  const textDivRef = useRef<HTMLDivElement>(null);
  const clickPositionRef = useRef<number | null>(null);
    // Update local state when prop changes or when editing starts
  useEffect(() => {
    if (!isEditing) {
      setEditText(text);
    }
  }, [text, isEditing]);

  // When clicking on the text, store the click position
  const handleTextClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    // Calculate click position for cursor positioning
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    clickPositionRef.current = clickX;
  };

  // Position cursor when editing starts
  useLayoutEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      
      // If we have a stored click position, use it to position the cursor
      if (clickPositionRef.current !== null) {
        const cursorPos = calculateCursorPosition(text, inputRef.current, clickPositionRef.current);
        inputRef.current.setSelectionRange(cursorPos, cursorPos);
        clickPositionRef.current = null; // Reset after use
      }
    }
  }, [isEditing, text]);
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    
    if (e.key === 'Enter') {
      // Pass the latest text value to the parent component
      onTextChange(editText);
      onEditComplete();
    } else if (e.key === 'Escape') {
      if (onEditCancel) {
        onEditCancel();
      } else {
        setEditText(text); // Reset to original text
        onEditComplete();
      }
    }
  };
  if (isEditing) {
    return (
      <div className={`editable-text-container ${className}`} style={{ position: 'relative', zIndex: 9999 }}>
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => {
            // Direct update of text value
            setEditText(e.target.value);
            // Also pass the change to parent component for real-time updates
            // Disabled for now to avoid double updates: onTextChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          onClick={(e) => {
            // Prevent event bubbling
            e.stopPropagation();
          }}
          onBlur={() => {
            // Ensure the latest value is passed to parent on blur
            onTextChange(editText);
            onEditComplete();
          }}
          className={`editable-text-input ${inputClassName}`}
          style={{
            zIndex: 9999,
            position: 'relative',
            width: '100%',
            backgroundColor: 'white',
            color: 'black',
            caretColor: 'black',
            padding: '0.5rem',
            border: '2px solid #3b82f6',
            borderRadius: '0.375rem',
            outline: 'none',
            boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            fontSize: '1rem',
            fontWeight: 500,
            lineHeight: 1.5,
            opacity: 1
          }}
          autoComplete="off"
          autoFocus
          spellCheck="false"
        />
      </div>
    );
  }

  return (
    <div 
      ref={textDivRef}
      className={textClassName}
      onClick={handleTextClick}
    >
      {text}
    </div>
  );
};

export default EditableTextWithCursor;
