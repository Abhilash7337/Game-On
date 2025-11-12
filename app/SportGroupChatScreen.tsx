import { supabase } from '@/src/common/services/supabase';
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

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      console.log(`📥 Loading messages for conversation: ${conversationId} (${groupName})`);
      
      // Load ONLY messages from THIS conversation (no mixing!)
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          conversation_id,
          users!messages_sender_id_fkey (
            full_name
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: (Array.isArray(msg.users) ? msg.users[0]?.full_name : msg.users?.full_name) || 'Unknown',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isMe: msg.sender_id === userId
      }));

      setMessages(formattedMessages);
      console.log(`✅ Loaded ${formattedMessages.length} messages for ${groupName}`);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId, userId, groupName]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!conversationId || !userId) return;

    console.log(`🔔 Setting up real-time subscription for: ${conversationId} (${groupName})`);

    // Subscribe ONLY to THIS conversation's messages (no mixing!)
    const channel = supabase
      .channel(`sport-group-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            const newMsg = payload.new as any;
            
            // Get sender name
            const { data: senderData } = await supabase
              .from('users')
              .select('full_name')
              .eq('id', newMsg.sender_id)
              .single();

            const message: Message = {
              id: newMsg.id,
              senderId: newMsg.sender_id,
              senderName: senderData?.full_name || 'Unknown',
              content: newMsg.content,
              timestamp: new Date(newMsg.created_at),
              isMe: newMsg.sender_id === userId
            };

            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === message.id)) return prev;
              return [...prev, message];
            });
            
            // Scroll to bottom
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      console.log(`🔕 Unsubscribing from: ${conversationId}`);
      channel.unsubscribe();
    };
  }, [conversationId, userId, groupName]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

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
      keyboardVerticalOffset={0}
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
        { paddingBottom: Math.max(insets.bottom, 10) }
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
