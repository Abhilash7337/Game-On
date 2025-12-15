# Sport Filter Pills Component Documentation

## Overview

A modern, horizontal scrollable filter bar with pill-style buttons featuring sport-specific images. Provides an intuitive UI for multi-select sport filtering with smooth animations, active states, and responsive design.

---

## Features

✅ **Horizontal Scrollable** - Smooth horizontal scroll with hidden scrollbar  
✅ **Sport-Specific Images** - 24x24px circular sport icons in each pill  
✅ **Multi-Select Filtering** - Select multiple sports simultaneously  
✅ **Active State Styling** - Orange (#FF6B35) background with shadow when active  
✅ **Filter Count Badge** - Shows number of active filters  
✅ **Clear All Button** - Appears when filters are active  
✅ **Auto-Scroll** - Automatically scrolls to newly activated pill  
✅ **Ripple Effect** - Android ripple on tap  
✅ **Smooth Transitions** - 300ms ease transitions on all state changes  
✅ **Sticky Positioning** - Can be positioned below hero section  

---

## Component Structure

### File Location
```
/src/common/components/SportFilterPills.tsx
```

### Core Data Structure

```typescript
interface SportFilter {
  id: string;
  name: string;
  image: any | null;
}

const SPORT_FILTERS: SportFilter[] = [
  { id: 'all', name: 'All Sports', image: null },
  { id: 'football', name: 'Football', image: getSportImage('football') },
  { id: 'cricket', name: 'Cricket', image: getSportImage('cricket') },
  { id: 'basketball', name: 'Basketball', image: getSportImage('basketball') },
  { id: 'tennis', name: 'Tennis', image: getSportImage('tennis') },
  { id: 'badminton', name: 'Badminton', image: getSportImage('badminton') },
  { id: 'volleyball', name: 'Volleyball', image: getSportImage('volleyball') },
];
```

---

## Props API

### `SportFilterPillsProps`

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `activeSports` | `string[]` | ✅ Yes | - | Array of active sport IDs (e.g., `['football', 'cricket']`) |
| `onToggleSport` | `(sportId: string) => void` | ✅ Yes | - | Callback when a pill is pressed. Receives sport ID |
| `onClearFilters` | `() => void` | ❌ No | `undefined` | Callback for "Clear All" button. Button hidden if not provided |
| `showFilterCount` | `boolean` | ❌ No | `true` | Whether to show active filter count badge |

---

## Usage Examples

### Basic Integration

```tsx
import { SportFilterPills } from '@/src/common/components/SportFilterPills';
import { useVenueFilter } from '@/src/common/contexts/VenueFilterContext';

function CourtsScreen() {
  const { filters, toggleSportFilter, clearAllFilters } = useVenueFilter();
  
  return (
    <View>
      <SportFilterPills
        activeSports={filters.sportTypes}
        onToggleSport={toggleSportFilter}
        onClearFilters={clearAllFilters}
        showFilterCount={true}
      />
    </View>
  );
}
```

### Without Clear Button

```tsx
<SportFilterPills
  activeSports={['football', 'cricket']}
  onToggleSport={(sportId) => console.log('Toggled:', sportId)}
  // onClearFilters not provided - button won't show
  showFilterCount={false}
/>
```

### With Custom State Management

```tsx
function CustomFilterScreen() {
  const [selectedSports, setSelectedSports] = useState(['all']);
  
  const handleToggle = (sportId: string) => {
    if (sportId === 'all') {
      setSelectedSports(['all']);
    } else {
      setSelectedSports(prev => {
        const filtered = prev.filter(s => s !== 'all');
        return filtered.includes(sportId)
          ? filtered.filter(s => s !== sportId)
          : [...filtered, sportId];
      });
    }
  };
  
  return (
    <SportFilterPills
      activeSports={selectedSports}
      onToggleSport={handleToggle}
      onClearFilters={() => setSelectedSports(['all'])}
    />
  );
}
```

---

## Design Specifications

### Pill Dimensions

```
Width: auto (content-based)
Height: 44px
Border Radius: 22px (fully rounded)
Padding: 12px 20px
Gap (icon to text): 8px
Margin Right: 12px
```

### Color Scheme

**Inactive State:**
```css
Background: #FFFFFF
Border: 1px solid #E5E7EB
Text Color: #374151
Shadow: none
```

**Active State:**
```css
Background: #FF6B35 (orange)
Border: none
Text Color: #FFFFFF
Shadow: 0 4px 12px rgba(255,107,53,0.3)
```

**Pressed State:**
```css
Opacity: 0.8
Transform: scale(0.97)
```

### Sport Icon/Image

```
Size: 24px x 24px
Border Radius: 12px (circular)
Object Fit: cover
Background (loading): #F3F4F6
```

### Filter Count Badge

```
Position: absolute, top-right
Background: #FEF3C7 (yellow)
Text Color: #92400E (dark yellow)
Padding: 4px 10px
Border Radius: 12px
Font Size: 11px
Font Weight: 600
```

### Clear All Button

```
Background: #FEE2E2 (light red)
Border: 1px solid #FCA5A5 (red)
Text Color: #EF4444 (red)
Icon: close-circle (18px)
Gap: 6px
```

---

## Behavior Details

### Multi-Select Logic

1. **"All Sports" Selection:**
   - Selecting "All Sports" clears all other filters
   - Sets `activeSports` to `['all']`

2. **Individual Sport Selection:**
   - First individual sport selection removes "All Sports"
   - Subsequent selections toggle on/off
   - If all individual sports are deselected, reverts to "All Sports"

3. **Toggle Behavior:**
   - If sport is active → remove from array
   - If sport is inactive → add to array
   - Special handling for 'all' to maintain exclusivity

### Auto-Scroll Behavior

```typescript
// When a pill is pressed:
1. Toggle the sport filter
2. Wait 100ms for state update
3. Calculate pill's x-position
4. Scroll to position - 20px (for padding)
5. Use animated scroll (duration: 300ms)
```

### Clear Filters Behavior

```typescript
// "Clear All" button:
- Only visible when activeFilterCount > 0
- Calls onClearFilters() callback
- Typically resets to ['all']
- Animated scroll to start of list
```

---

## Styling Customization

### Platform-Specific Shadows

**iOS:**
```typescript
shadowColor: '#FF6B35',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.3,
shadowRadius: 12,
```

**Android:**
```typescript
elevation: 6,
```

### Transition Timing

All transitions use **300ms** duration:
- Pill activation/deactivation
- Shadow appearance
- Color changes
- Auto-scroll animation

---

## Integration with VenueFilterContext

The component is designed to work seamlessly with the existing filter context:

```tsx
// In VenueFilterContext:
export interface VenueFilterState {
  sportTypes: string[];  // ← Used by SportFilterPills
  distanceRange: { min: number; max: number; };
  priceRange: { min: number; max: number; };
  minRating: number;
  sortBy: SortOption;
  searchQuery: string;
}

// Available methods:
toggleSportFilter(sport: string) → void  // ← Connected to onToggleSport
clearAllFilters() → void                 // ← Connected to onClearFilters
```

### Data Flow

```
User taps pill
    ↓
onToggleSport(sportId) called
    ↓
toggleSportFilter() in context
    ↓
filters.sportTypes updated
    ↓
applyFilters() re-runs (memoized)
    ↓
filteredVenues updated
    ↓
Courts screen re-renders with filtered list
```

---

## Accessibility Features

1. **Touch Target Size:** 44px height meets WCAG minimum
2. **Visual Feedback:** Clear active/inactive states
3. **Ripple Effect:** Android material design ripple on tap
4. **Color Contrast:** Active state has high contrast (white on orange)
5. **Icon + Text:** Dual visual cues for better recognition

---

## Performance Optimizations

### 1. **Ref-Based Position Tracking**
```typescript
const pillRefs = useRef<{ [key: string]: number }>({});

// Store x-position on layout
onLayout={(event) => {
  pillRefs.current[sport.id] = event.nativeEvent.layout.x;
}}
```

### 2. **Memoized Filter Count**
```typescript
const activeFilterCount = activeSports.filter(s => s !== 'all').length;
const hasActiveFilters = activeFilterCount > 0;
```

### 3. **Platform-Specific Ripple**
```typescript
android_ripple={{
  color: isActive ? 'rgba(255,255,255,0.3)' : 'rgba(255,107,53,0.1)',
  borderless: false,
}}
```

### 4. **Conditional Rendering**
- Filter count badge only renders when `hasActiveFilters && showFilterCount`
- Clear button only renders when `hasActiveFilters && onClearFilters`

---

## Common Use Cases

### Use Case 1: Filter Venues by Sport
```tsx
// User taps "Football" pill
onToggleSport('football')
  ↓
filters.sportTypes = ['football']
  ↓
Only football venues shown in list
```

### Use Case 2: Multi-Sport Filter
```tsx
// User taps "Football", then "Cricket"
filters.sportTypes = ['football', 'cricket']
  ↓
Venues with either football OR cricket shown
```

### Use Case 3: Clear All Filters
```tsx
// User taps "Clear All" button
onClearFilters()
  ↓
filters.sportTypes = ['all']
  ↓
All venues shown
```

---

## Troubleshooting

### Issue: Images not showing

**Check:**
1. Images exist in `/src/assets/images/sports/`
2. `imageAssets.ts` correctly imports them
3. `getSportImage()` returns valid source

**Solution:**
```typescript
import { getSportImage, getFallbackImage } from '@/src/assets/images/imageAssets';

const sportImage = getSportImage('football') || getFallbackImage('sport');
```

### Issue: Pills not scrolling

**Check:**
1. `ScrollView` has `horizontal` prop
2. `contentContainerStyle` has padding
3. `showsHorizontalScrollIndicator={false}` set

**Solution:**
```typescript
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={{ paddingHorizontal: 16 }}
>
```

### Issue: Active state not updating

**Check:**
1. `activeSports` prop is being updated
2. `onToggleSport` is calling context method
3. Context provider wraps component

**Solution:**
```typescript
// Ensure provider wraps screen
<VenueFilterProvider>
  <CourtsScreen />
</VenueFilterProvider>

// Extract methods correctly
const { filters, toggleSportFilter } = useVenueFilter();
```

---

## Future Enhancements

1. **Horizontal Scroll Indicators** - Show left/right arrows when content overflows
2. **Swipe Gestures** - Swipe to scroll through pills
3. **Quick Presets** - "Popular Sports", "Indoor Sports", "Outdoor Sports" buttons
4. **Sport Count Badges** - Show number of venues per sport
5. **Animated Transitions** - Pill reordering based on selection
6. **Search Integration** - Search within sport names
7. **Haptic Feedback** - Vibration on selection (iOS)
8. **Custom Sport Order** - Remember user's frequently selected sports

---

## Testing Checklist

- [ ] All sport pills render correctly
- [ ] Images load for each sport
- [ ] "All Sports" uses grid icon
- [ ] Tapping pill toggles active state
- [ ] Active state shows orange background + shadow
- [ ] Multiple sports can be selected
- [ ] Filter count badge shows correct number
- [ ] "Clear All" button appears when filters active
- [ ] Tapping "Clear All" resets to ['all']
- [ ] Auto-scroll to activated pill works
- [ ] Horizontal scroll is smooth
- [ ] Scrollbar is hidden
- [ ] Android ripple effect works
- [ ] iOS shadow renders correctly
- [ ] Venue list updates on filter change
- [ ] No TypeScript errors
- [ ] No console warnings

---

## Summary

The **SportFilterPills** component provides:
- ✅ Beautiful horizontal scrollable filter UI
- ✅ Sport-specific images with 24x24px circular icons
- ✅ Multi-select filtering with clear visual feedback
- ✅ Active state styling with orange theme (#FF6B35)
- ✅ Filter count badge and clear button
- ✅ Auto-scroll to activated pills
- ✅ Smooth 300ms transitions
- ✅ Platform-specific optimizations
- ✅ Seamless integration with VenueFilterContext
- ✅ Production-ready performance

Perfect for creating an engaging, intuitive filtering experience in the Courts screen!
