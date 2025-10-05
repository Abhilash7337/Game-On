import AppHeader from '@/src/common/components/AppHeader';
import {
    buttonStyles,
    cardStyles,
    courtsStyles,
    courtsTextStyles
} from '@/styles/screens/CourtsScreen';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
			<View style={courtsStyles.container}>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<ActivityIndicator size="large" color="#047857" />
				</View>
			</View>
		);
	}

	return (
		<View style={courtsStyles.container}>
			<AppHeader 
				title="Venues" 
				subtitle="Find courts near you"
			/>

			{/* Search and Filter Section */}
			<View style={courtsStyles.searchSection}>
				<TextInput
					style={courtsStyles.searchInput}
					placeholder="Search for venues..."
					placeholderTextColor="#666"
					value={search}
					onChangeText={setSearch}
				/>
				<View style={courtsStyles.radiusRow}>
					<Text style={courtsStyles.radiusLabel}>Radius:</Text>
					<TouchableOpacity style={courtsStyles.radiusChip}>
						<Text style={courtsStyles.radiusChipText}>{radius}</Text>
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
					<View style={courtsStyles.venueCard}>
						<Image source={item.image} style={courtsStyles.venueImage} />
						<View style={courtsStyles.venueInfo}>
							<View style={courtsStyles.venueTopRow}>
								<Text style={courtsStyles.venueName}>{item.name}</Text>
								<Text style={courtsStyles.venueRating}>{item.rating} ({item.reviews})</Text>
							</View>
							<Text style={courtsStyles.venueLocation}>{item.location}</Text>
							<View style={courtsStyles.venueBottomRow}>
								<Text style={courtsStyles.venuePrice}>From ₹{item.price}/hour</Text>
														<TouchableOpacity
															style={courtsStyles.bookBtn}
															onPress={() => router.push({ pathname: '/VenueDetailsScreen', params: { venueId: item.id } })}
														>
															<Text style={courtsStyles.bookBtnText}>Book Now</Text>
														</TouchableOpacity>
							</View>
						</View>
					</View>
				)}
			/>
		</View>
	);
}

