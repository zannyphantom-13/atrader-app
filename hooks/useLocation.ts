
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface UseLocationReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
}

export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getLocation = async () => {
      try {
         
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setError('Location permission denied');
          setIsLoading(false);
          return;
        }

        // Get current location
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        // console.log('Current Location:', currentLocation);

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          timestamp: currentLocation.timestamp,
        });

      } catch (err) {
        setError('Failed to get location');
        console.error('Location error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    getLocation();
  }, []);

  return { location, isLoading, error };
};