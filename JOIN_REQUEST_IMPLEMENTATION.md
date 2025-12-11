# 🎯 Join Request System Implementation Guide

## ✅ What's Been Implemented

### 1. **Database Table Created** ✓
- **File**: `supabase sql files/create_join_requests_table.sql`
- **Table**: `public.join_requests`
- **Features**:
  - Stores join requests with statuses (pending/accepted/rejected/cancelled)
  - Links to bookings, requesters, hosts, and conversations
  - Prevents duplicate requests (unique constraint)
  - Auto-triggers for acceptance/rejection
  - Auto-rejects pending requests when game becomes full
  - RLS policies for security
  - Real-time enabled

**Action Required**: Run this SQL file in your Supabase SQL Editor

### 2. **Service Layer Created** ✓
- **File**: `src/common/services/joinRequestService.ts`
- **Methods**:
  - `sendJoinRequest()` - Send join request
  - `acceptJoinRequest()` - Host accepts request
  - `rejectJoinRequest()` - Host rejects request
  - `cancelJoinRequest()` - Requester cancels
  - `getJoinRequestsForBooking()` - Get all requests for a booking
  - `getMyPendingRequests()` - Get user's received requests
  - `getMyRequestStatus()` - Check request status for a booking
  - `getPendingRequestsCount()` - Count pending requests
  - `subscribeToJoinRequests()` - Real-time subscription

### 3. **JoinGameScreen Updated** ✓
- **File**: `app/JoinGameScreen.tsx`
- **Changes**:
  - ✅ Replaced "Join Game" button with "Send Join Request"
  - ✅ Added chat icon next to host info (right side of card)
  - ✅ Button shows different states:
    - "Send Join Request" (default)
    - "Request Pending" (after sending)
    - "Request Declined" (if rejected)
    - "Already Joined" (if already in game)
    - "Game Full" (if no spots)
  - ✅ Chat icon opens direct conversation with host
  - ✅ Stays on same screen after sending request

### 4. **Styles Updated** ✓
- **File**: `styles/screens/JoinGameScreen.ts`
- **Added**: `chatIconButton` style for the chat icon

---

## 📝 What Still Needs Implementation

### TODO 1: Update FriendChatScreen - Add Dropdown Menu
**File**: `app/FriendChatScreen.tsx`

**Add to header (top-right)**:
```tsx
{/* More Options Button (top-right in header) */}
<TouchableOpacity 
  onPress={() => setShowOptionsMenu(true)}
  style={{
    position: 'absolute',
    right: 20,
    top: insets.top + 20
  }}
>
  <Ionicons name="ellipsis-vertical" size={24} color={colors.textInverse} />
</TouchableOpacity>

{/* Dropdown Menu Modal */}
<Modal
  visible={showOptionsMenu}
  transparent
  animationType="fade"
  onRequestClose={() => setShowOptionsMenu(false)}
>
  <TouchableOpacity 
    style={{
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)'
    }}
    activeOpacity={1}
    onPress={() => setShowOptionsMenu(false)}
  >
    <View style={{
      position: 'absolute',
      top: insets.top + 60,
      right: 20,
      backgroundColor: '#FFF',
      borderRadius: 12,
      minWidth: 200,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5
    }}>
      {/* Profile Option */}
      <TouchableOpacity 
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6'
        }}
        onPress={() => {
          setShowOptionsMenu(false);
          // Navigate to profile screen
          router.push({
            pathname: '/UserProfileScreen',
            params: { userId: friend.id }
          });
        }}
      >
        <Ionicons name="person-outline" size={20} color={colors.textPrimary} />
        <Text style={{ marginLeft: 12, fontSize: 16, color: colors.textPrimary }}>
          View Profile
        </Text>
      </TouchableOpacity>

      {/* Requests Option */}
      <TouchableOpacity 
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16
        }}
        onPress={() => {
          setShowOptionsMenu(false);
          setShowJoinRequests(true);
        }}
      >
        <Ionicons name="mail-outline" size={20} color={colors.textPrimary} />
        <Text style={{ marginLeft: 12, fontSize: 16, color: colors.textPrimary }}>
          Join Requests
        </Text>
        {pendingRequestsCount > 0 && (
          <View style={{
            backgroundColor: colors.primary,
            borderRadius: 10,
            minWidth: 20,
            height: 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8
          }}>
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>
              {pendingRequestsCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
</Modal>
```

