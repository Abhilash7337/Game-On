// User module entry point
export { default as BookingScreen } from './screens/BookingScreen';

export { UserService } from './services/userApi';

// Re-export common types and components for user module
export * from '../common/components/Button';
export * from '../common/components/Input';
export * from '../common/types';

