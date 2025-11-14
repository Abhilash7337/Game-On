import { ConversationService } from '@/src/common/services/conversationService'; // ✅ NEW: Supabase conversations
import { dataPrefetchService } from '@/src/common/services/dataPrefetch';
import { FriendService } from '@/src/common/services/friendService';
import { SportGroupService } from '@/src/common/services/sportGroupService';
import { GameChatroomCleanupService } from '@/src/common/services/gameChatroomCleanup'; // ✅ NEW: Auto-cleanup expired chatrooms
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
  conversationId: string;
  venue: string;
  court: string;
  sport: string;
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
    const [dataSource, setDataSource] = useState<'cache' | 'fresh' | 'loading'>('loading');
    const [showCitySports, setShowCitySports] = useState(false);
    const [showGlobalSports, setShowGlobalSports] = useState(false);
    const [navigating, setNavigating] = useState(false);
    
    // Game chat action sheet states
    const [showGameChatActions, setShowGameChatActions] = useState(false);
    const [selectedGameChat, setSelectedGameChat] = useState<GameChat | null>(null);
    const [mutedChats, setMutedChats] = useState<Set<string>>(new Set());
    
    // Friend search states
    const [showAddFriendModal, setShowAddFriendModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [processingFriendRequestIds, setProcessingFriendRequestIds] = useState<Set<string>>(new Set());

    // Load game chatrooms from ConversationService (Supabase)
    const loadGameChatrooms = async () => {
        try {
            // ✅ NEW: Cleanup expired chatrooms before loading
            console.log('🧹 [SOCIAL] Running cleanup before loading chatrooms...');
            await GameChatroomCleanupService.autoCleanup(true); // Silent cleanup
            
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
            const conversations = await ConversationService.getUserGameChats(userId); // ✅ CHANGED: Use Supabase
            
            // Convert GameConversationDisplay to GameChat format
            const gameChatsData: GameChat[] = conversations.map(conv => ({
                id: conv.conversationId,
                conversationId: conv.conversationId,
                venue: conv.venue,
                court: conv.court,
                sport: conv.sport,
                date: conv.date,
                time: conv.time,
                duration: conv.duration,
                isHost: conv.isHost,
                participants: conv.participants,
                expiresAt: new Date() // Conversations don't expire, use current date as placeholder
            }));

            setGameChats(gameChatsData);
            console.log('💬 Loaded', gameChatsData.length, 'game chatrooms (after cleanup)');
        } catch (error) {
            console.error('❌ Error loading game chatrooms:', error);
            setGameChats([]);
        }
    };

    // ✅ Background refresh on tab focus
    useFocusEffect(
        useCallback(() => {
            const cache = dataPrefetchService.getCache();
            const cacheAge = dataPrefetchService.getCacheAge();
            
            // If cache older than 2 minutes, refresh in background
            if (cacheAge > 2 * 60 * 1000) {
                console.log('🔄 [SOCIAL] Cache stale, refreshing in background...');
                dataPrefetchService.prefetchAll().then(() => {
                    // Update from fresh cache
                    const freshCache = dataPrefetchService.getCache();
                    if (freshCache) {
                        setFriends(freshCache.friends);
                        setGlobalSports(freshCache.globalSportGroups);
                        setCitySports(freshCache.citySportGroups);
                        console.log('✅ [SOCIAL] Background refresh completed');
                    }
                });
            }
            
            // Always refresh game chats on focus (real-time data)
            loadGameChatrooms();
        }, [])
    );

    useEffect(() => {
        let isMounted = true;
        
        const loadData = async () => {
            try {
                // ✅ OPTIMIZATION: Try cache first for instant load!
                const cache = dataPrefetchService.getCache();
                if (cache && dataPrefetchService.isCacheFresh()) {
                    console.log('⚡ [SOCIAL] Using cached data - INSTANT LOAD!');
                    
                    if (isMounted) {
                        // Set friends immediately from cache
                        setFriends(cache.friends);
                        
                        // ✅ Set sport groups immediately from cache (already have membership info!)
                        setGlobalSports(cache.globalSportGroups);
                        setCitySports(cache.citySportGroups);
                        
                        setDataSource('cache');
                        setLoading(false); // ✅ Show UI immediately!
                        
                        console.log(`✅ [SOCIAL] Loaded from cache:`, {
                            friends: cache.friends.length,
                            globalGroups: cache.globalSportGroups.length,
                            cityGroups: cache.citySportGroups.length
                        });
                    }
                    
                    // ✅ Load conversation metadata in background (deferred 100ms)
                    setTimeout(async () => {
                        if (!isMounted) return;
                        
                        try {
                            const conversationPromises = cache.friends.map(async (friend) => {
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
                    }, 100);
                    
                    // Load pending requests in background
                    setTimeout(async () => {
                        const { success: requestsSuccess, requests } = await FriendService.getPendingRequests();
                        if (requestsSuccess && requests && isMounted) {
                            setPendingRequests(requests);
                        }
                    }, 200);
                    
                    return; // Done! Screen loaded from cache ⚡
                }
                
                // ❌ Cache miss or stale - load fresh data
                console.log('📡 [SOCIAL] Cache miss/stale, loading fresh data...');
                setDataSource('loading');
                
                // Load real friends data (basic info first for fast loading)
                const { success, friends: realFriends } = await FriendService.getFriends();
                if (success && realFriends && isMounted) {
                    // Filter out invalid friends immediately
                    const validFriends = realFriends.filter(friend => friend && friend.id && friend.name);
                    setFriends(validFriends);
                    setDataSource('fresh');
                    setLoading(false); // Show friends immediately
                    
                    // Load conversation info for all friends in parallel (deferred, in background)
                    setTimeout(async () => {
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
                    }, 100); // Defer conversation loading
                } else {
                    setLoading(false);
                }

                // Load pending friend requests (in background)
                setTimeout(async () => {
                    const { success: requestsSuccess, requests } = await FriendService.getPendingRequests();
                    if (requestsSuccess && requests && isMounted) {
                        setPendingRequests(requests);
                    }
                }, 200);
            } catch (error) {
                console.error('Error loading friends data:', error);
                // Fallback to mock data if there's an error
                if (isMounted) {
                    setFriends([
                        {
                            id: '1',
                            name: 'Rahul Sharma',
                            profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face&q=80',
                            rating: 4.5,
                            isOnline: true,
                            status: 'accepted'
                        },
                        {
                            id: '2',
                            name: 'Priya Patel',
                            profilePhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face&q=80',
                            rating: 4.8,
                            isOnline: false,
                            status: 'accepted'
                        },
                        {
                            id: '3',
                            name: 'Arjun Kumar',
                            profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face&q=80',
                            rating: 4.2,
                            isOnline: true,
                            status: 'accepted'
                        }
                    ]);
                    setLoading(false);
                }
            }
        };

        loadData();

        // Load sport groups data (deferred, in background)
        const loadSportGroups = async () => {
            try {
                // ✅ OPTIMIZATION: Check cache first!
                const cache = dataPrefetchService.getCache();
                if (cache && dataPrefetchService.isCacheFresh()) {
                    console.log('⚡ [SOCIAL] Using cached sport groups - already loaded!');
                    // Sport groups already set from main loadData(), skip this
                    
                    // Still load game chatrooms if needed
                    if (activeTab === 'Game Chats') {
                        await loadGameChatrooms();
                    }
                    return;
                }
                
                // Cache miss - load fresh sport groups
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

                    // Debug logging to verify conversation IDs are different
                    console.log('🌍 Global Groups:', globalWithMembership.map(g => ({ 
                        sport: g.sport,
                        conversationId: g.conversationId
                    })));
                    console.log('🏙️ City Groups:', cityWithMembership.map(g => ({ 
                        sport: g.sport,
                        city: g.city,
                        conversationId: g.conversationId
                    })));

                    setGlobalSports(globalWithMembership);
                    setCitySports(cityWithMembership);
                } else {
                    setGlobalSports(globalGroups.map(g => ({ ...g, name: g.displayName })));
                    setCitySports(cityGroups.map(g => ({ ...g, name: g.displayName })));
                }

                // Load real game chatrooms (only if Game Chats tab is active)
                if (activeTab === 'Game Chats') {
                    await loadGameChatrooms();
                }
            } catch (error) {
                console.error('Error loading sport groups:', error);
            }
        };

        // Defer sport groups loading
        setTimeout(() => {
            loadSportGroups();
        }, 300);
        
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
            // Listen for conversation_participants updates (when messages are marked as read)
            .on('postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversation_participants'
                },
                async (payload) => {
                    console.log('🔄 [SOCIAL] Received conversation_participants update:', payload);
                    if (payload.new && typeof payload.new === 'object') {
                        const updatedParticipant = payload.new as any;
                        
                        // Check if this is for a conversation with one of our friends
                        const friendWithConversation = friends.find(f => f.conversationId === updatedParticipant.conversation_id);
                        if (friendWithConversation) {
                            console.log('📱 [SOCIAL] Updating unread count for friend:', friendWithConversation.name);
                            // Re-calculate unread count for this friend
                            try {
                                const { success, conversationInfo } = await FriendService.getFriendConversationInfo(friendWithConversation.id);
                                console.log('📊 [SOCIAL] New conversation info:', conversationInfo);
                                if (success && conversationInfo) {
                                    setFriends(prevFriends => {
                                        return prevFriends.map(friend => 
                                            friend.id === friendWithConversation.id 
                                                ? {
                                                    ...friend,
                                                    lastMessage: conversationInfo.lastMessage,
                                                    lastMessageTime: conversationInfo.lastMessageTime,
                                                    unreadCount: conversationInfo.unreadCount
                                                }
                                                : friend
                                        );
                                    });
                                    console.log('✅ [SOCIAL] Updated friend unread count to:', conversationInfo.unreadCount);
                                }
                            } catch (error) {
                                console.error('❌ [SOCIAL] Error updating friend read status:', error);
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
            } else if (activeTab === 'Friends' && friends.length > 0) {
                // Refresh unread counts when returning to friends tab
                const refreshUnreadCounts = async () => {
                    try {
                        const conversationPromises = friends.map(async (friend) => {
                            if (!friend?.id || !friend?.conversationId) return null;
                            
                            try {
                                const { success, conversationInfo } = await FriendService.getFriendConversationInfo(friend.id);
                                return {
                                    friendId: friend.id,
                                    success,
                                    conversationInfo
                                };
                            } catch (error) {
                                console.error('Error refreshing unread for friend:', friend.name, error);
                                return null;
                            }
                        });
                        
                        const results = await Promise.all(conversationPromises);
                        
                        setFriends(prevFriends => {
                            const updatedFriends = [...prevFriends];
                            
                            results.forEach(result => {
                                if (result?.success && result.conversationInfo) {
                                    const friendIndex = updatedFriends.findIndex(f => f?.id === result.friendId);
                                    if (friendIndex !== -1) {
                                        updatedFriends[friendIndex] = {
                                            ...updatedFriends[friendIndex],
                                            lastMessage: result.conversationInfo.lastMessage,
                                            lastMessageTime: result.conversationInfo.lastMessageTime,
                                            unreadCount: result.conversationInfo.unreadCount
                                        };
                                    }
                                }
                            });
                            
                            return updatedFriends.sort((a, b) => {
                                if (!a?.lastMessageTime && !b?.lastMessageTime) return 0;
                                if (!a?.lastMessageTime) return 1;
                                if (!b?.lastMessageTime) return -1;
                                return b.lastMessageTime.getTime() - a.lastMessageTime.getTime();
                            });
                        });
                    } catch (error) {
                        console.error('Error refreshing unread counts:', error);
                    }
                };
                
                // Debounce the refresh to avoid too many API calls
                const timeoutId = setTimeout(refreshUnreadCounts, 500);
                return () => clearTimeout(timeoutId);
            }
        }, [activeTab, friends.length])
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
        
        console.log(`🎯 Sport Group Clicked:`, {
            name: group.name,
            sport: group.sport,
            city: group.city,
            conversationId: group.conversationId,
            isGlobal: group.isGlobal,
            isMember: group.isMember
        });

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
                console.log(`📱 Navigating to ${group.name} chat with conversation ID: ${group.conversationId} (isGlobal: ${group.isGlobal})`);
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

    // Game Chat Action Functions
    const handleGameChatLongPress = useCallback((chat: GameChat) => {
        setSelectedGameChat(chat);
        setShowGameChatActions(true);
    }, []);

    const handleDeleteGameChat = useCallback(async () => {
        if (!selectedGameChat) return;
        
        Alert.alert(
            'Delete Chat',
            `Are you sure you want to delete the chat for ${selectedGameChat.venue} - ${selectedGameChat.court}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setShowGameChatActions(false);
                            
                            // Delete from conversation_participants to leave the chat
                            const { data: userData } = await supabase.auth.getUser();
                            if (userData?.user?.id) {
                                const { error } = await supabase
                                    .from('conversation_participants')
                                    .delete()
                                    .eq('conversation_id', selectedGameChat.conversationId)
                                    .eq('user_id', userData.user.id);
                                    
                                if (error) {
                                    console.error('❌ Error leaving chat:', error);
                                    Alert.alert('Error', 'Failed to delete chat');
                                    return;
                                }
                                
                                // Remove from local state immediately
                                setGameChats(prev => prev.filter(chat => chat.id !== selectedGameChat.id));
                                
                                // Clear muted state if it was muted
                                setMutedChats(prev => {
                                    const next = new Set(prev);
                                    next.delete(selectedGameChat.id);
                                    return next;
                                });
                                
                                Alert.alert('Success', 'Chat deleted successfully');
                            }
                        } catch (error) {
                            console.error('❌ Error deleting chat:', error);
                            Alert.alert('Error', 'Failed to delete chat');
                        } finally {
                            setSelectedGameChat(null);
                        }
                    }
                }
            ]
        );
    }, [selectedGameChat]);

    const handleMuteGameChat = useCallback(async () => {
        if (!selectedGameChat) return;
        
        try {
            const isMuted = mutedChats.has(selectedGameChat.id);
            
            if (isMuted) {
                // Unmute
                setMutedChats(prev => {
                    const next = new Set(prev);
                    next.delete(selectedGameChat.id);
                    return next;
                });
                Alert.alert('Success', 'Chat unmuted');
            } else {
                // Mute
                setMutedChats(prev => new Set(prev).add(selectedGameChat.id));
                Alert.alert('Success', 'Chat muted');
            }
            
            setShowGameChatActions(false);
            setSelectedGameChat(null);
        } catch (error) {
            console.error('❌ Error muting/unmuting chat:', error);
            Alert.alert('Error', 'Failed to update chat settings');
        }
    }, [selectedGameChat, mutedChats]);

    const handleGameChatPress = useCallback((chat: GameChat) => {
        // Prevent multiple rapid clicks
        if (navigating) return;
        
        setNavigating(true);
        router.push({
            pathname: '/GameChatScreen',
            params: {
                conversationId: chat.conversationId,
                gameId: chat.id,
                sport: chat.sport,
                venue: chat.venue,
                court: chat.court,
                date: chat.date,
                time: chat.time,
                players: JSON.stringify([]), // Players list, will be loaded from Supabase
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
        // Prevent duplicate processing
        if (processingFriendRequestIds.has(friendshipId)) {
            console.log('⚠️ [SOCIAL] Already processing friend request:', friendshipId);
            return;
        }

        setProcessingFriendRequestIds(prev => new Set(prev).add(friendshipId));
        
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
        } finally {
            setProcessingFriendRequestIds(prev => {
                const next = new Set(prev);
                next.delete(friendshipId);
                return next;
            });
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

    const GameChatCard = ({ chat }: { chat: GameChat }) => {
        const isMuted = mutedChats.has(chat.id);
        
        return (
            <TouchableOpacity 
                style={[
                    socialStyles.gameChatCard,
                    isMuted && { opacity: 0.6 }
                ]}
                onPress={() => handleGameChatPress(chat)}
                onLongPress={() => handleGameChatLongPress(chat)}
                delayLongPress={500}
                activeOpacity={0.7}
            >
                <View style={socialStyles.gameChatInfo}>
                    <View style={socialStyles.gameChatHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Text style={socialStyles.gameChatVenue}>{chat.venue} - {chat.court}</Text>
                            {isMuted && (
                                <Ionicons 
                                    name="volume-mute" 
                                    size={16} 
                                    color={colors.textSecondary} 
                                    style={{ marginLeft: 8 }}
                                />
                            )}
                        </View>
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
                                            style={[
                                                socialStyles.acceptButton,
                                                processingFriendRequestIds.has(request.friendshipId) && { opacity: 0.5 }
                                            ]}
                                            onPress={() => handleAcceptFriendRequest(request.friendshipId)}
                                            disabled={processingFriendRequestIds.has(request.friendshipId)}
                                        >
                                            <Text style={socialStyles.acceptButtonText}>
                                                {processingFriendRequestIds.has(request.friendshipId) ? 'Processing...' : 'Accept'}
                                            </Text>
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

            {/* Game Chat Action Sheet Modal */}
            <Modal
                visible={showGameChatActions}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowGameChatActions(false)}
            >
                <TouchableOpacity 
                    style={socialStyles.actionSheetOverlay}
                    activeOpacity={1}
                    onPress={() => setShowGameChatActions(false)}
                >
                    <TouchableOpacity 
                        style={socialStyles.actionSheetContainer}
                        activeOpacity={1}
                        onPress={() => {}} // Prevent closing when tapping inside the action sheet
                    >
                        {/* Bottom sheet indicator */}
                        <View style={{ alignItems: 'center', paddingTop: 12 }}>
                            <View style={{ 
                                width: 40, 
                                height: 4, 
                                backgroundColor: colors.gray300, 
                                borderRadius: 2 
                            }} />
                        </View>
                        
                        <View style={socialStyles.actionSheetHeader}>
                            <Text style={socialStyles.actionSheetTitle} numberOfLines={1}>
                                {selectedGameChat ? `${selectedGameChat.venue} - ${selectedGameChat.court}` : 'Game Chat'}
                            </Text>
                            <TouchableOpacity 
                                style={socialStyles.closeButton}
                                onPress={() => setShowGameChatActions(false)}
                            >
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={socialStyles.actionSheetBody}>
                            <TouchableOpacity 
                                style={socialStyles.actionSheetItem}
                                onPress={handleMuteGameChat}
                            >
                                <Ionicons 
                                    name={selectedGameChat && mutedChats.has(selectedGameChat.id) ? "volume-high" : "volume-mute"} 
                                    size={24} 
                                    color={colors.textSecondary} 
                                />
                                <Text style={socialStyles.actionSheetItemText}>
                                    {selectedGameChat && mutedChats.has(selectedGameChat.id) ? 'Unmute Chat' : 'Mute Chat'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[socialStyles.actionSheetItem, socialStyles.dangerAction]}
                                onPress={handleDeleteGameChat}
                            >
                                <Ionicons name="trash" size={24} color={colors.error} />
                                <Text style={[socialStyles.actionSheetItemText, { color: colors.error }]}>
                                    Delete Chat
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}
