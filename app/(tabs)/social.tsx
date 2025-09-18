import React, { useEffect, useState } from 'react';
// 1. Import StatusBar and useSafeAreaInsets
import AppHeader from '@/components/AppHeader';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bookingStore, Booking } from '@/utils/bookingStore';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';




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
            <View style={styles.gameCard}>
                <View style={styles.gameCardHeader}>
                    <View style={styles.gameVenue}>
                        <Ionicons name="location" size={16} color={colors.primary} />
                        <Text style={styles.gameVenueText}>{game.venue}</Text>
                    </View>
                    <View style={[styles.gameTypeBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.gameTypeText, { color: colors.primary }]}>
                            {game.bookingType}
                        </Text>
                    </View>
                </View>
                
                <Text style={styles.gameCourtText}>{game.court}</Text>
                
                <View style={styles.gameDetails}>
                    <View style={styles.gameDetailRow}>
                        <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                        <Text style={styles.gameDetailText}>
                            {formatDate(game.date)}
                        </Text>
                    </View>
                    <View style={styles.gameDetailRow}>
                        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                        <Text style={styles.gameDetailText}>
                            {game.time} • {game.duration}
                        </Text>
                    </View>
                    {game.skillLevel && (
                        <View style={styles.gameDetailRow}>
                            <Ionicons name="trophy-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.gameDetailText}>
                                {game.skillLevel}
                            </Text>
                        </View>
                    )}
                    {game.players && (
                        <View style={styles.gameDetailRow}>
                            <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
                            <Text style={styles.gameDetailText}>
                                {game.players} players needed
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.gameCardFooter}>
                    <Text style={styles.gamePriceText}>₹{game.price}</Text>
                    {!isUserGame && (
                        <TouchableOpacity
                            style={styles.joinButton}
                            onPress={() => handleJoinGame(game.id)}
                        >
                            <Text style={styles.joinButtonText}>Join Game</Text>
                        </TouchableOpacity>
                    )}
                    {isUserGame && (
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>Your Game</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#047857" />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Make status bar icons (time, battery) white */}
            <StatusBar style="light" />

            <AppHeader 
                title="Social Hub" 
                subtitle="Connect with players and join games"
            />

            {/* Tab Switcher */}
            <View style={styles.tabSwitcher}>
                {tabList.map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tab Content */}
            {activeTab === 'Players' && (
                <>
                    <View style={styles.playersHeader}>
                        <Text style={styles.playersTitle}>Players Online</Text>
                        <Text style={styles.playersCount}>{players.length} players</Text>
                    </View>
                    {players.length === 0 ? (
                        <View style={styles.playersPlaceholder}>
                            <Text style={styles.placeholderText}>No players online</Text>
                        </View>
                    ) : (
                        players.map(player => (
                            <View key={player.id} style={styles.playersPlaceholder}>
                                <Text style={styles.placeholderText}>{player.name}</Text>
                            </View>
                        ))
                    )}
                </>
            )}
            {activeTab === 'Games' && (
                <ScrollView style={styles.gamesContainer} showsVerticalScrollIndicator={false}>
                    {/* Your Games Section */}
                    <View style={styles.gamesSection}>
                        <View style={styles.gamesSectionHeader}>
                            <Text style={styles.gamesSectionTitle}>Your Games</Text>
                            <Text style={styles.gamesSectionCount}>{userOpenGames.length} games</Text>
                        </View>
                        
                        {userOpenGames.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
                                <Text style={styles.emptyStateText}>No upcoming games</Text>
                                <Text style={styles.emptyStateSubtext}>Create an open game to get started</Text>
                            </View>
                        ) : (
                            userOpenGames.map(game => (
                                <GameCard key={game.id} game={game} isUserGame={true} />
                            ))
                        )}
                    </View>

                    {/* Available Games Section */}
                    <View style={styles.gamesSection}>
                        <View style={styles.gamesSectionHeader}>
                            <Text style={styles.gamesSectionTitle}>Available Games</Text>
                            <Text style={styles.gamesSectionCount}>{availableGames.length} games</Text>
                        </View>
                        
                        {availableGames.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
                                <Text style={styles.emptyStateText}>No games available</Text>
                                <Text style={styles.emptyStateSubtext}>Check back later for new games</Text>
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
                        <View style={styles.playersPlaceholder}>
                            <Text style={styles.placeholderText}>No friends online</Text>
                        </View>
                    ) : (
                        friends.map(friend => (
                            <View key={friend.id} style={styles.playersPlaceholder}>
                                <Text style={styles.placeholderText}>{friend.name}</Text>
                            </View>
                        ))
                    )}
                </>
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
    },
    header: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingBottom: 28,
        marginBottom: 8,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    headerSubtitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '400',
        marginBottom: 8,
    },
    tabSwitcher: {
        flexDirection: 'row',
        backgroundColor: colors.backgroundTertiary,
        borderRadius: 24,
        marginHorizontal: 24,
        marginTop: 8,
        marginBottom: 16,
        padding: 4,
        justifyContent: 'space-between',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 16,
        alignItems: 'center',
        marginHorizontal: 2,
    },
    tabButtonActive: {
        backgroundColor: colors.background,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
    },
    tabText: {
        color: colors.textSecondary,
        fontSize: 16,
        fontWeight: '500',
    },
    tabTextActive: {
        color: colors.textPrimary,
        fontWeight: 'bold',
    },
    playersHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 24,
        marginBottom: 8,
    },
    playersTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    playersCount: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    playersPlaceholder: {
        backgroundColor: colors.backgroundTertiary,
        borderRadius: 16,
        marginHorizontal: 24,
        marginTop: 16,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: colors.textSecondary,
        fontSize: 16,
        textAlign: 'center',
    },
    // Games Section Styles
    gamesContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    gamesSection: {
        marginBottom: 32,
    },
    gamesSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    gamesSectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    gamesSectionCount: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    emptyState: {
        backgroundColor: colors.background,
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.gray200,
        borderStyle: 'dashed',
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: 16,
        marginBottom: 4,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: colors.textTertiary,
        textAlign: 'center',
    },
    // Game Card Styles
    gameCard: {
        backgroundColor: colors.background,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: colors.gray200,
    },
    gameCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    gameVenue: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    gameVenueText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginLeft: 6,
    },
    gameTypeBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    gameTypeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    gameCourtText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 16,
        marginLeft: 22,
    },
    gameDetails: {
        marginBottom: 16,
    },
    gameDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    gameDetailText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 8,
    },
    gameCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
    },
    gamePriceText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    joinButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    joinButtonText: {
        color: colors.textInverse,
        fontSize: 14,
        fontWeight: '600',
    },
    statusBadge: {
        backgroundColor: colors.gray200,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        color: colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
});