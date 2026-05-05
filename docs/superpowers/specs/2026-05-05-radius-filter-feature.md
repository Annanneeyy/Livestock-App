# Feature Specification: Radius-Based Filtering for Interactive Map

**Date:** 2026-05-05  
**Status:** Implemented  
**Feature:** Radius Filtering & Unified Map Controls  

## Overview
This feature introduces the ability for users to filter livestock listings on the interactive map based on a chosen radius from their current location. It also refactors the map UI for better usability and consistency across platforms (Web, Android, iOS).

## Changes Implemented

### 1. Distance Calculation Logic
- Implemented the **Haversine Formula** in `LivestockMap.tsx` to calculate the straight-line distance between the user's GPS coordinates and listing coordinates in kilometers.
- Added logic to hide/show listings based on the selected radius:
    - **Any**: Shows all listings (default).
    - **5km, 10km, 25km, 50km**: Filters listings strictly within these bounds.
- Listings without coordinates (unmapped) are hidden whenever a specific radius is set.

### 2. Unified Map Controls UI
- Combined the **Map Legend**, **Radius Filter**, and **List Toggle** into a single horizontal row at the top-left of the map.
- Used a `flex-row` container with `gap-2` and `flex-wrap` to ensure the buttons align properly on all screen sizes.
- Added `z-index` stacking to ensure dropdown menus (Legend and Radius) appear above other map elements.

### 3. Radius Dropdown Component
- Replaced the initial horizontal scrolling pill buttons with a stylish **Dropdown Menu**.
- Added a `compass` icon and a chevron indicator.
- Included a "checkmark" indicator for the currently selected radius within the dropdown list.
- Improved error handling: Displays a subtle message if location permissions are denied or if the location is still being fetched while a filter is active.

### 4. Custom Web Marker Icons
- Updated `NativeMap.web.tsx` to replace default Leaflet blue pins with **Custom DivIcons**.
- Marker icons on web now match the native look:
    - Circular white container (`rounded-full`).
    - Category emoji (e.g., 🐷 for Baktin).
    - Centered bottom-tip anchor for accurate location pointing.
- Removed text labels from markers to ensure consistency with the native app's simplified icon-only design.

### 5. Strict Platform Consistency
- Ensured the filtering logic applies to both the **Map Markers** and the **Toggleable List View**.
- If a radius is set but the user's location is unavailable, the map strictly hides listings until the location is resolved (unless set to "Any").

### 6. Android Marker Layout Fixes & Simplification
- **Resolved Android Cut-off**: Fixed a bug where livestock names were being truncated on Android markers due to internal `react-native-maps` layout constraints.
- **Icon-Only markers**: Transitioned all map markers to a simplified icon-only design (Emoji within a circle). This provides:
    - A cleaner, modern map interface.
    - Absolute immunity to text-cutting issues on different screen densities.
    - Cross-platform visual parity.
- **Interactive Details**: Names and prices are still visible in the interactive callouts (popups) when a marker is selected.

## Technical Instructions for Future Updates

### Adding New Radius Options
To add a new distance option, update the `RADIUS_OPTIONS` constant in `LivestockMap.tsx`:
```typescript
const RADIUS_OPTIONS = [
  { label: 'Any', value: null },
  { label: '5km', value: 5 },
  // Add here...
];
```

### Modifying Web Marker Styles
Styles for the web markers are located in `components/NativeMap.web.tsx` within the `L.divIcon` HTML string. Use inline CSS to adjust colors, padding, or borders.

### Handling Location Permissions
The app uses `expo-location`. Ensure that `NSLocationWhenInUseUsageDescription` (iOS) and `ACCESS_FINE_LOCATION` (Android) remain configured in `app.json`.
