import * as Location from 'expo-location';
import { calculateDistance, formatDistance } from './distanceCalculator';

export class LocationTestService {
  /**
   * Test location services and distance calculation
   */
  static async testLocationServices(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log('🧪 Testing location services...');

      // Check location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          message: 'Location permission not granted',
        };
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userCoords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Test distance calculation to known venues
      const testVenues = [
        {
          name: 'Mahindra Court',
          coordinates: { latitude: 17.5449, longitude: 78.5718 }
        },
        {
          name: 'Sports Arena',
          coordinates: { latitude: 17.4435, longitude: 78.3772 }
        }
      ];

      const distances = testVenues.map(venue => {
        const distanceKm = calculateDistance(
          userCoords.latitude,
          userCoords.longitude,
          venue.coordinates.latitude,
          venue.coordinates.longitude
        );
        return {
          venue: venue.name,
          distance: formatDistance(distanceKm),
          distanceKm: distanceKm
        };
      });

      return {
        success: true,
        message: 'Location services working correctly',
        details: {
          userLocation: userCoords,
          testDistances: distances,
          permissionStatus: status
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Location test failed',
        details: error
      };
    }
  }

  /**
   * Test distance calculation with known coordinates
   */
  static testDistanceCalculation(): {
    success: boolean;
    message: string;
    details?: any;
  } {
    try {
      // Test with known coordinates (Hyderabad city locations)
      const coord1 = { lat: 17.3850, lng: 78.4867 }; // Charminar
      const coord2 = { lat: 17.4435, lng: 78.3772 }; // Gachibowli

      const distance = calculateDistance(coord1.lat, coord1.lng, coord2.lat, coord2.lng);
      const formatted = formatDistance(distance);

      // Expected distance is approximately 8-10 km
      const isValid = distance > 5 && distance < 15;

      return {
        success: isValid,
        message: isValid ? 'Distance calculation working correctly' : 'Distance calculation seems incorrect',
        details: {
          from: 'Charminar',
          to: 'Gachibowli',
          calculatedDistance: formatted,
          distanceKm: distance,
          expectedRange: '8-10 km'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Distance calculation test failed',
        details: error
      };
    }
  }
}