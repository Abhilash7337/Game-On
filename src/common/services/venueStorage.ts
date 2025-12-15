import { Venue } from '../types';
import { supabase } from './supabase';

// Fallback in-memory storage for offline mode
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
      // Try to fetch from Supabase first - only get active venues
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch failed, using local storage:', error.message);
        return [...venuesStorage];
      }

      // Transform Supabase data to match Venue interface
      const venues: Venue[] = (data || []).map(v => {
        // Parse location safely
        let location = { latitude: 0, longitude: 0 };
        if (v.location) {
          try {
            // If location is a string, try to parse it as JSON
            if (typeof v.location === 'string') {
              const parsed = JSON.parse(v.location);
              if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
                location = parsed;
              }
            } else if (typeof v.location === 'object' && v.location.latitude && v.location.longitude) {
              // Already an object with coordinates
              location = v.location;
            }
          } catch (parseError) {
            // If parsing fails or location is invalid text, use default
            console.log(`Invalid location format for venue ${v.id}, using default coordinates`);
          }
        }

        return {
          id: v.id,
          name: v.name,
          address: v.address,
          location: location,
          description: v.description || '',
          amenities: v.facilities || [],
          images: v.images || [],
          pricing: v.pricing || { basePrice: 0, peakHourMultiplier: 1.5, currency: 'INR' },
          operatingHours: v.availability || { open: '06:00', close: '22:00', days: [] },
          courts: v.courts || [],
          ownerId: v.client_id,
          rating: v.rating || 0,
          isActive: v.is_active !== false,
          createdAt: new Date(v.created_at),
        };
      });

      // Update local cache
      venuesStorage = venues;
      return venues;
    } catch (error) {
      console.error('Error fetching venues:', error);
      return [...venuesStorage]; // Fallback to local storage
    }
  }

  // Check if venue with same name and address already exists
  static async checkDuplicateVenue(name: string, address: string, excludeId?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, address')
        .ilike('name', name.trim())
        .ilike('address', address.trim());

      if (error) {
        console.warn('Error checking duplicate venue:', error);
        return false;
      }

      if (excludeId) {
        // Exclude the venue being edited
        return (data || []).some(v => v.id !== excludeId);
      }

      return (data || []).length > 0;
    } catch (error) {
      console.error('Error checking duplicate venue:', error);
      return false;
    }
  }

  // Add a new venue
  static async addVenue(venue: Omit<Venue, 'id' | 'createdAt'>): Promise<Venue> {
    try {
      // Validate required fields
      if (!venue.name || !venue.address) {
        throw new Error('Venue name and address are required');
      }

      // Validate location coordinates
      if (!venue.location || venue.location.latitude === 0 || venue.location.longitude === 0) {
        throw new Error('Please select a valid location on the map');
      }

      // Check for duplicate venue
      const isDuplicate = await this.checkDuplicateVenue(venue.name, venue.address);
      if (isDuplicate) {
        throw new Error('A venue with this name and address already exists. Please use a different name or address.');
      }

      // Transform to Supabase schema
      const supabaseVenue = {
        client_id: venue.ownerId,
        name: venue.name,
        address: venue.address,
        location: venue.location,
        description: venue.description,
        facilities: venue.amenities,
        images: venue.images,
        pricing: venue.pricing,
        availability: venue.operatingHours,
        rating: venue.rating,
        is_active: venue.isActive,
      };

      // Insert into Supabase
      const { data, error } = await supabase
        .from('venues')
        .insert([supabaseVenue])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error('Failed to save venue to database: ' + error.message);
      }

      // If courts exist, insert them into courts table
      if (venue.courts && venue.courts.length > 0) {
        const courtsData = venue.courts.map(court => ({
          venue_id: data.id,
          name: court.name,
          type: court.type,
          is_active: court.isActive !== false,
        }));

        const { data: courtsInserted, error: courtsError } = await supabase
          .from('courts')
          .insert(courtsData)
          .select();

        if (courtsError) {
          console.error('❌ Error inserting courts:', courtsError);
          // Attempt to delete the venue if courts failed
          await supabase.from('venues').delete().eq('id', data.id);
          throw new Error('Failed to create courts for venue. Please try again.');
        }

        console.log(`✅ Successfully inserted ${courtsInserted?.length || 0} courts`);
      }

      // Transform back to Venue interface
      const newVenue: Venue = {
        id: data.id,
        name: data.name,
        address: data.address,
        location: data.location,
        description: data.description,
        amenities: data.facilities,
        images: data.images,
        pricing: data.pricing,
        operatingHours: data.availability,
        courts: venue.courts.map((court: any) => ({
          ...court,
          venueId: data.id
        })),
        ownerId: data.client_id,
        rating: data.rating,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
      };

      // Update local cache
      venuesStorage.push(newVenue);
      console.log('✅ Venue added to Supabase:', newVenue.name);
      console.log('📊 Total venues in storage:', venuesStorage.length);
      return newVenue;
    } catch (error) {
      console.error('Error adding venue:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to add venue. Please try again.');
    }
  }

  // Fetch courts for a venue from database
  static async getVenueCourts(venueId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('venue_id', venueId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching courts:', error);
        return [];
      }

      return (data || []).map(court => ({
        id: court.id,
        name: court.name,
        venueId: court.venue_id,
        type: court.type,
        isActive: court.is_active
      }));
    } catch (error) {
      console.error('Error fetching venue courts:', error);
      return [];
    }
  }

  // Get venues by owner ID (for client dashboard)
  static async getVenuesByOwner(ownerId: string): Promise<Venue[]> {
    try {
      if (!ownerId) {
        throw new Error('Owner ID is required');
      }

      // Try Supabase first
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('client_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch failed, using local storage:', error.message);
        return venuesStorage.filter(venue => venue.ownerId === ownerId);
      }

      // Transform to Venue interface
      return (data || []).map(v => ({
        id: v.id,
        name: v.name,
        address: v.address,
        location: v.location || { latitude: 0, longitude: 0 },
        description: v.description || '',
        amenities: v.facilities || [],
        images: v.images || [],
        pricing: v.pricing || { basePrice: 0, peakHourMultiplier: 1.5, currency: 'INR' },
        operatingHours: v.availability || { open: '06:00', close: '22:00', days: [] },
        courts: v.courts || [],
        ownerId: v.client_id,
        rating: v.rating || 0,
        isActive: v.is_active !== false,
        createdAt: new Date(v.created_at),
      }));
    } catch (error) {
      console.error('Error fetching venues by owner:', error);
      return venuesStorage.filter(venue => venue.ownerId === ownerId);
    }
  }

  // Update venue
  static async updateVenue(venueId: string, updates: Partial<Venue>): Promise<Venue> {
    try {
      if (!venueId) {
        throw new Error('Venue ID is required');
      }

      // Check for duplicate if name or address is being updated
      if (updates.name || updates.address) {
        const currentVenue = await this.getVenueById(venueId);
        if (!currentVenue) {
          throw new Error('Venue not found');
        }

        const nameToCheck = updates.name || currentVenue.name;
        const addressToCheck = updates.address || currentVenue.address;
        
        const isDuplicate = await this.checkDuplicateVenue(nameToCheck, addressToCheck, venueId);
        if (isDuplicate) {
          throw new Error('A venue with this name and address already exists.');
        }
      }

      // Transform updates to Supabase schema
      const supabaseUpdates: any = {};
      if (updates.name) supabaseUpdates.name = updates.name;
      if (updates.address) supabaseUpdates.address = updates.address;
      if (updates.location) supabaseUpdates.location = updates.location;
      if (updates.description) supabaseUpdates.description = updates.description;
      if (updates.amenities) supabaseUpdates.facilities = updates.amenities;
      if (updates.images) supabaseUpdates.images = updates.images;
      if (updates.pricing) supabaseUpdates.pricing = updates.pricing;
      if (updates.operatingHours) supabaseUpdates.availability = updates.operatingHours;
      if (updates.rating !== undefined) supabaseUpdates.rating = updates.rating;
      if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive;

      // Update in Supabase
      const { data, error } = await supabase
        .from('venues')
        .update(supabaseUpdates)
        .eq('id', venueId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error('Failed to update venue: ' + error.message);
      }

      // Update courts if provided
      if (updates.courts) {
        // Delete existing courts
        await supabase.from('courts').delete().eq('venue_id', venueId);
        
        // Insert new courts
        if (updates.courts.length > 0) {
          const courtsData = updates.courts.map(court => ({
            venue_id: venueId,
            name: court.name,
            type: court.type,
            is_active: court.isActive !== false,
          }));

          const { error: courtsError } = await supabase
            .from('courts')
            .insert(courtsData);

          if (courtsError) {
            console.error('Error updating courts:', courtsError);
          }
        }
      }

      // Transform back to Venue interface
      const updatedVenue: Venue = {
        id: data.id,
        name: data.name,
        address: data.address,
        location: data.location,
        description: data.description,
        amenities: data.facilities,
        images: data.images,
        pricing: data.pricing,
        operatingHours: data.availability,
        courts: updates.courts || [],
        ownerId: data.client_id,
        rating: data.rating,
        isActive: data.is_active,
        createdAt: new Date(data.created_at),
      };

      // Update local cache
      const venueIndex = venuesStorage.findIndex(v => v.id === venueId);
      if (venueIndex !== -1) {
        venuesStorage[venueIndex] = updatedVenue;
      }

      console.log('✅ Venue updated successfully:', updatedVenue.name);
      return updatedVenue;
    } catch (error) {
      console.error('Error updating venue:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update venue. Please try again.');
    }
  }

  // Get venue by ID
  static async getVenueById(venueId: string): Promise<Venue | null> {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', venueId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        address: data.address,
        location: data.location || { latitude: 0, longitude: 0 },
        description: data.description || '',
        amenities: data.facilities || [],
        images: data.images || [],
        pricing: data.pricing || { basePrice: 0, peakHourMultiplier: 1.5, currency: 'INR' },
        operatingHours: data.availability || { open: '06:00', close: '22:00', days: [] },
        courts: data.courts || [],
        ownerId: data.client_id,
        rating: data.rating || 0,
        isActive: data.is_active !== false,
        createdAt: new Date(data.created_at),
      };
    } catch (error) {
      console.error('Error fetching venue by ID:', error);
      return null;
    }
  }

  // Delete venue with image cleanup
  static async deleteVenue(venueId: string): Promise<void> {
    try {
      if (!venueId) {
        throw new Error('Venue ID is required');
      }

      // Get venue to access images for cleanup
      const venue = await this.getVenueById(venueId);
      if (!venue) {
        throw new Error('Venue not found');
      }

      // Delete associated courts first
      const { error: courtsError } = await supabase
        .from('courts')
        .delete()
        .eq('venue_id', venueId);

      if (courtsError) {
        console.warn('Error deleting courts:', courtsError);
        // Continue with venue deletion even if courts deletion fails
      }

      // Delete venue from database
      const { error: venueError } = await supabase
        .from('venues')
        .delete()
        .eq('id', venueId);

      if (venueError) {
        console.error('Supabase delete error:', venueError);
        throw new Error('Failed to delete venue: ' + venueError.message);
      }

      // Delete images from storage
      if (venue.images && venue.images.length > 0) {
        const { ImageUploadService } = await import('./imageUpload');
        
        for (const imageUrl of venue.images) {
          try {
            await ImageUploadService.deleteImage(imageUrl);
            console.log('🗑️ Deleted image:', imageUrl);
          } catch (imageError) {
            console.warn('Failed to delete image:', imageUrl, imageError);
            // Continue even if image deletion fails
          }
        }
      }

      // Update local cache
      venuesStorage = venuesStorage.filter(v => v.id !== venueId);
      
      console.log('✅ Venue deleted successfully:', venue.name);
    } catch (error) {
      console.error('Error deleting venue:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete venue. Please try again.');
    }
  }

  // Toggle venue active status
  static async toggleVenueStatus(venueId: string): Promise<boolean> {
    try {
      const venue = await this.getVenueById(venueId);
      if (!venue) {
        throw new Error('Venue not found');
      }

      const newStatus = !venue.isActive;

      const { error } = await supabase
        .from('venues')
        .update({ is_active: newStatus })
        .eq('id', venueId);

      if (error) {
        throw new Error('Failed to update venue status: ' + error.message);
      }

      // Update local cache
      const venueIndex = venuesStorage.findIndex(v => v.id === venueId);
      if (venueIndex !== -1) {
        venuesStorage[venueIndex].isActive = newStatus;
      }

      console.log(`✅ Venue status toggled: ${venue.name} is now ${newStatus ? 'active' : 'inactive'}`);
      return newStatus;
    } catch (error) {
      console.error('Error toggling venue status:', error);
      throw error;
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
    distance?: string;
    coordinates?: { latitude: number; longitude: number };
    sportType?: string;
    sportTypes?: string[];
  }[]> {
    try {
      // Fetch all venues from Supabase
      const allVenues = await this.getAllVenues();
      
      console.log('📍 Fetching public venues from Supabase. Total:', allVenues.length);
      const activeVenues = allVenues.filter(venue => venue.isActive);
      console.log('✅ Active venues:', activeVenues.length);
      
      // Fetch courts for all venues to determine sport types
      const venueIds = activeVenues.map(v => v.id);
      
      console.log('🔍 Fetching courts for venues:', venueIds);
      
      const { data: courtsData, error: courtsError } = await supabase
        .from('courts')
        .select('*')
        .in('venue_id', venueIds)
        .eq('is_active', true);
      
      if (courtsError) {
        console.error('❌ Error fetching courts for sport types:', courtsError);
      }
      
      console.log('🎾 Courts data fetched (FULL):', JSON.stringify(courtsData, null, 2));
      console.log('📊 Total courts found:', courtsData?.length || 0);
      
      // Log each court individually to see the actual data
      (courtsData || []).forEach(court => {
        console.log(`  🏟️  Court: ${court.name} | Type: "${court.type}" | Venue: ${court.venue_id}`);
      });
      
      // Create a map of venue_id to sport types
      const venueSportsMap = new Map<string, string[]>();
      (courtsData || []).forEach(court => {
        console.log(`  🔄 Processing court: "${court.name}" | Type raw: "${court.type}" | Type typeof: ${typeof court.type}`);
        
        if (!venueSportsMap.has(court.venue_id)) {
          venueSportsMap.set(court.venue_id, []);
        }
        const sportTypes = venueSportsMap.get(court.venue_id)!;
        
        // Normalize sport type to lowercase
        const normalizedType = court.type?.toLowerCase();
        console.log(`    → Normalized: "${normalizedType}" | Already in array: ${sportTypes.includes(normalizedType || '')}`);
        
        if (normalizedType && !sportTypes.includes(normalizedType)) {
          sportTypes.push(normalizedType);
          console.log(`    ✅ Added "${normalizedType}" to venue ${court.venue_id}`);
        }
      });
      
      console.log('🏀 Venue Sports Map (FINAL):', Object.fromEntries(venueSportsMap));
      
      return activeVenues.map(venue => {
        const sportTypes = venueSportsMap.get(venue.id) || [];
        
        console.log(`📍 Venue "${venue.name}" sports:`, sportTypes);
        
        return {
          id: venue.id,
          name: venue.name,
          rating: venue.rating,
          reviews: Math.floor(Math.random() * 20) + 5, // Random reviews count
          location: venue.address,
          price: venue.pricing.basePrice,
          image: venue.images[0] || 'https://via.placeholder.com/300x200/047857/ffffff?text=Venue+Image',
          images: venue.images,
          coordinates: venue.location,
          sportType: sportTypes[0] || undefined, // Primary sport type (undefined if no courts)
          sportTypes: sportTypes.length > 0 ? sportTypes : undefined, // All available sports (undefined if no courts)
        };
      });
    } catch (error) {
      console.error('Error fetching public venues:', error);
      throw new Error('Failed to fetch venues. Please try again.');
    }
  }
}