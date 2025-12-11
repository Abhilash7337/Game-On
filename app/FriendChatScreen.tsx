import { ChatService } from '@/src/common/services/chatService';
import { Message } from '@/src/common/services/supabase';
import { colors } from '@/styles/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { friendChatStyles } from '../styles/screens/FriendChatScreen';

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

  // New state for dropdown menu and join requests
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

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
            
            // Mark messages as read when chat is opened
            console.log('🔄 Marking messages as read for conversation:', convId);
            const markReadResult = await ChatService.markAsRead(convId);
            console.log('✅ Mark as read result:', markReadResult);
            
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
    loadJoinRequests(); // Load join requests on mount
  }, [friend.id]);

  // Load join requests function
  const loadJoinRequests = async () => {
    try {
      const { JoinRequestService } = await import('@/src/common/services/joinRequestService');
      // Get requests where I am the host (received requests)
      console.log('🔍 [FRIEND CHAT] Loading join requests...');
      const requests = await JoinRequestService.getMyReceivedRequests();
      console.log('📋 [FRIEND CHAT] Loaded join requests:', requests.length, requests);
      setJoinRequests(requests);
      setPendingRequestsCount(requests.length);
    } catch (error) {
      console.error('Error loading join requests:', error);
    }
  };

  // Handle accept request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { JoinRequestService } = await import('@/src/common/services/joinRequestService');
      const result = await JoinRequestService.acceptJoinRequest(requestId);
      
      if (result.success) {
        Alert.alert('Success', 'Join request accepted!');
        await loadJoinRequests(); // Refresh list
      } else {
        Alert.alert('Error', result.error || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  // Handle reject request
  const handleRejectRequest = async (requestId: string) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this join request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              const { JoinRequestService } = await import('@/src/common/services/joinRequestService');
              const result = await JoinRequestService.rejectJoinRequest(requestId);
              
              if (result.success) {
                Alert.alert('Rejected', 'Join request rejected');
                await loadJoinRequests(); // Refresh list
              } else {
                Alert.alert('Error', result.error || 'Failed to reject request');
              }
            } catch (error) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', 'Failed to reject request');
            }
          }
        }
      ]
    );
  };

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

  // Mark messages as read when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (conversationId) {
        console.log('🔄 [FOCUS] Marking messages as read for conversation:', conversationId);
        // Mark messages as read when user returns to this screen
        ChatService.markAsRead(conversationId).then(result => {
          console.log('✅ [FOCUS] Mark as read result:', result);
        }).catch(error => {
          console.error('❌ [FOCUS] Error marking messages as read:', error);
        });
      }
    }, [conversationId])
  );

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
    router.push(`/UserProfileScreen?userId=${friend.id}`);
  }, [friend.id, router]);

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

  // Format date for join requests
  const formatRequestDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatRequestTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Calculate dynamic heights
  const availableHeight = screenHeight - keyboardHeight - insets.top - insets.bottom;
  const headerHeight = insets.top + 70; // Approximate header height
  const inputHeight = 60; // Approximate input area height
  const messagesHeight = availableHeight - headerHeight - inputHeight;

  return (
    <KeyboardAvoidingView 
      style={friendChatStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
      enabled={Platform.OS === 'ios'}
    >
      <StatusBar style="light" />
      
      {/* Options Menu Modal */}
      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity 
          style={friendChatStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsMenu(false)}
        >
          <View style={[friendChatStyles.dropdownMenu, { top: insets.top + 70, right: 16 }]}>
            <TouchableOpacity 
              style={friendChatStyles.menuItem}
              onPress={() => {
                setShowOptionsMenu(false);
                viewFriendProfile();
              }}
            >
              <Ionicons name="person-outline" size={20} color="#1F2937" />
              <Text style={friendChatStyles.menuItemText}>Profile</Text>
            </TouchableOpacity>
            
            <View style={friendChatStyles.menuDivider} />
            
            <TouchableOpacity 
              style={friendChatStyles.menuItem}
              onPress={() => {
                setShowOptionsMenu(false);
                setShowJoinRequests(true);
              }}
            >
              <Ionicons name="people-outline" size={20} color="#1F2937" />
              <Text style={friendChatStyles.menuItemText}>Join Requests</Text>
              {pendingRequestsCount > 0 && (
                <View style={friendChatStyles.menuBadge}>
                  <Text style={friendChatStyles.menuBadgeText}>{pendingRequestsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Join Requests Modal */}
      <Modal
        visible={showJoinRequests}
        animationType="slide"
        onRequestClose={() => setShowJoinRequests(false)}
      >
        <SafeAreaView style={friendChatStyles.modalContainer}>
          <View style={[friendChatStyles.modalHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity 
              style={friendChatStyles.modalBackButton}
              onPress={() => setShowJoinRequests(false)}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={friendChatStyles.modalTitle}>Join Requests</Text>
            <View style={{ width: 40 }} />
          </View>

          {joinRequests.length === 0 ? (
            <View style={friendChatStyles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#9CA3AF" />
              <Text style={friendChatStyles.emptyStateText}>No pending requests</Text>
              <Text style={friendChatStyles.emptyStateSubtext}>
                Join requests will appear here
              </Text>
            </View>
          ) : (
            <ScrollView style={friendChatStyles.requestsList}>
              {joinRequests.map((request) => (
                <View key={request.id} style={friendChatStyles.requestCard}>
                  <View style={friendChatStyles.requestHeader}>
                    <View style={friendChatStyles.requestInfo}>
                      <Text style={friendChatStyles.requestDate}>
                        {formatRequestDate(request.booking.booking_date)} at {formatRequestTime(request.booking.start_time)}
                      </Text>
                      <Text style={friendChatStyles.requestVenue}>
                        {request.booking.venue?.name || 'Venue'} - {request.booking.court?.name || 'Court'}
                      </Text>
                      <Text style={friendChatStyles.requestDetails}>
                        Skill Level: {request.booking.skill_level || 'Any'}
                      </Text>
                      <Text style={friendChatStyles.requestDetails}>
                        Players: {request.booking.player_count || 0} spots needed
                      </Text>
                    </View>
                  </View>

                  <View style={friendChatStyles.requestActions}>
                    <TouchableOpacity 
                      style={[friendChatStyles.actionButton, friendChatStyles.rejectButton]}
                      onPress={() => handleRejectRequest(request.id)}
                    >
                      <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                      <Text style={friendChatStyles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[friendChatStyles.actionButton, friendChatStyles.acceptButton]}
                      onPress={() => handleAcceptRequest(request.id)}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      <Text style={friendChatStyles.actionButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
      
      
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

        <TouchableOpacity 
          style={friendChatStyles.optionsButton}
          onPress={() => setShowOptionsMenu(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
          {pendingRequestsCount > 0 && (
            <View style={friendChatStyles.badge}>
              <Text style={friendChatStyles.badgeText}>{pendingRequestsCount}</Text>
            </View>
          )}
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
          borderBottomWidth: 1,
          borderBottomColor: '#FFFFFF',
          marginBottom: isKeyboardVisible ? (Platform.OS === 'android' ? keyboardHeight + 16 : 0) : 5,
        },
        Platform.OS === 'android' && { 
          paddingBottom: isKeyboardVisible ? 24 : 16,
        },
        Platform.OS === 'ios' && { paddingBottom: insets.bottom || 12 }
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
