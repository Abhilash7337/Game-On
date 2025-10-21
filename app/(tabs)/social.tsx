import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { socialStyles } from '@/styles/screens/SocialScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';




// Types
interface Friend {
  id: string;
  name: string;
  profilePhoto: string;
  rating: number;
  isOnline: boolean;
}

interface SportGroup {
  id: string;
  name: string;
  memberCount: number;
  sport: string;
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

    useEffect(() => {
        let isMounted = true;
        
        // Simulate fetching data from backend
        const timeoutId = setTimeout(() => {
            if (!isMounted) return; // Prevent state updates if component unmounted
            
            // Mock friends data
            setFriends([
                {
                    id: '1',
                    name: 'Rahul Sharma',
                    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
                    rating: 4.5,
                    isOnline: true
                },
                {
                    id: '2',
                    name: 'Priya Patel',
                    profilePhoto: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
                    rating: 4.8,
                    isOnline: false
                },
                {
                    id: '3',
                    name: 'Arjun Kumar',
                    profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
                    rating: 4.2,
                    isOnline: true
                }
            ]);

            // Mock global sports data
            setGlobalSports([
                { id: '1', name: 'Global/Football', memberCount: 12500, sport: 'Football' },
                { id: '2', name: 'Global/Badminton', memberCount: 8900, sport: 'Badminton' },
                { id: '3', name: 'Global/Table Tennis', memberCount: 6700, sport: 'Table Tennis' },
                { id: '4', name: 'Global/Tennis', memberCount: 9800, sport: 'Tennis' },
                { id: '5', name: 'Global/Basketball', memberCount: 11200, sport: 'Basketball' }
            ]);

            // Mock city sports data
            setCitySports([
                { id: '1', name: `${userCity}/Football`, memberCount: 450, sport: 'Football' },
                { id: '2', name: `${userCity}/Badminton`, memberCount: 320, sport: 'Badminton' },
                { id: '3', name: `${userCity}/Table Tennis`, memberCount: 280, sport: 'Table Tennis' },
                { id: '4', name: `${userCity}/Tennis`, memberCount: 380, sport: 'Tennis' },
                { id: '5', name: `${userCity}/Basketball`, memberCount: 290, sport: 'Basketball' }
            ]);

            // Mock game chats data
            setGameChats([
                {
                    id: '1',
                    venue: 'Elite Sports Club',
                    court: 'Court A1',
                    date: 'Today',
                    time: '6:00 PM',
                    duration: '1 hr',
                    isHost: true,
                    participants: 4
                },
                {
                    id: '2',
                    venue: 'Champion Courts',
                    court: 'Court B2',
                    date: 'Tomorrow',
                    time: '7:00 AM',
                    duration: '1.5 hr',
                    isHost: false,
                    participants: 6
                }
            ]);
            
            setLoading(false);
        }, 500);
        
        // Cleanup function to prevent memory leaks
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [userCity]);

    const handleFriendPress = useCallback((friend: Friend) => {
        router.push({
            pathname: '/FriendChatScreen',
            params: {
                friendId: friend.id,
                friendName: friend.name,
                friendAvatar: friend.profilePhoto
            }
        });
    }, [router]);

    const handleSportGroupPress = useCallback((group: SportGroup) => {
        router.push({
            pathname: '/GlobalChatScreen',
            params: {
                channelId: group.id,
                channelName: group.name,
                channelType: 'sport'
            }
        });
    }, [router]);

    const handleGameChatPress = useCallback((chat: GameChat) => {
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
    }, [router]);

    const handleCityPress = useCallback(() => {
        setShowCitySports(!showCitySports);
    }, [showCitySports]);

    // Memoized computed values
    const totalCityMembers = useMemo(() => {
        return citySports.reduce((sum, group) => sum + group.memberCount, 0);
    }, [citySports]);

    const tabList = useMemo(() => ['Friends', 'Global', 'Game Chats'], []);

    const FriendCard = ({ friend }: { friend: Friend }) => (
        <TouchableOpacity 
            style={socialStyles.friendCard}
            onPress={() => handleFriendPress(friend)}
        >
            <View style={socialStyles.friendAvatar}>
                <Image 
                    source={{ uri: friend.profilePhoto }} 
                    style={socialStyles.avatarImage}
                />
                {friend.isOnline && <View style={socialStyles.onlineIndicator} />}
            </View>
            <View style={socialStyles.friendInfo}>
                <Text style={socialStyles.friendName}>{friend.name}</Text>
                <View style={socialStyles.ratingContainer}>
                    <Ionicons name="star" size={14} color={colors.warning} />
                    <Text style={socialStyles.ratingText}>{friend.rating}</Text>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    const SportGroupCard = ({ group }: { group: SportGroup }) => (
        <TouchableOpacity 
            style={socialStyles.sportGroupCard}
            onPress={() => handleSportGroupPress(group)}
        >
            <View style={socialStyles.sportGroupInfo}>
                <Text style={socialStyles.sportGroupName}>{group.name}</Text>
                <Text style={socialStyles.sportGroupMembers}>
                    {group.memberCount.toLocaleString()} members
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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
                            <Text style={socialStyles.sectionTitle}>Friends</Text>
                            <Text style={socialStyles.sectionCount}>{friends.length} friends</Text>
                        </View>
                        
                        {friends.length === 0 ? (
                            <View style={socialStyles.emptyState}>
                                <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                                <Text style={socialStyles.emptyStateText}>No friends yet</Text>
                                <Text style={socialStyles.emptyStateSubtext}>Add friends to start chatting</Text>
                            </View>
                        ) : (
                            friends.map(friend => (
                                <FriendCard key={friend.id} friend={friend} />
                            ))
                        )}
                    </View>
                )}

                {activeTab === 'Global' && (
                    <View style={socialStyles.globalContainer}>
                        {/* Your City - Always Expanded */}
                        <View style={socialStyles.section}>
                            <View style={socialStyles.sectionHeader}>
                                <Text style={socialStyles.sectionTitle}>Your City</Text>
                                <Text style={socialStyles.sectionCount}>
                                    {totalCityMembers.toLocaleString()} members
                                </Text>
                            </View>
                            
                            <View style={socialStyles.cityGroups}>
                                <Text style={socialStyles.cityGroupsTitle}>Sport Groups in {userCity}</Text>
                                {citySports.map(group => (
                                    <SportGroupCard key={group.id} group={group} />
                                ))}
                            </View>
                        </View>

                        {/* Global Sport Groups - Expandable */}
                        <View style={socialStyles.section}>
                            <View style={socialStyles.sectionHeader}>
                                <Text style={socialStyles.sectionTitle}>Global Sport Groups</Text>
                                <Text style={socialStyles.sectionCount}>{globalSports.length} groups</Text>
                            </View>
                            
                            <TouchableOpacity 
                                style={socialStyles.cityCard}
                                onPress={handleCityPress}
                            >
                                <View style={socialStyles.cityInfo}>
                                    <Text style={socialStyles.cityName}>Global Communities</Text>
                                    <Text style={socialStyles.cityMembers}>
                                        {globalSports.length} sport groups
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
                                    <Text style={socialStyles.cityGroupsTitle}>Global Sport Communities</Text>
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
        </View>
    );
}
