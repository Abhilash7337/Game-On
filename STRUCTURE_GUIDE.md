# Project Structure Documentation

## Overview
The project has been reorganized into a clean, scalable structure separating concerns by user roles (user, client, admin) with shared common components and utilities.

## Folder Structure

```
/src
  /user              # End-user facing app
    /screens
      HomeScreen.tsx         # Main dashboard for users
      SocialScreen.tsx       # Social games and player connections
      CourtsScreen.tsx       # Court browsing and discovery
      ProfileScreen.tsx      # User profile management
      BookingScreen.tsx      # Court booking interface
    /components              # User-specific components
    /services
      userApi.ts            # User-related API calls
    index.ts               # User module exports

  /client            # Venue owner/client app
    /screens
      DashboardScreen.tsx   # Client dashboard with revenue, bookings
    /components             # Client-specific components
    /services
      clientApi.ts         # Client-related API calls
    index.ts              # Client module exports

  /admin             # System administrator app
    /screens
      AdminDashboard.tsx    # System overview and management
    /components             # Admin-specific components
    /services
      adminApi.ts          # Admin-related API calls
    index.ts              # Admin module exports

  /common            # Shared across all apps
    /components
      Button.tsx           # Reusable button component
      Input.tsx            # Reusable input component
      AppHeader.tsx        # Common header component
    /utils
      bookingStore.ts      # Booking state management
    /constants
      theme.ts             # Color and styling constants
    /types
      index.ts             # TypeScript interfaces and types
    /services              # Shared API utilities
    index.ts              # Common module exports

/app                 # Current Expo Router structure (to be updated)
/assets              # Images, fonts, etc.
/styles              # Legacy styles (to be moved to src/common)
```

## Key Features by Role

### User App Features:
- Home dashboard with upcoming games
- Social tab with available games to join
- Court discovery and booking
- Profile management
- Open game creation and joining

### Client App Features:
- Revenue and booking analytics
- Venue management
- Court availability management
- Booking oversight
- Customer insights

### Admin App Features:
- System overview and stats
- User management
- Venue approval and management
- Platform analytics
- System settings

## Next Steps:

1. **Update Routing**: Modify the main app routing to use the new structure
2. **Update Imports**: Update all import paths to use the new structure
3. **Clean Up**: Remove old files and update package imports
4. **Role-Based Navigation**: Implement role-based app switching
5. **Testing**: Ensure all functionality works with new structure

## Benefits of This Structure:

- **Separation of Concerns**: Each user type has its own dedicated space
- **Code Reusability**: Common components and utilities are shared
- **Scalability**: Easy to add new features per user type
- **Maintainability**: Clear organization makes code easier to maintain
- **Type Safety**: Strong TypeScript interfaces across all modules