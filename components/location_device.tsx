import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface AddressData {
  street?: string;
  city?: string;
  region?: string; // State/Province
  regionCode?: string; // State abbreviation (e.g., 'CA', 'NY')
  country?: string;
  countryCode?: string;
  postalCode?: string;
  formattedAddress?: string;
}

export interface LocationWithAddress {
  location: LocationData;
  address: AddressData;
}



class LocationService {
  private static instance: LocationService;

  private constructor() { }

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions
   */
  async requestLocationPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to use this feature. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  /**
   * Check if location services are enabled
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  };

  /**
   * Get current location
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) return null;

      const isEnabled = await this.isLocationEnabled();
      if (!isEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to use this feature.'
        );
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        // accuracy: location.coords.accuracy,
        // altitude: location.coords.altitude,
        // heading: location.coords.heading,
        // speed: location.coords.speed,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
      return null;
    }
  }

  /**
   * Get address from coordinates (Reverse Geocoding)
   */
  async getAddressFromLocation(latitude: number, longitude: number): Promise<AddressData | null> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];

        return {
          //   street: address.street,
          //   city: address.city,
          //   region: address.region, // Full state name (e.g., "California")
          //   regionCode: address.isoCountryCode === 'US' ? 
          //     this.getUSStateAbbreviation(address.region) : address.region,
          //   country: address.country,
          //   countryCode: address.isoCountryCode,
          //   postalCode: address.postalCode,
          formattedAddress: this.formatAddress(address),
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting address from location:', error);
      return null;
    }
  }

  /**
   * Get location coordinates from address (Forward Geocoding)
   */
  async getLocationFromAddress(address: string): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) return null;

      const locations = await Location.geocodeAsync(address);

      if (locations && locations.length > 0) {
        const location = locations[0];

        return {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: Date.now(),
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting location from address:', error);
      return null;
    }
  }


  /**
   * Get current location with address
   */
  async getCurrentLocationWithAddress(): Promise<LocationWithAddress | null> {
    try {
      const location = await this.getCurrentLocation();
      if (!location) return null;

      const address = await this.getAddressFromLocation(
        location.latitude,
        location.longitude
      );

      return {
        location,
        address: address || {},
      };
    } catch (error) {
      console.error('Error getting location with address:', error);
      return null;
    }
  }


  /**
   * Watch location changes (for real-time updates)
   */
  async watchLocation(
    onLocationUpdate: (location: LocationData) => void,
    onError?: (error: Error) => void
  ): Promise<{ remove: () => void } | null> {
    try {
      const hasPermission = await this.requestLocationPermissions();
      if (!hasPermission) return null;

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 50, // Update when moved 50 meters
        },
        (location) => {
          onLocationUpdate({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            // accuracy: location.coords.accuracy,
            // altitude: location.coords.altitude,
            // heading: location.coords.heading,
            // speed: location.coords.speed,
            timestamp: location.timestamp,
          });
        }
      );

      return subscription;
    } catch (error) {
      console.error('Error watching location:', error);
      onError?.(error as Error);
      return null;
    }
  }

  /**
   * Format address for display
   */
  private formatAddress(address: Location.LocationGeocodedAddress): string {
    const parts = [
      address.street,
      address.city,
      address.region,
      address.postalCode,
      address.country
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Get US state abbreviation from full state name
   */
  private getUSStateAbbreviation(stateName: string | null): string | undefined {
    if (!stateName) return undefined;

    const stateAbbreviations: { [key: string]: string } = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC'
    };

    return stateAbbreviations[stateName] || stateName;
  }
}

export const detachedInstanceCache: any[] = [];
export const cacheLocationViewInstance = (instance: any) => {
  detachedInstanceCache.push(instance);
};

export const useDeviceLocationWatcher = (onLocation: (loc: any) => void) => {
  const [coords, setCoords] = React.useState<any>(null);

  const locationOptions = { highAccuracy: true, timeout: 5000 };

  React.useEffect(() => {
    let active = true;
    LocationService.getInstance().getCurrentLocation().then((res) => {
      if (active && res) {
        setCoords(res);
        onLocation(res);
      }
    });
    return () => { active = false; };
  }, [locationOptions]);

  React.useEffect(() => {
    let watchSub: any = null;
    LocationService.getInstance().watchLocation((loc) => {
      setCoords(loc);
    }).then(sub => {
      watchSub = sub;
    });
    return () => {
    };
  }, []);

  return coords;
};

import React from 'react';
export default LocationService.getInstance();

