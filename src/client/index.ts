// Client module entry point
export { default as DashboardScreen } from './screens/DashboardScreen';

export { ClientService } from './services/clientApi';

// Re-export common types and components for client module
export * from '../common/components/Button';
export * from '../common/components/Input';
export * from '../common/types';
