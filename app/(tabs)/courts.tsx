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
					<TouchableOpacity 
						style={courtsStyles.venueCard}
						onPress={() => router.push({ pathname: '/VenueDetailsScreen', params: { venueId: item.id } })}
						activeOpacity={0.7}
					>
						<View style={courtsStyles.venueCardContent}>
							<View style={courtsStyles.venueHeader}>
								<View style={courtsStyles.venueMainInfo}>
									<Text style={courtsStyles.venueName}>{item.name}</Text>
									<View style={courtsStyles.venueRatingContainer}>
										<Ionicons name="star" size={14} color="#F59E0B" />
										<Text style={courtsStyles.venueRating}>{item.rating}</Text>
										<Text style={courtsStyles.venueReviews}>({item.reviews})</Text>
									</View>
								</View>
								<View style={courtsStyles.venuePriceContainer}>
									<Text style={courtsStyles.venuePrice}>₹{item.price}</Text>
									<Text style={courtsStyles.venuePriceUnit}>/hr</Text>
								</View>
							</View>
							
							<View style={courtsStyles.venueLocationContainer}>
								<Ionicons name="location-outline" size={14} color="#6B7280" />
								<Text style={courtsStyles.venueLocation} numberOfLines={1}>
									{item.location}
								</Text>
							</View>
							
							<View style={courtsStyles.venueFooter}>
								<View style={courtsStyles.venueAmenities}>
									<Ionicons name="car-outline" size={14} color="#6B7280" />
									<Ionicons name="sunny-outline" size={14} color="#6B7280" />
									<Ionicons name="water-outline" size={14} color="#6B7280" />
								</View>
								<View style={courtsStyles.bookButtonContainer}>
									<Text style={courtsStyles.bookButtonText}>View Details</Text>
									<Ionicons name="chevron-forward" size={16} color="#059669" />
								</View>
							</View>
						</View>
					</TouchableOpacity>
				)}
			/>
		</View>
	);
}

