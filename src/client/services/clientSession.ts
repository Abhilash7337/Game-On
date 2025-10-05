// Simple client session management
// In a real app, this would integrate with proper authentication

interface ClientSession {
  clientId: string;
  name: string;
  email: string;
  isAuthenticated: boolean;
}

class ClientSessionManager {
  private static currentSession: ClientSession | null = null;

  // Set client session (called after login)
  static setSession(session: ClientSession): void {
    this.currentSession = session;
  }

  // Get current client session
  static getSession(): ClientSession | null {
    return this.currentSession;
  }

  // Get current client ID
  static getCurrentClientId(): string | null {
    return this.currentSession?.clientId || null;
  }

  // Check if client is authenticated
  static isAuthenticated(): boolean {
    return this.currentSession?.isAuthenticated || false;
  }

  // Logout client
  static logout(): void {
    this.currentSession = null;
  }

  // Create a demo session for testing
  static createDemoSession(): void {
    this.currentSession = {
      clientId: 'current-client',
      name: 'Demo Venue Owner',
      email: 'demo@gameon.com',
      isAuthenticated: true,
    };
  }
}

export { ClientSessionManager, type ClientSession };
