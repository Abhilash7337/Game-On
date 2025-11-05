import { BookingWithNotification } from '@/src/common/services/bookingStorage';
import { bookingRequestsStyles } from '@/styles/screens/BookingRequestsScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const styles = bookingRequestsStyles;

export default function ClientBookingRequestsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [pendingBookings, setPendingBookings] = useState<BookingWithNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadPendingBookings();
    }, []);

    const loadPendingBookings = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        
        try {
            console.log('🔍 [BOOKING REQUESTS] Loading pending bookings...');
            
            // Get the actual authenticated client ID from Supabase
            const { supabase } = await import('@/src/common/services/supabase');
            const { ClientAuthService } = await import('@/src/client/services/clientAuth');
            const { BookingStorageService } = await import('@/src/common/services/bookingStorage');
            
            // Try ClientAuthService first, fallback to Supabase auth
            let clientId = null;
            const client = await ClientAuthService.getCurrentClient();
            
            if (client?.id) {
                clientId = client.id;
            } else {
                // Fallback to getting user from Supabase auth directly
                const { data: { user } } = await supabase.auth.getUser();
                clientId = user?.id || null;
            }
            
            console.log('👤 [BOOKING REQUESTS] Current client ID:', clientId);
            
            if (clientId) {
                const bookings = await BookingStorageService.getPendingBookings(clientId);
                console.log('📋 [BOOKING REQUESTS] Found pending bookings:', bookings.length);
                console.log('📋 [BOOKING REQUESTS] Bookings:', JSON.stringify(bookings.map(b => ({
                    id: b.id,
                    venue: b.venue,
                    ownerId: b.ownerId,
                    bookingStatus: (b as any).bookingStatus,
                })), null, 2));
                
                setPendingBookings(bookings);
            } else {
                console.log('⚠️ [BOOKING REQUESTS] No client ID found');
            }
        } catch (error) {
            console.error('❌ [BOOKING REQUESTS] Error loading pending bookings:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleApproveBooking = async (booking: BookingWithNotification) => {
        Alert.alert(
            'Approve Booking',
            `Approve booking for ${booking.venue} on ${booking.date.toLocaleDateString()} at ${booking.time}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    style: 'default',
                    onPress: async () => {
                        try {
                            const { BookingStorageService } = await import('@/src/common/services/bookingStorage');
                            const { ClientNotificationService } = await import('@/src/client/services/clientNotificationService');
                            const { GameChatroomService } = await import('@/src/common/services/gameChatroomService');
                            
                            // Update booking status to confirmed
                            await BookingStorageService.updateBookingStatus(booking.id, 'confirmed');
                            
                            // Create game chatroom automatically (with null checks)
                            if (booking.venue && booking.court) {
                                const chatroom = await GameChatroomService.createChatroom(
                                    booking.id,
                                    booking.venue,
                                    booking.court,
                                    booking.date,
                                    booking.time,
                                    booking.duration,
                                    booking.userId
                                );
                                
                                console.log('✅ Game chatroom created:', chatroom.id);
                            } else {
                                console.warn('⚠️ Cannot create chatroom: missing venue or court info');
                            }
                            
                            // Send confirmation notification
                            await ClientNotificationService.sendConfirmationNotification(booking.userId, booking);
                            
                            Alert.alert(
                                'Success', 
                                'Booking approved! A game chatroom has been created for the players.'
                            );
                            loadPendingBookings();
                        } catch (error) {
                            console.error('❌ Error approving booking:', error);
                            Alert.alert('Error', 'Failed to approve booking');
                        }
                    }
                }
            ]
        );
    };

    const handleRejectBooking = async (booking: BookingWithNotification) => {
        Alert.prompt(
            'Reject Booking',
            'Please provide a reason for rejection:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async (reason?: string) => {
                        if (!reason?.trim()) {
                            Alert.alert('Error', 'Please provide a reason for rejection');
                            return;
                        }
                        
                        try {
                            const { BookingStorageService } = await import('@/src/common/services/bookingStorage');
                            const { ClientNotificationService } = await import('@/src/client/services/clientNotificationService');
                            
                            await BookingStorageService.updateBookingStatus(booking.id, 'rejected');
                            await ClientNotificationService.sendRejectionNotification(booking.userId, booking, reason);
                            
                            Alert.alert('Success', 'Booking rejected');
                            loadPendingBookings();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to reject booking');
                        }
                    }
                }
            ],
            'plain-text',
            '',
            'default'
        );
    };

    const renderBookingItem = ({ item }: { item: BookingWithNotification }) => (
        <View style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
                <View style={styles.bookingInfo}>
                    <Text style={styles.venueName}>{item.venue}</Text>
                    <Text style={styles.courtName}>{item.court}</Text>
                </View>
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>PENDING</Text>
                </View>
            </View>
            
            <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>
                        {item.date.toLocaleDateString()} at {item.time}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{item.duration}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="people" size={16} color="#6B7280" />
                    <Text style={styles.detailText}>{item.bookingType}</Text>
                </View>
                {item.skillLevel && (
                    <View style={styles.detailRow}>
                        <Ionicons name="trophy" size={16} color="#6B7280" />
                        <Text style={styles.detailText}>{item.skillLevel}</Text>
                    </View>
                )}
            </View>
            
            <View style={styles.priceRow}>
                <Text style={styles.priceText}>₹{item.price}</Text>
                <Text style={styles.priceLabel}>Total Amount</Text>
            </View>
            
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleRejectBooking(item)}
                >
                    <Ionicons name="close" size={16} color="#EF4444" />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleApproveBooking(item)}
                >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.approveButtonText}>Approve</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" />
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* White Elevated Header */}
            <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 }}>
                    <TouchableOpacity 
                        onPress={() => router.back()}
                        style={{ marginRight: 16 }}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Booking Requests</Text>
                        <Text style={styles.headerSubtitle}>{pendingBookings.length} pending requests</Text>
                    </View>
                </View>
            </View>

            <FlatList
                data={pendingBookings}
                keyExtractor={(item) => item.id}
                renderItem={renderBookingItem}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => loadPendingBookings(true)}
                        colors={['#047857']}
                        tintColor="#047857"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
                        <Text style={styles.emptyTitle}>No Pending Requests</Text>
                        <Text style={styles.emptyText}>
                            New booking requests will appear here for your approval.
                        </Text>
                    </View>
                }
            />
        </View>
    );
}