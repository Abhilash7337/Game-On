import React, { useEffect, useState } from 'react';
// 1. Import StatusBar and useSafeAreaInsets
import AppHeader from '@/components/AppHeader';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';




export default function SocialScreen() {
    const [activeTab, setActiveTab] = useState('Players');
    const [tabList, setTabList] = useState<string[]>([]);
    const [players, setPlayers] = useState<Array<{ id: string; name: string }>>([]);
    const [games, setGames] = useState<Array<{ id: string; title: string }>>([]);
    const [friends, setFriends] = useState<Array<{ id: string; name: string }>>([]);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        // Simulate fetching tabs and data from backend
        setTimeout(() => {
            setTabList(['Players', 'Games', 'Friends']);
            setPlayers([]); // [] for no players, or add objects for players
            setGames([]); // [] for no games, or add objects for games
            setFriends([]); // [] for no friends, or add objects for friends
            setLoading(false);
        }, 700);
    }, []);

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
                <>
                    {games.length === 0 ? (
                        <View style={styles.playersPlaceholder}>
                            <Text style={styles.placeholderText}>No games available</Text>
                        </View>
                    ) : (
                        games.map(game => (
                            <View key={game.id} style={styles.playersPlaceholder}>
                                <Text style={styles.placeholderText}>{game.title}</Text>
                            </View>
                        ))
                    )}
                </>
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
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: '#047857',
        // borderBottomLeftRadius: 32,
        // borderBottomRightRadius: 32,
        paddingHorizontal: 24,
        // 5. The fixed paddingTop is removed from here
        paddingBottom: 28, // Restored to your original value
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
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        marginHorizontal: 24,
        marginTop: 8, // Restored to your original positive margin
        marginBottom: 16,
        padding: 4,
        justifyContent: 'space-between',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 16, // Restored
        alignItems: 'center',
        marginHorizontal: 2,
    },
    tabButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
    },
    tabText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '500',
    },
    tabTextActive: {
        color: '#111827',
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
        color: '#111827',
    },
    playersCount: {
        fontSize: 16,
        color: '#6B7280',
    },
    playersPlaceholder: {
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        marginHorizontal: 24,
        marginTop: 16,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        color: '#6B7280',
        fontSize: 16,
        textAlign: 'center',
    },
});