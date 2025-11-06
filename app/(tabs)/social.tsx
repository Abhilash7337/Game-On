import { FriendService } from '@/src/common/services/friendService';
import { GameChatroomService } from '@/src/common/services/gameChatroomService';
import { SportGroupService } from '@/src/common/services/sportGroupService';
import { supabase } from '@/src/common/services/supabase';
import { socialStyles } from '@/styles/screens/SocialScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';




// Types
interface Friend {
  id: string;
  name: string;
  profilePhoto?: string;
  rating?: number;
  isOnline: boolean;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  conversationId?: string;
  status?: 'pending' | 'accepted' | 'blocked';
}

interface SportGroup {
  id: string;
  name: string;
  memberCount: number;
  sport: string;
  conversationId?: string;
  city?: string | null;
  isGlobal?: boolean;
  isMember?: boolean;
}

interface GameChat {
  id: string;
  venue: string;
  court: string;
  date: string;
  time: string;
  duration: string;
  isHost: boolean;
  participants: number;
  expiresAt?: Date; // Added for chatroom expiry tracking
}

export default function SocialScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Global');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [globalSports, setGlobalSports] = useState<SportGroup[]>([]);
    const [citySports, setCitySports] = useState<SportGroup[]>([]);
    const [gameChats, setGameChats] = useState<GameChat[]>([]);
    const [userCity] = useState('Hyderabad'); // setUserCity removed as it's not used yet
    const [loading, setLoading] = useState(true);
    const [showCitySports, setShowCitySports] = useState(false);
    const [showGlobalSports, setShowGlobalSports] = useState(false);
    const [navigating, setNavigating] = useState(false);
    
    // Friend search states
    const [showAddFriendModal, setShowAddFriendModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);

    // Load game chatrooms from GameChatroomService
    const loadGameChatrooms = async () => {
        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) {
                console.log('⚠️ Auth error loading chatrooms:', userError.message);
                // Handle refresh token error gracefully
                if (userError.message.includes('Refresh Token') || userError.message.includes('Invalid')) {
                    console.log('Clearing invalid session from social screen');
                    await supabase.auth.signOut();
                    router.replace('/login');
                    return;
                }
                setGameChats([]);
                return;
            }
            
            if (!userData?.user?.id) {
                console.log('⚠️ No authenticated user for chatrooms');
                setGameChats([]);
                return;
            }

            const userId = userData.user.id;
            const chatrooms = await GameChatroomService.getUserChatrooms(userId);
            
            // Convert GameChatroomDisplay to GameChat format
            const gameChatsData: GameChat[] = chatrooms.map(room => ({
                id: room.id,
                venue: room.venue,
                court: room.court,
                date: room.date,
                time: room.time,
                duration: room.duration,
                isHost: room.isHost,
                participants: room.participants,
                expiresAt: room.expiresAt
            }));

            setGameChats(gameChatsData);
            console.log('💬 Loaded', gameChatsData.length, 'game chatrooms');
        } catch (error) {
            console.error('❌ Error loading game chatrooms:', error);
            setGameChats([]);
        }
    };

    useEffect(() => {
        let isMounted = true;
        
        const loadData = async () => {
            try {
                // Load real friends data (basic info first for fast loading)
                const { success, friends: realFriends } = await FriendService.getFriends();
                if (success && realFriends && isMounted) {
                    // Filter out invalid friends immediately
                    const validFriends = realFriends.filter(friend => friend && friend.id && friend.name);
                    setFriends(validFriends);
                    
                    // Load conversation info for all friends in parallel (much faster)
                    try {
                        const conversationPromises = validFriends.map(async (friend) => {
                            try {
                                const { success: convSuccess, conversationInfo } = await FriendService.getFriendConversationInfo(friend.id);
                                return {
                                    friendId: friend.id,
                                    success: convSuccess,
                                    conversationInfo
                                };
                            } catch (error) {
                                console.error('Error loading conversation info for friend:', friend.name, error);
                                return { friendId: friend.id, success: false, conversationInfo: null };
                            }
                        });
                        
                        const conversationResults = await Promise.all(conversationPromises);
                        
                        if (isMounted) {
                            setFriends(prevFriends => {
                                const updatedFriends = [...prevFriends];
                                
                                conversationResults.forEach(result => {
                                    if (result.success && result.conversationInfo) {
                                        const friendIndex = updatedFriends.findIndex(f => f && f.id === result.friendId);
                                        if (friendIndex !== -1) {
                                            updatedFriends[friendIndex] = {
                                                ...updatedFriends[friendIndex],
                                                conversationId: result.conversationInfo.conversationId,
                                                lastMessage: result.conversationInfo.lastMessage,
                                                lastMessageTime: result.conversationInfo.lastMessageTime,
                                                unreadCount: result.conversationInfo.unreadCount
                                            };
                                        }
                                    }
                                });
                                
                                // Sort by last message time (most recent first)
                                return updatedFriends.sort((a, b) => {
                                    if (!a?.lastMessageTime && !b?.lastMessageTime) return 0;
                                    if (!a?.lastMessageTime) return 1;
                                    if (!b?.lastMessageTime) return -1;
                                    return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
                                });
                            });
                        }
                    } catch (error) {
                        console.error('Error loading conversation data:', error);
                    }
                }

                // Load pending friend requests
                const { success: requestsSuccess, requests } = await FriendService.getPendingRequests();
                if (requestsSuccess && requests && isMounted) {
                    setPendingRequests(requests);
                }
            } catch (error) {
                console.error('Error loading friends data:', error);
                // Fallback to mock data if there's an error
                if (isMounted) {
                    setFriends([
                        {
                            id: '1',
                            name: 'Rahul Sharma',
                            profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
                            rating: 4.5,
                            isOnline: true,
                            status: 'accepted'
                        },
                        {
                            id: '2',
                            name: 'Priya Patel',
                            profilePhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
                            rating: 4.8,
                            isOnline: false,
                            status: 'accepted'
                        },
                        {
                            id: '3',
                            name: 'Arjun Kumar',
                            profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
                            rating: 4.2,
                            isOnline: true,
                            status: 'accepted'
                        }
                    ]);
                }
            }
        };

        loadData();

        // Load sport groups data
        const loadSportGroups = async () => {
            try {
                const { data: userData, error: userError } = await supabase.auth.getUser();
                if (userError) {
                    console.log('⚠️ Auth error loading sport groups:', userError.message);
                    if (userError.message.includes('Refresh Token') || userError.message.includes('Invalid')) {
                        await supabase.auth.signOut();
                        router.replace('/login');
                        return;
                    }
                }
                const userId = userData?.user?.id;

                // Initialize city sport groups if they don't exist
                console.log(`🔄 Initializing sport groups for ${userCity}...`);
                await SportGroupService.initializeCitySportGroups(userCity);

                // Load global and city sport groups in parallel
                const [globalGroups, cityGroups] = await Promise.all([
                    SportGroupService.getGlobalSportGroups(),
                    SportGroupService.getCitySportGroups(userCity)
                ]);

                if (!isMounted) return;

                console.log(`📊 Loaded ${globalGroups.length} global groups and ${cityGroups.length} city groups`);

                // Check membership status for each group if user is logged in
                if (userId) {
                    const globalWithMembership = await Promise.all(
                        globalGroups.map(async (group) => ({
                            ...group,
                            name: group.displayName,
                            isMember: await SportGroupService.isGroupMember(userId, group.conversationId)
                        }))
                    );

                    const cityWithMembership = await Promise.all(
                        cityGroups.map(async (group) => ({
                            ...group,
                            name: group.displayName,
                            isMember: await SportGroupService.isGroupMember(userId, group.conversationId)
                        }))
                    );

                    setGlobalSports(globalWithMembership);
                    setCitySports(cityWithMembership);
                } else {
                    setGlobalSports(globalGroups.map(g => ({ ...g, name: g.displayName })));
                    setCitySports(cityGroups.map(g => ({ ...g, name: g.displayName })));
                }

                // Load real game chatrooms
                await loadGameChatrooms();
                
                setLoading(false);
            } catch (error) {
                console.error('Error loading sport groups:', error);
                setLoading(false);
            }
        };

        loadSportGroups();
        
        // Cleanup function to prevent memory leaks
        return () => {
            isMounted = false;
        };
    }, [userCity]);

    // Real-time subscription for new messages (to update unread counts)
    useEffect(() => {
        if (friends.length === 0) return;

        const subscription = supabase
            .channel('messages-social-tab')
            .on('postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                async (payload) => {
                    if (payload.new && typeof payload.new === 'object') {
                        const newMessage = payload.new as any;
                        
                        // Check if this message is from a conversation with one of our friends
                        const friendWithConversation = friends.find(f => f.conversationId === newMessage.conversation_id);
                        if (friendWithConversation) {
                            // Update the friend's last message and unread count
                            try {
                                const { success, conversationInfo } = await FriendService.getFriendConversationInfo(friendWithConversation.id);
                                if (success && conversationInfo) {
                                    setFriends(prevFriends => {
                                        const updatedFriends = prevFriends.map(friend => 
                                            friend.id === friendWithConversation.id 
                                                ? {
                                                    ...friend,
                                                    lastMessage: conversationInfo.lastMessage,
                                                    lastMessageTime: conversationInfo.lastMessageTime,
                                                    unreadCount: conversationInfo.unreadCount
                                                }
                                                : friend
                                        );
                                        
                                        // Re-sort by last message time
                                        return updatedFriends.sort((a, b) => {
                                            if (!a.lastMessageTime && !b.lastMessageTime) return 0;
                                            if (!a.lastMessageTime) return 1;
                                            if (!b.lastMessageTime) return -1;
                                            return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
                                        });
                                    });
                                }
                            } catch (error) {
                                console.error('Error updating friend message info:', error);
                            }
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [friends]);

    // Reload game chatrooms when screen gains focus or Game Chats tab is active
    useFocusEffect(
        useCallback(() => {
            if (activeTab === 'Game Chats') {
                loadGameChatrooms();
            }
        }, [activeTab])
    );

    const handleFriendPress = useCallback((friend: Friend) => {
        // Prevent multiple rapid clicks
        if (navigating) return;
        
        setNavigating(true);
        router.push({
            pathname: '/FriendChatScreen',
            params: {
                friendId: friend.id,
                friendName: friend.name,
                friendAvatar: friend.profilePhoto
            }
        });
        
        // Reset navigating flag after a delay
        setTimeout(() => setNavigating(false), 1000);
    }, [router, navigating]);

    const handleSportGroupPress = useCallback(async (group: SportGroup) => {
        // Prevent multiple rapid clicks
        if (navigating) return;
        
        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) {
                console.log('⚠️ Auth error in sport group press:', userError.message);
                if (userError.message.includes('Refresh Token') || userError.message.includes('Invalid')) {
                    await supabase.auth.signOut();
                    router.replace('/login');
                    return;
                }
                Alert.alert('Authentication Error', 'Please sign in again to continue');
                return;
            }

            const userId = userData?.user?.id;
            if (!userId) {
                Alert.alert('Sign In Required', 'Please sign in to join sport groups');
                return;
            }

            // Check if user is a member
            if (!group.isMember && group.conversationId) {
            // Ask if they want to join
            Alert.alert(
                'Join Group',
                `Do you want to join ${group.name}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Join',
                        onPress: async () => {
                            try {
                                setNavigating(true);
                                await SportGroupService.joinSportGroup(userId, group.sport, group.city || undefined);
                                
                                // Refresh the sport groups
                                const [globalGroups, cityGroups] = await Promise.all([
                                    SportGroupService.getGlobalSportGroups(),
                                    SportGroupService.getCitySportGroups(userCity)
                                ]);

                                const globalWithMembership = await Promise.all(
                                    globalGroups.map(async (g) => ({
                                        ...g,
                                        name: g.displayName,
                                        isMember: await SportGroupService.isGroupMember(userId, g.conversationId)
                                    }))
                                );

                                const cityWithMembership = await Promise.all(
                                    cityGroups.map(async (g) => ({
                                        ...g,
                                        name: g.displayName,
                                        isMember: await SportGroupService.isGroupMember(userId, g.conversationId)
                                    }))
                                );

                                setGlobalSports(globalWithMembership);
                                setCitySports(cityWithMembership);

                                Alert.alert('Success', 'You have joined the group!');
                                
                                // Navigate to chat
                                router.push({
                                    pathname: '/SportGroupChatScreen',
                                    params: {
                                        conversationId: group.conversationId,
                                        groupName: group.name,
                                        sport: group.sport,
                                        isGlobal: String(group.isGlobal || false)
                                    }
                                });
                                
                                // Reset navigating flag after a delay
                                setTimeout(() => setNavigating(false), 1000);
                            } catch (error) {
                                console.error('Error joining group:', error);
                                Alert.alert('Error', 'Failed to join the group');
                                setNavigating(false);
                            }
                        }
                    }
                ]
            );
            } else {
                // Already a member, just navigate to chat
                setNavigating(true);
                router.push({
                    pathname: '/SportGroupChatScreen',
                    params: {
                        conversationId: group.conversationId,
                        groupName: group.name,
                        sport: group.sport,
                        isGlobal: String(group.isGlobal || false)
                    }
                });
                
                // Reset navigating flag after a delay
                setTimeout(() => setNavigating(false), 1000);
            }
        } catch (error) {
            console.error('Error handling sport group press:', error);
            Alert.alert('Error', 'Something went wrong. Please try again.');
        }
    }, [router, userCity, navigating]);

    const handleGameChatPress = useCallback((chat: GameChat) => {
        // Prevent multiple rapid clicks
        if (navigating) return;
        
        setNavigating(true);
        router.push({
            pathname: '/GameChatScreen',
            params: {
                gameId: chat.id,
                sport: 'Badminton', // You can add sport to GameChat interface
                venue: chat.venue,
                court: chat.court,
                date: chat.date,
                time: chat.time,
                status: 'upcoming'
            }
        });
        
        // Reset navigating flag after a delay
        setTimeout(() => setNavigating(false), 1000);
    }, [router, navigating]);

    const handleCityPress = useCallback(() => {
        setShowCitySports(!showCitySports);
    }, [showCitySports]);

    const handleGlobalPress = useCallback(() => {
        setShowGlobalSports(!showGlobalSports);
    }, [showGlobalSports]);

    // Helper function to format message time - guaranteed to return string
    const formatMessageTime = useCallback((time: Date | string | null | undefined): string => {
        if (!time) return '';
        
        try {
            const messageTime = time instanceof Date ? time : new Date(time);
            if (isNaN(messageTime.getTime())) return '';
            
            const now = new Date();
            const diffMs = now.getTime() - messageTime.getTime();
            const diffMins = Math.floor(diffMs / (1000 * 60));
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffMins < 1) return 'now';
            if (diffMins < 60) return `${diffMins}m`;
            if (diffHours < 24) return `${diffHours}h`;
            if (diffDays < 7) return `${diffDays}d`;
            
            return messageTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch (error) {
            // Don't log to console - just return empty string to prevent any render issues
            return '';
        }
    }, []);

    // Friend search functions
    const handleAddFriendPress = useCallback(() => {
        setShowAddFriendModal(true);
    }, []);

    const handleSearchUsers = useCallback(async (query: string) => {
        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const { success, users } = await FriendService.searchUsers(query);
            if (success && users) {
                setSearchResults(users);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
        setSearchLoading(false);
    }, []);

    const handleSendFriendRequest = useCallback(async (userId: string) => {
        try {
            const { success, error } = await FriendService.sendFriendRequest(userId);
            if (success) {
                Alert.alert('Success', 'Friend request sent successfully!');
                setShowAddFriendModal(false);
                setSearchQuery('');
                setSearchResults([]);
            } else {
                Alert.alert('Error', error || 'Failed to send friend request');
            }
        } catch (error) {
            console.error('Send friend request error:', error);
            Alert.alert('Error', 'Failed to send friend request');
        }
    }, []);

    const handleAcceptFriendRequest = useCallback(async (friendshipId: string) => {
        try {
            const { success, error } = await FriendService.acceptFriendRequest(friendshipId);
            if (success) {
                Alert.alert('Success', 'Friend request accepted!');
                // Refresh friends list
                const { success: friendsSuccess, friends: updatedFriends } = await FriendService.getFriends();
                if (friendsSuccess && updatedFriends) {
                    setFriends(updatedFriends);
                }
                // Refresh pending requests
                const { success: requestsSuccess, requests } = await FriendService.getPendingRequests();
                if (requestsSuccess && requests) {
                    setPendingRequests(requests);
                }
            } else {
                Alert.alert('Error', error || 'Failed to accept friend request');
            }
        } catch (error) {
            console.error('Accept friend request error:', error);
            Alert.alert('Error', 'Failed to accept friend request');
        }
    }, []);

    // Memoized computed values
    const totalCityMembers = useMemo(() => {
        return citySports.reduce((sum, group) => sum + group.memberCount, 0);
    }, [citySports]);

    const tabList = useMemo(() => ['Friends', 'Global', 'Game Chats'], []);

    const FriendCard = React.memo(({ friend }: { friend: Friend }) => {
        // Strict validation to prevent any rendering issues
        if (!friend || typeof friend !== 'object') {
            return null;
        }
        
        if (!friend.id || !friend.name || typeof friend.id !== 'string' || typeof friend.name !== 'string') {
            return null;
        }

        // Safe value extraction with guaranteed types
        const friendName = String(friend.name || 'Unknown User');
        const friendRating = String(friend.rating || '4.5');
        const lastMessage = friend.lastMessage ? String(friend.lastMessage) : null;
        const unreadCount = typeof friend.unreadCount === 'number' ? friend.unreadCount : 0;
        const isOnline = Boolean(friend.isOnline);
        const profilePhoto = friend.profilePhoto && typeof friend.profilePhoto === 'string' 
            ? friend.profilePhoto 
            : 'https://via.placeholder.com/40';

        return (
            <TouchableOpacity 
                style={socialStyles.friendCard}
                onPress={() => handleFriendPress(friend)}
            >
                <View style={socialStyles.friendAvatar}>
                    <Image 
                        source={{ uri: profilePhoto }} 
                        style={socialStyles.avatarImage}
                    />
                    {isOnline ? <View style={socialStyles.onlineIndicator} /> : null}
                </View>
                <View style={socialStyles.friendInfo}>
                    <Text style={socialStyles.friendName}>{friendName}</Text>
                    {lastMessage ? (
                        <View style={socialStyles.lastMessageContainer}>
                            <Text style={socialStyles.lastMessageText} numberOfLines={1}>
                                {lastMessage}
                            </Text>
                            {friend.lastMessageTime ? (
                                <Text style={socialStyles.lastMessageTime}>
                                    {formatMessageTime(friend.lastMessageTime)}
                                </Text>
                            ) : null}
                        </View>
                    ) : (
                        <View style={socialStyles.ratingContainer}>
                            <Ionicons name="star" size={14} color={colors.warning} />
                            <Text style={socialStyles.ratingText}>
                                {friendRating}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={socialStyles.friendActions}>
                    {unreadCount > 0 ? (
                        <View style={socialStyles.unreadBadge}>
                            <Text style={socialStyles.unreadCount}>
                                {unreadCount > 99 ? '99+' : String(unreadCount)}
                            </Text>
                        </View>
                    ) : null}
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
            </TouchableOpacity>
        );
    });

    const SportGroupCard = ({ group }: { group: SportGroup }) => (
        <TouchableOpacity 
            style={socialStyles.sportGroupCard}
            onPress={() => handleSportGroupPress(group)}
        >
            <View style={socialStyles.sportGroupInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={socialStyles.sportGroupName}>{group.name}</Text>
                    {group.isMember && (
                        <View style={{
                            backgroundColor: colors.primary,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 8
                        }}>
                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '600' }}>JOINED</Text>
                        </View>
                    )}
                </View>
                <Text style={socialStyles.sportGroupMembers}>
                    {group.memberCount.toLocaleString()} members
                </Text>
            </View>
            <Ionicons 
                name={group.isMember ? "chatbubbles" : "add-circle-outline"} 
                size={24} 
                color={group.isMember ? colors.primary : colors.textSecondary} 
            />
        </TouchableOpacity>
    );

    const GameChatCard = ({ chat }: { chat: GameChat }) => (
        <TouchableOpacity 
            style={socialStyles.gameChatCard}
            onPress={() => handleGameChatPress(chat)}
        >
            <View style={socialStyles.gameChatInfo}>
                <View style={socialStyles.gameChatHeader}>
                    <Text style={socialStyles.gameChatVenue}>{chat.venue} - {chat.court}</Text>
                    {chat.isHost && (
                        <View style={socialStyles.hostBadge}>
                            <Text style={socialStyles.hostBadgeText}>Host</Text>
                        </View>
                    )}
                </View>
                <Text style={socialStyles.gameChatTime}>
                    {chat.date} • {chat.time} • {chat.duration}
                </Text>
                <Text style={socialStyles.gameChatParticipants}>
                    {chat.participants} participants
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

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
        <View style={socialStyles.container}>
            {/* Make status bar icons (time, battery) dark for white background */}
            <StatusBar style="dark" />

            {/* Simple White Header */}
            <View style={[socialStyles.header, { paddingTop: insets.top + 20 }]}>
                <Text style={socialStyles.headerTitle}>Social Hub</Text>
            </View>

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
            <ScrollView style={socialStyles.contentContainer} showsVerticalScrollIndicator={false}>
                {activeTab === 'Friends' && (
                    <View style={socialStyles.friendsContainer}>
                        <View style={socialStyles.sectionHeader}>
                            <View style={socialStyles.sectionTitleContainer}>
                                <Text style={socialStyles.sectionTitle}>Friends</Text>
                                <TouchableOpacity 
                                    style={socialStyles.addFriendButton}
                                    onPress={handleAddFriendPress}
                                >
                                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={socialStyles.sectionCount}>{friends.length} friends</Text>
                        </View>

                        {/* Pending Friend Requests */}
                        {pendingRequests.length > 0 && (
                            <View style={socialStyles.pendingRequestsContainer}>
                                <Text style={socialStyles.pendingRequestsTitle}>Pending Requests ({pendingRequests.length})</Text>
                                {pendingRequests.map((request) => (
                                    <View key={request.friendshipId} style={socialStyles.pendingRequestCard}>
                                        <Image 
                                            source={{ uri: request.user.profilePhoto }} 
                                            style={socialStyles.pendingRequestAvatar}
                                        />
                                        <View style={socialStyles.pendingRequestInfo}>
                                            <Text style={socialStyles.pendingRequestName}>{request.user.name}</Text>
                                            <Text style={socialStyles.pendingRequestEmail}>{request.user.email}</Text>
                                        </View>
                                        <TouchableOpacity 
                                            style={socialStyles.acceptButton}
                                            onPress={() => handleAcceptFriendRequest(request.friendshipId)}
                                        >
                                            <Text style={socialStyles.acceptButtonText}>Accept</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                        
                        {friends.length === 0 ? (
                            <View style={socialStyles.emptyState}>
                                <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                                <Text style={socialStyles.emptyStateText}>No friends yet</Text>
                                <Text style={socialStyles.emptyStateSubtext}>Add friends to start chatting</Text>
                            </View>
                        ) : (
                            friends
                                .filter(friend => {
                                    return friend && 
                                           typeof friend === 'object' && 
                                           friend.id && 
                                           typeof friend.id === 'string' &&
                                           friend.name && 
                                           typeof friend.name === 'string';
                                })
                                .map(friend => (
                                    <FriendCard key={`friend-${friend.id}`} friend={friend} />
                                ))
                        )}
                    </View>
                )}

                {activeTab === 'Global' && (
                    <View style={socialStyles.globalContainer}>
                        {/* Your City Sport Groups - Collapsible */}
                        <View style={socialStyles.section}>
                            <View style={socialStyles.sectionHeader}>
                                <Text style={socialStyles.sectionTitle}>Your City</Text>
                                <Text style={socialStyles.sectionCount}>
                                    {totalCityMembers.toLocaleString()} members
                                </Text>
                            </View>
                            
                            <TouchableOpacity 
                                style={socialStyles.cityCard}
                                onPress={handleCityPress}
                            >
                                <View style={socialStyles.cityInfo}>
                                    <Text style={socialStyles.cityName}>{userCity} Communities</Text>
                                    <Text style={socialStyles.cityMembers}>
                                        {citySports.length} sport groups
                                    </Text>
                                </View>
                                <Ionicons 
                                    name={showCitySports ? "chevron-up" : "chevron-down"} 
                                    size={20} 
                                    color={colors.textSecondary} 
                                />
                            </TouchableOpacity>

                            {showCitySports && (
                                <View style={socialStyles.cityGroups}>
                                    {citySports.map(group => (
                                        <SportGroupCard key={group.id} group={group} />
                                    ))}
                                </View>
                            )}
                        </View>

                        {/* Global Sport Groups - Collapsible */}
                        <View style={socialStyles.section}>
                            <View style={socialStyles.sectionHeader}>
                                <Text style={socialStyles.sectionTitle}>Global Sport Groups</Text>
                                <Text style={socialStyles.sectionCount}>{globalSports.length} groups</Text>
                            </View>
                            
                            <TouchableOpacity 
                                style={socialStyles.cityCard}
                                onPress={handleGlobalPress}
                            >
                                <View style={socialStyles.cityInfo}>
                                    <Text style={socialStyles.cityName}>Global Communities</Text>
                                    <Text style={socialStyles.cityMembers}>
                                        {globalSports.length} sport groups
                                    </Text>
                                </View>
                                <Ionicons 
                                    name={showGlobalSports ? "chevron-up" : "chevron-down"} 
                                    size={20} 
                                    color={colors.textSecondary} 
                                />
                            </TouchableOpacity>

                            {showGlobalSports && (
                                <View style={socialStyles.cityGroups}>
                                    {globalSports.map(group => (
                                        <SportGroupCard key={group.id} group={group} />
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {activeTab === 'Game Chats' && (
                    <View style={socialStyles.gameChatsContainer}>
                        <View style={socialStyles.sectionHeader}>
                            <Text style={socialStyles.sectionTitle}>Game Chats</Text>
                            <Text style={socialStyles.sectionCount}>{gameChats.length} active chats</Text>
                        </View>
                        
                        {gameChats.length === 0 ? (
                            <View style={socialStyles.emptyState}>
                                <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
                                <Text style={socialStyles.emptyStateText}>No active game chats</Text>
                                <Text style={socialStyles.emptyStateSubtext}>Join a game to start chatting</Text>
                            </View>
                        ) : (
                            gameChats.map(chat => (
                                <GameChatCard key={chat.id} chat={chat} />
                            ))
                        )}
                    </View>
                )}
            </ScrollView>

            {/* Add Friend Modal */}
            <Modal
                visible={showAddFriendModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAddFriendModal(false)}
            >
                <View style={socialStyles.modalOverlay}>
                    <View style={socialStyles.modalContent}>
                        <View style={socialStyles.modalHeader}>
                            <Text style={socialStyles.modalTitle}>Add Friend</Text>
                            <TouchableOpacity 
                                style={socialStyles.closeButton}
                                onPress={() => setShowAddFriendModal(false)}
                            >
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={socialStyles.searchInput}
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChangeText={(text) => {
                                setSearchQuery(text);
                                handleSearchUsers(text);
                            }}
                            autoFocus={true}
                        />

                        <ScrollView style={socialStyles.searchResultsContainer}>
                            {searchLoading ? (
                                <View style={socialStyles.loadingContainer}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                </View>
                            ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                                <Text style={socialStyles.emptySearchText}>No users found</Text>
                            ) : searchQuery.length < 2 ? (
                                <Text style={socialStyles.emptySearchText}>Type at least 2 characters to search</Text>
                            ) : (
                                searchResults.map((user) => (
                                    <View key={user.id} style={socialStyles.searchResultItem}>
                                        <Image 
                                            source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=047857&color=fff` }} 
                                            style={socialStyles.searchResultAvatar}
                                        />
                                        <View style={socialStyles.searchResultInfo}>
                                            <Text style={socialStyles.searchResultName}>{user.full_name}</Text>
                                            <Text style={socialStyles.searchResultEmail}>{user.email}</Text>
                                        </View>
                                        <TouchableOpacity 
                                            style={socialStyles.addButton}
                                            onPress={() => handleSendFriendRequest(user.id)}
                                        >
                                            <Text style={socialStyles.addButtonText}>Add</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
