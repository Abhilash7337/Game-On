import { globalChatStyles } from '../styles/screens/GlobalChatScreen';
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
  location?: string;
  sportType?: string;
}

interface Channel {
  id: string;
  name: string;
  type: 'location' | 'sport' | 'general';
  memberCount: number;
  description: string;
}

export default function GlobalChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  
  const [message, setMessage] = useState('');
  const [showChannelInfo, setShowChannelInfo] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Anyone up for cricket this evening at Central Park?',
      timestamp: new Date(Date.now() - 7200000),
      username: 'CricketFan23',
      userId: '1',
      isMe: false,
      location: 'Mumbai',
      sportType: 'Cricket'
    },
    {
      id: '2',
      text: 'I\'m in! What time?',
      timestamp: new Date(Date.now() - 6900000),
      username: 'SportsLover',
      userId: '2',
      isMe: false,
      location: 'Mumbai'
    },
    {
      id: '3',
      text: 'Count me in too! 6 PM works?',
      timestamp: new Date(Date.now() - 6600000),
      username: 'You',
      userId: 'me',
      isMe: true,
      location: 'Mumbai'
    }
  ]);

  // Mock channel data
  const channel: Channel = {
    id: params.channelId as string || '1',
    name: params.channelName as string || 'Mumbai Cricket',
    type: (params.channelType as 'location' | 'sport' | 'general') || 'location',
    memberCount: 1247,
    description: 'Cricket enthusiasts in Mumbai area'
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
        location: 'Mumbai'
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const announceEvent = () => {
    Alert.alert(
      'Create Event Announcement',
      'Share a sports event or tournament with the community?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create', 
          onPress: () => {
            const eventMessage: Message = {
              id: Date.now().toString(),
              text: '🏆 EVENT: Weekend Cricket Tournament at Sports Complex - Registration open! #CricketTournament',
              timestamp: new Date(),
              username: 'You',
              userId: 'me',
              isMe: true,
              location: 'Mumbai',
              sportType: 'Cricket'
            };
            setMessages(prev => [...prev, eventMessage]);
          }
        }
      ]
    );
  };

  const reportMessage = (messageId: string) => {
    Alert.alert(
      'Report Message',
      'Report this message for inappropriate content?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('Reported', 'Message has been reported to moderators.');
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

  const getChannelIcon = () => {
    switch (channel.type) {
      case 'location': return 'location';
      case 'sport': return 'basketball';
      default: return 'chatbubbles';
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={globalChatStyles.messageContainer}>
      <View style={globalChatStyles.messageHeader}>
        <Text style={globalChatStyles.username}>
          {item.username}
          {item.location && (
            <Text style={globalChatStyles.location}> • {item.location}</Text>
          )}
        </Text>
        {!item.isMe && (
          <TouchableOpacity 
            onPress={() => reportMessage(item.id)}
            style={globalChatStyles.reportButton}
          >
            <Ionicons name="flag-outline" size={12} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={globalChatStyles.messageText}>
        {item.text}
      </Text>
      
      <View style={globalChatStyles.messageFooter}>
        <Text style={globalChatStyles.timestamp}>
          {formatTime(item.timestamp)}
        </Text>
        {item.sportType && (
          <View style={globalChatStyles.sportTag}>
            <Ionicons name="basketball" size={12} color={colors.primary} />
            <Text style={globalChatStyles.sportTagText}>{item.sportType}</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={globalChatStyles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[globalChatStyles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          style={globalChatStyles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={globalChatStyles.channelInfo}
          onPress={() => setShowChannelInfo(true)}
        >
          <View style={globalChatStyles.channelIcon}>
            <Ionicons name={getChannelIcon()} size={20} color={colors.primary} />
          </View>
          
          <View style={globalChatStyles.channelDetails}>
            <Text style={globalChatStyles.channelName}>{channel.name}</Text>
            <Text style={globalChatStyles.memberCount}>
              {channel.memberCount.toLocaleString()} members
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={globalChatStyles.headerAction}
          onPress={announceEvent}
          activeOpacity={0.7}
        >
          <Ionicons name="megaphone" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={globalChatStyles.messagesList}
        contentContainerStyle={globalChatStyles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <View style={[globalChatStyles.inputContainer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <View style={globalChatStyles.inputWrapper}>
          <TextInput
            style={globalChatStyles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Share with the community..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={300}
          />
          
          <TouchableOpacity 
            style={[
              globalChatStyles.sendButton,
              message.trim() && globalChatStyles.sendButtonActive
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

      {/* Channel Info Modal */}
      <Modal
        visible={showChannelInfo}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChannelInfo(false)}
      >
        <View style={globalChatStyles.modalOverlay}>
          <View style={globalChatStyles.modalContent}>
            <View style={globalChatStyles.modalHeader}>
              <Text style={globalChatStyles.modalTitle}>Channel Info</Text>
              <TouchableOpacity onPress={() => setShowChannelInfo(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <View style={globalChatStyles.channelInfoContent}>
              <Text style={globalChatStyles.channelNameLarge}>{channel.name}</Text>
              <Text style={globalChatStyles.channelDescription}>{channel.description}</Text>
              <Text style={globalChatStyles.channelStats}>
                {channel.memberCount.toLocaleString()} members • {channel.type} channel
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
