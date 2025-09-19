import AppHeader from '@/src/common/components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



export default function CourtsScreen() {
	const router = useRouter();
	const [search, setSearch] = useState('');
	const [radius, setRadius] = useState('5 km');
	const [venues, setVenues] = useState<Array<{
		id: string;
		name: string;
		rating: number;
		reviews: number;
		location: string;
		price: number;
		image: any;
	}>>([]);
	const [loading, setLoading] = useState(true);
	const insets = useSafeAreaInsets();

	useEffect(() => {
		// Simulate fetching venues from backend
		setTimeout(() => {
			setVenues([
				{
					id: '1',
					name: 'Mahindra Court',
					rating: 4.2,
					reviews: 7,
					location: 'Located at Mahindra University, Bahadurpally',
					price: 170,
					image: require('../../assets/images/partial-react-logo.png'),
				},
				// Add more venues here or leave empty for no venues
			]);
			setLoading(false);
		}, 700);
	}, []);

	const filteredVenues = venues.filter((v) => v.name.toLowerCase().includes(search.toLowerCase()));

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
			<AppHeader 
				title="Venues" 
				subtitle="Find courts near you"
			/>

			{/* Search and Filter Section */}
			<View style={styles.searchSection}>
				<TextInput
					style={styles.searchInput}
					placeholder="Search for venues..."
					placeholderTextColor="#666"
					value={search}
					onChangeText={setSearch}
				/>
				<View style={styles.radiusRow}>
					<Text style={styles.radiusLabel}>Radius:</Text>
					<TouchableOpacity style={styles.radiusChip}>
						<Text style={styles.radiusChipText}>{radius}</Text>
						<Ionicons name="chevron-down" size={16} color="#047857" style={{ marginLeft: 4 }} />
					</TouchableOpacity>
				</View>
			</View>

			{/* Body Content */}
			<FlatList
				data={filteredVenues}
				keyExtractor={item => item.id}
				contentContainerStyle={{ padding: 24, paddingBottom: 24 }}
				ListEmptyComponent={
					<View style={{ alignItems: 'center', marginTop: 32 }}>
						<Text style={{ color: '#6B7280', fontSize: 16 }}>No venues found.</Text>
					</View>
				}
				renderItem={({ item }) => (
					<View style={styles.venueCard}>
						<Image source={item.image} style={styles.venueImage} />
						<View style={styles.venueInfo}>
							<View style={styles.venueTopRow}>
								<Text style={styles.venueName}>{item.name}</Text>
								<Text style={styles.venueRating}>{item.rating} ({item.reviews})</Text>
							</View>
							<Text style={styles.venueLocation}>{item.location}</Text>
							<View style={styles.venueBottomRow}>
								<Text style={styles.venuePrice}>From ₹{item.price}/hour</Text>
														<TouchableOpacity
															style={styles.bookBtn}
															onPress={() => router.push({ pathname: '/VenueDetailsScreen', params: { venueId: item.id } })}
														>
															<Text style={styles.bookBtnText}>Book Now</Text>
														</TouchableOpacity>
							</View>
						</View>
					</View>
				)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#F9FAFB',
	},
	searchSection: {
		backgroundColor: '#fff',
		paddingHorizontal: 24,
		paddingVertical: 16,
		marginHorizontal: 16,
		marginBottom: 16,
		borderRadius: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.07,
		shadowRadius: 6,
		elevation: 4,
	},
	searchInput: {
		backgroundColor: '#F3F4F6',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		color: '#111827',
		fontSize: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: '#E5E7EB',
	},
	radiusRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	radiusLabel: {
		color: '#111827',
		fontSize: 16,
		marginRight: 8,
	},
	radiusChip: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#047857',
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	radiusChipText: {
		color: '#fff',
		fontSize: 14,
	},
	venueCard: {
		backgroundColor: '#fff',
		borderRadius: 16,
		marginBottom: 24,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.07,
		shadowRadius: 6,
		elevation: 4,
	},
	venueImage: {
		width: '100%',
		height: 160,
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		resizeMode: 'cover',
	},
	venueInfo: {
		padding: 16,
	},
	venueTopRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	venueName: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#111827',
	},
	venueRating: {
		fontSize: 16,
		color: '#6B7280',
	},
	venueLocation: {
		fontSize: 14,
		color: '#6B7280',
		marginBottom: 12,
	},
	venueBottomRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	venuePrice: {
		fontSize: 18,
		color: '#047857',
		fontWeight: '500',
	},
		bookBtn: {
			backgroundColor: '#EA580C',
			borderRadius: 16,
			paddingHorizontal: 20,
			paddingVertical: 10,
		},
	bookBtnText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
