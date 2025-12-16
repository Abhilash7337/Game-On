import { Booking } from '@/src/common/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BOOKINGS_STORAGE_KEY = '@game_on_bookings';

interface BookingRequest {
  userId: string;
  venueId: string;
  venueName: string;
  ownerId: string;
  court: string;
  date: Date;
  time: string;
  duration: string;
  bookingType: 'Open Game' | 'Private Game';
  skillLevel?: string;
  players?: string;
  price: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
}

interface BookingWithNotification extends Booking {
  notificationSent?: boolean;
  venue?: string; // venue name for display
  court?: string; // court name for display  
  ownerId?: string; // venue owner ID
  bookingStatus?: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
}

class BookingStorageService {
  private static bookings: BookingWithNotification[] = [];
  private static listeners: (() => void)[] = [];
  private static initialized = false;
  private static pendingBookings: Set<string> = new Set(); // ✅ Duplicate prevention

  // Load bookings from AsyncStorage
  private static async loadFromStorage(): Promise<void> {
    try {
      console.log('💾 [STORAGE] Loading bookings from AsyncStorage...');
      const stored = await AsyncStorage.getItem(BOOKINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        this.bookings = parsed.map((b: any) => ({
          ...b,
          date: new Date(b.date),
          createdAt: new Date(b.createdAt),
          updatedAt: new Date(b.updatedAt),
        }));
        console.log('✅ [STORAGE] Loaded bookings from storage:', this.bookings.length);
      } else {
        console.log('ℹ️ [STORAGE] No stored bookings found');
        this.bookings = [];
      }
      this.initialized = true;
    } catch (error) {
      console.error('❌ [STORAGE] Error loading bookings:', error);
      this.bookings = [];
      this.initialized = true;
    }
  }

