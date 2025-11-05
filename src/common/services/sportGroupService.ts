import { supabase } from './supabase';

/**
 * Sport Group Interface
 */
export interface SportGroup {
  id: string;
  sport: string;
  city: string | null; // null for global groups
  conversationId: string;
  memberCount: number;
  isGlobal: boolean;
  displayName: string; // e.g., "Global - Football" or "Hyderabad - Football"
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Sport Group Service Class
 * Handles global and city-wide sport group chats
 */
class SportGroupServiceClass {
  /**
   * Get all global sport groups (visible to everyone)
   */
  async getGlobalSportGroups(): Promise<SportGroup[]> {
    try {
      const { data, error } = await supabase
        .from('sport_chat_groups')
        .select('*')
        .is('city', null)
        .order('sport', { ascending: true });

      if (error) throw error;

      return (data || []).map(group => this.transformSportGroup(group));
    } catch (error) {
      console.error('❌ Error fetching global sport groups:', error);
      return [];
    }
  }

  /**
   * Get city-specific sport groups
   * @param city - User's current city
   */
  async getCitySportGroups(city: string): Promise<SportGroup[]> {
    try {
      const { data, error } = await supabase
        .from('sport_chat_groups')
        .select('*')
        .eq('city', city)
        .order('sport', { ascending: true });

      if (error) throw error;

      return (data || []).map(group => this.transformSportGroup(group));
    } catch (error) {
      console.error(`❌ Error fetching ${city} sport groups:`, error);
      return [];
    }
  }

  /**
   * Get or create a city sport group
   * If a user in a new city opens the app, create groups for that city
   */
  async getOrCreateCitySportGroup(sport: string, city: string): Promise<SportGroup | null> {
    try {
      const { data, error } = await supabase.rpc('get_or_create_city_sport_group', {
        p_sport: sport,
        p_city: city
      });

      if (error) throw error;

      // Fetch the full group data
      const { data: groupData, error: fetchError } = await supabase
        .from('sport_chat_groups')
        .select('*')
        .eq('id', data)
        .single();

      if (fetchError) throw fetchError;

      return this.transformSportGroup(groupData);
    } catch (error) {
      console.error(`❌ Error getting/creating city sport group:`, error);
      return null;
    }
  }

  /**
   * Join a sport group (global or city-specific)
   */
  async joinSportGroup(userId: string, sport: string, city?: string): Promise<{
    success: boolean;
    conversationId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('join_sport_group', {
        p_user_id: userId,
        p_sport: sport,
        p_city: city || null
      });

      if (error) throw error;

      console.log(`✅ Joined ${city ? city : 'Global'} - ${sport}`);
      return {
        success: data.success,
        conversationId: data.conversation_id,
        error: data.error
      };
    } catch (error) {
      console.error('❌ Error joining sport group:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Leave a sport group
   */
  async leaveSportGroup(userId: string, conversationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;

      console.log(`✅ Left sport group (conversation: ${conversationId})`);
      return true;
    } catch (error) {
      console.error('❌ Error leaving sport group:', error);
      return false;
    }
  }

  /**
   * Check if user is member of a sport group
   */
  async isGroupMember(userId: string, conversationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      return !error && data !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's joined sport groups
   */
  async getUserSportGroups(userId: string): Promise<SportGroup[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner (
            id,
            type,
            name,
            metadata
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('conversations.type', 'sport_group');

      if (error) throw error;

      // Get full sport group data
      const conversationIds = (data || []).map((item: any) => item.conversation_id);
      
      const { data: sportGroups, error: groupError } = await supabase
        .from('sport_chat_groups')
        .select('*')
        .in('conversation_id', conversationIds);

      if (groupError) throw groupError;

      return (sportGroups || []).map(group => this.transformSportGroup(group));
    } catch (error) {
      console.error('❌ Error fetching user sport groups:', error);
      return [];
    }
  }

  /**
   * Create default city sport groups for a new city
   * Called when user with new city location opens the app
   */
  async initializeCitySportGroups(city: string): Promise<void> {
    const defaultSports = ['Football', 'Badminton', 'Table Tennis', 'Tennis', 'Basketball', 'Cricket', 'Volleyball'];
    
    try {
      for (const sport of defaultSports) {
        await this.getOrCreateCitySportGroup(sport, city);
      }
      console.log(`✅ Initialized sport groups for ${city}`);
    } catch (error) {
      console.error(`❌ Error initializing city sport groups for ${city}:`, error);
    }
  }

  /**
   * Transform database row to SportGroup interface
   */
  private transformSportGroup(group: any): SportGroup {
    return {
      id: group.id,
      sport: group.sport,
      city: group.city,
      conversationId: group.conversation_id,
      memberCount: group.member_count || 0,
      isGlobal: group.city === null,
      displayName: group.city ? `${group.city} - ${group.sport}` : `Global - ${group.sport}`,
      createdAt: new Date(group.created_at),
      updatedAt: new Date(group.updated_at)
    };
  }
}

// Export singleton instance
export const SportGroupService = new SportGroupServiceClass();
