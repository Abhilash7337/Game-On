import React, { useEffect, useState } from 'react';
// 1. Import StatusBar and useSafeAreaInsets
import AppHeader from '@/src/common/components/AppHeader';
import {
    buttonStyles,
    cardStyles,
    socialStyles,
    socialTextStyles
} from '@/styles/screens/SocialScreen';
import { colors } from '@/styles/theme';
import { Booking, bookingStore } from '@/utils/bookingStore';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';




export default function SocialScreen() {
    const [activeTab, setActiveTab] = useState('Players');
    const [tabList, setTabList] = useState<string[]>([]);
    const [players, setPlayers] = useState<Array<{ id: string; name: string }>>([]);
    const [userOpenGames, setUserOpenGames] = useState<Booking[]>([]);
    const [availableGames, setAvailableGames] = useState<Booking[]>([]);
    const [friends, setFriends] = useState<Array<{ id: string; name: string }>>([]);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();

    const refreshGamesData = () => {
        // Get user's own open games and available games separately
        const userGames = bookingStore.getUserUpcomingOpenGames();
        const availableGames = bookingStore.getAvailableOpenGames();
        
        console.log('Refreshing games data:');
        console.log('User games:', userGames.length);
        console.log('Available games:', availableGames.length);
        console.log('All bookings:', bookingStore.getAllBookings().length);
        
        setUserOpenGames(userGames);
        setAvailableGames(availableGames);
    };

    useEffect(() => {
        // Simulate fetching tabs and data from backend
        setTimeout(() => {
            setTabList(['Players', 'Games', 'Friends']);
            setPlayers([]); // [] for no players, or add objects for players
            
            // Add some sample games from other users for demonstration
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const dayAfterTomorrow = new Date();
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

            // Only add if no games exist yet
            if (bookingStore.getAllBookings().length === 0) {
                bookingStore.addOtherUserGame({
                    venue: 'Elite Sports Club',
                    court: 'Court B1',
                    date: tomorrow,
                    time: '7:00 AM',
                    duration: '1 hr',
                    bookingType: 'Open Game',
                    skillLevel: 'Beginner',
                    players: '4',
                    price: 400,
                });

                bookingStore.addOtherUserGame({
                    venue: 'Champion Courts',
                    court: 'Court A3',
                    date: dayAfterTomorrow,
                    time: '6:00 PM',
                    duration: '1.5 hr',
                    bookingType: 'Open Game',
                    skillLevel: 'Advanced',
                    players: '2',
                    price: 600,
                });
            }
            
            refreshGamesData(); // Load games data
            setFriends([]); // [] for no friends, or add objects for friends
            setLoading(false);
        }, 700);

        // Subscribe to booking store changes
        const unsubscribe = bookingStore.subscribe(() => {
            refreshGamesData();
        });

        return unsubscribe;
    }, []);

    const handleJoinGame = (gameId: string) => {
        Alert.alert(
            'Join Game',
            'Are you sure you want to join this game?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Join', 
                    onPress: () => {
                        // Here you would implement the actual join logic
                        // For now, we'll just show a success message
                        Alert.alert(
                            'Success! 🎉', 
                            'You have successfully joined the game! Check your upcoming games for details.',
                            [
                                { text: 'OK', onPress: () => refreshGamesData() }
                            ]
                        );
                    }
                }
            ]
        );
    };

    const GameCard = ({ game, isUserGame = false }: { game: Booking; isUserGame?: boolean }) => {
        const formatDate = (date: Date) => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
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

        return (
            <View style={socialStyles.gameCard}>
                <View style={socialStyles.gameCardHeader}>
                    <View style={socialStyles.gameVenue}>
                        <Ionicons name="location" size={16} color={colors.primary} />
                        <Text style={socialStyles.gameVenueText}>{game.venue}</Text>
                    </View>
                    <View style={[socialStyles.gameTypeBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[socialStyles.gameTypeText, { color: colors.primary }]}>
                            {game.bookingType}
                        </Text>
                    </View>
                </View>
                
                <Text style={socialStyles.gameCourtText}>{game.court}</Text>
                
                <View style={socialStyles.gameDetails}>
                    <View style={socialStyles.gameDetailRow}>
                        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                        <Text style={socialStyles.gameDetailText}>
                            {formatDate(game.date)}
                        </Text>
                    </View>
                    <View style={socialStyles.gameDetailRow}>
                        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                        <Text style={socialStyles.gameDetailText}>
                            {game.time} • {game.duration}
                        </Text>
                    </View>
                    {game.skillLevel && (
                        <View style={socialStyles.gameDetailRow}>
                            <Ionicons name="trophy-outline" size={16} color={colors.textSecondary} />
                            <Text style={socialStyles.gameDetailText}>
                                {game.skillLevel}
                            </Text>
                        </View>
                    )}
                    {game.players && (
                        <View style={socialStyles.gameDetailRow}>
                            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                            <Text style={socialStyles.gameDetailText}>
                                {game.players} players needed
                            </Text>
                        </View>
                    )}
                </View>

                <View style={socialStyles.gameCardFooter}>
                    <Text style={socialStyles.gamePriceText}>₹{game.price}</Text>
                    {!isUserGame && (
                        <TouchableOpacity
                            style={socialStyles.joinButton}
                            onPress={() => handleJoinGame(game.id)}
                        >
                            <Text style={socialStyles.joinButtonText}>Join Game</Text>
                        </TouchableOpacity>
                    )}
                    {isUserGame && (
                        <View style={socialStyles.statusBadge}>
                            <Text style={socialStyles.statusText}>Your Game</Text>
                        </View>
                    )}
                </View>
            </View>
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
            {/* Make status bar icons (time, battery) white */}
            <StatusBar style="light" />

            <AppHeader 
                title="Social Hub" 
                subtitle="Connect with players and join games"
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
            {activeTab === 'Players' && (
                <>
                    <View style={socialStyles.playersHeader}>
                        <Text style={socialStyles.playersTitle}>Players Online</Text>
                        <Text style={socialStyles.playersCount}>{players.length} players</Text>
                    </View>
                    {players.length === 0 ? (
                        <View style={socialStyles.playersPlaceholder}>
                            <Text style={socialStyles.placeholderText}>No players online</Text>
                        </View>
                    ) : (
                        players.map(player => (
                            <View key={player.id} style={socialStyles.playersPlaceholder}>
                                <Text style={socialStyles.placeholderText}>{player.name}</Text>
                            </View>
                        ))
                    )}
                </>
            )}
            {activeTab === 'Games' && (
                <ScrollView style={socialStyles.gamesContainer} showsVerticalScrollIndicator={false}>
                    {/* Your Games Section */}
                    <View style={socialStyles.gamesSection}>
                        <View style={socialStyles.gamesSectionHeader}>
                            <Text style={socialStyles.gamesSectionTitle}>Your Games</Text>
                            <Text style={socialStyles.gamesSectionCount}>{userOpenGames.length} games</Text>
                        </View>
                        
                        {userOpenGames.length === 0 ? (
                            <View style={socialStyles.emptyState}>
                                <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
                                <Text style={socialStyles.emptyStateText}>No upcoming games</Text>
                                <Text style={socialStyles.emptyStateSubtext}>Create an open game to get started</Text>
                            </View>
                        ) : (
                            userOpenGames.map(game => (
                                <GameCard key={game.id} game={game} isUserGame={true} />
                            ))
                        )}
                    </View>

                    {/* Available Games Section */}
                    <View style={socialStyles.gamesSection}>
                        <View style={socialStyles.gamesSectionHeader}>
                            <Text style={socialStyles.gamesSectionTitle}>Available Games</Text>
                            <Text style={socialStyles.gamesSectionCount}>{availableGames.length} games</Text>
                        </View>
                        
                        {availableGames.length === 0 ? (
                            <View style={socialStyles.emptyState}>
                                <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
                                <Text style={socialStyles.emptyStateText}>No games available</Text>
                                <Text style={socialStyles.emptyStateSubtext}>Check back later for new games</Text>
                            </View>
                        ) : (
                            availableGames.map(game => (
                                <GameCard key={game.id} game={game} isUserGame={false} />
                            ))
                        )}
                    </View>
                </ScrollView>
            )}
            {activeTab === 'Friends' && (
                <>
                    {friends.length === 0 ? (
                        <View style={socialStyles.playersPlaceholder}>
                            <Text style={socialStyles.placeholderText}>No friends online</Text>
                        </View>
                    ) : (
                        friends.map(friend => (
                            <View key={friend.id} style={socialStyles.playersPlaceholder}>
                                <Text style={socialStyles.placeholderText}>{friend.name}</Text>
                            </View>
                        ))
                    )}
                </>
            )}
        </View>
    );
}


