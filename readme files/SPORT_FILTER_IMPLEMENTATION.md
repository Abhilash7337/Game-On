# Sport Filter Implementation - How It Works

## Overview
The sport filtering system checks the **courts** associated with each venue and extracts the sport types from the `court.type` field to enable filtering by sport.

## Data Flow

### 1. **Venue Creation**
When a venue is created, courts are added with a `type` field:
```typescript
courts: [
  { id: '1-1', name: 'Court 1', venueId: '1', type: 'badminton', isActive: true },
  { id: '1-2', name: 'Court 2', venueId: '1', type: 'tennis', isActive: true },
]
```

### 2. **Loading Venues (getPublicVenues)**
Location: `/src/common/services/venueStorage.ts`

When venues are fetched for the Courts screen:
```typescript
static async getPublicVenues() {
  // 1. Fetch all active venues
  const allVenues = await this.getAllVenues();
  const activeVenues = allVenues.filter(venue => venue.isActive);
  
  // 2. Fetch ALL courts for these venues from database
  const { data: courtsData } = await supabase
    .from('courts')
    .select('venue_id, type')
    .in('venue_id', venueIds)
    .eq('is_active', true);
  
  // 3. Group courts by venue_id and extract unique sport types
  const venueSportsMap = new Map<string, string[]>();
  courtsData.forEach(court => {
    // Normalize court type to lowercase
    const sportType = court.type?.toLowerCase();
    
    // Add to venue's sport types if not already present
    if (!venueSportsMap.get(court.venue_id)?.includes(sportType)) {
      venueSportsMap.get(court.venue_id).push(sportType);
    }
  });
  
  // 4. Add sport types to each venue
  return activeVenues.map(venue => ({
    ...venue,
    sportType: sportTypes[0],      // Primary sport (first court type)
    sportTypes: sportTypes,         // All available sports
  }));
}
```

### 3. **Courts Screen Transformation**
Location: `/app/(tabs)/courts.tsx`

When venues load in the Courts screen:
```typescript
const transformedVenues = venuesData.map(venue => ({
  ...venue,
  sportType: venue.sportType,    // From getPublicVenues
  sportTypes: venue.sportTypes,  // From getPublicVenues
}));
```

### 4. **Filter Application**
Location: `/src/common/contexts/VenueFilterContext.tsx`

When sport filters are applied:
```typescript
// Sport type filter (multi-select)
if (filters.sportTypes.length > 0 && !filters.sportTypes.includes('all')) {
  filtered = filtered.filter(venue => {
    // Get venue's sports from sportTypes array or single sportType
    const venueSports = venue.sportTypes || (venue.sportType ? [venue.sportType] : []);
    
    // Check if ANY of the venue's sports match the filter
    return filters.sportTypes.some(filterSport => 
      venueSports.includes(filterSport)
    );
  });
}
```

## Example Flow

### Scenario: User clicks "Tennis" filter

1. **Database Structure**:
```
Venue: "Sports Arena"
├── Court A (type: 'tennis')
├── Court B (type: 'badminton')
└── Court C (type: 'tennis')

Venue: "Mahindra Court"
├── Court 1 (type: 'badminton')
└── Court 2 (type: 'badminton')
```

2. **After getPublicVenues()**:
```javascript
[
  {
    id: '1',
    name: 'Sports Arena',
    sportType: 'tennis',
    sportTypes: ['tennis', 'badminton'],
    // ... other fields
  },
  {
    id: '2',
    name: 'Mahindra Court',
    sportType: 'badminton',
    sportTypes: ['badminton'],
    // ... other fields
  }
]
```

3. **User Action**: Clicks "Tennis" filter
   - `filters.sportTypes = ['tennis']`

4. **Filter Logic**:
```typescript
// For "Sports Arena"
venueSports = ['tennis', 'badminton']
filterSport = 'tennis'
matches = venueSports.includes('tennis') // ✅ TRUE - SHOW

// For "Mahindra Court"
venueSports = ['badminton']
filterSport = 'tennis'
matches = venueSports.includes('tennis') // ❌ FALSE - HIDE
```

5. **Result**: Only "Sports Arena" is displayed

## Sport Type Normalization

Sport types are normalized to **lowercase** to ensure consistent matching:
- Database: `'Tennis'`, `'TENNIS'`, `'tennis'` → All become `'tennis'`
- Filter Pills: Display names are capitalized, but values are lowercase

## Key Points

1. **Source of Truth**: The `courts` table's `type` field
2. **Extraction**: Happens in `getPublicVenues()` via Supabase query
3. **Storage**: Added to venue object as `sportType` and `sportTypes`
4. **Matching**: Case-insensitive, checks if ANY venue sport matches filter
5. **Multi-Sport Venues**: Venues with multiple court types appear in multiple sport filters

## Common Sport Types
- `badminton`
- `tennis`
- `basketball`
- `football`
- `cricket`
- `volleyball`
- `squash`

## Troubleshooting

### Venue not appearing in sport filter?
1. Check if venue has courts in database:
   ```sql
   SELECT * FROM courts WHERE venue_id = 'your-venue-id' AND is_active = true;
   ```

2. Verify court `type` field matches sport filter name (case-insensitive)

3. Check if venue is active:
   ```sql
   SELECT is_active FROM venues WHERE id = 'your-venue-id';
   ```

### Want to add new sport type?
1. Create courts with the new sport type
2. Add sport to `SportFilterPills` component if needed
3. Sport will automatically appear in filters once courts exist
