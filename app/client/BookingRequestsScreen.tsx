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
        // ✅ REMOVE CONFIRMATION - Approve immediately
        try {
            const { BookingStorageService } = await import('@/src/common/services/bookingStorage');
            
            console.log('✅ [BOOKING REQUESTS] Approving booking:', booking.id);
            
            // Update booking status to confirmed
            // ✅ Database trigger auto-creates game chat conversation
            await BookingStorageService.updateBookingStatus(booking.id, 'confirmed');
            
            console.log('✅ [BOOKING REQUESTS] Booking approved successfully');
            Alert.alert('Success', 'Booking approved! A game chat has been created.');
            loadPendingBookings();
        } catch (error) {
            console.error('❌ [BOOKING REQUESTS] Error approving booking:', error);
            Alert.alert('Error', 'Failed to approve booking');
        }
    };

    const handleRejectBooking = async (booking: BookingWithNotification) => {
        // ✅ REMOVE CONFIRMATION - Reject immediately
        try {
            const { BookingStorageService } = await import('@/src/common/services/bookingStorage');
            
            console.log('🚫 [BOOKING REQUESTS] Rejecting booking:', booking.id);
            await BookingStorageService.updateBookingStatus(booking.id, 'cancelled'); // ✅ Use 'cancelled' not 'rejected'
            console.log('✅ [BOOKING REQUESTS] Booking rejected');
            
            Alert.alert('Success', 'Booking rejected');
            loadPendingBookings();
        } catch (error) {
            console.error('❌ [BOOKING REQUESTS] Error rejecting booking:', error);
            Alert.alert('Error', 'Failed to reject booking');
        }
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