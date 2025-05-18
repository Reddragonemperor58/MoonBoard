import React, { useState } from 'react';
import { MapSticker } from '../../types/moodboard';
import { v4 as uuidv4 } from 'uuid';

interface MapStickerCreatorProps {
  onCreate: (sticker: MapSticker) => void;
  timeSegmentId: string;
}

export const MapStickerCreator: React.FC<MapStickerCreatorProps> = ({ onCreate, timeSegmentId }) => {
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocodeLocation = async (address: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results[0]) {
        const { lat, lng } = data.results[0].geometry.location;
        return { lat, lng, address: data.results[0].formatted_address };
      }
      throw new Error('Location not found');
    } catch (error) {
      throw new Error('Failed to geocode location');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { lat, lng, address } = await geocodeLocation(location);
      
      const mapSticker: MapSticker = {
        id: uuidv4(),
        type: 'map',
        content: address,
        timeSegmentId,
        x: 0,
        y: 0,
        width: 300,
        height: 200,
        rotation: 0,
        zIndex: 1,
        location: {
          lat,
          lng,
          zoom: 14
        }
      };

      onCreate(mapSticker);
      setLocation('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create map');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter a location..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !location.trim()}
          className={`
            px-4 py-2 rounded-md text-white
            ${isLoading || !location.trim()
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'}
            transition-colors
          `}
        >
          {isLoading ? 'Creating...' : 'Add Map'}
        </button>
      </div>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </form>
  );
};

export default MapStickerCreator;
