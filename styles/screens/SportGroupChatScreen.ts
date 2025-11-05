import { StyleSheet } from 'react-native';
import { colors } from '../theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  
  // Header Styles
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  backButton: {
    marginRight: 12,
  },
  
  headerTextContainer: {
    flex: 1,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  infoButton: {
    padding: 4,
  },
  
  // Message Styles
  messageContainer: {
    marginVertical: 4,
    marginHorizontal: 12,
    maxWidth: '75%',
  },
  
  messageContainerMe: {
    alignSelf: 'flex-end',
  },
  
  messageContainerOther: {
    alignSelf: 'flex-start',
  },
  
  senderName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
    marginLeft: 8,
  },
  
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  
  messageBubbleMe: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 16,
  },
  
  messageBubbleOther: {
    backgroundColor: colors.gray100,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 4,
  },
  
  messageText: {
    fontSize: 15,
  },
  
  messageTextMe: {
    color: '#FFF',
  },
  
  messageTextOther: {
    color: colors.textPrimary,
  },
  
  messageTimestamp: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  
  messageTimestampMe: {
    color: 'rgba(255,255,255,0.7)',
  },
  
  messageTimestampOther: {
    color: colors.textSecondary,
  },
  
  // Keyboard Avoiding View
  keyboardAvoidingView: {
    flex: 1,
  },
  
  // FlatList
  messagesList: {
    paddingVertical: 8,
    paddingBottom: 16,
  },
  
  // Input Area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  
  sendButtonInactive: {
    backgroundColor: colors.gray300,
  },
});
