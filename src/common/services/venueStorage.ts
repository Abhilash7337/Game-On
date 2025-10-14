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
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...venuesStorage];
  }

  // Add a new venue
  static async addVenue(venue: Omit<Venue, 'id' | 'createdAt'>): Promise<Venue> {
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
  }

  // Get venues by owner ID (for client dashboard)
  static async getVenuesByOwner(ownerId: string): Promise<Venue[]> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return venuesStorage.filter(venue => venue.ownerId === ownerId);
  }

  // Update venue
  static async updateVenue(venueId: string, updates: Partial<Venue>): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const venueIndex = venuesStorage.findIndex(venue => venue.id === venueId);
    if (venueIndex !== -1) {
      venuesStorage[venueIndex] = { ...venuesStorage[venueIndex], ...updates };
    }
  }

  // Delete venue
  static async deleteVenue(venueId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
    venuesStorage = venuesStorage.filter(venue => venue.id !== venueId);
  }

  // Get venues for public display (courts screen)
  static async getPublicVenues(): Promise<Array<{
    id: string;
    name: string;
    rating: number;
    reviews: number;
    location: string;
    price: number;
    image: string;
  }>> {
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
      }));
  }
}