import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@game_on_chatrooms';

export interface GameChatroom {
    id: string;
    bookingId: string;
    venue: string;
    court: string;
    date: Date;
    time: string;
    duration: string;
    hostUserId: string;
    participants: string[]; // Array of user IDs
    createdAt: Date;
    expiresAt: Date; // Game end time + 30 minutes
    isActive: boolean;
}

export interface GameChatroomDisplay {
    id: string;
    venue: string;
    court: string;
    date: string; // Formatted for display (Today, Tomorrow, or date)
    time: string;
    duration: string;
    isHost: boolean;
    participants: number;
    expiresAt: Date;
}

class GameChatroomServiceClass {
    private chatrooms: GameChatroom[] = [];
    private initialized = false;

    async ensureInitialized(): Promise<void> {
        if (!this.initialized) {
            await this.loadFromStorage();
            this.initialized = true;
        }
    }

    private async loadFromStorage(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Convert date strings back to Date objects
                this.chatrooms = parsed.map((room: any) => ({
                    ...room,
                    date: new Date(room.date),
                    createdAt: new Date(room.createdAt),
                    expiresAt: new Date(room.expiresAt)
                }));
                console.log('💬 Loaded', this.chatrooms.length, 'chatrooms from storage');
            } else {
                this.chatrooms = [];
            }
        } catch (error) {
            console.error('❌ Error loading chatrooms from storage:', error);
            this.chatrooms = [];
        }
    }

    private async saveToStorage(): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.chatrooms));
            console.log('💾 Saved', this.chatrooms.length, 'chatrooms to storage');
        } catch (error) {
            console.error('❌ Error saving chatrooms to storage:', error);
        }
    }

    /**
     * Create a new game chatroom when a booking is approved
     */
    async createChatroom(
        bookingId: string,
        venue: string,
        court: string,
        date: Date,
        time: string,
        duration: string,
        hostUserId: string
    ): Promise<GameChatroom> {
        await this.ensureInitialized();

        // Calculate expiry time (game end time + 30 minutes)
        const expiresAt = this.calculateExpiryTime(date, time, duration);

        const chatroom: GameChatroom = {
            id: `chatroom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            bookingId,
            venue,
            court,
            date,
            time,
            duration,
            hostUserId,
            participants: [hostUserId], // Host is automatically a participant
            createdAt: new Date(),
            expiresAt,
            isActive: true
        };

        this.chatrooms.push(chatroom);
        await this.saveToStorage();

        console.log('🎮 Created game chatroom:', {
            id: chatroom.id,
            venue,
            court,
            date: date.toLocaleDateString(),
            time,
            expiresAt: expiresAt.toLocaleString()
        });

        return chatroom;
    }

    /**
     * Calculate when the chatroom should expire (game end + 30 min)
     */
    private calculateExpiryTime(gameDate: Date, gameTime: string, duration: string): Date {
        // Parse game start time (e.g., "6:00 AM")
        const [timeStr, period] = gameTime.split(' ');
        const [hours, minutes] = timeStr.split(':').map(Number);
        let startHour = hours;
        
        if (period === 'PM' && hours !== 12) {
            startHour += 12;
        } else if (period === 'AM' && hours === 12) {
            startHour = 0;
        }

        // Parse duration (e.g., "2 hr", "1.5 hr")
        const durationHours = parseFloat(duration.replace(' hr', '').replace(' hrs', ''));

        // Create expiry date
        const expiryDate = new Date(gameDate);
        expiryDate.setHours(startHour);
        expiryDate.setMinutes(minutes || 0);
        
        // Add game duration + 30 minutes buffer
        const totalMinutes = (durationHours * 60) + 30;
        expiryDate.setMinutes(expiryDate.getMinutes() + totalMinutes);

        return expiryDate;
    }

    /**
     * Get all active chatrooms for a specific user
     */
    async getUserChatrooms(userId: string): Promise<GameChatroomDisplay[]> {
        await this.ensureInitialized();
        
        // Clean up expired chatrooms first
        await this.cleanupExpiredChatrooms();

        const userChatrooms = this.chatrooms.filter(room => 
            room.isActive && room.participants.includes(userId)
        );

        return userChatrooms.map(room => this.formatChatroomForDisplay(room, userId));
    }

    /**
     * Format chatroom for display in UI
     */
    private formatChatroomForDisplay(room: GameChatroom, currentUserId: string): GameChatroomDisplay {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let dateDisplay: string;
        const roomDateStr = room.date.toDateString();
        
        if (roomDateStr === today.toDateString()) {
            dateDisplay = 'Today';
        } else if (roomDateStr === tomorrow.toDateString()) {
            dateDisplay = 'Tomorrow';
        } else {
            dateDisplay = room.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        return {
            id: room.id,
            venue: room.venue,
            court: room.court,
            date: dateDisplay,
            time: room.time,
            duration: room.duration,
            isHost: room.hostUserId === currentUserId,
            participants: room.participants.length,
            expiresAt: room.expiresAt
        };
    }

    /**
     * Add a participant to a chatroom (when someone joins an open game)
     */
    async addParticipant(chatroomId: string, userId: string): Promise<void> {
        await this.ensureInitialized();

        const chatroom = this.chatrooms.find(r => r.id === chatroomId);
        if (chatroom && !chatroom.participants.includes(userId)) {
            chatroom.participants.push(userId);
            await this.saveToStorage();
            console.log('👥 Added participant to chatroom:', chatroomId);
        }
    }

    /**
     * Get a specific chatroom by ID
     */
    async getChatroom(chatroomId: string): Promise<GameChatroom | null> {
        await this.ensureInitialized();
        return this.chatrooms.find(r => r.id === chatroomId) || null;
    }

    /**
     * Get chatroom by booking ID
     */
    async getChatroomByBookingId(bookingId: string): Promise<GameChatroom | null> {
        await this.ensureInitialized();
        return this.chatrooms.find(r => r.bookingId === bookingId && r.isActive) || null;
    }

    /**
     * Remove expired chatrooms (30 minutes after game end)
     */
    async cleanupExpiredChatrooms(): Promise<void> {
        await this.ensureInitialized();

        const now = new Date();
        const beforeCount = this.chatrooms.length;
        
        this.chatrooms = this.chatrooms.filter(room => {
            if (room.expiresAt <= now) {
                console.log('🗑️ Removing expired chatroom:', {
                    venue: room.venue,
                    court: room.court,
                    expiredAt: room.expiresAt.toLocaleString()
                });
                return false;
            }
            return true;
        });

        const afterCount = this.chatrooms.length;
        
        if (beforeCount !== afterCount) {
            await this.saveToStorage();
            console.log(`🧹 Cleaned up ${beforeCount - afterCount} expired chatrooms`);
        }
    }

    /**
     * Manually delete a chatroom (for testing or admin purposes)
     */
    async deleteChatroom(chatroomId: string): Promise<void> {
        await this.ensureInitialized();

        const index = this.chatrooms.findIndex(r => r.id === chatroomId);
        if (index !== -1) {
            const room = this.chatrooms[index];
            this.chatrooms.splice(index, 1);
            await this.saveToStorage();
            console.log('🗑️ Deleted chatroom:', room.venue, room.court);
        }
    }

    /**
     * Get all chatrooms (for debugging)
     */
    async getAllChatrooms(): Promise<GameChatroom[]> {
        await this.ensureInitialized();
        return [...this.chatrooms];
    }

    /**
     * Clear all chatrooms (for testing)
     */
    async clearAllChatrooms(): Promise<void> {
        this.chatrooms = [];
        await this.saveToStorage();
        console.log('🧹 Cleared all chatrooms');
    }
}

export const GameChatroomService = new GameChatroomServiceClass();