**Add Join Requests Modal**:
```tsx
{/* Join Requests Modal */}
<Modal
  visible={showJoinRequests}
  animationType="slide"
  onRequestClose={() => setShowJoinRequests(false)}
>
  <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    {/* Header */}
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.gray200
    }}>
      <TouchableOpacity onPress={() => setShowJoinRequests(false)}>
        <Ionicons name="close" size={28} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={{ 
        flex: 1, 
        fontSize: 20, 
        fontWeight: '600', 
        marginLeft: 12 
      }}>
        Join Requests
      </Text>
    </View>

    {/* Requests List */}
    <FlatList
      data={joinRequests}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={{
          backgroundColor: '#FFF',
          marginHorizontal: 20,
          marginTop: 12,
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: colors.gray200
        }}>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
            {formatDate(item.booking.booking_date)} • {formatTime(item.booking.start_time)}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
            {item.booking.venue_name}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 12 }}>
            {item.booking.court_name} • {item.booking.skill_level || 'All Levels'}
          </Text>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                padding: 12,
                borderRadius: 8,
                alignItems: 'center'
              }}
              onPress={() => handleAcceptRequest(item.id)}
            >
              <Text style={{ color: '#FFF', fontWeight: '600' }}>Accept</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: '#EF4444',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center'
              }}
              onPress={() => handleRejectRequest(item.id)}
            >
              <Text style={{ color: '#FFF', fontWeight: '600' }}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ListEmptyComponent={
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Ionicons name="mail-outline" size={64} color={colors.textSecondary} />
          <Text style={{ marginTop: 16, color: colors.textSecondary }}>
            No pending requests
          </Text>
        </View>
      }
    />
  </SafeAreaView>
</Modal>
```

**Add state variables**:
```tsx
const [showOptionsMenu, setShowOptionsMenu] = useState(false);
const [showJoinRequests, setShowJoinRequests] = useState(false);
const [joinRequests, setJoinRequests] = useState<any[]>([]);
const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
```

**Load requests on mount**:
```tsx
useEffect(() => {
  loadJoinRequests();
}, []);

const loadJoinRequests = async () => {
  const { JoinRequestService } = await import('@/src/common/services/joinRequestService');
  const requests = await JoinRequestService.getMyPendingRequests();
  setJoinRequests(requests);
  setPendingRequestsCount(requests.length);
};

const handleAcceptRequest = async (requestId: string) => {
  const { JoinRequestService } = await import('@/src/common/services/joinRequestService');
  const result = await JoinRequestService.acceptJoinRequest(requestId);
  
  if (result.success) {
    Alert.alert('Success', 'Join request accepted!');
    await loadJoinRequests(); // Refresh list
  } else {
    Alert.alert('Error', result.error || 'Failed to accept request');
  }
};

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
          const { JoinRequestService } = await import('@/src/common/services/joinRequestService');
          const result = await JoinRequestService.rejectJoinRequest(requestId);
          
          if (result.success) {
            Alert.alert('Rejected', 'Join request rejected');
            await loadJoinRequests(); // Refresh list
          } else {
            Alert.alert('Error', result.error || 'Failed to reject request');
          }
        }
      }
    ]
  );
};
```

---

### TODO 2: Update NotificationsScreen
**File**: `app/NotificationsScreen.tsx`

