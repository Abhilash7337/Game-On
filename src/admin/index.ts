// Admin module entry point
export { default as AdminDashboard } from './screens/AdminDashboard';

export { AdminService } from './services/adminApi';

// Re-export common types and components for admin module
export * from '../common/components/Button';
export * from '../common/components/Input';
export * from '../common/types';
