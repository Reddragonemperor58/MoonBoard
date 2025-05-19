import React, { useState, useEffect, useRef } from 'react';

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

const EditableText: React.FC<EditableTextProps> = ({
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

  // Update local state when prop changes
  useEffect(() => {
    setEditText(text);
  }, [text]);
  // Focus input when isEditing becomes true
  useEffect(() => {
    if (isEditing && inputRef.current) {
      // Slight delay to ensure the input has mounted
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Don't automatically select all text, let user place cursor where they want
        }
      }, 50);
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    
    if (e.key === 'Enter') {
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
          onChange={(e) => setEditText(e.target.value)}
          onClick={(e) => {
            // This prevents the click from being handled by parent elements
            e.stopPropagation();
            // The cursor is automatically placed where the user clicks in the input
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            onTextChange(editText);
            onEditComplete();
          }}
          className={`editable-text-input ${inputClassName}`}
          style={{
            zIndex: 9999,
            position: 'relative',
            width: '100%',
            backgroundColor: 'white',
            color: '#000000',
            caretColor: '#000000',
            padding: '0.5rem',
            border: '2px solid #3b82f6',
            borderRadius: '0.375rem',
            outline: 'none',
            boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)',
          }}
          autoComplete="off"
        />
      </div>
    );
  }  // For non-editing state
  return (
    <div 
      className={textClassName}
      onClick={(e) => {
        e.stopPropagation();
        // Signal that editing should start (parent component will handle this)
        // Store the click position in a data attribute for later use
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        
        // Store data for potential use when input is mounted
        if (typeof document !== 'undefined') {
          document.documentElement.style.setProperty('--click-position-x', `${clickX}px`);
        }
      }}
    >
      {text}
    </div>
  );
};

export default EditableText;