**Handle join request notifications**:
```tsx
const renderNotification = (notification: any) => {
  const isJoinRequest = notification.type === 'join_request_received';
  
  return (
    <TouchableOpacity 
      style={{
        backgroundColor: notification.is_read ? '#FFF' : colors.primary + '10',
        padding: 16,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.gray200
      }}
      onPress={() => handleNotificationPress(notification)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.primary + '20',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12
        }}>
          <Ionicons 
            name={isJoinRequest ? 'people' : 'notifications'} 
            size={20} 
            color={colors.primary} 
          />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
            {notification.title}
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>
            {notification.message}
          </Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>
            {formatTime(notification.created_at)}
          </Text>
          
          {/* Accept/Reject buttons for join requests */}
          {isJoinRequest && !notification.is_read && (
            <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
              <TouchableOpacity 
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  padding: 10,
                  borderRadius: 8,
                  alignItems: 'center'
                }}
                onPress={() => handleAcceptFromNotification(notification)}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Accept</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{
                  flex: 1,
                  backgroundColor: '#EF4444',
                  padding: 10,
                  borderRadius: 8,
                  alignItems: 'center'
                }}
                onPress={() => handleRejectFromNotification(notification)}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
```

---

### TODO 3: Create UserProfileScreen (if doesn't exist)
**File**: `app/UserProfileScreen.tsx`

Display user profile with:
- Avatar
- Full name
- Email
- Rating (stars display)
- Total games played
- Win rate (if tracked)
- Favorite sports

---

### TODO 4: Update Social Tab to Show Game Chats
**File**: `app/(tabs)/social.tsx`

Add a section to show game chat conversations where join requests exist:
```tsx
{/* Game Chats Section */}
<View style={{ marginTop: 20 }}>
  <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
    Game Chats
  </Text>
  <FlatList
    data={gameChats}
    renderItem={({ item }) => (
      <TouchableOpacity 
        onPress={() => navigateToChat(item)}
        style={{
          backgroundColor: '#FFF',
          padding: 16,
          borderRadius: 12,
          marginBottom: 12
        }}
      >
        {/* Display game chat with join request status */}
      </TouchableOpacity>
    )}
  />
</View>
```

---

## 🎯 Testing Checklist

### Person B (Requester) Flow:
1. [ ] Open venue details, see open game
2. [ ] Click on time slot, see "Send Join Request" button
3. [ ] Click "Send Join Request", button changes to "Request Pending"
4. [ ] Click chat icon next to host, opens direct message
5. [ ] Send message to host
6. [ ] See chat in Social tab under game chats

### Person A (Host) Flow:
1. [ ] Receive notification "New Join Request"
2. [ ] See notification in home screen notification icon
3. [ ] Click notification, opens NotificationsScreen
4. [ ] See accept/reject buttons in notification
5. [ ] OR: Open chat with Person B
6. [ ] Click three dots (top-right)
7. [ ] See "Profile" and "Requests" options
8. [ ] Click "Requests", see all pending requests
9. [ ] Accept or reject request
10. [ ] Person B gets notification of acceptance/rejection

### Auto-Reject Flow:
1. [ ] Person B, C, D send join requests
2. [ ] Person A accepts C and D (game full)
3. [ ] Person B gets auto-reject notification
4. [ ] Person B's request shows "Request Declined"

---

## 📁 Files Modified

1. ✅ `supabase sql files/create_join_requests_table.sql` - NEW
2. ✅ `src/common/services/joinRequestService.ts` - NEW
3. ✅ `app/JoinGameScreen.tsx` - MODIFIED
4. ✅ `styles/screens/JoinGameScreen.ts` - MODIFIED
5. ⏳ `app/FriendChatScreen.tsx` - NEEDS UPDATE
6. ⏳ `app/NotificationsScreen.tsx` - NEEDS UPDATE
7. ⏳ `app/UserProfileScreen.tsx` - NEEDS CREATION
8. ⏳ `app/(tabs)/social.tsx` - NEEDS UPDATE

---

## 🚀 Next Steps

1. **Run the SQL file** in Supabase SQL Editor
2. **Test the current implementation**:
   - Send join request button
   - Chat icon functionality
   - Request status display
3. **Implement remaining TODOs**:
   - Dropdown menu in chat screen
   - Notification accept/reject
   - Profile screen
   - Game chats section

Let me know which part you want me to implement next! 🎉
