import { ErrorBoundary } from '@/src/common/components/ErrorBoundary';
import { LoadingState } from '@/src/common/components/LoadingState';
import { calculateDistance, formatDistance } from '@/src/common/utils/distanceCalculator';
import { dataPrefetchService } from '@/src/common/services/dataPrefetch';
import { LocationCacheService } from '@/src/common/services/locationCache';
import { courtsStyles } from '@/styles/screens/CourtsScreen';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Animated, Dimensions, FlatList, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



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
		coordinates?: {latitude: number; longitude: number};
	}[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [expandedVenue, setExpandedVenue] = useState<string | null>(null);
	const [animationValues] = useState<{[key: string]: Animated.Value}>({});
	const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
	const [dataSource, setDataSource] = useState<'cache' | 'fresh' | 'loading'>('loading');
	const insets = useSafeAreaInsets();
	const { width } = Dimensions.get('window');

	// ✅ Background refresh on tab focus
	useFocusEffect(
		useCallback(() => {
			const cache = dataPrefetchService.getCache();
			const cacheAge = dataPrefetchService.getCacheAge();
			
			// If cache older than 2 minutes, refresh in background
			if (cacheAge > 2 * 60 * 1000) {
				console.log('🔄 [COURTS] Cache stale, refreshing in background...');
				dataPrefetchService.prefetchAll().then(() => {
					// Update venues from fresh cache
					const freshCache = dataPrefetchService.getCache();
					if (freshCache) {
						const venuesWithDistance = freshCache.venues.map(v => {
							let distanceText = 'N/A';
							
							if (freshCache.userLocation && v.location) {
								try {
									// Parse location if it's a string
									let venueCoords = v.location;
									if (typeof v.location === 'string') {
										venueCoords = JSON.parse(v.location);
									}
									
									// Handle different coordinate formats
									let venueLat, venueLng;
									if (venueCoords.coordinates) {
										// GeoJSON format: [longitude, latitude]
										venueLat = venueCoords.coordinates[1];
										venueLng = venueCoords.coordinates[0];
									} else if (venueCoords.latitude && venueCoords.longitude) {
										// Direct lat/lng object
										venueLat = venueCoords.latitude;
										venueLng = venueCoords.longitude;
									}
									
									if (venueLat && venueLng) {
										const distance = calculateDistance(
											freshCache.userLocation.latitude,
											freshCache.userLocation.longitude,
											venueLat,
											venueLng
										);
										distanceText = formatDistance(distance);
									}
								} catch (error) {
									console.log('⚠️ [COURTS] Distance calculation error for venue:', v.name);
								}
							}
							
							return {
								...v,
								distance: distanceText,
								coordinates: v.location && v.location.coordinates ? {
									latitude: v.location.coordinates[1],
									longitude: v.location.coordinates[0]
								} : undefined
							};
						});
						setVenues(venuesWithDistance);
						console.log('✅ [COURTS] Background refresh completed');
					}
				}).catch(err => {
					console.error('❌ [COURTS] Background refresh failed:', err);
				});
			}
		}, [])
	);

	useEffect(() => {
		const initializeScreen = async () => {
			setLoading(true);
			
			// ✅ OPTIMIZATION: Try cache first for instant load!
			const cache = dataPrefetchService.getCache();
			if (cache && dataPrefetchService.isCacheFresh()) {
				console.log('⚡ [COURTS] Using cached data - INSTANT LOAD!');
				
				// Set venues and location from cache immediately
				const venuesWithDistance = cache.venues.map(v => {
					let distanceText = 'N/A';
					
					if (cache.userLocation && v.location) {
						try {
							// Parse location if it's a string
							let venueCoords = v.location;
							if (typeof v.location === 'string') {
								venueCoords = JSON.parse(v.location);
							}
							
							const distance = calculateDistance(
								cache.userLocation.latitude,
								cache.userLocation.longitude,
								venueCoords.latitude,
								venueCoords.longitude
							);
							distanceText = formatDistance(distance);
						} catch (error) {
							console.log('Distance calculation error for venue:', v.name);
						}
					}
					
					return {
						id: v.id,
						name: v.name,
						rating: v.rating || 0,
						reviews: 0,
						location: v.address || '',
						price: v.pricing?.basePrice || 0,
						image: v.images && v.images.length > 0 
							? `${v.images[0]}?w=300&h=150&q=80`
							: require('@/assets/images/partial-react-logo.png'),
						images: v.images || [],
						coordinates: v.location,
						distance: distanceText,
					};
				});
				
				setVenues(venuesWithDistance);
				setUserLocation(cache.userLocation);
				setDataSource('cache');
				setLoading(false);
				
				console.log(`✅ [COURTS] Loaded ${venuesWithDistance.length} venues from cache in <100ms`);
				return; // Done! Screen shows instantly ⚡
			}
			
			// ❌ Cache miss or stale - load fresh data
			console.log('📡 [COURTS] Cache miss/stale, loading fresh data...');
			setDataSource('loading');
			
			// ✅ OPTIMIZED: Use cached location (instant!)
			const coords = await LocationCacheService.getLocationFast();
			setUserLocation(coords);
			
			// Now load venues with the location we just got
			await loadVenues(false, coords);
			
			setDataSource('fresh');
			setLoading(false);
		};
		
		initializeScreen();
	}, []);

	// Refresh venues when screen comes into focus and reset expanded state
	useFocusEffect(
		useCallback(() => {
			// ✅ OPTIMIZATION: Only reload if cache is stale or we're using fresh data
			const shouldRefresh = dataSource === 'fresh' || !dataPrefetchService.isCacheFresh();
			
			if (shouldRefresh && dataSource === 'cache') {
				console.log('🔄 [COURTS] Cache is stale, refreshing...');
				loadVenues(false, userLocation);
			} else if (dataSource === 'cache') {
				console.log('⚡ [COURTS] Cache still fresh, no reload needed!');
			}
			
			// Always reset expanded venue when screen comes into focus
			setExpandedVenue(null);
		}, [dataSource, userLocation])
	);

	const getUserLocation = async (): Promise<{latitude: number; longitude: number} | null> => {
		try {
			console.log('📍 [COURTS] Requesting location permission...');
			// Request location permissions
			const { status } = await Location.requestForegroundPermissionsAsync();
			
			if (status !== 'granted') {
				console.log('❌ [COURTS] Location permission denied');
				// Don't show alert, just silently fail - distances will show as N/A
				return null;
			}

			console.log('📍 [COURTS] Getting current location...');
			// Get current location with lower accuracy for faster response
			const location = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.Low, // Changed from Balanced to Low for faster response
			});

			const userCoords = {
				latitude: location.coords.latitude,
				longitude: location.coords.longitude,
			};

			console.log('📍 [COURTS] User location obtained:', userCoords);
			
			// Set location state immediately
			setUserLocation(userCoords);
			
			return userCoords;
		} catch (error) {
			console.log('❌ [COURTS] Error getting location:', error);
			// Continue without location - distances won't be shown
			return null;
		}
	};

	const loadVenues = async (isRefresh = false, locationCoords?: {latitude: number; longitude: number} | null) => {
		if (isRefresh) {
			setRefreshing(true);
		}
		
		// Use passed location or state location
		const currentLocation = locationCoords || userLocation;
		
		try {
			const { VenueStorageService } = await import('@/src/common/services/venueStorage');
			const venuesData = await VenueStorageService.getPublicVenues();
			
			// Transform the data to match the expected format and calculate distances
			const transformedVenues = venuesData.map(venue => {
				let distanceText = 'N/A';
				
				// Calculate distance if user location is available and venue has coordinates
				if (currentLocation && venue.coordinates) {
					try {
						// Use coordinates directly from getPublicVenues
						const venueCoords = venue.coordinates;
						
						// Verify we have valid coordinates
						if (venueCoords && 
						    typeof venueCoords.latitude === 'number' && 
						    typeof venueCoords.longitude === 'number' &&
						    !isNaN(venueCoords.latitude) && 
						    !isNaN(venueCoords.longitude) &&
						    venueCoords.latitude !== 0 && 
						    venueCoords.longitude !== 0) {
							const distanceKm = calculateDistance(
								currentLocation.latitude,
								currentLocation.longitude,
								venueCoords.latitude,
								venueCoords.longitude
							);
							distanceText = formatDistance(distanceKm);
							console.log(`📍 Distance calculated for ${venue.name}: ${distanceText}`);
						} else {
							console.log('❌ Invalid coordinates for venue:', venue.name, venueCoords);
							distanceText = 'N/A';
						}
					} catch (error) {
						console.log('❌ Error calculating distance for venue:', venue.id, error);
						distanceText = 'N/A';
					}
				} else if (!currentLocation) {
					console.log('⚠️ User location not available for distance calculation');
					distanceText = 'N/A';
				} else if (!venue.coordinates) {
					console.log('⚠️ Venue coordinates not available for:', venue.name);
					distanceText = 'N/A';
				}
				
				return {
					...venue,
					image: venue.image || require('../../assets/images/partial-react-logo.png'),
					images: venue.images || [
						'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=300&h=150&fit=crop&q=80',
						'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=150&fit=crop&q=80',
						'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=150&fit=crop&q=80',
						'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=150&fit=crop&q=80',
					],
					distance: distanceText,
					coordinates: venue.coordinates,
				};
			});
			
			setVenues(transformedVenues);
			console.log('📍 [COURTS] Transformed venues with distances:', transformedVenues.map(v => ({
				name: v.name,
				distance: v.distance,
				hasCoordinates: !!v.coordinates
			})));
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
						'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=300&h=150&fit=crop&q=80',
						'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=150&fit=crop&q=80',
						'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=150&fit=crop&q=80',
						'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=150&fit=crop&q=80',
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
		console.log('🔄 [COURTS] Manual refresh triggered');
		setDataSource('loading'); // Force fresh data load
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
						{/* Main Venue Card - Make entire card clickable */}
						<TouchableOpacity 
							style={courtsStyles.venueCard}
							activeOpacity={0.7}
							onPress={() => router.push({ pathname: '/VenueDetailsScreen', params: { venueId: item.id } })}
						>
							{/* Image Container - Clickable for preview */}
							<TouchableOpacity 
								style={courtsStyles.imageContainer}
								activeOpacity={0.9}
								onPress={(e) => {
									e.stopPropagation();
									toggleImagePreview(item.id);
								}}
							>
								<Image 
									source={typeof item.image === 'string' ? { uri: item.image } : item.image} 
									style={courtsStyles.venueImage}
									resizeMode="cover"
									defaultSource={require('../../assets/images/partial-react-logo.png')}
								/>
								{/* Preview Button Overlay at Bottom of Image */}
								<View style={courtsStyles.imagePreviewButton}>
									<Text style={courtsStyles.imagePreviewText}>Preview</Text>
									<Ionicons 
										name={expandedVenue === item.id ? "chevron-up-outline" : "chevron-down-outline"} 
										size={12} 
										color="#FFFFFF" 
									/>
								</View>
							</TouchableOpacity>
							
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
									<View style={courtsStyles.bookBtn}>
										<Text style={courtsStyles.bookBtnText}>Book Now</Text>
									</View>
								</View>
							</View>
						</TouchableOpacity>
						
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
											resizeMode="cover"
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

