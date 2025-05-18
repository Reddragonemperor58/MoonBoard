# Moodboard Application

An interactive moodboard application built with React, TypeScript, and Tailwind CSS that allows users to create and organize stickers across time segments.

## Features

- Drag and drop stickers from a palette onto time segments
- Resize and move stickers freely within time segments
- Create, edit, and delete time segments (days)
- Interactive UI with hover effects and visual feedback

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone or download this repository
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

### Running the Application

```bash
npm run dev
# or
yarn dev
```

The application will be available at http://localhost:5173

## Project Structure

```
/src
  /components
    /Sticker         # Sticker component with drag and resize functionality
    /board           # Board and TimeSegment components
    StickerPalette.tsx
  /context
    MoodboardContext.tsx  # State management for moodboard
    ToastContext.tsx      # Notifications system
  /types
    index.ts              # Common type definitions
    moodboard.ts          # Moodboard-specific types
  App.tsx                 # Main application component
  main.tsx                # Entry point
  index.css               # Global styles with Tailwind
```

## Sticker Drag and Drop Implementation

The sticker drag and drop functionality uses both HTML5 native drag and drop and React-Rnd for positioning and resizing. The implementation includes:

1. Position reference tracking to prevent stickers from jumping
2. Complete drag lifecycle handling (start, during, stop)
3. Proper bounds handling within time segments
4. Delete button that appears on hover

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- DND Kit
- React-Rnd for resizable components
