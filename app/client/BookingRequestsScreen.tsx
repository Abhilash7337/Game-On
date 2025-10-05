import AppHeader from '@/src/common/components/AppHeader';
import { BookingWithNotification } from '@/src/common/services/bookingStorage';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
            const { ClientSessionManager } = await import('@/src/client/services/clientSession');
            const { BookingStorageService } = await import('@/src/common/services/bookingStorage');
            
            const clientId = ClientSessionManager.getCurrentClientId();
            if (clientId) {
                const bookings = await BookingStorageService.getPendingBookings(clientId);
                setPendingBookings(bookings);
            }
        } catch (error) {
            console.error('Error loading pending bookings:', error);
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
                            
                            await BookingStorageService.updateBookingStatus(booking.id, 'confirmed');
                            await ClientNotificationService.sendConfirmationNotification(booking.userId, booking);
                            
                            Alert.alert('Success', 'Booking approved successfully!');
                            loadPendingBookings();
                        } catch (error) {
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
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <AppHeader 
                    title="Booking Requests"
                    subtitle={`${pendingBookings.length} pending requests`}
                />

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
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    bookingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    bookingInfo: {
        flex: 1,
    },
    venueName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    courtName: {
        fontSize: 14,
        color: '#6B7280',
    },
    statusBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400E',
    },
    bookingDetails: {
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#374151',
        marginLeft: 8,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        marginBottom: 16,
    },
    priceText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#047857',
    },
    priceLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    rejectButton: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    rejectButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
    },
    approveButton: {
        backgroundColor: '#047857',
    },
    approveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
});