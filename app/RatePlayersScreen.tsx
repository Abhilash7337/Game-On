import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  currentRating?: number;
  myRating?: number;
}

interface VenueInfo {
  id: string;
  name: string;
  currentRating?: number;
  myRating?: number;
}

export default function RatePlayersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const conversationId = params.conversationId as string;
  const bookingId = params.bookingId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [venue, setVenue] = useState<VenueInfo | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Rating states
  const [userRatings, setUserRatings] = useState<{[key: string]: number}>({});
  const [venueRating, setVenueRating] = useState<number>(0);
  const [venueReview, setVenueReview] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { supabase } = await import('@/src/common/services/supabase');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Get booking with participants and venue
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          venues!inner(id, name, rating),
          users!bookings_user_id_fkey(id, full_name, avatar, rating)
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Get all participants from conversation
      const { data: conversationParticipants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          users!conversation_participants_user_id_fkey(id, full_name, avatar, rating)
        `)
        .eq('conversation_id', conversationId)
        .eq('is_active', true);

      if (participantsError) throw participantsError;

      // Build participants list
      const participantsList: Participant[] = conversationParticipants
        ?.filter((p: any) => p.user_id !== user?.id) // Exclude current user
        .map((p: any) => ({
          id: p.users.id,
          name: p.users.full_name,
          avatar: p.users.avatar,
          isHost: p.user_id === booking.user_id,
          currentRating: p.users.rating || 0
        })) || [];

      setParticipants(participantsList);

      // Set venue info
      if (booking.venues) {
        setVenue({
          id: booking.venues.id,
          name: booking.venues.name,
          currentRating: booking.venues.rating || 0
        });
      }

      // Load existing ratings
      await loadExistingRatings(user?.id || '', participantsList.map(p => p.id), booking.venues?.id);

    } catch (error) {
      console.error('Error loading rating data:', error);
      Alert.alert('Error', 'Failed to load participants');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadExistingRatings = async (userId: string, participantIds: string[], venueId: string) => {
    try {
      const { supabase } = await import('@/src/common/services/supabase');

      // Check if user already rated these players
      const { data: existingUserRatings } = await supabase
        .from('user_ratings')
        .select('rated_user_id, rating')
        .eq('rater_user_id', userId)
        .in('rated_user_id', participantIds);

      if (existingUserRatings) {
        const ratingsMap: {[key: string]: number} = {};
        existingUserRatings.forEach(r => {
          ratingsMap[r.rated_user_id] = r.rating;
        });
        setUserRatings(ratingsMap);
      }

      // Check if user already rated this venue
      const { data: existingVenueRating } = await supabase
        .from('reviews')
        .select('rating, comment')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .single();

      if (existingVenueRating) {
        setVenueRating(existingVenueRating.rating);
        setVenueReview(existingVenueRating.comment || '');
      }

    } catch (error) {
      console.log('No existing ratings found');
    }
  };

  const handleSubmitRatings = async () => {
    try {
      setSubmitting(true);
      const { supabase } = await import('@/src/common/services/supabase');

      console.log('📊 [RATINGS] Submitting ratings...');

      // Submit user ratings
      for (const participantId of Object.keys(userRatings)) {
        const rating = userRatings[participantId];
        if (rating > 0) {
          // Check if rating exists
          const { data: existing } = await supabase
            .from('user_ratings')
            .select('id')
            .eq('rater_user_id', currentUserId)
            .eq('rated_user_id', participantId)
            .single();

          if (existing) {
            // Update existing rating
            await supabase
              .from('user_ratings')
              .update({ rating, updated_at: new Date().toISOString() })
              .eq('id', existing.id);
          } else {
            // Insert new rating
            await supabase
              .from('user_ratings')
              .insert([{
                rater_user_id: currentUserId,
                rated_user_id: participantId,
                rating,
                created_at: new Date().toISOString()
              }]);
          }

          // Recalculate average rating for the user
          await recalculateUserRating(participantId);
        }
      }

      // Submit venue rating
      if (venueRating > 0 && venue) {
        const { data: existingReview } = await supabase
          .from('reviews')
          .select('id')
          .eq('user_id', currentUserId)
          .eq('venue_id', venue.id)
          .single();

        if (existingReview) {
          // Update existing review
          await supabase
            .from('reviews')
            .update({ 
              rating: venueRating, 
              comment: venueReview,
              created_at: new Date().toISOString() 
            })
            .eq('id', existingReview.id);
        } else {
          // Insert new review
          await supabase
            .from('reviews')
            .insert([{
              user_id: currentUserId,
              venue_id: venue.id,
              rating: venueRating,
              comment: venueReview,
              created_at: new Date().toISOString()
            }]);
        }

        // Recalculate average rating for the venue
        await recalculateVenueRating(venue.id);
      }

      console.log('✅ [RATINGS] All ratings submitted successfully');
      
      Alert.alert(
        'Ratings Submitted!',
        'Thank you for your feedback. Ratings have been updated.',
        [
          { 
            text: 'OK', 
            onPress: () => router.back() 
          }
        ]
      );

    } catch (error) {
      console.error('❌ [RATINGS] Error submitting ratings:', error);
      Alert.alert('Error', 'Failed to submit ratings. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const recalculateUserRating = async (userId: string) => {
    try {
      const { supabase } = await import('@/src/common/services/supabase');
      
      // Get all ratings for this user
      const { data: ratings } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('rated_user_id', userId);

      if (ratings && ratings.length > 0) {
        const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        
        // Update user's rating
        await supabase
          .from('users')
          .update({ rating: avgRating })
          .eq('id', userId);
        
        console.log(`✅ [RATINGS] Updated user ${userId} rating to ${avgRating.toFixed(1)}`);
      }
    } catch (error) {
      console.error('Error recalculating user rating:', error);
    }
  };

  const recalculateVenueRating = async (venueId: string) => {
    try {
      const { supabase } = await import('@/src/common/services/supabase');
      
      // Get all reviews for this venue
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('venue_id', venueId);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        // Update venue's rating
        await supabase
          .from('venues')
          .update({ rating: avgRating })
          .eq('id', venueId);
        
        console.log(`✅ [RATINGS] Updated venue ${venueId} rating to ${avgRating.toFixed(1)}`);
      }
    } catch (error) {
      console.error('Error recalculating venue rating:', error);
    }
  };

  const renderStars = (rating: number, onPress?: (star: number) => void) => {
    return (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress?.(star)}
            disabled={!onPress}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? '#FFB800' : colors.gray300}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />

        <View style={{
          backgroundColor: '#FFFFFF',
          paddingTop: insets.top + 20,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back-outline" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: '600', color: '#000' }}>Rate Players</Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading...</Text>
        </View>
      </View>
    );
  }

  const hasRatings = Object.values(userRatings).some(r => r > 0) || venueRating > 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{
          backgroundColor: '#FFFFFF',
          paddingTop: insets.top + 20,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back-outline" size={24} color="#000" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#000' }}>Rate Experience</Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>
              Rate players and venue
            </Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Venue Rating */}
          {venue && (
            <View style={{ 
              backgroundColor: '#FFFFFF', 
              marginTop: 16, 
              marginHorizontal: 16, 
              borderRadius: 12,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.primary + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <Ionicons name="business" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>
                    {venue.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Ionicons name="star" size={14} color="#FFB800" />
                    <Text style={{ marginLeft: 4, fontSize: 14, color: colors.textSecondary }}>
                      {venue.currentRating?.toFixed(1) || 'Not rated'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 12 }}>
                How was the venue?
              </Text>
              {renderStars(venueRating, (star) => setVenueRating(star))}

              <TextInput
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.gray200,
                  borderRadius: 8,
                  fontSize: 14,
                  color: colors.textPrimary,
                  minHeight: 80,
                  textAlignVertical: 'top'
                }}
                placeholder="Share your experience (optional)"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                value={venueReview}
                onChangeText={setVenueReview}
              />
            </View>
          )}

          {/* Players Rating */}
          {participants.length > 0 && (
            <View style={{ marginTop: 16, marginHorizontal: 16 }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600', 
                color: colors.textPrimary,
                marginBottom: 12
              }}>
                Rate Players ({participants.length})
              </Text>

              {participants.map((participant, index) => (
                <View
                  key={participant.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: colors.primary + '20',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12
                    }}>
                      {participant.avatar ? (
                        <Image 
                          source={{ uri: participant.avatar }} 
                          style={{ width: 48, height: 48, borderRadius: 24 }}
                        />
                      ) : (
                        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.primary }}>
                          {getInitials(participant.name)}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
                          {participant.name}
                        </Text>
                        {participant.isHost && (
                          <View style={{
                            marginLeft: 8,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            backgroundColor: colors.primary + '20',
                            borderRadius: 4
                          }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>
                              Host
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Ionicons name="star" size={14} color="#FFB800" />
                        <Text style={{ marginLeft: 4, fontSize: 14, color: colors.textSecondary }}>
                          {participant.currentRating?.toFixed(1) || 'Not rated'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {renderStars(userRatings[participant.id] || 0, (star) => {
                    setUserRatings(prev => ({ ...prev, [participant.id]: star }));
                  })}
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Submit Button */}
        <View style={{
          backgroundColor: '#FFFFFF',
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: insets.bottom || 20,
          borderTopWidth: 1,
          borderTopColor: colors.gray200
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: hasRatings ? colors.primary : colors.gray300,
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              opacity: submitting ? 0.6 : 1
            }}
            onPress={handleSubmitRatings}
            disabled={!hasRatings || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
                Submit Ratings
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
