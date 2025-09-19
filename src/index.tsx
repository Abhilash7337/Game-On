
// Main entry point for the application
// This file exports all modules for easy access

// Re-export all modules
export * from './admin';
export * from './client';
export * from './common';
export * from './user';

// Export user role type for app switching
export type { UserRole } from './common/types';
