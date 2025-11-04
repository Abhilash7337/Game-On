import { friendChatStyles } from '../styles/screens/FriendChatScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChatService } from '@/src/common/services/chatService';
import { Message } from '@/src/common/services/supabase';

interface Friend {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}


export default function FriendChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messageAnimation = useRef(new Animated.Value(0)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [screenHeight, setScreenHeight] = useState(Dimensions.get('window').height);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Mock friend data - in real app, fetch based on params.friendId
  const friend: Friend = {
    id: params.friendId as string || '1',
    name: params.friendName as string || 'John Doe',
    avatar: params.friendAvatar as string,
    isOnline: true,
    lastSeen: new Date(Date.now() - 300000) // 5 minutes ago
  };

  // Initialize conversation and load messages (optimized for speed)
  useEffect(() => {
    const initializeChat = async () => {
      if (!friend.id) return;

      try {
        setLoading(true);
        
        // Get or create conversation first
        const conversationResult = await ChatService.getOrCreateDirectConversation(friend.id);
        
        if (conversationResult.success && conversationResult.conversation) {
          const convId = conversationResult.conversation.id;
          setConversationId(convId);
          
          // Load messages for the conversation
          const { success: messagesSuccess, messages: loadedMessages } = await ChatService.getMessages(convId, 30);
          if (messagesSuccess && loadedMessages) {
            setMessages(loadedMessages);
            setHasMoreMessages(loadedMessages.length === 30);
            
            // Immediate scroll without delay for faster UX
            requestAnimationFrame(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            });
          }
        } else {
          Alert.alert('Error', conversationResult.error || 'Failed to initialize chat');
        }
      } catch (error) {
        console.error('Initialize chat error:', error);
        Alert.alert('Error', 'Failed to initialize chat');
      } finally {
        setLoading(false);
      }
    };

    initializeChat();
  }, [friend.id]);

  // Optimized real-time subscription
  useEffect(() => {
    if (!conversationId) return;

    const subscription = ChatService.subscribeToMessages(conversationId, (newMessage) => {
      setMessages(prev => {
        // Efficient duplicate check using Set
        const messageIds = new Set(prev.map(msg => msg.id));
        if (messageIds.has(newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
      
      // Smart scroll to bottom for new messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId]);

  // Enhanced keyboard handling for all devices
  useEffect(() => {
    const updateScreenHeight = () => {
      setScreenHeight(Dimensions.get('window').height);
    };

    const dimensionsListener = Dimensions.addEventListener('change', updateScreenHeight);

    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const keyboardH = event.endCoordinates.height;
        setKeyboardHeight(keyboardH);
        setIsKeyboardVisible(true);
        
        // Immediate scroll for better UX
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 50 : 150);
      }
    );

    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      dimensionsListener?.remove();
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  const sendMessage = useCallback(async () => {
    if (!message.trim() || !conversationId) return;

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
      const { success, message: newMessage, error } = await ChatService.sendMessage(
        conversationId,
        messageText,
        'text'
      );

      if (success && newMessage) {
        // Message will be added via real-time subscription
        // Ensure we scroll to the new message immediately
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        Alert.alert('Error', error || 'Failed to send message');
        // Restore message text on error
        setMessage(messageText);
      }
    } catch (error) {
      console.error('Send message error:', error);
      Alert.alert('Error', 'Failed to send message');
      // Restore message text on error
      setMessage(messageText);
    }
  }, [message, conversationId]);

  const handleTextChange = useCallback((text: string) => {
    setMessage(text);
    setIsTyping(text.length > 0);
  }, []);



  const viewFriendProfile = useCallback(() => {
    Alert.alert('Profile', `View ${friend.name}'s profile (Feature coming soon)`);
  }, [friend.name]);

  const loadMoreMessages = useCallback(async () => {
    if (!conversationId || !hasMoreMessages) return;

    try {
      const { success, messages: olderMessages } = await ChatService.getMessages(
        conversationId, 
        20, 
        messages.length
      );
      
      if (success && olderMessages && olderMessages.length > 0) {
        setMessages(prev => [...olderMessages, ...prev]);
        if (olderMessages.length < 20) {
          setHasMoreMessages(false);
        }
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Load more messages error:', error);
    }
  }, [conversationId, messages.length, hasMoreMessages]);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }, []);

  // Memoized message component for better performance
  const MessageItem = React.memo(({ item }: { item: Message }) => (
    <View style={item.isMe ? friendChatStyles.myMessage : friendChatStyles.theirMessage}>
      <Text style={item.isMe ? friendChatStyles.myMessageText : friendChatStyles.theirMessageText}>
        {item.content}
      </Text>
      <Text style={item.isMe ? friendChatStyles.myMessageTime : friendChatStyles.theirMessageTime}>
        {formatTime(item.timestamp)}
      </Text>
    </View>
  ));

  const renderMessage = useCallback(({ item }: { item: Message }) => (
    <MessageItem item={item} />
  ), []);

  // Calculate dynamic heights
  const availableHeight = screenHeight - keyboardHeight - insets.top - insets.bottom;
  const headerHeight = insets.top + 70; // Approximate header height
  const inputHeight = 60; // Approximate input area height
  const messagesHeight = availableHeight - headerHeight - inputHeight;

  return (
    <KeyboardAvoidingView 
      style={friendChatStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[friendChatStyles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={friendChatStyles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={friendChatStyles.friendInfo}
          onPress={viewFriendProfile}
        >
          <View style={friendChatStyles.avatarContainer}>
            {friend.avatar ? (
              <Image source={{ uri: friend.avatar }} style={friendChatStyles.avatar} />
            ) : (
              <LinearGradient
                colors={['#ff9a9e', '#fecfef']}
                style={friendChatStyles.avatarPlaceholder}
              >
                <Ionicons name="person" size={20} color="#FFFFFF" />
              </LinearGradient>
            )}
            {friend.isOnline && <View style={friendChatStyles.onlineIndicator} />}
          </View>
          
          <View style={friendChatStyles.friendDetails}>
            <Text style={friendChatStyles.friendName}>{friend.name}</Text>
            <Text style={friendChatStyles.friendStatus}>
              {friend.isOnline ? '🟢 Online' : `Last seen ${formatTime(friend.lastSeen!)}`}
            </Text>
          </View>
        </TouchableOpacity>


      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={[
          friendChatStyles.messagesList,
          { flex: 1 }
        ]}
        contentContainerStyle={[
          friendChatStyles.messagesContent,
          { 
            paddingBottom: isKeyboardVisible ? 5 : 20,
            flexGrow: 1
          }
        ]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => {
          // Auto-scroll to bottom when content changes (new messages)
          requestAnimationFrame(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          });
        }}
        onLayout={() => {
          // Ensure we scroll to bottom on initial layout
          requestAnimationFrame(() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          });
        }}
        // Load more messages when scrolled to top
        onEndReached={loadMoreMessages}
        onEndReachedThreshold={0.1}
        inverted={false} // Keep messages in normal order
        // Performance optimizations
        removeClippedSubviews={false} // Disable for better scroll behavior
        maxToRenderPerBatch={15}
        windowSize={8}
        initialNumToRender={20}
        updateCellsBatchingPeriod={30}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        getItemLayout={(data, index) => ({
          length: 60, // Approximate message height
          offset: 60 * index,
          index,
        })}
      />

      {/* Input */}
      <View style={[
        friendChatStyles.inputContainer,
        {
          paddingTop: isKeyboardVisible ? 10 : 16,
          paddingBottom: isKeyboardVisible ? 
            (Platform.OS === 'ios' ? 5 : 8) : 
            Math.max(insets.bottom, 12)
        }
      ]}>
        <View style={friendChatStyles.inputWrapper}>
          <TextInput
            style={friendChatStyles.textInput}
            value={message}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            onFocus={() => {
              // Scroll to bottom when input is focused
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, Platform.OS === 'ios' ? 300 : 100);
            }}
            blurOnSubmit={false}
            enablesReturnKeyAutomatically={true}
            returnKeyType="send"
            onSubmitEditing={() => {
              if (message.trim()) {
                sendMessage();
              }
            }}
          />
          
          <Animated.View style={{ transform: [{ scale: sendButtonScale }] }}>
            <TouchableOpacity 
              style={[
                friendChatStyles.sendButton,
                isTyping && friendChatStyles.sendButtonActive
              ]}
              onPress={sendMessage}
              disabled={!message.trim()}
              activeOpacity={0.8}
            >
              {isTyping ? (
                <View style={[friendChatStyles.sendButton, { backgroundColor: '#10b981' }]}>
                  <Ionicons name="send" size={20} color="#FFFFFF" />
                </View>
              ) : (
                <Ionicons name="send" size={20} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
