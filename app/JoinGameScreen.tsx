import React from 'react';
import {
    buttonStyles,
    cardStyles,
    joinGameStyles,
    joinGameTextStyles
} from '@/styles/screens/JoinGameScreen';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function JoinGameScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <View style={joinGameStyles.container}>
                {/* Header */}
                <View style={[joinGameStyles.header, { paddingTop: insets.top + 20 }]}>
                    <View style={joinGameStyles.headerContent}>
                        <TouchableOpacity onPress={() => router.back()} style={joinGameStyles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text style={joinGameStyles.headerTitle}>Join Game</Text>
                            <Text style={joinGameStyles.headerSubtitle}>Find players and join games</Text>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <View style={joinGameStyles.content}>
                    <View style={joinGameStyles.comingSoonCard}>
                        <Ionicons name="game-controller-outline" size={64} color="#047857" />
                        <Text style={joinGameStyles.comingSoonTitle}>Coming Soon!</Text>
                        <Text style={joinGameStyles.comingSoonText}>
                            This feature is under development. Soon you'll be able to join individual games here.
                        </Text>
                        <Text style={joinGameStyles.suggestionText}>
                            For now, check out "Join Games" in the Social tab to find available games.
                        </Text>
                        <TouchableOpacity 
                            style={joinGameStyles.navigateButton}
                            onPress={() => router.push('/JoinGamesScreen')}
                        >
                            <Text style={joinGameStyles.navigateButtonText}>Go to Join Games</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </>
    );
}
