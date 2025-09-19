import AppHeader from '@/src/common/components/AppHeader';
import {
  joinGamesStyles,
  joinGamesTextStyles
} from '@/styles/screens/JoinGamesScreen';
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Image, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get("window");

const games = [
  {
    id: '1',
    sport: 'Badminton',
    venue: 'Mahindra Court',
    court: 'Court B2',
    date: '2025-08-17',
    time: '20:47',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    players: 3,
    maxPlayers: 4,
    price: 40,
    organizer: 'Rajamouli',
    status: '1 spot left',
  },
];

export default function JoinGamesScreen() {
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedSport, setSelectedSport] = useState('Badminton');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const sports = ['Badminton', 'Tennis', 'Table Tennis', 'Squash', 'Football', 'Basketball'];

  return (
    <View style={joinGamesStyles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <AppHeader 
        title="Join Games" 
        subtitle="Find and join available games"
      />
      {/* Filter Button */}
      <View style={joinGamesStyles.filterContainer}>
        <TouchableOpacity style={joinGamesStyles.filterDropdown} onPress={() => setFilterModalVisible(true)}>
          <Text style={joinGamesTextStyles.filterDropdownText}>Filter</Text>
          <Ionicons name="options-outline" size={18} color="#6B7280" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '85%' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16, color: '#047857' }}>Filter Games</Text>
            {/* Sport Picker */}
            <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 6 }}>Sport</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
              {sports.map((sport) => (
                <TouchableOpacity
                  key={sport}
                  style={{
                    backgroundColor: selectedSport === sport ? '#047857' : '#F3F4F6',
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                  onPress={() => setSelectedSport(sport)}
                >
                  <Text style={{ color: selectedSport === sport ? '#fff' : '#374151', fontWeight: 'bold' }}>{sport}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Date Picker */}
            <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 6 }}>Date</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#F3F4F6', borderRadius: 16, padding: 10, marginBottom: 16 }}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: '#374151', fontWeight: '500' }}>{selectedDate.toDateString()}</Text>
            </TouchableOpacity>
            {/* Time Range */}
            <Text style={{ color: '#374151', fontWeight: '500', marginBottom: 6 }}>Time Range</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#F3F4F6', borderRadius: 16, padding: 10, marginRight: 8, flex: 1 }}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={{ color: '#374151', fontWeight: '500' }}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </TouchableOpacity>
              <Text style={{ color: '#374151', fontWeight: 'bold' }}>to</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#F3F4F6', borderRadius: 16, padding: 10, marginLeft: 8, flex: 1 }}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={{ color: '#374151', fontWeight: '500' }}>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </TouchableOpacity>
            </View>
            {/* DateTimePickers */}
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) setSelectedDate(date);
                }}
              />
            )}
            {showStartTimePicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowStartTimePicker(false);
                  if (date) setStartTime(date);
                }}
              />
            )}
            {showEndTimePicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(_, date) => {
                  setShowEndTimePicker(false);
                  if (date) setEndTime(date);
                }}
              />
            )}
            {/* Modal Actions */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={{ color: '#047857', fontWeight: 'bold', fontSize: 16 }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0 }}>
        {/* Game Cards */}
        {games.map((game) => (
          <View key={game.id} style={joinGamesStyles.gameCard}>
            <Image source={{ uri: game.image }} style={joinGamesStyles.gameCardImage} />
            <View style={joinGamesStyles.gameCardInfo}>
              <View style={joinGamesStyles.gameCardTopRow}>
                <Text style={joinGamesTextStyles.venueName}>{game.venue}</Text>
                <TouchableOpacity style={joinGamesStyles.gameJoinButton}>
                  <Text style={joinGamesTextStyles.joinButtonText}>Join</Text>
                </TouchableOpacity>
              </View>
              <Text style={joinGamesTextStyles.gameDetails}>At {game.court} | 17/8/2025 at 08:47 pm</Text>
              <View style={joinGamesStyles.playerStatusRow}>
                <Text style={joinGamesTextStyles.playerCount}>{game.players}/{game.maxPlayers} players</Text>
                <View style={joinGamesStyles.statusChip}>
                  <Text style={joinGamesTextStyles.statusChipText}>{game.status}</Text>
                </View>
              </View>
              <Text style={joinGamesTextStyles.priceText}>₹{game.price}/player</Text>
              <View style={joinGamesStyles.divider} />
              <View style={joinGamesStyles.organizerRow}>
                <Text style={joinGamesTextStyles.organizerLabel}>Organised by:</Text>
                <Ionicons name="person" size={16} color="#374151" style={{ marginHorizontal: 4 }} />
                <Text style={joinGamesTextStyles.organizerName}>{game.organizer}</Text>
                <TouchableOpacity style={{ marginLeft: 'auto' }}>
                  <Text style={joinGamesTextStyles.detailsLink}>Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
