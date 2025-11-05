import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/common/services/supabase';
import { colors } from '@/styles/theme';
import { styles } from '@/styles/screens/SportGroupChatScreen';

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
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [showInfo, setShowInfo] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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
      let allMessages: any[] = [];

      // If viewing a city group, also fetch messages from the global group of the same sport
      if (!isGlobal && sport) {
        // Get the global conversation ID for this sport
        const { data: globalGroup } = await supabase
          .from('sport_chat_groups')
          .select('conversation_id')
          .eq('sport', sport)
          .is('city', null)
          .single();

        if (globalGroup?.conversation_id) {
          // Fetch messages from both city and global conversations
          const [cityMessages, globalMessages] = await Promise.all([
            supabase
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
              .order('created_at', { ascending: true }),
            supabase
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
              .eq('conversation_id', globalGroup.conversation_id)
              .order('created_at', { ascending: true })
          ]);

          // Combine and sort by timestamp
          allMessages = [
            ...(cityMessages.data || []),
            ...(globalMessages.data || [])
          ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        } else {
          // Fallback to just city messages
          const { data } = await supabase
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
          
          allMessages = data || [];
        }
      } else {
        // For global groups, just fetch their own messages
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
        allMessages = data || [];
      }

      const formattedMessages: Message[] = allMessages.map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.users?.full_name || 'Unknown',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isMe: msg.sender_id === userId
      }));

      setMessages(formattedMessages);
      setLoading(false);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      setLoading(false);
    }
  }, [conversationId, userId, isGlobal, sport]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!conversationId || !userId) return;

    const setupSubscriptions = async () => {
      const channels: any[] = [];

      // Always subscribe to current conversation
      const mainChannel = supabase
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
      
      channels.push(mainChannel);

      // If viewing city group, also subscribe to global group messages
      if (!isGlobal && sport) {
        const { data: globalGroup } = await supabase
          .from('sport_chat_groups')
          .select('conversation_id')
          .eq('sport', sport)
          .is('city', null)
          .single();

        if (globalGroup?.conversation_id) {
          const globalChannel = supabase
            .channel(`global-sport-${globalGroup.conversation_id}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${globalGroup.conversation_id}`
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
                    return [...prev, message].sort((a, b) => 
                      a.timestamp.getTime() - b.timestamp.getTime()
                    );
                  });
                  
                  // Scroll to bottom
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }
              }
            )
            .subscribe();
          
          channels.push(globalChannel);
        }
      }

      return () => {
        channels.forEach(channel => channel.unsubscribe());
      };
    };

    const cleanup = setupSubscriptions();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, [conversationId, userId, isGlobal, sport]);

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
    <View
      style={[
        styles.messageContainer,
        item.isMe ? styles.messageContainerMe : styles.messageContainerOther
      ]}
    >
      {!item.isMe && (
        <Text style={styles.senderName}>
          {item.senderName}
        </Text>
      )}
      <View
        style={[
          styles.messageBubble,
          item.isMe ? styles.messageBubbleMe : styles.messageBubbleOther
        ]}
      >
        <Text style={[
          styles.messageText,
          item.isMe ? styles.messageTextMe : styles.messageTextOther
        ]}>
          {item.content}
        </Text>
        <Text
          style={[
            styles.messageTimestamp,
            item.isMe ? styles.messageTimestampMe : styles.messageTimestampOther
          ]}
        >
          {item.timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View
        style={[
          styles.headerContainer,
          { paddingTop: insets.top + 8 }
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            {groupName}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isGlobal ? '🌍 Global Chat' : '📍 City-wide Chat'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowInfo(!showInfo)} style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input Area */}
        <View
          style={[
            styles.inputContainer,
            { paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 12) : 12 }
          ]}
        >
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
            style={[
              styles.sendButton,
              newMessage.trim() ? styles.sendButtonActive : styles.sendButtonInactive
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
