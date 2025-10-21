import { friendChatStyles } from '../styles/screens/FriendChatScreen';
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
  Image,
  Animated,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isMe: boolean;
  isRead?: boolean;
}

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
  const messageAnimation = useRef(new Animated.Value(0)).current;
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hey! Ready for the game tomorrow?',
      timestamp: new Date(Date.now() - 3600000),
      isMe: false,
      isRead: true
    },
    {
      id: '2',
      text: 'Yes! I\'ll bring extra rackets just in case',
      timestamp: new Date(Date.now() - 3000000),
      isMe: true,
      isRead: true
    },
    {
      id: '3',
      text: 'Perfect! See you at 6 PM',
      timestamp: new Date(Date.now() - 1800000),
      isMe: false,
      isRead: false
    }
  ]);

  // Mock friend data - in real app, fetch based on params.friendId
  const friend: Friend = {
    id: params.friendId as string || '1',
    name: params.friendName as string || 'John Doe',
    avatar: params.friendAvatar as string,
    isOnline: true,
    lastSeen: new Date(Date.now() - 300000) // 5 minutes ago
  };

  const sendMessage = () => {
    if (message.trim()) {
      // Animate send button
      Animated.sequence([
        Animated.timing(sendButtonScale, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(sendButtonScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        })
      ]).start();

      const newMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        timestamp: new Date(),
        isMe: true,
        isRead: false
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      setIsTyping(false);
      
      // Animate new message
      Animated.timing(messageAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Auto scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleTextChange = (text: string) => {
    setMessage(text);
    setIsTyping(text.length > 0);
  };

  const shareLocation = () => {
    Alert.alert(
      'Share Location',
      'Share your current location with this friend?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Share', 
          onPress: () => {
            const locationMessage: Message = {
              id: Date.now().toString(),
              text: '📍 Shared location: Sports Complex, Sector 18',
              timestamp: new Date(),
              isMe: true,
              isRead: false
            };
            setMessages(prev => [...prev, locationMessage]);
          }
        }
      ]
    );
  };

  const viewFriendProfile = () => {
    router.push(`/profile/${friend.id}`);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={item.isMe ? friendChatStyles.myMessage : friendChatStyles.theirMessage}>
      <Text style={item.isMe ? friendChatStyles.myMessageText : friendChatStyles.theirMessageText}>
        {item.text}
      </Text>
      <Text style={item.isMe ? friendChatStyles.myMessageTime : friendChatStyles.theirMessageTime}>
        {formatTime(item.timestamp)}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={friendChatStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
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

        <TouchableOpacity 
          style={friendChatStyles.headerAction}
          onPress={shareLocation}
          activeOpacity={0.7}
        >
          <Ionicons name="location" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={friendChatStyles.messagesList}
        contentContainerStyle={friendChatStyles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <View style={[friendChatStyles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={friendChatStyles.inputWrapper}>
          <TextInput
            style={friendChatStyles.textInput}
            value={message}
            onChangeText={handleTextChange}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
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
