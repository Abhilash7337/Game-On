import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JoinGameScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
                    <View style={styles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={styles.headerTitle}>Join Game</Text>
                            <Text style={styles.headerSubtitle}>Find players and join games</Text>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <View style={styles.comingSoonCard}>
                        <Ionicons name="game-controller-outline" size={64} color="#047857" />
                        <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
                        <Text style={styles.comingSoonText}>
                            This feature is under development. Soon you'll be able to join individual games here.
                        </Text>
                        <Text style={styles.suggestionText}>
                            For now, check out "Join Games" in the Social tab to find available games.
                        </Text>
                        <TouchableOpacity 
                            style={styles.navigateButton}
                            onPress={() => router.push('/JoinGamesScreen')}
                        >
                            <Text style={styles.navigateButtonText}>Go to Join Games</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        backgroundColor: '#047857',
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 12,
        padding: 4,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    headerSubtitle: {
        color: '#fff',
        fontSize: 14,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    comingSoonCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    comingSoonTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#047857',
        marginTop: 16,
        marginBottom: 12,
    },
    comingSoonText: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 16,
    },
    suggestionText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    navigateButton: {
        backgroundColor: '#047857',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    navigateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});