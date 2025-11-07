import { gameChatStyles } from '../styles/screens/GameChatScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { messageService, FormattedMessage } from '@/src/common/services/messageService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/src/common/services/supabase';

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
  const [messages, setMessages] = useState<FormattedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string>('');
  const messageChannelRef = useRef<any>(null);

  // Parse game data from params (passed from social tab)
  const gameDetails: GameDetails = {
    id: params.gameId as string || '',
    sport: params.sport as string || 'Game',
    venue: params.venue as string || 'Venue',
    court: params.court as string || 'Court',
    date: params.date as string || new Date().toISOString().split('T')[0],
    time: params.time as string || '12:00 PM',
    players: params.players ? JSON.parse(params.players as string) : [],
    status: (params.status as 'upcoming' | 'live' | 'completed') || 'upcoming'
  };

  // Load current user and messages
  useEffect(() => {
    loadUserAndMessages();
    
    return () => {
      // Cleanup subscription on unmount
      if (messageChannelRef.current) {
        messageService.unsubscribeFromMessages(messageChannelRef.current);
      }
    };
  }, []);

  const loadUserAndMessages = async () => {
    try {
      setLoading(true);
      
      // Get current user - try user_session first (for player login)
      let userId = null;
      const userSession = await AsyncStorage.getItem('user_session');
      if (userSession) {
        const user = JSON.parse(userSession);
        userId = user.id;
      }
      
      // If no user_session, try clientId (for business login)
      if (!userId) {
        userId = await AsyncStorage.getItem('clientId');
      }
      
      // If still no user, try Supabase auth
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      }
      
      if (!userId) {
        Alert.alert('Error', 'User not logged in');
        router.back();
        return;
      }
      setCurrentUserId(userId);

      // Get conversation ID from params
      const convId = params.conversationId as string;
      if (!convId) {
        Alert.alert('Error', 'Invalid conversation');
        router.back();
        return;
      }
      setConversationId(convId);

      // Load existing messages
      const msgs = await messageService.getConversationMessages(convId, userId);
      setMessages(msgs);

      // Subscribe to new messages
      const channel = messageService.subscribeToMessages(
        convId,
        userId,
        (newMessage) => {
          setMessages(prev => [...prev, newMessage]);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      );
      messageChannelRef.current = channel;

      // Mark messages as read
      await messageService.markAsRead(convId, userId);

    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (message.trim() && !sending) {
      try {
        setSending(true);
        const messageText = message.trim();
        setMessage(''); // Clear input immediately
        
        await messageService.sendMessage(conversationId, currentUserId, messageText);
        
        // Message will appear via subscription
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } catch (error) {
        console.error('Error sending message:', error);
        Alert.alert('Error', 'Failed to send message');
        setMessage(message); // Restore message on error
      } finally {
        setSending(false);
      }
    }
  };


  const rescheduleGame = async () => {
    Alert.alert(
      'Reschedule Game',
      'Request to reschedule this game?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Request', 
          onPress: async () => {
            try {
              await messageService.sendSystemMessage(
                conversationId,
                `${gameDetails.sport} game reschedule requested. Waiting for other players to respond.`
              );
            } catch (error) {
              console.error('Error sending reschedule request:', error);
            }
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
            // TODO: Navigate to rating screen when implemented
            Alert.alert('Coming Soon', 'Player rating feature is coming soon!');
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

  const renderMessage = ({ item }: { item: FormattedMessage }) => {
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

      {/* Loading Indicator */}
      {loading ? (
        <View style={gameChatStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={gameChatStyles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <>
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
                editable={!sending}
              />
              
              <TouchableOpacity 
                style={[
                  gameChatStyles.sendButton,
                  (message.trim() && !sending) && gameChatStyles.sendButtonActive
                ]}
                onPress={sendMessage}
                disabled={!message.trim() || sending}
                activeOpacity={0.8}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons 
                    name="send" 
                    size={20} 
                    color={message.trim() ? '#FFFFFF' : colors.textSecondary} 
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

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
