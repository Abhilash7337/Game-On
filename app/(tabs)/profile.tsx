import AppHeader from '@/src/common/components/AppHeader';
import {
    buttonStyles,
    cardStyles,
    profileStyles,
    profileTextStyles
} from '@/styles/screens/ProfileScreen';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
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
	const [user, setUser] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [tab, setTab] = useState('Stats');
	const [userBookings, setUserBookings] = useState<Booking[]>([]);

	useEffect(() => {
		setTimeout(() => {
			setUser(demoUser);
			setLoading(false);
		}, 700);

		// Subscribe to booking updates
		const updateBookings = () => {
			setUserBookings(bookingStore.getAllBookings());
		};

		updateBookings();
		const unsubscribe = bookingStore.subscribe(updateBookings);

		return () => unsubscribe();
	}, []);

	if (loading || !user) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
				<ActivityIndicator size="large" color="#047857" />
			</View>
		);
	}

	const completedBookings = userBookings.filter((booking) => booking.status === 'completed');
	const upcomingBookings = userBookings.filter((booking) => booking.status === 'upcoming');
	const averageRating = demoRatings.length > 0 ? (demoRatings.reduce((a, b) => a + b, 0) / demoRatings.length).toFixed(1) : 'N/A';
	const levelProgress = Math.min(((user.gamesPlayed || 0) * 10) % 100, 100);
	const currentLevel = Math.floor((user.gamesPlayed || 0) / 10) + 1;

	return (
		<ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ paddingBottom: 32 }}>
			<AppHeader 
				title="Profile" 
				subtitle="Your game stats and bookings"
			/>
			
			{/* User Info Section */}
			<View style={profileStyles.userInfoSection}>
				<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
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
					<View style={{ marginLeft: 16, flex: 1 }}>
						<Text style={[profileStyles.name, { fontSize: responsiveFontSize(22) }]}>{user.firstName} {user.lastName}</Text>
															<Text style={[profileStyles.email, { fontSize: responsiveFontSize(14), marginTop: 6, alignSelf: 'flex-start' }]}>{user.phone}</Text>
																							<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, width: '100%' }}>
																								<Text style={[profileStyles.email, { fontSize: responsiveFontSize(14), marginRight: 10, textAlign: 'left', flexShrink: 0 }]}>{user.gender}</Text>
																								<Text style={[profileStyles.email, { fontSize: responsiveFontSize(14), textAlign: 'left', flexShrink: 0 }]}>{user.age}</Text>
																							</View>
					</View>
				</View>
				<View style={profileStyles.levelBox}>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
						<Text style={[profileStyles.levelText, { fontSize: responsiveFontSize(13) }]}>Level {currentLevel}</Text>
						<Text style={[profileStyles.levelText, { fontSize: responsiveFontSize(13) }]}>{levelProgress}%</Text>
					</View>
					<View style={profileStyles.progressBarBg}>
						<View style={[profileStyles.progressBar, { width: `${levelProgress}%` }]} />
					</View>
				</View>
			</View>

			{/* Tabs */}
			<View style={profileStyles.tabsRow}>
				{TABS.map((t) => (
					<TouchableOpacity key={t} style={[profileStyles.tabBtn, tab === t && profileStyles.tabBtnActive]} onPress={() => setTab(t)}>
						<Text style={[profileStyles.tabBtnText, tab === t && profileStyles.tabBtnTextActive, { fontSize: responsiveFontSize(15) }]}>{t}</Text>
					</TouchableOpacity>
				))}
			</View>

			{/* Tab Content */}
			{tab === 'Stats' && (
				<View style={{ padding: 16 }}>
					<View style={profileStyles.statsGrid}>
						<View style={profileStyles.statCard}>
							  <Text style={[profileStyles.statValue, { fontSize: responsiveFontSize(20) }]}>{user.gamesPlayed || 0}</Text>
							  <Text style={[profileStyles.statLabel, { fontSize: responsiveFontSize(13) }]}>Games Played</Text>
						</View>
						<View style={profileStyles.statCard}>
							  <Text style={[profileStyles.statValue, { fontSize: responsiveFontSize(20) }]}>{user.hoursPlayed || 0}h</Text>
							  <Text style={[profileStyles.statLabel, { fontSize: responsiveFontSize(13) }]}>Hours Played</Text>
						</View>
						<View style={profileStyles.statCard}>
							  <Text style={[profileStyles.statValue, { fontSize: responsiveFontSize(20) }]}>#{user.ranking || 'N/A'}</Text>
							  <Text style={[profileStyles.statLabel, { fontSize: responsiveFontSize(13) }]}>Ranking</Text>
						</View>
						<View style={profileStyles.statCard}>
							  <Text style={[profileStyles.statValue, { fontSize: responsiveFontSize(20) }]}>{averageRating}</Text>
							  <Text style={[profileStyles.statLabel, { fontSize: responsiveFontSize(13) }]}>Rating</Text>
						</View>
					</View>
					<View style={profileStyles.sectionCard}>
						<Text style={[profileStyles.sectionTitle, { fontSize: responsiveFontSize(16) }]}>Preferred Sports</Text>
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
							{user.preferredSports && user.preferredSports.length > 0 ? (
								user.preferredSports.map((sport: string) => (
									<View key={sport} style={profileStyles.sportBadge}>
										<Text style={[profileStyles.sportBadgeText, { fontSize: responsiveFontSize(12) }]}>{sport.replace('_', ' ')}</Text>
									</View>
								))
							) : (
								<Text style={{ color: '#6b7280', fontSize: responsiveFontSize(13) }}>No preferences set</Text>
							)}
						</View>
					</View>
					<View style={profileStyles.sectionCard}>
						<Text style={[profileStyles.sectionTitle, { fontSize: responsiveFontSize(16) }]}>Recent Activity</Text>
						{completedBookings.length > 0 ? (
							completedBookings.slice(0, 3).map((booking) => (
								<View key={booking.id} style={profileStyles.activityRow}>
														<View style={profileStyles.activityIcon}><Text style={{ color: '#047857', fontSize: responsiveFontSize(16) }}>✓</Text></View>
														<View style={{ flex: 1 }}>
															<Text style={[profileStyles.activityTitle, { fontSize: responsiveFontSize(14) }]}>Completed {booking.bookingType} at {booking.venue}</Text>
															<Text style={[profileStyles.activityDate, { fontSize: responsiveFontSize(12) }]}>{booking.date.toLocaleDateString()}</Text>
									</View>
								</View>
							))
						) : (
							  <Text style={{ color: '#6b7280', fontSize: responsiveFontSize(13) }}>No recent activity</Text>
						)}
					</View>
				</View>
			)}
			{tab === 'Games' && (
				<View style={{ padding: 16 }}>
					<View style={profileStyles.sectionCard}>
						<Text style={[profileStyles.sectionTitle, { fontSize: responsiveFontSize(16) }]}>Upcoming Games ({upcomingBookings.length})</Text>
						{upcomingBookings.length > 0 ? (
							upcomingBookings.map((booking) => (
								<View key={booking.id} style={profileStyles.gameRow}>
									<View>
										<Text style={[profileStyles.gameTitle, { fontSize: responsiveFontSize(14) }]}>{booking.bookingType} at {booking.venue}</Text>
										<Text style={[profileStyles.gameDate, { fontSize: responsiveFontSize(12) }]}>{booking.date.toLocaleDateString()} at {booking.time}</Text>
									</View>
									<View style={profileStyles.playersBadge}>
										<Text style={[profileStyles.playersBadgeText, { fontSize: responsiveFontSize(13) }]}>{booking.court}</Text>
									</View>
								</View>
							))
						) : (
							<Text style={{ color: '#6b7280', fontSize: responsiveFontSize(13) }}>No upcoming games</Text>
						)}
					</View>
					<View style={profileStyles.sectionCard}>
						<Text style={[profileStyles.sectionTitle, { fontSize: responsiveFontSize(16) }]}>Game History ({completedBookings.length})</Text>
						{completedBookings.length > 0 ? (
							completedBookings.slice(0, 5).map((booking) => (
								<View key={booking.id} style={profileStyles.gameRow}>
									<View>
										<Text style={[profileStyles.gameTitle, { fontSize: responsiveFontSize(14) }]}>{booking.bookingType} at {booking.venue}</Text>
										<Text style={[profileStyles.gameDate, { fontSize: responsiveFontSize(12) }]}>{booking.date.toLocaleDateString()}</Text>
									</View>
									<View style={[profileStyles.playersBadge, { backgroundColor: '#e5e7eb' }] }>
										<Text style={[profileStyles.playersBadgeText, { color: '#374151', fontSize: responsiveFontSize(13) }]}>Completed</Text>
									</View>
								</View>
							))
						) : (
							  <Text style={{ color: '#6b7280', fontSize: responsiveFontSize(13) }}>No completed games</Text>
						)}
					</View>
				</View>
			)}
			{tab === 'Bookings' && (
				<View style={{ padding: 16 }}>
					<View style={profileStyles.sectionCard}>
						<Text style={[profileStyles.sectionTitle, { fontSize: responsiveFontSize(16) }]}>Booking History</Text>
						{userBookings.length > 0 ? (
							userBookings.map((booking) => (
								<View key={booking.id} style={profileStyles.bookingRow}>
									<View style={{ flex: 1 }}>
										<Text style={[profileStyles.bookingTitle, { fontSize: responsiveFontSize(14) }]}>{booking.court} at {booking.venue}</Text>
										<Text style={[profileStyles.bookingDate, { fontSize: responsiveFontSize(12) }]}>{booking.date.toLocaleDateString()} at {booking.time}</Text>
										<Text style={[profileStyles.bookingAmount, { fontSize: responsiveFontSize(13) }]}>₹{booking.price}</Text>
									</View>
									<View style={[profileStyles.bookingStatus, booking.status === 'upcoming' ? { backgroundColor: '#bbf7d0' } : booking.status === 'completed' ? { backgroundColor: '#dbeafe' } : { backgroundColor: '#e5e7eb' }] }>
										<Text style={[profileStyles.bookingStatusText, { fontSize: responsiveFontSize(13) }]}>{booking.status}</Text>
									</View>
								</View>
							))
						) : (
							  <Text style={{ color: '#6b7280', fontSize: responsiveFontSize(13) }}>No bookings found</Text>
						)}
					</View>
				</View>
			)}
		</ScrollView>
	);
}

