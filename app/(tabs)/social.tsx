import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import {
    buttonStyles,
    cardStyles,
    socialStyles,
    socialTextStyles
} from '@/styles/screens/SocialScreen';
import { colors } from '@/styles/theme';
import { Booking, bookingStore } from '@/utils/bookingStore';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';




export default function SocialScreen() {
    const [activeTab, setActiveTab] = useState('Friends');
    const [tabList, setTabList] = useState<string[]>([]);
    const [friends, setFriends] = useState<Array<{ id: string; name: string; isOnline: boolean; lastActive: string; rating: number }>>([]);
    const [currentCity, setCurrentCity] = useState<{ id: string; name: string; memberCount: number }>({ id: '1', name: 'Hyderabad', memberCount: 1250 });
    const [globalSportGroups, setGlobalSportGroups] = useState<Array<{ id: string; name: string; sport: string; memberCount: number; isJoined: boolean }>>([]);
    const [citySportGroups, setCitySportGroups] = useState<Array<{ id: string; name: string; sport: string; memberCount: number; isJoined: boolean }>>([]);
    const [gameChats, setGameChats] = useState<Array<{ id: string; venue: string; court: string; date: string; time: string; duration: string; memberCount: number; isHost: boolean }>>([]);
    const [showCityGroups, setShowCityGroups] = useState(false);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();

    const refreshSocialData = () => {
        // Refresh friends, city chat, and sport groups data
        // This would typically make API calls to get updated data
        console.log('Refreshing social data...');
    };

    useEffect(() => {
        // Simulate fetching tabs and data from backend
        setTimeout(() => {
            setTabList(['Friends', 'Global', 'Game Chats']);
            
            // Sample friends data
            setFriends([
                { id: '1', name: 'Alex Johnson', isOnline: true, lastActive: '', rating: 4.8 },
                { id: '2', name: 'Sarah Wilson', isOnline: false, lastActive: '2h ago', rating: 4.5 },
                { id: '3', name: 'Mike Chen', isOnline: true, lastActive: '', rating: 4.9 },
            ]);
            
            // Sample global sport groups data (All India)
            setGlobalSportGroups([
                { id: 'global-1', name: 'Global/Football', sport: 'Football', memberCount: 12500, isJoined: true },
                { id: 'global-2', name: 'Global/Badminton', sport: 'Badminton', memberCount: 8900, isJoined: false },
                { id: 'global-3', name: 'Global/Table Tennis', sport: 'Table Tennis', memberCount: 6700, isJoined: true },
                { id: 'global-4', name: 'Global/Tennis', sport: 'Tennis', memberCount: 9800, isJoined: false },
                { id: 'global-5', name: 'Global/Basketball', sport: 'Basketball', memberCount: 11200, isJoined: true },
            ]);

            // Sample city sport groups data (Hyderabad only)
            setCitySportGroups([
                { id: 'city-1', name: 'Hyderabad/Football', sport: 'Football', memberCount: 450, isJoined: true },
                { id: 'city-2', name: 'Hyderabad/Badminton', sport: 'Badminton', memberCount: 320, isJoined: false },
                { id: 'city-3', name: 'Hyderabad/Table Tennis', sport: 'Table Tennis', memberCount: 280, isJoined: true },
                { id: 'city-4', name: 'Hyderabad/Tennis', sport: 'Tennis', memberCount: 380, isJoined: false },
                { id: 'city-5', name: 'Hyderabad/Basketball', sport: 'Basketball', memberCount: 290, isJoined: true },
            ]);
            
            // Sample game chats data
            setGameChats([
                { 
                    id: '1', 
                    venue: 'Sports Complex', 
                    court: 'Court 1', 
                    date: 'Today', 
                    time: '6:00 PM', 
                    duration: '2 hours',
                    memberCount: 4, 
                    isHost: true 
                },
                { 
                    id: '2', 
                    venue: 'Tennis Academy', 
                    court: 'Court 2', 
                    date: 'Tomorrow', 
                    time: '7:00 AM', 
                    duration: '1.5 hours',
                    memberCount: 2, 
                    isHost: false 
                },
            ]);
            
            refreshSocialData(); // Load social data
            setLoading(false);
        }, 700);

        // Subscribe to social data changes
        const unsubscribe = bookingStore.subscribe(() => {
            refreshSocialData();
        });

        return unsubscribe;
    }, []);

    const handleCityClick = () => {
        setShowCityGroups(!showCityGroups);
    };

    const handleSportGroupClick = (groupId: string, groupName: string) => {
        Alert.alert(
            'Enter Chat Room',
            `Join ${groupName} chat room?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Join Chat', 
                    onPress: () => {
                        // Here you would navigate to the specific group chat room
                        console.log('Entering chat room:', groupId, groupName);
                        // router.push(`/chat/group/${groupId}`);
                    }
                }
            ]
        );
    };

    const handleGameChatClick = (chatId: string, venue: string, court: string) => {
        Alert.alert(
            'Enter Game Chat',
            `Join ${venue} - ${court} chat room?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Join Chat', 
                    onPress: () => {
                        // Here you would navigate to the specific game chat room
                        console.log('Entering game chat:', chatId, venue, court);
                        // router.push(`/chat/game/${chatId}`);
                    }
                }
            ]
        );
    };


    if (loading) {
        return (
            <View style={socialStyles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#047857" />
                </View>
            </View>
        );
    }

    return (
        <SafeAreaView style={socialStyles.container} edges={['left', 'right', 'bottom']}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: 'Social Hub',
                    headerStyle: {
                        backgroundColor: colors.background,
                    },
                    headerTitleStyle: {
                        fontSize: 20,
                        fontWeight: '700' as const,
                        color: colors.textPrimary,
                    },
                }}
            />

            {/* Tab Switcher */}
            <View style={socialStyles.tabSwitcher}>
                {tabList.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[socialStyles.tabButton, activeTab === tab && socialStyles.tabButtonActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[socialStyles.tabText, activeTab === tab && socialStyles.tabTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            {activeTab === 'Friends' && (
                <>
                    <View style={socialStyles.playersHeader}>
                        <Text style={socialStyles.playersTitle}>Your Friends</Text>
                        <Text style={socialStyles.playersCount}>{friends.length} friends</Text>
                    </View>
                    {friends.length === 0 ? (
                        <View style={socialStyles.playersPlaceholder}>
                            <Text style={socialStyles.placeholderText}>No friends yet</Text>
                        </View>
                    ) : (
                        friends.map(friend => (
                            <View key={friend.id} style={socialStyles.friendCard}>
                                <View style={socialStyles.friendAvatar}>
                                    <Text style={socialStyles.friendAvatarText}>
                                        {friend.name.split(' ').map(n => n[0]).join('')}
                                    </Text>
                                    {friend.isOnline && <View style={socialStyles.onlineIndicator} />}
                                </View>
                                <View style={socialStyles.friendInfo}>
                                    <Text style={socialStyles.friendName}>{friend.name}</Text>
                                    <Text style={socialStyles.friendRating}>⭐ {friend.rating}</Text>
                                    {friend.isOnline ? (
                                        <Text style={socialStyles.onlineStatus}>Online</Text>
                                    ) : (
                                        <Text style={socialStyles.offlineStatus}>Last seen {friend.lastActive}</Text>
                                    )}
                                </View>
                            </View>
                        ))
                    )}
                </>
            )}
            {activeTab === 'Global' && (
                <ScrollView style={socialStyles.gamesContainer} showsVerticalScrollIndicator={false}>
                    {/* Global Sport Groups Section */}
                    <View style={socialStyles.gamesSection}>
                        <View style={socialStyles.gamesSectionHeader}>
                            <Text style={socialStyles.gamesSectionTitle}>Global Sport Groups</Text>
                            <Text style={socialStyles.gamesSectionCount}>{globalSportGroups.length} groups</Text>
                        </View>
                        
                        {globalSportGroups.map(group => (
                            <TouchableOpacity 
                                key={group.id} 
                                style={socialStyles.sportGroupCard}
                                onPress={() => handleSportGroupClick(group.id, group.name)}
                            >
                                <View style={socialStyles.sportGroupContent}>
                                    <Text style={socialStyles.sportGroupName}>{group.name}</Text>
                                    <Text style={socialStyles.sportGroupMembers}>{group.memberCount.toLocaleString()} members</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Current City Section */}
                    <View style={socialStyles.gamesSection}>
                        <View style={socialStyles.gamesSectionHeader}>
                            <Text style={socialStyles.gamesSectionTitle}>Your City</Text>
                            <Text style={socialStyles.gamesSectionCount}>{currentCity.memberCount.toLocaleString()} members</Text>
                        </View>
                        
                        <TouchableOpacity 
                            style={socialStyles.cityCard}
                            onPress={handleCityClick}
                        >
                            <View style={socialStyles.cityCardContent}>
                                <Text style={socialStyles.cityName}>{currentCity.name}</Text>
                                <Text style={socialStyles.cityMembers}>{currentCity.memberCount.toLocaleString()} members</Text>
                                <Ionicons 
                                    name={showCityGroups ? "chevron-up" : "chevron-down"} 
                                    size={20} 
                                    color={colors.primary} 
                                />
                            </View>
                        </TouchableOpacity>

                        {/* Sport Groups for Current City */}
                        {showCityGroups && (
                            <View style={socialStyles.sportGroupsContainer}>
                                <Text style={socialStyles.sportGroupsTitle}>Sport Groups in {currentCity.name}</Text>
                                {citySportGroups.map(group => (
                                    <TouchableOpacity 
                                        key={group.id} 
                                        style={socialStyles.sportGroupCard}
                                        onPress={() => handleSportGroupClick(group.id, group.name)}
                                    >
                                        <View style={socialStyles.sportGroupContent}>
                                            <Text style={socialStyles.sportGroupName}>{group.name}</Text>
                                            <Text style={socialStyles.sportGroupMembers}>{group.memberCount} members</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                </ScrollView>
            )}
            {activeTab === 'Game Chats' && (
                <>
                    <View style={socialStyles.playersHeader}>
                        <Text style={socialStyles.playersTitle}>Game Chats</Text>
                        <Text style={socialStyles.playersCount}>{gameChats.length} active chats</Text>
                    </View>
                    {gameChats.length === 0 ? (
                        <View style={socialStyles.playersPlaceholder}>
                            <Text style={socialStyles.placeholderText}>No active game chats</Text>
                        </View>
                    ) : (
                        gameChats.map(chat => (
                            <TouchableOpacity 
                                key={chat.id} 
                                style={socialStyles.gameChatCard}
                                onPress={() => handleGameChatClick(chat.id, chat.venue, chat.court)}
                            >
                                <View style={socialStyles.gameChatContent}>
                                    <View style={socialStyles.gameChatHeader}>
                                        <Text style={socialStyles.gameChatVenue}>{chat.venue} - {chat.court}</Text>
                                        {chat.isHost && <Text style={socialStyles.hostBadge}>Host</Text>}
                                    </View>
                                    <Text style={socialStyles.gameChatTiming}>{chat.date} • {chat.time} • {chat.duration}</Text>
                                    <Text style={socialStyles.gameChatMembers}>{chat.memberCount} players</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        ))
                    )}
                </>
            )}
        </SafeAreaView>
    );
}


