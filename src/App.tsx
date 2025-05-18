import React from 'react';
import MoodboardCanvas from './components/board/MoodboardCanvas';
import StickerPalette from './components/StickerPalette';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Moodboard App</h1>
        <p className="text-gray-600 dark:text-gray-400">Create your interactive moodboard with draggable stickers</p>
      </header>
      
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 shrink-0">
          <StickerPalette />
        </aside>
        
        <main className="flex-1">
          <MoodboardCanvas />
        </main>
      </div>
    </div>
  );
}

export default App;
