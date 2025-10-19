import { profileStyles } from '@/styles/screens/ProfileScreen';
import { UserAuthService } from '@/src/user/services/userAuth';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Booking, bookingStore } from '../../utils/bookingStore';

// Responsive font size utility
function responsiveFontSize(base: number) {
	const { width } = Dimensions.get('window');
	const minScale = 0.9;
	const maxScale = 1.15;
	let scale = width / 375;
	scale = Math.max(minScale, Math.min(scale, maxScale));
	if (Platform.OS === 'web') return base;
	return Math.round(base * scale);
}


const TABS = ['Stats', 'Games', 'Bookings'];

const demoUser = {
	id: '1',
	firstName: 'Demo',
	lastName: '',
	phone: '+91 9876543210',
	profileImageUrl: '',
	gender: 'Male',
	age: 24,
	gamesPlayed: 12,
	hoursPlayed: 34,
	ranking: 42,
	preferredSports: ['badminton', 'tennis'],
};

const demoGames = [
	{ id: 'g1', sport: 'badminton', status: 'completed', startTime: '2025-08-01T10:00:00', endTime: '2025-08-01T11:00:00', court: { name: 'Court 1', venue: { name: 'Mahindra Court' } }, currentPlayers: 4, maxPlayers: 6 },
	{ id: 'g2', sport: 'tennis', status: 'completed', startTime: '2025-08-10T10:00:00', endTime: '2025-08-10T11:00:00', court: { name: 'Court 2', venue: { name: 'Venue B' } }, currentPlayers: 2, maxPlayers: 4 },
	{ id: 'g3', sport: 'badminton', status: 'upcoming', startTime: '2025-09-01T10:00:00', endTime: '2025-09-01T11:00:00', court: { name: 'Court 1', venue: { name: 'Mahindra Court' } }, currentPlayers: 3, maxPlayers: 6 },
];

const demoRatings = [4, 5, 5, 4, 5];

const achievements = [
	{ title: 'First Game', description: 'Played your first game', completed: demoUser.gamesPlayed >= 1 },
	{ title: 'Regular Player', description: 'Played 10 games', completed: demoUser.gamesPlayed >= 10 },
	{ title: 'Social Butterfly', description: 'Played with 20 different players', completed: false },
	{ title: 'Marathon Player', description: 'Played for 50 hours', completed: demoUser.hoursPlayed >= 50 },
	{ title: 'Top Rated', description: 'Maintain 4.5+ star rating', completed: (demoRatings.reduce((a, b) => a + b, 0) / demoRatings.length) >= 4.5 },
];

function getSkillLevelColor(skillLevel?: string) {
	switch ((skillLevel || '').toLowerCase()) {
		case 'beginner':
			return { backgroundColor: '#bbf7d0', color: '#166534', borderColor: '#bbf7d0' };
		case 'intermediate':
			return { backgroundColor: '#fef9c3', color: '#a16207', borderColor: '#fef9c3' };
		case 'advanced':
			return { backgroundColor: '#fecaca', color: '#991b1b', borderColor: '#fecaca' };
		default:
			return { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#f3f4f6' };
	}
}

export default function ProfileScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [userBookings, setUserBookings] = useState<Booking[]>([]);

	useEffect(() => {
		const loadUserData = async () => {
			try {
				// Get current user session
				const currentUser = await UserAuthService.getCurrentSession();
				
				if (currentUser && currentUser.profile) {
					setUser({
						firstName: currentUser.profile.fullName.split(' ')[0] || 'User',
						lastName: currentUser.profile.fullName.split(' ').slice(1).join(' ') || '',
						phone: currentUser.profile.phone || 'No phone number',
						profileImageUrl: '',
					});
				} else {
					// Fallback to demo user if no session
					setUser(demoUser);
				}
			} catch (error) {
				console.error('Error loading user data:', error);
				setUser(demoUser);
			} finally {
				setLoading(false);
			}
		};

		loadUserData();

		// Subscribe to booking updates
		const updateBookings = async () => {
			setUserBookings(bookingStore.getAllBookings());
		};

		updateBookings();
		const unsubscribe = bookingStore.subscribe(updateBookings);

		return () => unsubscribe();
	}, []);

	const handleLogout = () => {
		Alert.alert(
			'Logout',
			'Are you sure you want to logout?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{ 
					text: 'Logout', 
					style: 'destructive',
					onPress: async () => {
						try {
							await UserAuthService.signOut();
							router.replace('/login');
						} catch (error) {
							console.error('Logout error:', error);
							Alert.alert('Error', 'Failed to logout. Please try again.');
						}
					}
				}
			]
		);
	};

	if (loading || !user) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
				<ActivityIndicator size="large" color="#047857" />
			</View>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: '#fff' }}>
			{/* Make status bar icons dark for white background */}
			<StatusBar style="dark" />

			{/* White Header matching Social Hub */}
			<View style={[profileStyles.header, { paddingTop: insets.top + 20 }]}>
				<Text style={profileStyles.headerTitle}>Profile</Text>
			</View>

			<ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
				{/* User Info Section */}
				<View style={profileStyles.userInfoSection}>
					<View style={profileStyles.userRow}>
						{user.profileImageUrl ? (
							<Image
								source={{ uri: user.profileImageUrl }}
								style={profileStyles.avatar}
							/>
						) : (
							<View style={[profileStyles.avatar, profileStyles.defaultAvatar]}>
								<Ionicons name="person" size={40} color="#047857" />
							</View>
						)}
						<View style={profileStyles.userDetails}>
							<Text style={profileStyles.userName}>{user.firstName} {user.lastName}</Text>
							<Text style={profileStyles.userPhone}>{user.phone}</Text>
						</View>
						<TouchableOpacity 
							style={profileStyles.editButton}
							onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon!')}
						>
							<Ionicons name="pencil" size={18} color="#047857" />
						</TouchableOpacity>
					</View>
				</View>

				{/* Menu List */}
				<View style={profileStyles.menuSection}>
					<TouchableOpacity 
						style={profileStyles.menuItem}
						onPress={() => Alert.alert('Coming Soon', 'My Bookings feature will be available soon!')}
					>
						<View style={profileStyles.menuItemLeft}>
							<Ionicons name="calendar-outline" size={24} color="#047857" />
							<Text style={profileStyles.menuItemText}>My Bookings</Text>
						</View>
						<Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
					</TouchableOpacity>

					<TouchableOpacity 
						style={profileStyles.menuItem}
						onPress={() => Alert.alert('Coming Soon', 'Notification Preferences will be available soon!')}
					>
						<View style={profileStyles.menuItemLeft}>
							<Ionicons name="notifications-outline" size={24} color="#047857" />
							<Text style={profileStyles.menuItemText}>Notification Preferences</Text>
						</View>
						<Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
					</TouchableOpacity>

					<TouchableOpacity 
						style={[profileStyles.menuItem, profileStyles.logoutItem]}
						onPress={handleLogout}
					>
						<View style={profileStyles.menuItemLeft}>
							<Ionicons name="log-out-outline" size={24} color="#DC2626" />
							<Text style={[profileStyles.menuItemText, profileStyles.logoutText]}>Logout</Text>
						</View>
						<Ionicons name="chevron-forward-outline" size={20} color="#9CA3AF" />
					</TouchableOpacity>
				</View>
			</ScrollView>
		</View>
	);
}

