import AppHeader from '@/src/common/components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationData } from '@/src/client/services/clientNotificationService';

export default function NotificationsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        
        try {
            const { ClientNotificationService } = await import('@/src/client/services/clientNotificationService');
            // In real app, get user ID from session
            const userNotifications = await ClientNotificationService.getUserNotifications('current-user');
            setNotifications(userNotifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            const { ClientNotificationService } = await import('@/src/client/services/clientNotificationService');
            await ClientNotificationService.markAsRead(notificationId);
            loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'booking_confirmed':
                return { name: 'checkmark-circle', color: '#10B981' };
            case 'booking_rejected':
                return { name: 'close-circle', color: '#EF4444' };
            default:
                return { name: 'notifications', color: '#6B7280' };
        }
    };

    const renderNotificationItem = ({ item }: { item: NotificationData }) => {
        const iconConfig = getNotificationIcon(item.type);
        
        return (
            <TouchableOpacity
                style={[styles.notificationCard, !item.read && styles.unreadCard]}
                onPress={() => markAsRead(item.id)}
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
});