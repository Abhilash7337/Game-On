import {
  buttonStyles,
  joinGameStyles,
  layoutStyles
} from '@/styles/screens/JoinGameScreen';
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
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JoinGameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const bookingId = params.bookingId as string;

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isAlreadyJoined, setIsAlreadyJoined] = useState(false);

  useEffect(() => {
    loadBookingDetails();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { supabase } = await import('@/src/common/services/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      const { BookingStorageService } = await import('@/src/common/services/bookingStorage');
      const details = await BookingStorageService.getBookingWithParticipants(bookingId);

      if (details) {
        setBookingDetails(details);

        // Check if current user is already a participant
        const { supabase } = await import('@/src/common/services/supabase');
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const isJoined = details.participants.some((p: any) => p.id === user.id) || details.host.id === user.id;
          setIsAlreadyJoined(isJoined);
        }
      } else {
        Alert.alert('Error', 'Booking not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading booking details:', error);
      Alert.alert('Error', 'Failed to load booking details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!currentUserId) {
      Alert.alert(
        'Authentication Required',
        'Please sign in to join a game.',
        [
          {
            text: 'Sign In',
            onPress: () => router.push('/login')
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    if (isAlreadyJoined) {
      Alert.alert('Already Joined', 'You are already part of this game.');
      return;
    }

    // Check if booking is still available
    if (bookingDetails.spotsNeeded <= 0) {
      Alert.alert('Game Full', 'This game is now full. Please try another game.');
      await loadBookingDetails(); // Refresh data
      return;
    }

    Alert.alert(
      'Join Game',
      `Join this ${bookingDetails.skillLevel || ''} game at ${bookingDetails.venueName}?\n\nYour share: ₹${Math.round(bookingDetails.totalAmount / (bookingDetails.currentPlayers + bookingDetails.spotsNeeded))}`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Join',
          onPress: async () => {
            try {
              setJoining(true);
              const { BookingStorageService } = await import('@/src/common/services/bookingStorage');
              
              console.log('🎮 [JOIN GAME] Attempting to join booking:', bookingId);
              console.log('📊 [JOIN GAME] Current state:', {
                currentPlayers: bookingDetails.currentPlayers,
                spotsNeeded: bookingDetails.spotsNeeded,
                totalPlayers: bookingDetails.currentPlayers + bookingDetails.spotsNeeded
              });
              
              const success = await BookingStorageService.joinOpenGame(bookingId, currentUserId);

              if (success) {
                console.log('✅ [JOIN GAME] Successfully joined!');
                
                // Reload booking details to get updated counts
                await loadBookingDetails();
                
                Alert.alert(
                  'Joined Successfully!',
                  'You have joined this game. See you on the court!',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.push('/(tabs)')
                    }
                  ]
                );
              } else {
                console.error('❌ [JOIN GAME] Failed to join');
                Alert.alert('Error', 'Failed to join game. The game might be full or no longer available.');
                await loadBookingDetails(); // Refresh data
              }
            } catch (error) {
              console.error('❌ [JOIN GAME] Error joining game:', error);
              Alert.alert('Error', 'Failed to join game. Please try again.');
            } finally {
              setJoining(false);
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const joinTime = new Date(timestamp);
    const diffMs = now.getTime() - joinTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <View style={[layoutStyles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />

        {/* Header */}
        <View style={[{
          backgroundColor: '#FFFFFF',
          paddingTop: insets.top + 20,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
          flexDirection: 'row',
          alignItems: 'center',
        }]}>
          <TouchableOpacity onPress={() => router.back()} style={joinGameStyles.headerBackButton}>
            <Ionicons name="arrow-back-outline" size={24} color="#000" />
          </TouchableOpacity>
          <View style={joinGameStyles.headerTextContainer}>
            <Text style={joinGameStyles.headerTitle}>Join Game</Text>
            <Text style={joinGameStyles.headerSubtitle}>Loading details...</Text>
          </View>
        </View>

        <View style={joinGameStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={joinGameStyles.loadingText}>Loading game details...</Text>
        </View>
      </View>
    );
  }

  if (!bookingDetails) {
    return (
      <View style={[layoutStyles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" />

        <View style={joinGameStyles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textSecondary} />
          <Text style={joinGameStyles.errorText}>Game not found</Text>
        </View>
      </View>
    );
  }

  const spotsAvailable = bookingDetails.spotsNeeded > 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      <View style={[layoutStyles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[{
          backgroundColor: '#FFFFFF',
          paddingTop: insets.top + 20,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
          flexDirection: 'row',
          alignItems: 'center',
        }]}>
          <TouchableOpacity onPress={() => router.back()} style={joinGameStyles.headerBackButton}>
            <Ionicons name="arrow-back-outline" size={24} color="#000" />
          </TouchableOpacity>
          <View style={joinGameStyles.headerTextContainer}>
            <Text style={joinGameStyles.headerTitle}>Join Open Game</Text>
            <Text style={joinGameStyles.headerSubtitle}>
              {bookingDetails.skillLevel || 'All Levels'} • {formatDate(bookingDetails.date)}
            </Text>
          </View>
        </View>

        <ScrollView style={layoutStyles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Spots Available Indicator */}
          {spotsAvailable && (
            <View style={joinGameStyles.spotsIndicator}>
              <Text style={joinGameStyles.spotsText}>
                {bookingDetails.spotsNeeded} {bookingDetails.spotsNeeded === 1 ? 'spot' : 'spots'} available
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="people" size={20} color={colors.primary} />
                <Text style={joinGameStyles.spotsCount}> {bookingDetails.currentPlayers}/{bookingDetails.currentPlayers + bookingDetails.spotsNeeded}</Text>
              </View>
            </View>
          )}

          {/* Venue Information */}
          <View style={joinGameStyles.venueInfoCard}>
            <View style={joinGameStyles.venueRow}>
              <View style={joinGameStyles.venueIconContainer}>
                <Ionicons name="location" size={24} color={colors.primary} />
              </View>
              <View style={joinGameStyles.venueTextContainer}>
                <Text style={joinGameStyles.venueName}>{bookingDetails.venueName}</Text>
                <Text style={joinGameStyles.venueAddress}>{bookingDetails.venueAddress}</Text>
              </View>
            </View>

            {/* Booking Details */}
            <View style={joinGameStyles.detailsRow}>
              <View style={joinGameStyles.detailsIcon}>
                <Ionicons name="tennisball" size={18} color={colors.textSecondary} />
              </View>
              <Text style={joinGameStyles.detailsText}>{bookingDetails.courtName} • {bookingDetails.courtType || 'Standard Court'}</Text>
            </View>

            <View style={joinGameStyles.detailsRow}>
              <View style={joinGameStyles.detailsIcon}>
                <Ionicons name="calendar" size={18} color={colors.textSecondary} />
              </View>
              <Text style={joinGameStyles.detailsText}>{formatDate(bookingDetails.date)} • {bookingDetails.startTime}</Text>
            </View>

            <View style={joinGameStyles.detailsRow}>
              <View style={joinGameStyles.detailsIcon}>
                <Ionicons name="time" size={18} color={colors.textSecondary} />
              </View>
              <Text style={joinGameStyles.detailsText}>{bookingDetails.duration}</Text>
            </View>

            {bookingDetails.skillLevel && (
              <View style={joinGameStyles.detailsRow}>
                <View style={joinGameStyles.detailsIcon}>
                  <Ionicons name="trophy" size={18} color={colors.textSecondary} />
                </View>
                <Text style={joinGameStyles.detailsText}>{bookingDetails.skillLevel}</Text>
              </View>
            )}
          </View>

          {/* Host Information */}
          <Text style={joinGameStyles.sectionHeader}>Hosted By</Text>
          <View style={joinGameStyles.hostCard}>
            <View style={joinGameStyles.hostRow}>
              <View style={joinGameStyles.hostAvatar}>
                {bookingDetails.host.avatar ? (
                  <Image source={{ uri: bookingDetails.host.avatar }} style={joinGameStyles.hostAvatarImage} />
                ) : (
                  <Text style={joinGameStyles.hostAvatarText}>
                    {getInitials(bookingDetails.host.name)}
                  </Text>
                )}
              </View>
              <View style={joinGameStyles.hostInfo}>
                <Text style={joinGameStyles.hostName}>{bookingDetails.host.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <View style={joinGameStyles.hostBadge}>
                    <Ionicons name="star" size={12} color={colors.primary} />
                    <Text style={joinGameStyles.hostBadgeText}>Host</Text>
                  </View>
                  {bookingDetails.host.rating && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                      <Ionicons name="star" size={14} color="#FFB800" />
                      <Text style={{ marginLeft: 4, fontSize: 14, color: colors.textSecondary, fontWeight: '500' }}>
                        {bookingDetails.host.rating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Participants */}
          {bookingDetails.participants && bookingDetails.participants.length > 0 && (
            <>
              <Text style={joinGameStyles.sectionHeader}>
                Players ({bookingDetails.participants.length})
              </Text>
              <View style={joinGameStyles.participantsCard}>
                {bookingDetails.participants.map((participant: any, index: number) => (
                  <View
                    key={participant.id}
                    style={[
                      joinGameStyles.participantRow,
                      index === bookingDetails.participants.length - 1 && joinGameStyles.participantRowLast
                    ]}
                  >
                    <View style={joinGameStyles.participantAvatar}>
                      {participant.avatar ? (
                        <Image source={{ uri: participant.avatar }} style={joinGameStyles.participantAvatarImage} />
                      ) : (
                        <Text style={joinGameStyles.participantAvatarText}>
                          {getInitials(participant.name)}
                        </Text>
                      )}
                    </View>
                    <Text style={joinGameStyles.participantName}>{participant.name}</Text>
                    <Text style={joinGameStyles.participantTime}>{getTimeAgo(participant.joinedAt)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Booking Summary */}
          <Text style={joinGameStyles.sectionHeader}>Payment</Text>
          <View style={joinGameStyles.summaryCard}>
            <View style={joinGameStyles.summaryRow}>
              <Text style={joinGameStyles.summaryLabel}>Court Fee</Text>
              <Text style={joinGameStyles.summaryValue}>₹{bookingDetails.totalAmount}</Text>
            </View>
            <View style={joinGameStyles.summaryRow}>
              <Text style={joinGameStyles.summaryLabel}>Split Among</Text>
              <Text style={joinGameStyles.summaryValue}>{bookingDetails.currentPlayers + bookingDetails.spotsNeeded} players</Text>
            </View>
            <View style={joinGameStyles.summaryDivider} />
            <View style={joinGameStyles.summaryRow}>
              <Text style={joinGameStyles.summaryTotal}>Your Share</Text>
              <Text style={joinGameStyles.summaryTotalValue}>
                ₹{Math.round(bookingDetails.totalAmount / (bookingDetails.currentPlayers + bookingDetails.spotsNeeded))}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Join Button */}
        <View style={[layoutStyles.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom || 20 }]}>
          <TouchableOpacity
            style={[
              buttonStyles.primary,
              {
                backgroundColor: (spotsAvailable && !isAlreadyJoined && !joining) ? colors.primary : colors.gray300
              }
            ]}
            onPress={handleJoinGame}
            disabled={!spotsAvailable || isAlreadyJoined || joining}
          >
            {joining ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[buttonStyles.primaryText, { color: colors.background }]}>
                {isAlreadyJoined ? 'Already Joined' : !spotsAvailable ? 'Game Full' : `Join Game - ₹${Math.round(bookingDetails.totalAmount / (bookingDetails.currentPlayers + bookingDetails.spotsNeeded))}`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
