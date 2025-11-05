import { ErrorBoundary } from '@/src/common/components/ErrorBoundary';
import { LoadingState } from '@/src/common/components/LoadingState';
import { courtsStyles } from '@/styles/screens/CourtsScreen';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Animated, Dimensions, FlatList, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { calculateDistance, formatDistance } from '@/src/common/utils/distanceCalculator';



export default function CourtsScreen() {
	const router = useRouter();
	const [venues, setVenues] = useState<{
		id: string;
		name: string;
		rating: number;
		reviews: number;
		location: string;
		price: number;
		image: string | any;
		images?: string[];
		distance?: string;
	}[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [expandedVenue, setExpandedVenue] = useState<string | null>(null);
	const [animationValues] = useState<{[key: string]: Animated.Value}>({});
	const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
	const insets = useSafeAreaInsets();
	const { width } = Dimensions.get('window');

	useEffect(() => {
		getUserLocation();
	}, []);

	useEffect(() => {
		loadVenues();
	}, [userLocation]); // Reload venues when user location changes

	// Refresh venues when screen comes into focus and reset expanded state
	useFocusEffect(
		useCallback(() => {
			getUserLocation();
			loadVenues();
			// Reset expanded venue when screen comes into focus
			setExpandedVenue(null);
		}, [])
	);

	const getUserLocation = async () => {
		try {
			// Request location permissions
			const { status } = await Location.requestForegroundPermissionsAsync();
			
			if (status !== 'granted') {
				Alert.alert(
					'Location Permission Required',
					'Please enable location access to see distances to venues.',
					[{ text: 'OK' }]
				);
				return;
			}

			// Get current location
			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Balanced,
			});

			setUserLocation({
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
			});
		} catch (error) {
			console.log('Error getting location:', error);
			// Continue without location - distances won't be shown
		}
	};

	const loadVenues = async (isRefresh = false) => {
		if (isRefresh) {
			setRefreshing(true);
		}
		
		try {
			const { VenueStorageService } = await import('@/src/common/services/venueStorage');
			const venuesData = await VenueStorageService.getPublicVenues();
			
			// Transform the data to match the expected format and calculate distances
			const transformedVenues = venuesData.map(venue => {
				let distanceText = 'N/A';
				
				// Calculate distance if user location is available and venue has location
				if (userLocation && venue.location) {
					try {
						// Parse venue location from JSONB format
						let venueCoords;
						if (typeof venue.location === 'string') {
							// Try to parse as JSON
							try {
								venueCoords = JSON.parse(venue.location);
							} catch (parseError) {
								// If parsing fails, it might be a plain text address, not coordinates
								console.log('Location is not JSON coordinates for venue:', venue.id);
								venueCoords = null;
							}
						} else {
							venueCoords = venue.location;
						}
						
						// Verify we have valid coordinates
						if (venueCoords && 
						    typeof venueCoords.latitude === 'number' && 
						    typeof venueCoords.longitude === 'number' &&
						    !isNaN(venueCoords.latitude) && 
						    !isNaN(venueCoords.longitude)) {
							const distanceKm = calculateDistance(
								userLocation.latitude,
								userLocation.longitude,
								venueCoords.latitude,
								venueCoords.longitude
							);
							distanceText = formatDistance(distanceKm);
						}
					} catch (error) {
						console.log('Error calculating distance for venue:', venue.id, error);
					}
				}
				
				return {
					...venue,
					image: venue.image || require('../../assets/images/partial-react-logo.png'),
					images: venue.images || [
						'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=200&fit=crop',
						'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
						'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop',
						'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=200&fit=crop',
					],
					distance: distanceText,
				};
			});
			
			setVenues(transformedVenues);
		} catch {
			// Error loading venues - fallback to default venue
			let distanceText = '2.5 km';
			
			// If we have user location, try to calculate distance to default venue
			if (userLocation) {
				// Mahindra University coordinates (example)
				const defaultVenueCoords = { latitude: 17.5985, longitude: 78.1239 };
				const distanceKm = calculateDistance(
					userLocation.latitude,
					userLocation.longitude,
					defaultVenueCoords.latitude,
					defaultVenueCoords.longitude
				);
				distanceText = formatDistance(distanceKm);
			}
			
			setVenues([
				{
					id: '1',
					name: 'Mahindra Court',
					rating: 4.2,
					reviews: 7,
					location: 'Located at Mahindra University, Bahadurpally',
					price: 170,
					image: require('../../assets/images/partial-react-logo.png'),
					images: [
						'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=200&fit=crop',
						'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
						'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop',
						'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=200&fit=crop',
					],
					distance: distanceText,
				},
			]);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	const onRefresh = () => {
		loadVenues(true);
	};

	const getAnimationValue = useCallback((venueId: string) => {
		if (!animationValues[venueId]) {
			animationValues[venueId] = new Animated.Value(0);
		}
		return animationValues[venueId];
	}, [animationValues]);

	const toggleImagePreview = useCallback((venueId: string) => {
		const animValue = getAnimationValue(venueId);
		
		if (expandedVenue === venueId) {
			// Collapse current venue
			Animated.timing(animValue, {
				toValue: 0,
				duration: 300,
				useNativeDriver: false,
			}).start(() => {
				setExpandedVenue(null);
			});
		} else {
			// Close any currently expanded venue first
			if (expandedVenue) {
				const currentAnimValue = getAnimationValue(expandedVenue);
				currentAnimValue.setValue(0);
			}
			
			// Expand new venue
			setExpandedVenue(venueId);
			// Reset animation value to 0 first, then animate to 1
			animValue.setValue(0);
			Animated.timing(animValue, {
				toValue: 1,
				duration: 300,
				useNativeDriver: false,
			}).start();
		}
	}, [expandedVenue, getAnimationValue]);

	const filteredVenues = venues; // No filtering needed since search is removed

	if (loading) {
		return (
			<ErrorBoundary>
				<View style={courtsStyles.container}>
					<LoadingState message="Loading venues..." />
				</View>
			</ErrorBoundary>
		);
	}

	return (
		<ErrorBoundary>
			<View style={courtsStyles.container}>
			{/* Make status bar icons dark for white background */}
			<StatusBar style="dark" />

			{/* Simple White Header */}
			<View style={[courtsStyles.header, { paddingTop: insets.top + 20 }]}>
				<Text style={courtsStyles.headerTitle}>Venues</Text>
			</View>

			{/* Body Content */}
			<View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
				<FlatList
					data={filteredVenues}
					keyExtractor={item => item.id}
					contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={['#047857']}
						tintColor="#047857"
					/>
				}
				ListEmptyComponent={
					<View style={{ alignItems: 'center', marginTop: 32 }}>
						<Ionicons name="location-outline" size={48} color="#9CA3AF" style={{ marginBottom: 16 }} />
						<Text style={{ color: '#6B7280', fontSize: 16, textAlign: 'center' }}>
							No venues found.
						</Text>
						<Text style={{ color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
							Pull down to refresh to load venues.
						</Text>
					</View>
				}
				renderItem={({ item }) => (
					<View>
						{/* Main Venue Card */}
						<View style={courtsStyles.venueCard}>
							{/* Image Container with Preview Button */}
							<View style={courtsStyles.imageContainer}>
								<Image 
									source={typeof item.image === 'string' ? { uri: item.image } : item.image} 
									style={courtsStyles.venueImage} 
								/>
								{/* Preview Button Overlay at Bottom of Image */}
								<TouchableOpacity 
									style={courtsStyles.imagePreviewButton}
									onPress={() => toggleImagePreview(item.id)}
								>
									<Text style={courtsStyles.imagePreviewText}>Preview</Text>
									<Ionicons 
										name={expandedVenue === item.id ? "chevron-up-outline" : "chevron-down-outline"} 
										size={12} 
										color="#FFFFFF" 
									/>
								</TouchableOpacity>
							</View>
							
							<View style={courtsStyles.venueInfo}>
								<View style={courtsStyles.venueHeader}>
									<Text style={courtsStyles.venueName}>{item.name}</Text>
									<View style={courtsStyles.venueRatingRow}>
										<Ionicons name="star" size={12} color="#EA580C" />
										<Text style={courtsStyles.venueRating}>{item.rating.toFixed(1)} ({item.reviews})</Text>
									</View>
								</View>
								
								<View style={courtsStyles.venueLocationRow}>
									<Ionicons name="location-outline" size={12} color="#6B7280" />
									<Text style={courtsStyles.venueDistance}>{item.distance}</Text>
								</View>
								
								<View style={courtsStyles.venueBottomRow}>
									<Text style={courtsStyles.venuePrice}>₹{item.price}/hr</Text>
									<TouchableOpacity
										style={courtsStyles.bookBtn}
										onPress={() => router.push({ pathname: '/VenueDetailsScreen', params: { venueId: item.id } })}
									>
										<Text style={courtsStyles.bookBtnText}>Book Now</Text>
									</TouchableOpacity>
								</View>
							</View>
						</View>
						
						{/* Expandable Image Preview */}
						{expandedVenue === item.id && (
							<Animated.View style={[
								courtsStyles.imagePreview,
								{
									height: getAnimationValue(item.id).interpolate({
										inputRange: [0, 1],
										outputRange: [0, 200],
									}),
									opacity: getAnimationValue(item.id),
								}
							]}>
								<ScrollView 
									horizontal 
									showsHorizontalScrollIndicator={false}
									style={courtsStyles.imageScroll}
									contentContainerStyle={courtsStyles.imageScrollContent}
								>
									{item.images?.map((imageUrl, index) => (
										<Image
											key={index}
											source={{ uri: imageUrl }}
											style={[courtsStyles.previewImage, { width: width * 0.7 }]}
										/>
									))}
								</ScrollView>
							</Animated.View>
						)}
					</View>
				)}
				/>
			</View>
		</View>
		</ErrorBoundary>
	);
}

