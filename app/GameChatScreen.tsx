import { gameChatStyles } from '../styles/screens/GameChatScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  username: string;
  userId: string;
  isMe: boolean;
  type: 'message' | 'score' | 'system';
  score?: { team1: number; team2: number };
}

interface GameDetails {
  id: string;
  sport: string;
  venue: string;
  court: string;
  date: string;
  time: string;
  players: string[];
  status: 'upcoming' | 'live' | 'completed';
}

export default function GameChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  
  const [message, setMessage] = useState('');
  const [showGameDetails, setShowGameDetails] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Game chat created',
      timestamp: new Date(Date.now() - 86400000),
      username: 'System',
      userId: 'system',
      isMe: false,
      type: 'system'
    },
    {
      id: '2',
      text: 'Hey everyone! Looking forward to the game tomorrow',
      timestamp: new Date(Date.now() - 3600000),
      username: 'Alex',
      userId: '1',
      isMe: false,
      type: 'message'
    },
    {
      id: '3',
      text: 'I\'ll bring extra water bottles',
      timestamp: new Date(Date.now() - 3000000),
      username: 'You',
      userId: 'me',
      isMe: true,
      type: 'message'
    },
    {
      id: '4',
      text: 'Score Update',
      timestamp: new Date(Date.now() - 1800000),
      username: 'Mike',
      userId: '2',
      isMe: false,
      type: 'score',
      score: { team1: 15, team2: 12 }
    }
  ]);

  // Mock game data
  const gameDetails: GameDetails = {
    id: params.gameId as string || '1',
    sport: params.sport as string || 'Badminton',
    venue: params.venue as string || 'Sports Complex',
    court: params.court as string || 'Court 2',
    date: params.date as string || '2024-10-22',
    time: params.time as string || '6:00 PM',
    players: ['You', 'Alex', 'Mike', 'Sarah'],
    status: (params.status as 'upcoming' | 'live' | 'completed') || 'upcoming'
  };

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        timestamp: new Date(),
        username: 'You',
        userId: 'me',
        isMe: true,
        type: 'message'
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };


  const rescheduleGame = () => {
    Alert.alert(
      'Reschedule Game',
      'Request to reschedule this game?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request', 
          onPress: () => {
            const systemMessage: Message = {
              id: Date.now().toString(),
              text: 'You requested to reschedule the game. Waiting for other players to respond.',
              timestamp: new Date(),
              username: 'System',
              userId: 'system',
              isMe: false,
              type: 'system'
            };
            setMessages(prev => [...prev, systemMessage]);
          }
        }
      ]
    );
  };

  const ratePlayer = () => {
    Alert.alert(
      'Rate Players',
      'Rate your teammates and opponents after the game',
      [
        { text: 'Later', style: 'cancel' },
        { 
          text: 'Rate Now', 
          onPress: () => {
            // Navigate to rating screen
            router.push('/rate-players');
          }
        }
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getStatusColor = () => {
    switch (gameDetails.status) {
      case 'live': return '#10B981';
      case 'completed': return '#6B7280';
      default: return colors.primary;
    }
  };

  const getStatusText = () => {
    switch (gameDetails.status) {
      case 'live': return 'Live Now';
      case 'completed': return 'Completed';
      default: return 'Upcoming';
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.type === 'system') {
      return (
        <View style={gameChatStyles.systemMessage}>
          <Text style={gameChatStyles.systemMessageText}>{item.text}</Text>
          <Text style={gameChatStyles.systemTimestamp}>
            {formatTime(item.timestamp)}
          </Text>
        </View>
      );
    }

    if (item.type === 'score') {
      return (
        <View style={gameChatStyles.scoreMessage}>
          <View style={gameChatStyles.scoreHeader}>
            <Text style={gameChatStyles.scoreUsername}>{item.username}</Text>
            <Text style={gameChatStyles.timestamp}>{formatTime(item.timestamp)}</Text>
          </View>
          <View style={gameChatStyles.scoreDisplay}>
            <View style={gameChatStyles.scoreTeam}>
              <Text style={gameChatStyles.teamName}>Team 1</Text>
              <Text style={gameChatStyles.teamScore}>{item.score?.team1}</Text>
            </View>
            <Text style={gameChatStyles.scoreSeparator}>-</Text>
            <View style={gameChatStyles.scoreTeam}>
              <Text style={gameChatStyles.teamName}>Team 2</Text>
              <Text style={gameChatStyles.teamScore}>{item.score?.team2}</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={[
        gameChatStyles.messageContainer,
        item.isMe ? gameChatStyles.myMessage : gameChatStyles.theirMessage
      ]}>
        {!item.isMe && (
          <Text style={gameChatStyles.messageUsername}>{item.username}</Text>
        )}
        <Text style={[
          gameChatStyles.messageText,
          item.isMe ? gameChatStyles.myMessageText : gameChatStyles.theirMessageText
        ]}>
          {item.text}
        </Text>
        <Text style={gameChatStyles.timestamp}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={gameChatStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[gameChatStyles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={gameChatStyles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={gameChatStyles.gameInfo}
          onPress={() => setShowGameDetails(true)}
        >
          <View style={gameChatStyles.gameIcon}>
            <Ionicons name="basketball" size={20} color={colors.primary} />
          </View>
          
          <View style={gameChatStyles.gameDetails}>
            <Text style={gameChatStyles.gameName}>
              {gameDetails.sport} - {gameDetails.court}
            </Text>
            <View style={gameChatStyles.gameStatus}>
              <View style={[gameChatStyles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={gameChatStyles.statusText}>{getStatusText()}</Text>
            </View>
          </View>
        </TouchableOpacity>

      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={gameChatStyles.messagesList}
        contentContainerStyle={gameChatStyles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <View style={[gameChatStyles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={gameChatStyles.inputWrapper}>
          <TextInput
            style={gameChatStyles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Coordinate with your team..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={300}
          />
          
          <TouchableOpacity 
            style={[
              gameChatStyles.sendButton,
              message.trim() && gameChatStyles.sendButtonActive
            ]}
            onPress={sendMessage}
            disabled={!message.trim()}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={message.trim() ? '#FFFFFF' : colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Game Details Modal */}
      <Modal
        visible={showGameDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGameDetails(false)}
      >
        <View style={gameChatStyles.modalOverlay}>
          <View style={gameChatStyles.modalContent}>
            <View style={gameChatStyles.modalHeader}>
              <Text style={gameChatStyles.modalTitle}>Game Details</Text>
              <TouchableOpacity onPress={() => setShowGameDetails(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={gameChatStyles.gameDetailsContent}>
              <Text style={gameChatStyles.gameDetailItem}>
                <Text style={gameChatStyles.gameDetailLabel}>Sport: </Text>
                {gameDetails.sport}
              </Text>
              <Text style={gameChatStyles.gameDetailItem}>
                <Text style={gameChatStyles.gameDetailLabel}>Venue: </Text>
                {gameDetails.venue}
              </Text>
              <Text style={gameChatStyles.gameDetailItem}>
                <Text style={gameChatStyles.gameDetailLabel}>Court: </Text>
                {gameDetails.court}
              </Text>
              <Text style={gameChatStyles.gameDetailItem}>
                <Text style={gameChatStyles.gameDetailLabel}>Date & Time: </Text>
                {gameDetails.date} at {gameDetails.time}
              </Text>
              <Text style={gameChatStyles.gameDetailItem}>
                <Text style={gameChatStyles.gameDetailLabel}>Players: </Text>
                {gameDetails.players.join(', ')}
              </Text>
              
              <View style={gameChatStyles.gameActions}>
                <TouchableOpacity 
                  style={gameChatStyles.actionButton}
                  onPress={rescheduleGame}
                >
                  <Ionicons name="calendar" size={16} color={colors.primary} />
                  <Text style={gameChatStyles.actionButtonText}>Reschedule</Text>
                </TouchableOpacity>
                
                {gameDetails.status === 'completed' && (
                  <TouchableOpacity 
                    style={gameChatStyles.actionButton}
                    onPress={ratePlayer}
                  >
                    <Ionicons name="star" size={16} color={colors.primary} />
                    <Text style={gameChatStyles.actionButtonText}>Rate Players</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}
