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
// Import services at top level to prevent rebundling
import { supabase } from '@/src/common/services/supabase';
import { BookingStorageService } from '@/src/common/services/bookingStorage';
import { JoinRequestService } from '@/src/common/services/joinRequestService';
import { ChatService } from '@/src/common/services/chatService';

export default function JoinGameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const bookingId = params.bookingId as string;

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isAlreadyJoined, setIsAlreadyJoined] = useState(false);
  const [joinRequestStatus, setJoinRequestStatus] = useState<any>(null);
  const [openingChat, setOpeningChat] = useState(false);

  useEffect(() => {
    loadBookingDetails();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
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
      const details = await BookingStorageService.getBookingWithParticipants(bookingId);

      if (details) {
        setBookingDetails(details);

        // Check if current user is already a participant
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const isJoined = details.participants.some((p: any) => p.id === user.id) || details.host.id === user.id;
          setIsAlreadyJoined(isJoined);

          // Check join request status
          const requestStatus = await JoinRequestService.getMyRequestStatus(bookingId);
          setJoinRequestStatus(requestStatus);
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

  const handleSendJoinRequest = async () => {
    if (!currentUserId) {
      Alert.alert(
        'Authentication Required',
        'Please sign in to send a join request.',
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

    if (joinRequestStatus?.status === 'pending') {
      Alert.alert('Request Pending', 'Your join request is awaiting approval from the host.');
      return;
    }

    if (joinRequestStatus?.status === 'rejected') {
      Alert.alert('Request Rejected', 'Your previous request was declined by the host.');
      return;
    }

    // Check if booking is still available
    if (bookingDetails.spotsNeeded <= 0) {
      Alert.alert('Game Full', 'This game is now full. Please try another game.');
      await loadBookingDetails(); // Refresh data
      return;
    }

    try {
      setSending(true);
      
      console.log('📤 [JOIN REQUEST] Sending join request for booking:', bookingId);
      
      const result = await JoinRequestService.sendJoinRequest(bookingId, bookingDetails.host.id);

      if (result.success) {
        console.log('✅ [JOIN REQUEST] Request sent successfully');
        await loadBookingDetails(); // Refresh to update status
        Alert.alert(
          'Request Sent!',
          'Your join request has been sent to the host. You can message them to discuss details.',
          [{ text: 'OK' }]
        );
      } else {
        console.error('❌ [JOIN REQUEST] Failed:', result.error);
        Alert.alert('Error', result.error || 'Failed to send join request');
      }
    } catch (error) {
      console.error('❌ [JOIN REQUEST] Error:', error);
      Alert.alert('Error', 'Failed to send join request. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleChatWithHost = async () => {
    if (openingChat) return; // Prevent double-click
    
    if (!currentUserId) {
      Alert.alert('Authentication Required', 'Please sign in to chat.');
      return;
    }

    setOpeningChat(true);
    try {
      
      // Get or create conversation with host
      const conversationResult = await ChatService.getOrCreateDirectConversation(bookingDetails.host.id);
      
      if (conversationResult.success && conversationResult.conversation) {
        // Navigate to chat screen
        router.push({
          pathname: '/FriendChatScreen',
          params: {
            friendId: bookingDetails.host.id,
            friendName: bookingDetails.host.name,
            friendAvatar: bookingDetails.host.avatar || '',
          }
        });
        
        // Reset state after navigation (in case user comes back)
        setTimeout(() => {
          setOpeningChat(false);
        }, 500);
      } else {
        Alert.alert('Error', 'Failed to open chat');
        setOpeningChat(false);
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      Alert.alert('Error', 'Failed to open chat');
      setOpeningChat(false);
    }
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

        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: 20, paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
        >
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
                  {(bookingDetails.host.rating != null && typeof bookingDetails.host.rating === 'number' && bookingDetails.host.rating > 0) ? (
                    <>
                      <Ionicons name="star" size={14} color="#FFB800" style={{ marginLeft: 8 }} />
                      <Text style={{ marginLeft: 4, fontSize: 14, color: colors.textSecondary, fontWeight: '500' }}>
                        {bookingDetails.host.rating.toFixed(1)}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>
              {/* Chat Icon */}
              <TouchableOpacity 
                style={[joinGameStyles.chatIconButton, openingChat && { opacity: 0.5 }]}
                onPress={handleChatWithHost}
                disabled={openingChat}
                activeOpacity={0.7}
              >
                {openingChat ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="chatbubble" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
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

        {/* Send Join Request Button */}
        <View style={[layoutStyles.footer, { backgroundColor: colors.background, paddingBottom: insets.bottom || 20 }]}>
          <TouchableOpacity
            style={[
              buttonStyles.primary,
              {
                backgroundColor: (spotsAvailable && !isAlreadyJoined && !joinRequestStatus && !sending) 
                  ? colors.primary 
                  : colors.gray300
              }
            ]}
            onPress={handleSendJoinRequest}
            disabled={!spotsAvailable || isAlreadyJoined || sending || !!joinRequestStatus}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={[buttonStyles.primaryText, { color: colors.background }]}>
                {isAlreadyJoined 
                  ? 'Already Joined' 
                  : !spotsAvailable 
                  ? 'Game Full' 
                  : joinRequestStatus?.status === 'pending'
                  ? 'Request Pending'
                  : joinRequestStatus?.status === 'rejected'
                  ? 'Request Declined'
                  : 'Send Join Request'
                }
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
