import React, { useState } from 'react';
import { LinkSticker } from '../../types/moodboard';
import { v4 as uuidv4 } from 'uuid';

interface LinkStickerCreatorProps {
  onCreate: (sticker: LinkSticker) => void;
  timeSegmentId: string;
}

export const LinkStickerCreator: React.FC<LinkStickerCreatorProps> = ({ onCreate, timeSegmentId }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = async (url: string) => {
    try {
      // In a production environment, you would want to use a proxy service
      // to avoid CORS issues and to safely fetch metadata
      const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      return {
        title: data.title || url,
        thumbnail: data.image || null
      };
    } catch {
      return {
        title: url,
        thumbnail: null
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Validate URL
      new URL(url);
      
      const { title, thumbnail } = await fetchMetadata(url);
      
      const linkSticker: LinkSticker = {
        id: uuidv4(),
        type: 'link',
        content: url,
        title,
        thumbnail,
        timeSegmentId,
        x: 0,
        y: 0,
        width: 300,
        height: 100,
        rotation: 0,
        zIndex: 1
      };

      onCreate(linkSticker);
      setUrl('');
    } catch (err) {
      setError('Please enter a valid URL');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter a URL..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className={`
            px-4 py-2 rounded-md text-white
            ${isLoading || !url.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'}
            transition-colors
          `}
        >
          {isLoading ? 'Creating...' : 'Add Link'}
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </form>
  );
};

export default LinkStickerCreator;
