import React, { useState, useEffect, useRef } from 'react';

interface SimpleEditableTextProps {
  text: string;
  isEditing: boolean;
  onTextChange: (newText: string) => void;
  onEditComplete: () => void;
  onEditCancel?: () => void;
  textClassName?: string;
}

const SimpleEditableText: React.FC<SimpleEditableTextProps> = ({
  text,
  isEditing,
  onTextChange,
  onEditComplete,
  onEditCancel,
  textClassName = '',
}) => {
  // Local state to track the text during editing
  const [editedText, setEditedText] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset edited text when text prop changes or editing starts/ends
  useEffect(() => {
    setEditedText(text);
  }, [text, isEditing]);

  // Focus the input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      // Focus with a slight delay to ensure the input is rendered
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 10);
    }
  }, [isEditing]);
  // Handle Enter and Escape keys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();

    if (e.key === 'Enter') {
      // Get the current value directly from the input element
      const finalText = inputRef.current?.value || editedText;
      // Update parent component with final text
      onTextChange(finalText);
      // Complete editing
      onEditComplete();
    } else if (e.key === 'Escape') {
      // Cancel editing
      if (onEditCancel) {
        onEditCancel();
      } else {
        setEditedText(text); // Reset to original text
        onEditComplete();
      }
    }
  };

  if (isEditing) {
    return (
      <div 
        style={{ 
          position: 'relative', 
          zIndex: 9999,
          width: '100%',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={editedText}
          onChange={(e) => {
            setEditedText(e.target.value);
          }}          onBlur={() => {
            // Get the most current value directly from the input element
            const finalValue = inputRef.current?.value || editedText;
            // Notify parent of the final value
            onTextChange(finalValue);
            // Complete the edit
            onEditComplete();
          }}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '16px',
            color: '#000',
            backgroundColor: '#fff',
            border: '2px solid #3b82f6',
            borderRadius: '4px',
            boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)',
            outline: 'none',
            position: 'relative',
            zIndex: 9999,
            caretColor: '#000',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
          }}
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <div 
      className={textClassName}
      style={{ 
        cursor: 'text',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}
    >
      {text}
    </div>
  );
};

export default SimpleEditableText;
