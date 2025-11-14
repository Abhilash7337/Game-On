import { FormattedMessage, messageService } from '@/src/common/services/messageService';
import { supabase } from '@/src/common/services/supabase';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { gameChatStyles } from '../styles/screens/GameChatScreen';

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
  const [isTyping, setIsTyping] = useState(false);
  const [showGameDetails, setShowGameDetails] = useState(false);
  const [messages, setMessages] = useState<FormattedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [conversationId, setConversationId] = useState<string>('');
  const [bookingId, setBookingId] = useState<string>('');
  const messageChannelRef = useRef<any>(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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

  // Keyboard tracking with detailed logging for Android debugging
  useEffect(() => {
    console.log('🎹 [KEYBOARD] Setting up keyboard listeners...');
    console.log('🎹 [KEYBOARD] Platform:', Platform.OS);
    console.log('🎹 [KEYBOARD] Insets:', JSON.stringify(insets));
    
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const keyboardH = event.endCoordinates.height;
        console.log('⬆️ [KEYBOARD SHOW]');
        console.log('   Height:', keyboardH);
        console.log('   Screen Y:', event.endCoordinates.screenY);
        console.log('   Duration:', event.duration);
        console.log('   Easing:', event.easing);
        
        setKeyboardHeight(keyboardH);
        setIsKeyboardVisible(true);
        
        // Scroll to bottom when keyboard shows
        setTimeout(() => {
          console.log('📜 [KEYBOARD] Scrolling to bottom...');
          flatListRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 50 : 200);
      }
    );

    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        console.log('⬇️ [KEYBOARD HIDE]');
        console.log('   Duration:', event?.duration);
        
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      console.log('🎹 [KEYBOARD] Removing keyboard listeners...');
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [insets]);

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

      // Get booking_id from conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('booking_id')
        .eq('id', convId)
        .single();

      if (convError) {
        console.error('Error fetching conversation:', convError);
      } else if (conversation?.booking_id) {
        setBookingId(conversation.booking_id);
        console.log('📋 [GAME_CHAT] Loaded booking_id:', conversation.booking_id);
      }

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

  const sendMessage = useCallback(async () => {
    if (!message.trim() || sending) {
      console.log('⚠️ [SEND] Message send blocked:', { hasMessage: !!message.trim(), sending });
      return;
    }

    console.log('📤 [SEND] Sending message...', message.substring(0, 50));

    // Quick button animation
    Animated.timing(sendButtonScale, {
      toValue: 0.8,
      duration: 50,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(sendButtonScale, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
      }).start();
    });

    const messageText = message.trim();
    setMessage('');
    setIsTyping(false);
    
    try {
      setSending(true);
      await messageService.sendMessage(conversationId, currentUserId, messageText);
      console.log('✅ [SEND] Message sent successfully');
      
      // Message will appear via subscription
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('❌ [SEND] Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      // Restore message text on error
      setMessage(messageText);
      setIsTyping(messageText.length > 0);
    } finally {
      setSending(false);
    }
  }, [message, conversationId, currentUserId, sending]);

  const handleTextChange = useCallback((text: string) => {
    setMessage(text);
    setIsTyping(text.trim().length > 0);
  }, []);


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

    // Regular message with FriendChatScreen layout
    return (
      <View style={item.isMe ? gameChatStyles.myMessage : gameChatStyles.theirMessage}>
        {!item.isMe && (
          <Text style={gameChatStyles.messageUsername}>{item.username}</Text>
        )}
        <Text style={item.isMe ? gameChatStyles.myMessageText : gameChatStyles.theirMessageText}>
          {item.text}
        </Text>
        <Text style={item.isMe ? gameChatStyles.myMessageTime : gameChatStyles.theirMessageTime}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    );
  };

  // Log component render state
  console.log('🔄 [RENDER] GameChatScreen');
  console.log('   Keyboard visible:', isKeyboardVisible);
  console.log('   Keyboard height:', keyboardHeight);
  console.log('   Messages count:', messages.length);
  console.log('   Loading:', loading);

  return (
    <KeyboardAvoidingView 
      style={gameChatStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
      enabled={Platform.OS === 'ios'}
      onLayout={(event) => {
        console.log('📐 [LAYOUT] KeyboardAvoidingView:', {
          x: event.nativeEvent.layout.x,
          y: event.nativeEvent.layout.y,
          width: event.nativeEvent.layout.width,
          height: event.nativeEvent.layout.height
        });
      }}
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

        {/* Rating Button */}
        <TouchableOpacity
          style={gameChatStyles.ratingButton}
          onPress={() => {
            if (!bookingId) {
              Alert.alert('Error', 'Booking information not available');
              return;
            }
            router.push({
              pathname: '/RatePlayersScreen',
              params: {
                conversationId: conversationId,
                bookingId: bookingId
              }
            });
          }}
        >
          <Ionicons name="stats-chart" size={24} color="#FFFFFF" />
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
            contentContainerStyle={[
              gameChatStyles.messagesContent,
              { 
                paddingBottom: 20,
                flexGrow: 1
              }
            ]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />

          {/* Input */}
          <View 
            style={[
              gameChatStyles.inputContainer,
              {
                borderBottomWidth: 1,
                borderBottomColor: '#FFFFFF',
                marginBottom: isKeyboardVisible ? (Platform.OS === 'android' ? keyboardHeight + 16 : 0) : 5,
              },
              Platform.OS === 'android' && { 
                paddingBottom: isKeyboardVisible ? 7 : 16,
              },
              Platform.OS === 'ios' && { paddingBottom: insets.bottom || 12 }
            ]}
            onLayout={(event) => {
              console.log('📐 [LAYOUT] Input Container:', {
                x: event.nativeEvent.layout.x,
                y: event.nativeEvent.layout.y,
                width: event.nativeEvent.layout.width,
                height: event.nativeEvent.layout.height,
                marginBottom: Platform.OS === 'android' && isKeyboardVisible ? keyboardHeight : 0
              });
            }}
          >
            <View style={gameChatStyles.inputWrapper}>
              <TextInput
                style={gameChatStyles.textInput}
                value={message}
                onChangeText={handleTextChange}
                placeholder="Coordinate with your team..."
                placeholderTextColor={colors.textSecondary}
                multiline
                maxLength={300}
                editable={!sending}
                onFocus={() => {
                  console.log('⌨️ [INPUT] TextInput focused');
                  console.log('   Current keyboard state:', isKeyboardVisible);
                  // Scroll to bottom when input is focused
                  setTimeout(() => {
                    console.log('📜 [INPUT] Scrolling to bottom after focus...');
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }, Platform.OS === 'ios' ? 300 : 100);
                }}
                onBlur={() => {
                  console.log('⌨️ [INPUT] TextInput blurred');
                }}
                blurOnSubmit={false}
                enablesReturnKeyAutomatically={true}
                returnKeyType="send"
                onSubmitEditing={() => {
                  if (message.trim()) {
                    console.log('📤 [INPUT] Submit editing - sending message');
                    sendMessage();
                  }
                }}
              />
              
              <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
                <TouchableOpacity 
                  style={[
                    gameChatStyles.sendButton,
                    isTyping && gameChatStyles.sendButtonActive
                  ]}
                  onPress={sendMessage}
                  disabled={!message.trim() || sending}
                  activeOpacity={0.8}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : isTyping ? (
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      style={gameChatStyles.sendButtonGradient}
                    >
                      <Ionicons name="send" size={20} color="#FFFFFF" />
                    </LinearGradient>
                  ) : (
                    <Ionicons 
                      name="send" 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>
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
