import AppHeader from '@/src/common/components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
			<View style={styles.userInfoSection}>
				<View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
					{user.profileImageUrl ? (
						<Image
							source={{ uri: user.profileImageUrl }}
							style={styles.avatar}
						/>
					) : (
						<View style={[styles.avatar, styles.defaultAvatar]}>
							<Ionicons name="person" size={40} color="#047857" />
						</View>
					)}
					<View style={{ marginLeft: 16, flex: 1 }}>
						<Text style={[styles.name, { fontSize: responsiveFontSize(22) }]}>{user.firstName} {user.lastName}</Text>
															<Text style={[styles.email, { fontSize: responsiveFontSize(14), marginTop: 6, alignSelf: 'flex-start' }]}>{user.phone}</Text>
																							<View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, width: '100%' }}>
																								<Text style={[styles.email, { fontSize: responsiveFontSize(14), marginRight: 10, textAlign: 'left', flexShrink: 0 }]}>{user.gender}</Text>
																								<Text style={[styles.email, { fontSize: responsiveFontSize(14), textAlign: 'left', flexShrink: 0 }]}>{user.age}</Text>
																							</View>
					</View>
				</View>
				<View style={styles.levelBox}>
					<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
						<Text style={[styles.levelText, { fontSize: responsiveFontSize(13) }]}>Level {currentLevel}</Text>
						<Text style={[styles.levelText, { fontSize: responsiveFontSize(13) }]}>{levelProgress}%</Text>
					</View>
					<View style={styles.progressBarBg}>
						<View style={[styles.progressBar, { width: `${levelProgress}%` }]} />
					</View>
				</View>
			</View>

			{/* Tabs */}
			<View style={styles.tabsRow}>
				{TABS.map((t) => (
					<TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
						<Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive, { fontSize: responsiveFontSize(15) }]}>{t}</Text>
					</TouchableOpacity>
				))}
			</View>

			{/* Tab Content */}
			{tab === 'Stats' && (
				<View style={{ padding: 16 }}>
					<View style={styles.statsGrid}>
						<View style={styles.statCard}>
							  <Text style={[styles.statValue, { fontSize: responsiveFontSize(20) }]}>{user.gamesPlayed || 0}</Text>
							  <Text style={[styles.statLabel, { fontSize: responsiveFontSize(13) }]}>Games Played</Text>
						</View>
						<View style={styles.statCard}>
							  <Text style={[styles.statValue, { fontSize: responsiveFontSize(20) }]}>{user.hoursPlayed || 0}h</Text>
							  <Text style={[styles.statLabel, { fontSize: responsiveFontSize(13) }]}>Hours Played</Text>
						</View>
						<View style={styles.statCard}>
							  <Text style={[styles.statValue, { fontSize: responsiveFontSize(20) }]}>#{user.ranking || 'N/A'}</Text>
							  <Text style={[styles.statLabel, { fontSize: responsiveFontSize(13) }]}>Ranking</Text>
						</View>
						<View style={styles.statCard}>
							  <Text style={[styles.statValue, { fontSize: responsiveFontSize(20) }]}>{averageRating}</Text>
							  <Text style={[styles.statLabel, { fontSize: responsiveFontSize(13) }]}>Rating</Text>
						</View>
					</View>
					<View style={styles.sectionCard}>
						<Text style={[styles.sectionTitle, { fontSize: responsiveFontSize(16) }]}>Preferred Sports</Text>
						<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
							{user.preferredSports && user.preferredSports.length > 0 ? (
								user.preferredSports.map((sport: string) => (
									<View key={sport} style={styles.sportBadge}>
										<Text style={[styles.sportBadgeText, { fontSize: responsiveFontSize(12) }]}>{sport.replace('_', ' ')}</Text>
									</View>
								))
							) : (
								<Text style={{ color: '#6b7280', fontSize: responsiveFontSize(13) }}>No preferences set</Text>
							)}
						</View>
					</View>
					<View style={styles.sectionCard}>
						<Text style={[styles.sectionTitle, { fontSize: responsiveFontSize(16) }]}>Recent Activity</Text>
						{completedBookings.length > 0 ? (
							completedBookings.slice(0, 3).map((booking) => (
								<View key={booking.id} style={styles.activityRow}>
														<View style={styles.activityIcon}><Text style={{ color: '#047857', fontSize: responsiveFontSize(16) }}>✓</Text></View>
														<View style={{ flex: 1 }}>
															<Text style={[styles.activityTitle, { fontSize: responsiveFontSize(14) }]}>Completed {booking.bookingType} at {booking.venue}</Text>
															<Text style={[styles.activityDate, { fontSize: responsiveFontSize(12) }]}>{booking.date.toLocaleDateString()}</Text>
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
					<View style={styles.sectionCard}>
						<Text style={[styles.sectionTitle, { fontSize: responsiveFontSize(16) }]}>Upcoming Games ({upcomingBookings.length})</Text>
						{upcomingBookings.length > 0 ? (
							upcomingBookings.map((booking) => (
								<View key={booking.id} style={styles.gameRow}>
									<View>
										<Text style={[styles.gameTitle, { fontSize: responsiveFontSize(14) }]}>{booking.bookingType} at {booking.venue}</Text>
										<Text style={[styles.gameDate, { fontSize: responsiveFontSize(12) }]}>{booking.date.toLocaleDateString()} at {booking.time}</Text>
									</View>
									<View style={styles.playersBadge}>
										<Text style={[styles.playersBadgeText, { fontSize: responsiveFontSize(13) }]}>{booking.court}</Text>
									</View>
								</View>
							))
						) : (
							<Text style={{ color: '#6b7280', fontSize: responsiveFontSize(13) }}>No upcoming games</Text>
						)}
					</View>
					<View style={styles.sectionCard}>
						<Text style={[styles.sectionTitle, { fontSize: responsiveFontSize(16) }]}>Game History ({completedBookings.length})</Text>
						{completedBookings.length > 0 ? (
							completedBookings.slice(0, 5).map((booking) => (
								<View key={booking.id} style={styles.gameRow}>
									<View>
										<Text style={[styles.gameTitle, { fontSize: responsiveFontSize(14) }]}>{booking.bookingType} at {booking.venue}</Text>
										<Text style={[styles.gameDate, { fontSize: responsiveFontSize(12) }]}>{booking.date.toLocaleDateString()}</Text>
									</View>
									<View style={[styles.playersBadge, { backgroundColor: '#e5e7eb' }] }>
										<Text style={[styles.playersBadgeText, { color: '#374151', fontSize: responsiveFontSize(13) }]}>Completed</Text>
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
					<View style={styles.sectionCard}>
						<Text style={[styles.sectionTitle, { fontSize: responsiveFontSize(16) }]}>Booking History</Text>
						{userBookings.length > 0 ? (
							userBookings.map((booking) => (
								<View key={booking.id} style={styles.bookingRow}>
									<View style={{ flex: 1 }}>
										<Text style={[styles.bookingTitle, { fontSize: responsiveFontSize(14) }]}>{booking.court} at {booking.venue}</Text>
										<Text style={[styles.bookingDate, { fontSize: responsiveFontSize(12) }]}>{booking.date.toLocaleDateString()} at {booking.time}</Text>
										<Text style={[styles.bookingAmount, { fontSize: responsiveFontSize(13) }]}>₹{booking.price}</Text>
									</View>
									<View style={[styles.bookingStatus, booking.status === 'upcoming' ? { backgroundColor: '#bbf7d0' } : booking.status === 'completed' ? { backgroundColor: '#dbeafe' } : { backgroundColor: '#e5e7eb' }] }>
										<Text style={[styles.bookingStatusText, { fontSize: responsiveFontSize(13) }]}>{booking.status}</Text>
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

const styles = StyleSheet.create({
	userInfoSection: {
		backgroundColor: '#047857',
		paddingHorizontal: 20,
		paddingVertical: 20,
		marginHorizontal: 16,
		marginBottom: 16,
		borderRadius: 16,
	},
	header: {
		backgroundColor: '#047857',
		paddingHorizontal: 20,
		paddingBottom: 24,
		marginBottom: 12,
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		borderWidth: 3,
		borderColor: '#fff',
	},
	defaultAvatar: {
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},
	name: {
		fontWeight: 'bold',
		fontSize: 22,
		color: '#fff',
	},
	email: {
		color: '#d1fae5',
		fontSize: 14,
		marginTop: 2,
	},
	badge: {
		borderRadius: 12,
		paddingHorizontal: 10,
		paddingVertical: 4,
		borderWidth: 1,
		alignSelf: 'center',
		marginBottom: 0,
	},
	badgeText: {
		fontSize: 12,
		fontWeight: 'bold',
	},
	levelBox: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 10,
		marginTop: 8,
	},
	levelText: {
		fontSize: 13,
		color: '#047857',
		fontWeight: 'bold',
	},
	progressBarBg: {
		height: 8,
		backgroundColor: '#e5e7eb',
		borderRadius: 8,
		overflow: 'hidden',
	},
	progressBar: {
		height: 8,
		backgroundColor: '#047857',
		borderRadius: 8,
	},
	tabsRow: {
		flexDirection: 'row',
		backgroundColor: '#f3f4f6',
		borderRadius: 16,
		marginHorizontal: 16,
		marginTop: 8,
		marginBottom: 8,
		padding: 4,
	},
	tabBtn: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 12,
		alignItems: 'center',
	},
	tabBtnActive: {
		backgroundColor: '#fff',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.07,
		shadowRadius: 6,
		elevation: 2,
	},
	tabBtnText: {
		color: '#6B7280',
		fontSize: 15,
		fontWeight: 'bold',
	},
	tabBtnTextActive: {
		color: '#047857',
	},
	statsGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
		marginBottom: 16,
	},
	statCard: {
		backgroundColor: '#fff',
		borderRadius: 12,
		flexBasis: '47%',
		marginBottom: 10,
		padding: 16,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOpacity: 0.04,
		shadowRadius: 4,
		elevation: 1,
	},
	statValue: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#047857',
	},
	statLabel: {
		fontSize: 13,
		color: '#6b7280',
		marginTop: 2,
	},
	sectionCard: {
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 14,
		marginBottom: 14,
		shadowColor: '#000',
		shadowOpacity: 0.03,
		shadowRadius: 2,
		elevation: 1,
	},
	sectionTitle: {
		fontWeight: 'bold',
		fontSize: 16,
		color: '#047857',
		marginBottom: 6,
	},
	sportBadge: {
		backgroundColor: '#d1fae5',
		borderRadius: 8,
		paddingHorizontal: 8,
		paddingVertical: 2,
		marginRight: 4,
		marginBottom: 4,
	},
	sportBadgeText: {
		fontSize: 12,
		color: '#047857',
		fontWeight: 'bold',
	},
	activityRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	activityIcon: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: '#d1fae5',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},
	activityTitle: {
		fontWeight: 'bold',
		color: '#047857',
		fontSize: 14,
	},
	activityDate: {
		color: '#6b7280',
		fontSize: 12,
	},
	gameRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10,
		backgroundColor: '#f9fafb',
		borderRadius: 8,
		padding: 10,
	},
	gameTitle: {
		fontWeight: 'bold',
		color: '#047857',
		fontSize: 14,
	},
	gameDate: {
		color: '#6b7280',
		fontSize: 12,
	},
	playersBadge: {
		backgroundColor: '#bbf7d0',
		borderRadius: 8,
		paddingHorizontal: 8,
		paddingVertical: 2,
	},
	playersBadgeText: {
		color: '#047857',
		fontWeight: 'bold',
		fontSize: 13,
	},
	bookingRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10,
		backgroundColor: '#f9fafb',
		borderRadius: 8,
		padding: 10,
	},
	bookingTitle: {
		fontWeight: 'bold',
		color: '#047857',
		fontSize: 14,
	},
	bookingDate: {
		color: '#6b7280',
		fontSize: 12,
	},
	bookingAmount: {
		color: '#ea580c',
		fontWeight: 'bold',
		fontSize: 13,
		marginTop: 2,
	},
	bookingStatus: {
		borderRadius: 8,
		paddingHorizontal: 8,
		paddingVertical: 2,
	},
	bookingStatusText: {
		fontWeight: 'bold',
		fontSize: 13,
		color: '#047857',
	},
	achievementRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10,
		backgroundColor: '#f9fafb',
		borderRadius: 8,
		padding: 10,
	},
	achievementIcon: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},
	achievementTitle: {
		fontWeight: 'bold',
		fontSize: 14,
	},
	achievementDesc: {
		color: '#6b7280',
		fontSize: 12,
	},
	achievementBadge: {
		backgroundColor: '#ea580c',
		borderRadius: 8,
		paddingHorizontal: 8,
		paddingVertical: 2,
		marginLeft: 8,
	},
	achievementBadgeText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 12,
	},
});
