import React, { useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Modal, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, Stack } from "expo-router";
import DateTimePicker from '@react-native-community/datetimepicker';

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

  const sports = ['Badminton', 'Tennis', 'Table Tennis', 'Squash', 'Football', 'Basketball'];

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffffff' }}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Join Games</Text>
        <Text style={styles.headerSubtitle}>Find and join available games</Text>
      </View>
      {/* Filter Button */}
      <View style={{ paddingHorizontal: 20, marginTop: 8, marginBottom: 10 }}>
        <TouchableOpacity style={styles.dropdown} onPress={() => setFilterModalVisible(true)}>
          <Text style={styles.dropdownText}>Filter</Text>
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
          <View key={game.id} style={styles.card}>
            <Image source={{ uri: game.image }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
              <View style={styles.cardTopRow}>
                <Text style={styles.venueName}>{game.venue}</Text>
                <TouchableOpacity style={styles.joinBtn}>
                  <Text style={styles.joinBtnText}>Join</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.gameDetails}>At {game.court} | 17/8/2025 at 08:47 pm</Text>
              <View style={styles.playerStatusRow}>
                <Text style={styles.playerCount}>{game.players}/{game.maxPlayers} players</Text>
                <View style={styles.statusChip}>
                  <Text style={styles.statusChipText}>{game.status}</Text>
                </View>
              </View>
              <Text style={styles.priceText}>₹{game.price}/player</Text>
              <View style={styles.divider} />
              <View style={styles.organizerRow}>
                <Text style={styles.organizerLabel}>Organised by:</Text>
                <Ionicons name="person" size={16} color="#374151" style={{ marginHorizontal: 4 }} />
                <Text style={styles.organizerName}>{game.organizer}</Text>
                <TouchableOpacity style={{ marginLeft: 'auto' }}>
                  <Text style={styles.detailsLink}>Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#047857',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '400',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 18,
    width: '100%',
  },
  dropdownText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    resizeMode: 'cover',
  },
  cardInfo: {
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  venueName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  joinBtn: {
    backgroundColor: '#EA580C',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  joinBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  gameDetails: {
    color: '#6B7280',
    fontSize: 13,
    marginBottom: 8,
  },
  playerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  playerCount: {
    color: '#6B7280',
    fontSize: 14,
    marginRight: 10,
  },
  statusChip: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusChipText: {
    color: '#B45309',
    fontSize: 12,
    fontWeight: 'bold',
  },
  priceText: {
    color: '#047857',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 2,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizerLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginRight: 2,
  },
  organizerName: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  detailsLink: {
    color: '#047857',
    fontWeight: 'bold',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
