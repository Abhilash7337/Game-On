import { supabase } from '@/src/common/services/supabase';
import { messageService } from '@/src/common/services/messageService';
import { styles } from '@/styles/screens/SportGroupChatScreen';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
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
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isMe: boolean;
}

export default function SportGroupChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const conversationId = params.conversationId as string;
  const groupName = params.groupName as string;
  const sport = params.sport as string;
  const isGlobal = params.isGlobal === 'true';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [showInfo, setShowInfo] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Get user name from users table
        const { data: userData } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        setUserName(userData?.full_name || 'Unknown');
      }
    };
    getCurrentUser();
  }, []);

  // Keyboard tracking for Android
  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
        setIsKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 50 : 200);
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
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  // Load messages with caching
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      console.log(`📥 Loading messages for conversation: ${conversationId} (${groupName})`);
      
      // Use messageService with caching
      const formattedMessages = await messageService.getConversationMessages(conversationId, userId);
      
      setMessages(formattedMessages.map(msg => ({
        id: msg.id,
        senderId: msg.userId,
        senderName: msg.username,
        content: msg.text,
        timestamp: msg.timestamp,
        isMe: msg.isMe
      })));
      
      console.log(`✅ Loaded ${formattedMessages.length} messages for ${groupName}`);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId, groupName]);

  // Load messages once on mount only
  useEffect(() => {
    if (conversationId && userId) {
      loadMessages();
    }
  }, [conversationId, userId]); // Don't include loadMessages to avoid double load

  // Real-time subscription using messageService (updates cache automatically)
  useEffect(() => {
    if (!conversationId || !userId) return;

    console.log(`🔔 Setting up real-time subscription for: ${conversationId} (${groupName})`);

    const channel = messageService.subscribeToMessages(
      conversationId,
      userId,
      (newMsg) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, {
            id: newMsg.id,
            senderId: newMsg.userId,
            senderName: newMsg.username,
            content: newMsg.text,
            timestamp: newMsg.timestamp,
            isMe: newMsg.isMe
          }];
        });
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      console.log(`🔕 Unsubscribing from: ${conversationId}`);
      messageService.unsubscribeFromMessages(channel);
    };
  }, [conversationId, userId, groupName]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || sending) return;

    setSending(true);
    try {
      // Use messageService which updates cache automatically
      await messageService.sendMessage(conversationId, userId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={item.isMe ? styles.myMessage : styles.theirMessage}>
      {!item.isMe && (
        <Text style={styles.messageUsername}>{item.senderName}</Text>
      )}
      <Text style={item.isMe ? styles.myMessageText : styles.theirMessageText}>
        {item.content}
      </Text>
      <Text style={item.isMe ? styles.myMessageTime : styles.theirMessageTime}>
        {item.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.channelInfo}>
            <View style={styles.channelIcon}>
              <Ionicons name="people" size={20} color={colors.primary} />
            </View>
            <View style={styles.channelDetails}>
              <Text style={styles.channelName}>{groupName}</Text>
              <Text style={styles.memberCount}>Loading...</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
      enabled={Platform.OS === 'ios'}
    >
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.channelInfo}
          onPress={() => setShowInfo(!showInfo)}
        >
          <View style={styles.channelIcon}>
            <Ionicons name="people" size={20} color={colors.primary} />
          </View>
          
          <View style={styles.channelDetails}>
            <Text style={styles.channelName}>{groupName}</Text>
            <Text style={styles.memberCount}>
              {isGlobal ? '🌍 Global Chat' : '📍 City-wide Chat'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.headerAction}
          onPress={() => setShowInfo(!showInfo)}
        >
          <Ionicons name="information-circle-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <View style={[
        styles.inputContainer,
        {
          borderBottomWidth: 1,
          borderBottomColor: '#FFFFFF',
          marginBottom: isKeyboardVisible ? (Platform.OS === 'android' ? keyboardHeight + 16 : 0) : 5,
        },
        Platform.OS === 'android' && { 
          paddingBottom: isKeyboardVisible ? 24 : 16,
        },
        Platform.OS === 'ios' && { paddingBottom: insets.bottom || 12 }
      ]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={300}
            editable={!sending}
          />
          
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
            style={[
              styles.sendButton,
              (newMessage.trim() && !sending) && styles.sendButtonActive
            ]}
            activeOpacity={0.8}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons 
                name="send" 
                size={20} 
                color={(newMessage.trim() && !sending) ? colors.primary : colors.textSecondary} 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