  // Save bookings to AsyncStorage
  private static async saveToStorage(): Promise<void> {
    try {
      console.log('💾 [STORAGE] Saving bookings to AsyncStorage:', this.bookings.length);
      await AsyncStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(this.bookings));
      console.log('✅ [STORAGE] Bookings saved successfully');
    } catch (error) {
      console.error('❌ [STORAGE] Error saving bookings:', error);
    }
  }

  // Ensure storage is loaded before any operation
  private static async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.loadFromStorage();
    }
  }

  static async createBooking(bookingData: BookingRequest): Promise<Booking> {
    try {
      // Ensure bookings are loaded
      await this.ensureInitialized();

      // ✅ DUPLICATE PREVENTION: Check if already processing this exact booking
      const bookingKey = `${bookingData.userId}-${bookingData.venueId}-${bookingData.court}-${bookingData.date.toISOString()}-${bookingData.time}`;
      if (this.pendingBookings.has(bookingKey)) {
        console.warn('⚠️ [STORAGE] Duplicate booking request detected, ignoring');
        throw new Error('Booking request already in progress. Please wait.');
      }
      this.pendingBookings.add(bookingKey);

      try {
        // Validate required fields
        if (!bookingData.userId || !bookingData.venueId || !bookingData.venueName) {
          throw new Error('User ID, venue ID, and venue name are required');
        }

        if (!bookingData.date || !bookingData.time || !bookingData.duration) {
          throw new Error('Date, time, and duration are required');
        }

        if (bookingData.price < 0) {
          throw new Error('Price cannot be negative');
        }

      // Parse time to get start and end times
      const { supabase } = await import('./supabase');
      const startTime = this.parseTimeToFormat(bookingData.time);
      const durationHours = parseInt(bookingData.duration.split(' ')[0]) || 1;
      const endTime = this.calculateEndTime(startTime, durationHours);

      // Get the real court UUID from courts table
      let courtId = null;
      
      // If courtId was passed directly, use it
      if ((bookingData as any).courtId) {
        courtId = (bookingData as any).courtId;
      } else {
        // Otherwise, look up the court by name and venue_id
        const { data: court, error: courtError } = await supabase
          .from('courts')
          .select('id')
          .eq('venue_id', bookingData.venueId)
          .eq('name', bookingData.court)
          .single();

        if (courtError || !court) {
          console.error('❌ [STORAGE] Court not found:', courtError);
          throw new Error(`Court "${bookingData.court}" not found for this venue`);
        }

        courtId = court.id;
      }

      console.log('🎾 [STORAGE] Using court ID:', courtId);

      // ✅ CHECK FOR BOOKING CONFLICTS
      const hasConflict = await this.checkBookingConflict(
        bookingData.venueId,
        courtId,
        bookingData.date,
        bookingData.time,
        parseInt(bookingData.duration.split(' ')[0]) || 1
      );

      if (hasConflict) {
        console.log('⚠️ [STORAGE] Booking conflict detected - slot already booked');
        throw new Error('This time slot is already booked. Please choose a different time.');
      }

      // Insert into Supabase bookings table
      const { data: supabaseBooking, error: insertError } = await supabase
        .from('bookings')
        .insert([{
          user_id: bookingData.userId,
          venue_id: bookingData.venueId,
          court_id: courtId,
          booking_date: bookingData.date.toISOString().split('T')[0],
          start_time: startTime,
          end_time: endTime,
          duration: bookingData.duration,
          booking_type: this.toDbBookingType(bookingData.bookingType),
          skill_level: bookingData.skillLevel,
          player_count: bookingData.players ? parseInt(bookingData.players) : null,
          total_amount: bookingData.price,
          status: bookingData.status,
          payment_status: bookingData.paymentStatus,
          notes: `Venue: ${bookingData.venueName}, Court: ${bookingData.court}`,
        }])
        .select()
        .single();

      if (insertError) {
        console.error('❌ [STORAGE] Supabase insert error:', insertError);
        throw new Error(`Failed to create booking in database: ${insertError.message}`);
      }

      console.log('✅ [STORAGE] Booking created in Supabase:', supabaseBooking.id);

      // ✅ SCHEDULE AUTO-ACCEPT (30 minutes from now)
      this.scheduleAutoAccept(supabaseBooking.id, bookingData.ownerId);

      // Transform Supabase booking to our format
      const booking: BookingWithNotification = {
        id: supabaseBooking.id,
        userId: supabaseBooking.user_id,
        venueId: supabaseBooking.venue_id,
        courtId: supabaseBooking.court_id,
        date: new Date(supabaseBooking.booking_date),
        time: bookingData.time,
        duration: supabaseBooking.duration,
        bookingType: this.fromDbBookingType(supabaseBooking.booking_type),
        skillLevel: supabaseBooking.skill_level,
        players: supabaseBooking.player_count?.toString(),
        price: parseFloat(supabaseBooking.total_amount),
        status: 'upcoming',
        paymentStatus: supabaseBooking.payment_status as 'pending' | 'paid' | 'refunded',
        createdAt: new Date(supabaseBooking.created_at),
        updatedAt: new Date(supabaseBooking.updated_at),
        venue: bookingData.venueName,
        court: bookingData.court,
        ownerId: bookingData.ownerId,
        bookingStatus: supabaseBooking.status as 'pending' | 'confirmed' | 'rejected' | 'cancelled',
        notificationSent: false,
      };

      // Update local cache
      this.bookings.push(booking);
      await this.saveToStorage(); // Also persist to AsyncStorage for offline access
      this.notifyListeners();
      
      console.log('✅ [STORAGE] Booking synced to local cache:', booking.id);
      
      // Also add to the old booking store for compatibility
      const { bookingStore } = await import('@/utils/bookingStore');
      if (bookingData.status === 'confirmed') {
        bookingStore.addBooking({
          venue: bookingData.venueName,
          court: bookingData.court,
          date: bookingData.date,
          time: bookingData.time,
          duration: bookingData.duration,
          bookingType: bookingData.bookingType,
          skillLevel: bookingData.skillLevel,
          players: bookingData.players,
          price: bookingData.price,
        });
      }

      return booking;
      } finally {
        // ✅ Always remove from pending set
        this.pendingBookings.delete(bookingKey);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create booking. Please try again.');
    }
  }

  // Helper: Parse time string to HH:MM:SS format for Supabase
  private static parseTimeToFormat(time: string): string {
    // Input: "6:00 AM" or "10:00 PM"
    // Output: "06:00:00" or "22:00:00"
    const parts = time.split(' ');
    const timePart = parts[0];
    const period = parts[1];
    
    let [hours, minutes] = timePart.split(':').map(Number);
    
    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }

  // Helper: Convert booking type to database format
  private static toDbBookingType(type: 'Open Game' | 'Private Game'): string {
    return type === 'Open Game' ? 'open' : 'private';
  }

  // Helper: Convert booking type from database format
  private static fromDbBookingType(type: string): 'Open Game' | 'Private Game' {
    return type === 'open' ? 'Open Game' : 'Private Game';
  }

  // Helper: Calculate end time based on duration
  private static calculateEndTime(startTime: string, durationHours: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + durationHours;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }

  // Check for booking conflicts
  static async checkBookingConflict(
    venueId: string,
    courtId: string,
    date: Date,
    startTime: string,
    durationHours: number
  ): Promise<boolean> {
    try {
      const { supabase } = await import('./supabase');
      
      // Parse time to DB format
      const dbStartTime = this.parseTimeToFormat(startTime);
      const dbEndTime = this.calculateEndTime(dbStartTime, durationHours);
      const dateStr = date.toISOString().split('T')[0];

      // ✅ IMPROVED: Only check for CONFIRMED bookings (not pending)
      // Pending bookings will be auto-rejected if conflicting
      // ✅ FIX: Use proper PostgREST syntax for time overlap detection
      const { data, error } = await supabase
        .from('bookings')
        .select('id, start_time, end_time, created_at, status')
        .eq('venue_id', venueId)
        .eq('court_id', courtId)
        .eq('booking_date', dateStr)
        .eq('status', 'confirmed') // ✅ Only confirmed bookings block
        .lt('start_time', dbEndTime) // ✅ Booking starts before our end time
        .gt('end_time', dbStartTime); // ✅ Booking ends after our start time

      if (error) {
        console.error('❌ [STORAGE] Error checking conflicts:', error);
        return false; // If error, allow booking (don't block)
      }

      const hasConflict = data && data.length > 0;
      
      if (hasConflict) {
        console.log('⚠️ [STORAGE] Confirmed booking conflict detected:', {
          venueId,
          courtId,
          date: dateStr,
          requestedTime: `${dbStartTime} - ${dbEndTime}`,
          conflictingBookings: data.length
        });
      }

      return hasConflict;
    } catch (error) {
      console.error('❌ [STORAGE] Error in checkBookingConflict:', error);
      return false; // If error, allow booking
    }
  }

  // ✅ AUTO-ACCEPT: Schedule auto-accept after 30 minutes
  private static scheduleAutoAccept(bookingId: string, ownerId: string): void {
    console.log(`⏰ [AUTO-ACCEPT] Scheduling auto-accept for booking ${bookingId} in 30 minutes`);
    
    // Set timeout for 30 minutes (1800000 ms)
    setTimeout(async () => {
      try {
        console.log(`⏰ [AUTO-ACCEPT] Checking booking ${bookingId} for auto-accept...`);
        const { supabase } = await import('./supabase');
        
        // Check if booking is still pending
        const { data: booking, error: fetchError } = await supabase
          .from('bookings')
          .select('id, status, venue_id, court_id, booking_date, start_time, end_time, created_at')
          .eq('id', bookingId)
          .single();

        if (fetchError || !booking) {
          console.log('⚠️ [AUTO-ACCEPT] Booking not found, skipping auto-accept');
          return;
        }

        if (booking.status !== 'pending') {
          console.log(`✅ [AUTO-ACCEPT] Booking already ${booking.status}, skipping auto-accept`);
          return;
        }

        // ✅ CHECK FOR CONFLICTING PENDING BOOKINGS (first-come-first-served)
        const { data: conflicts, error: conflictError } = await supabase
          .from('bookings')
          .select('id, created_at')
          .eq('venue_id', booking.venue_id)
          .eq('court_id', booking.court_id)
          .eq('booking_date', booking.booking_date)
          .eq('status', 'pending')
          .or(`and(start_time.lt.${booking.end_time},end_time.gt.${booking.start_time})`)
          .order('created_at', { ascending: true });

        if (!conflictError && conflicts && conflicts.length > 1) {
          // Multiple pending bookings for same slot - accept oldest, reject others
          const oldestBookingId = conflicts[0].id;
          
          if (bookingId === oldestBookingId) {
            console.log('✅ [AUTO-ACCEPT] This is the first booking, accepting...');
            await this.updateBookingStatus(bookingId, 'confirmed');
            
            // Reject all other conflicting bookings
            for (let i = 1; i < conflicts.length; i++) {
              console.log(`🚫 [AUTO-ACCEPT] Rejecting conflicting booking ${conflicts[i].id}`);
              await this.updateBookingStatus(conflicts[i].id, 'cancelled'); // ✅ Use 'cancelled'
            }
          } else {
            console.log('🚫 [AUTO-ACCEPT] Another booking was created first, rejecting this one');
            await this.updateBookingStatus(bookingId, 'cancelled'); // ✅ Use 'cancelled'
          }
        } else {
          // No conflicts, auto-accept
          console.log('✅ [AUTO-ACCEPT] No conflicts, auto-accepting booking');
          await this.updateBookingStatus(bookingId, 'confirmed');
        }
      } catch (error) {
        console.error('❌ [AUTO-ACCEPT] Error during auto-accept:', error);
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  static async getBookingsByUser(userId: string): Promise<Booking[]> {
    try {
      await this.ensureInitialized();
      
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Fetch from Supabase
      const { supabase } = await import('./supabase');
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          venues!inner(name, client_id),
          courts!inner(name)
        `)
        .eq('user_id', userId)
        .order('booking_date', { ascending: false });

      if (error) {
        console.warn('⚠️ [STORAGE] Supabase fetch failed, using local cache:', error.message);
        return this.bookings.filter(booking => booking.userId === userId);
      }

      return data.map(b => ({
        id: b.id,
        userId: b.user_id,
        venueId: b.venue_id,
        courtId: b.court_id,
        date: new Date(b.booking_date),
        time: this.formatTimeFromDB(b.start_time),
        duration: b.duration,
        bookingType: this.fromDbBookingType(b.booking_type),
        skillLevel: b.skill_level,
        players: b.player_count?.toString(),
        price: parseFloat(b.total_amount || 0),
        status: 'upcoming',
        paymentStatus: b.payment_status as 'pending' | 'paid' | 'refunded',
        createdAt: new Date(b.created_at),
        updatedAt: new Date(b.updated_at),
      }));
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch bookings. Please try again.');
    }
  }

  static async getBookingsByClient(clientId: string): Promise<BookingWithNotification[]> {
    try {
      await this.ensureInitialized();
      
      if (!clientId) {
        throw new Error('Client ID is required');
      }

      // Fetch from Supabase - get bookings for venues owned by this client
      const { supabase } = await import('./supabase');
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          venues!inner(name, client_id),
          courts!inner(name)
        `)
        .eq('venues.client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ [STORAGE] Supabase fetch failed, using local cache:', error.message);
        return this.bookings.filter(booking => booking.ownerId === clientId);
      }

      return data.map(b => ({
        id: b.id,
        userId: b.user_id,
        venueId: b.venue_id,
        courtId: b.court_id,
        date: new Date(b.booking_date),
        time: this.formatTimeFromDB(b.start_time),
        duration: b.duration,
        bookingType: this.fromDbBookingType(b.booking_type),
        skillLevel: b.skill_level,
        players: b.player_count?.toString(),
        price: parseFloat(b.total_amount || 0),
        status: 'upcoming',
        paymentStatus: b.payment_status as 'pending' | 'paid' | 'refunded',
        createdAt: new Date(b.created_at),
        updatedAt: new Date(b.updated_at),
        venue: b.venues?.name,
        court: b.courts?.name,
        ownerId: b.venues?.client_id,
        bookingStatus: b.status as 'pending' | 'confirmed' | 'rejected' | 'cancelled',
        notificationSent: false,
      }));
    } catch (error) {
      console.error('Error fetching client bookings:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch bookings. Please try again.');
    }
  }

  static async getPendingBookings(clientId: string): Promise<BookingWithNotification[]> {
    await this.ensureInitialized();
    
    console.log('🔍 [STORAGE] Getting pending bookings for clientId:', clientId);
    
    try {
      // Fetch from Supabase - First get all pending bookings for venues owned by this client
      const { supabase } = await import('./supabase');
      
      // ✅ FIX: Fetch bookings separately to avoid column conflicts
      // Step 1: Get venue IDs owned by this client
      const { data: venuesData, error: venuesError } = await supabase
        .from('venues')
        .select('id, name, client_id')
        .eq('client_id', clientId);
      
      if (venuesError || !venuesData || venuesData.length === 0) {
        console.warn('⚠️ [STORAGE] No venues found for client or error:', venuesError?.message);
        return [];
      }
      
      const venueIds = venuesData.map(v => v.id);
      const venueMap = new Map(venuesData.map(v => [v.id, v]));
      
      // Step 2: Get all pending bookings for these venues
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .in('venue_id', venueIds)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ [STORAGE] Supabase fetch failed, using local cache:', error.message);
        const pending = this.bookings.filter(booking => 
          booking.ownerId === clientId && 
          (booking as any).bookingStatus === 'pending'
        );
        console.log('✅ [STORAGE] Found pending bookings (local):', pending.length);
        return pending;
      }
      
      if (!data || data.length === 0) {
        console.log('✅ [STORAGE] Found pending bookings (Supabase): 0');
        return [];
      }
      
      // Step 3: Get court names for all bookings
      const courtIds = [...new Set(data.map(b => b.court_id))];
      const { data: courtsData } = await supabase
        .from('courts')
        .select('id, name')
        .in('id', courtIds);
      
      const courtMap = new Map(courtsData?.map(c => [c.id, c.name]) || []);

      const pending = data.map(b => {
        const venue = venueMap.get(b.venue_id);
        return {
          id: b.id,
          userId: b.user_id,
          venueId: b.venue_id,
          courtId: b.court_id,
          date: new Date(b.booking_date),
          time: this.formatTimeFromDB(b.start_time),
          duration: b.duration,
          bookingType: this.fromDbBookingType(b.booking_type),
          skillLevel: b.skill_level,
          players: b.player_count?.toString(),
          price: parseFloat(b.total_amount || 0),
          status: 'upcoming' as const,
          paymentStatus: b.payment_status as 'pending' | 'paid' | 'refunded',
          createdAt: new Date(b.created_at),
          updatedAt: new Date(b.updated_at),
          venue: venue?.name || 'Unknown Venue',
          court: courtMap.get(b.court_id) || 'Unknown Court',
          ownerId: venue?.client_id || clientId,
          bookingStatus: 'pending' as const,
          notificationSent: false,
        };
      });

      console.log('✅ [STORAGE] Found pending bookings (Supabase):', pending.length);
      return pending;
    } catch (error) {
      console.error('❌ [STORAGE] Error fetching pending bookings:', error);
      return [];
    }
  }

  static async updateBookingStatus(
    bookingId: string, 
    status: 'confirmed' | 'cancelled', // ✅ Changed 'rejected' to 'cancelled' to match DB constraint
    message?: string
  ): Promise<Booking | null> {
    await this.ensureInitialized();
    
    try {
      // Update in Supabase
      const { supabase } = await import('./supabase');
      
      // ✅ CONFLICT HANDLING: If confirming, reject any conflicting pending bookings
      if (status === 'confirmed') {
        // Get booking details first
        const { data: bookingToConfirm } = await supabase
          .from('bookings')
          .select('venue_id, court_id, booking_date, start_time, end_time')
          .eq('id', bookingId)
          .single();

        if (bookingToConfirm) {
          console.log('🔍 [BOOKING] Checking for conflicting pending bookings...');
          
          // Find all conflicting pending bookings
          const { data: conflicts } = await supabase
            .from('bookings')
            .select('id')
            .eq('venue_id', bookingToConfirm.venue_id)
            .eq('court_id', bookingToConfirm.court_id)
            .eq('booking_date', bookingToConfirm.booking_date)
            .eq('status', 'pending')
            .neq('id', bookingId) // Exclude the one being confirmed
            .or(`and(start_time.lt.${bookingToConfirm.end_time},end_time.gt.${bookingToConfirm.start_time})`);

          if (conflicts && conflicts.length > 0) {
            console.log(`🚫 [BOOKING] Found ${conflicts.length} conflicting bookings, auto-rejecting...`);
            
            // Auto-reject all conflicting bookings
            for (const conflict of conflicts) {
              await supabase
                .from('bookings')
                .update({ status: 'cancelled', updated_at: new Date().toISOString() }) // ✅ Use 'cancelled'
                .eq('id', conflict.id);
              
              console.log(`✅ [BOOKING] Auto-rejected conflicting booking: ${conflict.id}`);
            }
          }
        }
      }
      
      // ✅ FIX: First update the status, then fetch the data separately
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('❌ [STORAGE] Supabase update error:', updateError);
        // Fallback to local update
        const booking = this.bookings.find(b => b.id === bookingId);
        if (!booking) return null;

        (booking as any).bookingStatus = status;
        booking.updatedAt = new Date();
        
        if (status === 'confirmed') {
          booking.status = 'upcoming';
        }
        
        await this.saveToStorage();
        this.notifyListeners();
        return booking;
      }

      // ✅ FIX: Fetch the updated booking data separately (cleaner query)
      // Fetch booking and venue/court data separately to avoid column conflicts
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();
      
      let venueName = 'Unknown Venue';
      let courtName = 'Unknown Court';
      let ownerId = '';
      
      if (data) {
        // Fetch venue name separately
        const { data: venueData } = await supabase
          .from('venues')
          .select('name, client_id')
          .eq('id', data.venue_id)
          .single();
        
        if (venueData) {
          venueName = venueData.name;
          ownerId = venueData.client_id;
        }
        
        // Fetch court name separately
        const { data: courtData } = await supabase
          .from('courts')
          .select('name')
          .eq('id', data.court_id)
          .single();
        
        if (courtData) {
          courtName = courtData.name;
        }
      }

      if (fetchError || !data) {
        console.warn('⚠️ [STORAGE] Could not fetch updated booking, using local cache');
        const booking = this.bookings.find(b => b.id === bookingId);
        if (booking) {
          (booking as any).bookingStatus = status;
          booking.updatedAt = new Date();
          if (status === 'confirmed') {
            booking.status = 'upcoming';
          }
          await this.saveToStorage();
          this.notifyListeners();
          return booking;
        }
        return null;
      }

      // Update local cache
      const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
      const updatedBooking: BookingWithNotification = {
        id: data.id,
        userId: data.user_id,
        venueId: data.venue_id,
        courtId: data.court_id,
        date: new Date(data.booking_date),
        time: this.formatTimeFromDB(data.start_time),
        duration: data.duration,
        bookingType: this.fromDbBookingType(data.booking_type),
        skillLevel: data.skill_level,
        players: data.player_count?.toString(),
        price: parseFloat(data.total_amount || 0),
        status: status === 'confirmed' ? 'upcoming' : 'cancelled',
        paymentStatus: data.payment_status as 'pending' | 'paid' | 'refunded',
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        venue: venueName, // ✅ Use separately fetched venue name
        court: courtName, // ✅ Use separately fetched court name
        ownerId: ownerId,  // ✅ Use separately fetched owner ID
        bookingStatus: status,
        notificationSent: false,
      };

      if (bookingIndex !== -1) {
        this.bookings[bookingIndex] = updatedBooking;
      }
      
      await this.saveToStorage();
      this.notifyListeners();

      // Add to old booking store if confirmed
      if (status === 'confirmed') {
        const { bookingStore } = await import('@/utils/bookingStore');
        bookingStore.addBooking({
          venue: updatedBooking.venue!,
          court: updatedBooking.court!,
          date: updatedBooking.date,
          time: updatedBooking.time,
          duration: updatedBooking.duration,
          bookingType: updatedBooking.bookingType,
          skillLevel: updatedBooking.skillLevel,
          players: updatedBooking.players,
          price: updatedBooking.price,
        });
      }

      console.log('✅ [STORAGE] Booking status updated in Supabase:', bookingId, status);
      return updatedBooking;
    } catch (error) {
      console.error('❌ [STORAGE] Error updating booking status:', error);
      return null;
    }
  }

  static async getAllBookings(): Promise<BookingWithNotification[]> {
    await this.ensureInitialized();
    
    try {
      // Fetch from Supabase for latest data
      const { supabase } = await import('./supabase');
      const { data: supabaseBookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          venues!inner(name, client_id),
          courts!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('⚠️ [STORAGE] Supabase fetch failed, using local cache:', error.message);
        return [...this.bookings].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }

      // Transform to our format
      const bookings: BookingWithNotification[] = supabaseBookings.map(b => ({
        id: b.id,
        userId: b.user_id,
        venueId: b.venue_id,
        courtId: b.court_id,
        date: new Date(b.booking_date),
        time: this.formatTimeFromDB(b.start_time),
        duration: b.duration,
        bookingType: this.fromDbBookingType(b.booking_type),
        skillLevel: b.skill_level,
        players: b.player_count?.toString(),
        price: parseFloat(b.total_amount || 0),
        status: 'upcoming',
        paymentStatus: b.payment_status as 'pending' | 'paid' | 'refunded',
        createdAt: new Date(b.created_at),
        updatedAt: new Date(b.updated_at),
        venue: b.venues?.name || 'Unknown Venue',
        court: b.courts?.name || 'Unknown Court',
        ownerId: b.venues?.client_id,
        bookingStatus: b.status as 'pending' | 'confirmed' | 'rejected' | 'cancelled',
        notificationSent: false,
      }));

      // Update local cache
      this.bookings = bookings;
      await this.saveToStorage();
      
      console.log('✅ [STORAGE] Fetched bookings from Supabase:', bookings.length);
      return bookings;
    } catch (error) {
      console.error('❌ [STORAGE] Error fetching bookings:', error);
      // Fallback to local cache
      return [...this.bookings].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  }

  // Helper: Format time from DB (HH:MM:SS) to display format (H:MM AM/PM)
  private static formatTimeFromDB(time: string): string {
    // Input: "06:00:00" or "14:00:00"
    // Output: "6:00 AM" or "2:00 PM"
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  static subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Clear all bookings (for testing/reset)
  static async clearAllBookings(): Promise<void> {
    console.log('🗑️ [STORAGE] Clearing all bookings...');
    this.bookings = [];
    await AsyncStorage.removeItem(BOOKINGS_STORAGE_KEY);
    this.notifyListeners();
    console.log('✅ [STORAGE] All bookings cleared');
  }

  // Initialize with demo data (deprecated - using AsyncStorage now)
  static initializeDemoData(): void {
    // No-op - bookings are now persisted in AsyncStorage
    console.log('ℹ️ [STORAGE] initializeDemoData called (deprecated, using AsyncStorage)');
  }

  // ✅ NEW: Join an open game (add user to booking_participants)
  static async joinOpenGame(bookingId: string, userId: string): Promise<boolean> {
    try {
      console.log(`🎮 [STORAGE] User ${userId} joining booking ${bookingId}...`);
      const { supabase } = await import('./supabase');
      
      // Check if user is already a participant
      const { data: existingParticipant } = await supabase
        .from('booking_participants')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('user_id', userId)
        .single();
      
      if (existingParticipant) {
        console.log('⚠️ [STORAGE] User is already a participant');
        return false;
      }
      
      // Get booking details to check availability
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('booking_type, player_count, user_id')
        .eq('id', bookingId)
        .single();
      
      if (bookingError || !booking) {
        console.error('❌ [STORAGE] Booking not found:', bookingError);
        return false;
      }
      
      // Check if it's an open game
      if (booking.booking_type !== 'open') {
        console.error('❌ [STORAGE] Not an open game');
        return false;
      }
      
      // player_count in DB stores "spots still needed" (not total players)
      const spotsStillNeeded = booking.player_count || 0;
      
      console.log(`📊 [STORAGE] Current spots needed: ${spotsStillNeeded}`);
      
      if (spotsStillNeeded <= 0) {
        console.error('❌ [STORAGE] No spots available (game is full)');
        return false;
      }
      
      // Add participant
      const { error: insertError } = await supabase
        .from('booking_participants')
        .insert([{
          booking_id: bookingId,
          user_id: userId,
          status: 'confirmed', // ✅ Use 'confirmed' to match bookings table constraint
          joined_at: new Date().toISOString()
        }]);
      
      if (insertError) {
        console.error('❌ [STORAGE] Error adding participant:', insertError);
        return false;
      }
      
      // Decrement player_count by 1 (one less spot needed)
      const newPlayerCount = spotsStillNeeded - 1;
      await supabase
        .from('bookings')
        .update({ player_count: newPlayerCount })
        .eq('id', bookingId);
      
      console.log(`✅ [STORAGE] User joined game! Spots remaining: ${newPlayerCount}`);
      
      // ✅ ADD USER TO GAME CONVERSATION (CHATROOM)
      try {
        console.log(`💬 [STORAGE] Adding user to game conversation...`);
        
        // Get or create conversation for this booking
        const { data: existingConversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('booking_id', bookingId)
          .eq('type', 'game') // ✅ Use 'game' type for booking conversations
          .single();
        
        let conversationId = existingConversation?.id;
        
        // If no conversation exists, create one
        if (!conversationId) {
          console.log(`📝 [STORAGE] Creating new conversation for booking ${bookingId}...`);
          
          const { data: newConversation, error: conversationError } = await supabase
            .from('conversations')
            .insert([{
              booking_id: bookingId,
              name: `Game Chat`,
              type: 'game', // ✅ Use 'game' type
              created_by: booking.user_id, // Host is the creator
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }])
            .select('id')
            .single();
          
          if (conversationError) {
            console.error('⚠️ [STORAGE] Failed to create conversation:', conversationError);
          } else {
            conversationId = newConversation?.id;
            console.log(`✅ [STORAGE] Created conversation: ${conversationId}`);
            
            // Add host to the conversation
            const { error: hostError } = await supabase
              .from('conversation_participants')
              .insert([{
                conversation_id: conversationId,
                user_id: booking.user_id,
                joined_at: new Date().toISOString(),
                is_active: true
              }]);
            
            if (hostError) {
              console.error('⚠️ [STORAGE] Failed to add host to conversation:', hostError);
            } else {
              console.log(`✅ [STORAGE] Host added to conversation`);
            }
          }
        }
        
        // Add joining user to conversation
        if (conversationId) {
          const { error: participantError } = await supabase
            .from('conversation_participants')
            .insert([{
              conversation_id: conversationId,
              user_id: userId,
              joined_at: new Date().toISOString(),
              is_active: true
            }]);
          
          if (participantError) {
            console.error('⚠️ [STORAGE] Failed to add user to conversation:', participantError);
          } else {
            console.log(`✅ [STORAGE] User added to conversation: ${conversationId}`);
          }
        }
      } catch (chatError) {
        console.error('⚠️ [STORAGE] Error managing conversation:', chatError);
        // Don't fail the entire join operation if chat fails
      }
      
      return true;
    } catch (error) {
      console.error('❌ [STORAGE] Error joining game:', error);
      return false;
    }
  }

  // ✅ NEW: Get booking details with participants
  static async getBookingWithParticipants(bookingId: string): Promise<any | null> {
    try {
      const { supabase } = await import('./supabase');
      
      console.log(`📖 [STORAGE] Fetching booking details for: ${bookingId}`);
      
      // Fetch booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          venues!inner(name, address),
          courts!inner(name, type),
          users!bookings_user_id_fkey(id, full_name, avatar, email, rating)
        `)
        .eq('id', bookingId)
        .single();
      
      if (bookingError || !booking) {
        console.error('❌ [STORAGE] Booking not found:', bookingError);
        return null;
      }
      
      // Fetch participants
      const { data: participants, error: participantsError } = await supabase
        .from('booking_participants')
        .select(`
          *,
          users!booking_participants_user_id_fkey(id, full_name, avatar, email)
        `)
        .eq('booking_id', bookingId)
        .eq('status', 'confirmed'); // ✅ Use 'confirmed' status
      
      if (participantsError) {
        console.error('❌ [STORAGE] Error fetching participants:', participantsError);
      }
      
      const participantCount = participants?.length || 0;
      const spotsNeeded = booking.player_count || 0;
      const currentPlayers = participantCount + 1; // +1 for host
      const totalSlots = currentPlayers + spotsNeeded;
      
      console.log(`📊 [STORAGE] Booking player counts:`, {
        host: 1,
        participants: participantCount,
        currentPlayers: currentPlayers,
        spotsNeeded: spotsNeeded,
        totalSlots: totalSlots
      });
      
      return {
        id: booking.id,
        venueId: booking.venue_id,
        venueName: booking.venues?.name,
        venueAddress: booking.venues?.address,
        courtId: booking.court_id,
        courtName: booking.courts?.name,
        courtType: booking.courts?.type,
        date: booking.booking_date,
        startTime: this.formatTimeFromDB(booking.start_time),
        endTime: this.formatTimeFromDB(booking.end_time),
        duration: booking.duration,
        bookingType: this.fromDbBookingType(booking.booking_type),
        skillLevel: booking.skill_level,
        totalAmount: parseFloat(booking.total_amount || 0),
        status: booking.status,
        paymentStatus: booking.payment_status,
        host: {
          id: booking.users?.id,
          name: booking.users?.full_name,
          avatar: booking.users?.avatar,
          email: booking.users?.email,
          rating: booking.users?.rating
        },
        participants: participants?.map(p => ({
          id: p.users?.id,
          name: p.users?.full_name,
          avatar: p.users?.avatar,
          email: p.users?.email,
          joinedAt: p.joined_at
        })) || [],
        spotsNeeded: spotsNeeded,
        currentPlayers: currentPlayers
      };
    } catch (error) {
      console.error('❌ [STORAGE] Error fetching booking with participants:', error);
      return null;
    }
  }

  // ✅ NEW: Leave an open game (remove from booking_participants)
  static async leaveOpenGame(bookingId: string, userId: string): Promise<boolean> {
    try {
      console.log(`🚪 [STORAGE] User ${userId} leaving booking ${bookingId}...`);
      const { supabase } = await import('./supabase');
      
      // Remove participant
      const { error: deleteError } = await supabase
        .from('booking_participants')
        .delete()
        .eq('booking_id', bookingId)
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error('❌ [STORAGE] Error removing participant:', deleteError);
        return false;
      }
      
      // Get booking details
      const { data: booking } = await supabase
        .from('bookings')
        .select('player_count')
        .eq('id', bookingId)
        .single();
      
      if (booking) {
        // Increase player_count (one more spot available)
        const newPlayerCount = (booking.player_count || 0) + 1;
        await supabase
          .from('bookings')
          .update({ player_count: newPlayerCount })
          .eq('id', bookingId);
        
        console.log(`✅ [STORAGE] User left game! Spots now available: ${newPlayerCount}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ [STORAGE] Error leaving game:', error);
      return false;
    }
  }
}

export { BookingStorageService };
export type { BookingRequest, BookingWithNotification };

