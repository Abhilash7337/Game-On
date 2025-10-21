import { Venue } from '../types';

// In-memory storage for venues (replace with AsyncStorage or API later)
let venuesStorage: Venue[] = [
  {
    id: '1',
    name: 'Mahindra Court',
    address: 'Mahindra University, Bahadurpally, Hyderabad',
    location: { latitude: 17.5449, longitude: 78.5718 },
    description: 'Premium sports facility with modern amenities and professional courts',
    amenities: ['Parking', 'Cafeteria', 'Locker Rooms', 'Air Conditioning'],
    images: ['https://via.placeholder.com/300x200/047857/ffffff?text=Mahindra+Court'],
    pricing: { basePrice: 170, peakHourMultiplier: 1.5, currency: 'INR' },
    operatingHours: { open: '06:00', close: '22:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    courts: [
      { id: '1-1', name: 'Court 1', venueId: '1', type: 'badminton', isActive: true },
      { id: '1-2', name: 'Court 2', venueId: '1', type: 'badminton', isActive: true },
    ],
    ownerId: 'current-client',
    rating: 4.2,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Sports Arena',
    address: 'Gachibowli, Hyderabad',
    location: { latitude: 17.4435, longitude: 78.3772 },
    description: 'Modern multi-sport facility with premium courts and equipment',
    amenities: ['Parking', 'WiFi', 'Shower Facilities', 'Equipment Rental'],
    images: ['https://via.placeholder.com/300x200/059669/ffffff?text=Sports+Arena'],
    pricing: { basePrice: 200, peakHourMultiplier: 1.5, currency: 'INR' },
    operatingHours: { open: '05:30', close: '23:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    courts: [
      { id: '2-1', name: 'Court A', venueId: '2', type: 'tennis', isActive: true },
      { id: '2-2', name: 'Court B', venueId: '2', type: 'badminton', isActive: true },
      { id: '2-3', name: 'Court C', venueId: '2', type: 'squash', isActive: true },
    ],
    ownerId: 'current-client',
    rating: 4.5,
    isActive: true,
    createdAt: new Date(),
  },
];

export class VenueStorageService {
  // Get all venues
  static async getAllVenues(): Promise<Venue[]> {
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      return [...venuesStorage];
    } catch (error) {
      console.error('Error fetching venues:', error);
      throw new Error('Failed to fetch venues. Please try again.');
    }
  }

  // Add a new venue
  static async addVenue(venue: Omit<Venue, 'id' | 'createdAt'>): Promise<Venue> {
    try {
      // Validate required fields
      if (!venue.name || !venue.address) {
        throw new Error('Venue name and address are required');
      }

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const venueId = Date.now().toString();
      const newVenue: Venue = {
        ...venue,
        id: venueId,
        createdAt: new Date(),
        // Fix courts to have the correct venueId
        courts: venue.courts.map(court => ({
          ...court,
          venueId: venueId
        }))
      };
      
      venuesStorage.push(newVenue);
      return newVenue;
    } catch (error) {
      console.error('Error adding venue:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to add venue. Please try again.');
    }
  }

  // Get venues by owner ID (for client dashboard)
  static async getVenuesByOwner(ownerId: string): Promise<Venue[]> {
    try {
      if (!ownerId) {
        throw new Error('Owner ID is required');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      return venuesStorage.filter(venue => venue.ownerId === ownerId);
    } catch (error) {
      console.error('Error fetching venues by owner:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch venues. Please try again.');
    }
  }

  // Update venue
  static async updateVenue(venueId: string, updates: Partial<Venue>): Promise<void> {
    try {
      if (!venueId) {
        throw new Error('Venue ID is required');
      }
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const venueIndex = venuesStorage.findIndex(venue => venue.id === venueId);
      if (venueIndex === -1) {
        throw new Error('Venue not found');
      }
      venuesStorage[venueIndex] = { ...venuesStorage[venueIndex], ...updates };
    } catch (error) {
      console.error('Error updating venue:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update venue. Please try again.');
    }
  }

  // Delete venue
  static async deleteVenue(venueId: string): Promise<void> {
    try {
      if (!venueId) {
        throw new Error('Venue ID is required');
      }
      await new Promise(resolve => setTimeout(resolve, 200));
      const initialLength = venuesStorage.length;
      venuesStorage = venuesStorage.filter(venue => venue.id !== venueId);
      if (venuesStorage.length === initialLength) {
        throw new Error('Venue not found');
      }
    } catch (error) {
      console.error('Error deleting venue:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete venue. Please try again.');
    }
  }

  // Get venues for public display (courts screen)
  static async getPublicVenues(): Promise<{
    id: string;
    name: string;
    rating: number;
    reviews: number;
    location: string;
    price: number;
    image: string;
    images?: string[];
  }[]> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return venuesStorage
        .filter(venue => venue.isActive)
        .map(venue => ({
          id: venue.id,
          name: venue.name,
          rating: venue.rating,
          reviews: Math.floor(Math.random() * 20) + 5, // Random reviews count
          location: venue.address,
          price: venue.pricing.basePrice,
          image: venue.images[0] || 'https://via.placeholder.com/300x200/047857/ffffff?text=Venue+Image',
          images: venue.images, // Add images array for compatibility
        }));
    } catch (error) {
      console.error('Error fetching public venues:', error);
      throw new Error('Failed to fetch venues. Please try again.');
    }
  }
}