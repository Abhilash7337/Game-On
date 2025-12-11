import { NotificationData } from '@/src/client/services/clientNotificationService';
import AppHeader from '@/src/common/components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JoinRequestService } from '@/src/common/services/joinRequestService';

export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        
        try {
            // NOTIFICATIONS DISABLED - COMMENTED OUT
            // const { ClientNotificationService } = await import('@/src/client/services/clientNotificationService');
            // In real app, get user ID from session
            // const userNotifications = await ClientNotificationService.getUserNotifications('current-user');
            // setNotifications(userNotifications);
            setNotifications([]); // Empty array - notifications disabled
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            // NOTIFICATIONS DISABLED - COMMENTED OUT
            // const { ClientNotificationService } = await import('@/src/client/services/clientNotificationService');
            // await ClientNotificationService.markAsRead(notificationId);
            // loadNotifications();
            console.log('Notification mark as read disabled');
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleAcceptRequest = async (requestId: string, notificationId: string) => {
        try {
            setProcessingRequestId(requestId);
            const { success, error } = await JoinRequestService.acceptJoinRequest(requestId);
            
            if (success) {
                Alert.alert('Success', 'Join request accepted!');
                await markAsRead(notificationId);
                loadNotifications();
            } else {
                Alert.alert('Error', error || 'Failed to accept request');
            }
        } catch (error) {
            console.error('Error accepting join request:', error);
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setProcessingRequestId(null);
        }
    };

    const handleRejectRequest = async (requestId: string, notificationId: string) => {
        try {
            setProcessingRequestId(requestId);
            const { success, error } = await JoinRequestService.rejectJoinRequest(requestId);
            
            if (success) {
                Alert.alert('Success', 'Join request rejected');
                await markAsRead(notificationId);
                loadNotifications();
            } else {
                Alert.alert('Error', error || 'Failed to reject request');
            }
        } catch (error) {
            console.error('Error rejecting join request:', error);
            Alert.alert('Error', 'Something went wrong');
        } finally {
            setProcessingRequestId(null);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'booking_confirmed':
                return { name: 'checkmark-circle', color: '#10B981' };
            case 'booking_rejected':
                return { name: 'close-circle', color: '#EF4444' };
            case 'join_request_received':
                return { name: 'person-add', color: '#3B82F6' };
            case 'join_request_accepted':
                return { name: 'checkmark-done-circle', color: '#10B981' };
            case 'join_request_rejected':
                return { name: 'close-circle', color: '#EF4444' };
            case 'join_request_auto_rejected':
                return { name: 'information-circle', color: '#F59E0B' };
            default:
                return { name: 'notifications', color: '#6B7280' };
        }
    };

    const renderNotificationItem = ({ item }: { item: NotificationData }) => {
        const iconConfig = getNotificationIcon(item.type);
        const isJoinRequest = item.type === 'join_request_received';
        const isProcessing = processingRequestId === item.metadata?.requestId;
        
        return (
            <TouchableOpacity
                style={[styles.notificationCard, !item.read && styles.unreadCard]}
                onPress={() => !isJoinRequest && markAsRead(item.id)}
                disabled={isJoinRequest}
                activeOpacity={isJoinRequest ? 1 : 0.7}
            >
                <View style={styles.notificationContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons 
                            name={iconConfig.name as keyof typeof Ionicons.glyphMap} 
                            size={24} 
                            color={iconConfig.color} 
                        />
                    </View>
                    
                    <View style={styles.textContent}>
                        <Text style={[styles.title, !item.read && styles.unreadTitle]}>
                            {item.title}
                        </Text>
                        <Text style={styles.message}>{item.message}</Text>
                        <Text style={styles.timestamp}>
                            {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>

                        {/* Join Request Action Buttons */}
                        {isJoinRequest && item.metadata?.requestId && (
                            <View style={styles.actionButtons}>
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color="#047857" />
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.rejectButton]}
                                            onPress={() => handleRejectRequest(item.metadata!.requestId, item.id)}
                                        >
                                            <Ionicons name="close" size={18} color="#FFFFFF" />
                                            <Text style={styles.actionButtonText}>Reject</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.acceptButton]}
                                            onPress={() => handleAcceptRequest(item.metadata!.requestId, item.id)}
                                        >
                                            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                                            <Text style={styles.actionButtonText}>Accept</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        )}
                    </View>
                    
                    {!item.read && <View style={styles.unreadDot} />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <AppHeader 
                    title="Notifications"
                    subtitle={`${notifications.filter(n => !n.read).length} unread`}
                />

                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNotificationItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadNotifications(true)}
                            colors={['#047857']}
                            tintColor="#047857"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
                            <Text style={styles.emptyTitle}>No Notifications</Text>
                            <Text style={styles.emptyText}>
                                You'll receive notifications about your booking requests here.
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
    notificationCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#047857',
        backgroundColor: '#F0FDF4',
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        marginRight: 12,
        marginTop: 2,
    },
    textContent: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    unreadTitle: {
        fontWeight: '700',
    },
    message: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
        marginBottom: 8,
    },
    timestamp: {
        fontSize: 12,
        color: '#6B7280',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#059669',
        marginLeft: 8,
        marginTop: 8,
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
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 6,
    },
    acceptButton: {
        backgroundColor: '#10B981',
    },
    rejectButton: {
        backgroundColor: '#EF4444',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});