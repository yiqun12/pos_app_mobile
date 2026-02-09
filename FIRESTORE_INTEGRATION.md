# Firestore Menu Data Integration

## Overview

The menu UI now fetches live menu data from Firestore instead of using hardcoded mock data. The system gracefully handles loading states, errors, and falls back to mock data if Firestore is unavailable.

---

## Architecture

### Data Flow

```
Firestore (doc: "TitleLogoNameContent/23-sf-90011-960")
    ↓
    data.key (JSON string with menu items)
    ↓
useFirestoreMenu() hook (hooks/use-firestore-menu.ts)
    ↓
    Parses JSON → Categories & MenuItems
    ↓
MenuContext (context/menu.tsx)
    ↓
MenuSelectionModal (components/menu/modals/MenuSelectionModal.tsx)
    ↓
UI with Loading/Error States
```

---

## Components & Files

### 1. **hooks/use-firestore-menu.ts** (NEW)
A React hook that fetches menu data from Firestore and parses it into MenuCategory and MenuItem objects.

**Features:**
- Fetches from Firestore document: `TitleLogoNameContent/23-sf-90011-960`
- Parses JSON from `data.key` field
- Returns categories, items, loading state, and error message
- Handles errors gracefully

**Usage:**
```typescript
const { categories, items, loading, error } = useFirestoreMenu();
```

**Expected Firestore Data Format:**
```json
{
  "key": "{\"Appetizers\": [{\"name\": \"Spring Rolls\", \"price\": 5.0}], ...}"
}
```

The hook parses this JSON and converts it to:
```typescript
{
  categories: [
    { id: "cat-1", name: "Appetizers" },
    ...
  ],
  items: [
    { 
      id: "item-1", 
      categoryId: "cat-1", 
      name: "Spring Rolls", 
      price: 5.0,
      optionGroups: [...],    // if defined in data
      ingredients: [...]       // if defined in data
    },
    ...
  ],
  loading: boolean,
  error: string | null
}
```

---

### 2. **context/menu.tsx** (UPDATED)
MenuContext now integrates with Firestore data and exposes loading/error states.

**What Changed:**
- Added `loading: boolean` to MenuContextType
- Added `error: string | null` to MenuContextType
- Integrated `useFirestoreMenu()` hook
- Initializes state from Firestore data
- Falls back to mock data if Firestore fails or returns empty
- Exposes loading/error states for UI consumption

**Context Value:**
```typescript
{
  categories: MenuCategory[];
  items: MenuItem[];
  loading: boolean;        // NEW
  error: string | null;    // NEW
  // ... other methods
}
```

**Fallback Behavior:**
- If Firestore data loads successfully → Use Firestore data
- If Firestore returns error → Use fallback mock data, set error message
- If Firestore data is empty → Use fallback mock data, no error

---

### 3. **components/menu/modals/MenuSelectionModal.tsx** (UPDATED)
Menu selection modal now respects loading/error states and shows appropriate UI.

**New States:**

1. **Loading State**
   - Shows spinner and "Loading menu..." message
   - Search and categories hidden
   - User cannot interact until data loads

2. **Error State**
   - Shows error icon and message
   - Displays specific Firestore error details
   - "Close" button to dismiss
   - Menu categories/items hidden

3. **Ready State** (No loading, no error)
   - Shows normal menu UI
   - Search, categories, items all available
   - User can select items

**UI Flow:**
```
Modal Opens
    ↓
Has MenuContext.loading?
    ├─ YES → Show Loading Spinner
    └─ NO  → Check error
            ├─ Has error? → Show Error Message
            └─ NO error  → Show Menu (normal UI)
```

---

## Implementation Details

### useFirestoreMenu Hook

**Location:** `hooks/use-firestore-menu.ts`

**How It Works:**
1. On mount, fetches document from Firestore
2. Extracts `data.key` field (JSON string)
3. Parses JSON to extract categories and items
4. Maps Firestore data to MenuItem/MenuCategory types
5. Returns all data in a single object

**Error Handling:**
- Catches Firestore fetch errors → Returns error message
- Catches JSON parse errors → Returns error message
- Document not found → Returns specific error message
- Missing `key` field → Returns error message

**Fallback Features:**
- If JSON parsing fails, returns empty categories/items
- Allows MenuContext to use fallback mock data

### MenuContext Integration

**Location:** `context/menu.tsx`

**Initialization Flow:**
```typescript
useEffect(() => {
  if (firestoreMenu.loading) {
    setLoading(true);
    return;
  }

  if (firestoreMenu.error) {
    // Use fallback with error message
    setCategories(FALLBACK_CATEGORIES);
    setItems(FALLBACK_ITEMS);
    setError(firestoreMenu.error);
    setLoading(false);
    return;
  }

  if (firestoreMenu.categories.length > 0 || firestoreMenu.items.length > 0) {
    // Use Firestore data
    setCategories(firestoreMenu.categories);
    setItems(firestoreMenu.items);
    setError(null);
    setLoading(false);
  } else {
    // Empty data → fallback
    setCategories(FALLBACK_CATEGORIES);
    setItems(FALLBACK_ITEMS);
    setError(null);
    setLoading(false);
  }
}, [firestoreMenu.loading, firestoreMenu.error, ...]);
```

### MenuSelectionModal UI States

**Location:** `components/menu/modals/MenuSelectionModal.tsx`

**Loading State:**
```tsx
{loading && (
  <View className="flex-1 items-center justify-center">
    <ActivityIndicator size="large" color={colors.tint} />
    <Text className="mt-4 text-slate-500">Loading menu...</Text>
  </View>
)}
```

**Error State:**
```tsx
{!loading && error && (
  <View className="flex-1 items-center justify-center px-4">
    <Ionicons name="alert-circle-outline" size={48} color={colors.tint} />
    <Text className="mt-4 font-semibold">Unable to Load Menu</Text>
    <Text className="mt-2 text-slate-600">{error}</Text>
    <TouchableOpacity onPress={onClose} className="mt-6 rounded-lg bg-blue-600">
      <Text className="text-center font-semibold text-white">Close</Text>
    </TouchableOpacity>
  </View>
)}
```

**Ready State:**
```tsx
{!loading && !error && (
  <>
    {/* Search, Categories, Items */}
  </>
)}
```

---

## Data Parsing Example

### Input (Firestore)
```json
{
  "key": "{\"Appetizers\": [{\"name\": \"Spring Rolls\", \"price\": 5.0}], \"Main Courses\": [{\"name\": \"Sichuan Chicken\", \"price\": 16.95}]}"
}
```

### Parsed Output
```typescript
{
  categories: [
    { id: "cat-1", name: "Appetizers" },
    { id: "cat-2", name: "Main Courses" }
  ],
  items: [
    { 
      id: "item-1", 
      categoryId: "cat-1", 
      name: "Spring Rolls", 
      price: 5.0
    },
    { 
      id: "item-2", 
      categoryId: "cat-2", 
      name: "Sichuan Chicken", 
      price: 16.95
    }
  ]
}
```

---

## Error Scenarios

### Scenario 1: Network Error
**Firestore Error:** `Network request failed`
**UI Result:** Shows error message, user can close modal and retry

### Scenario 2: Document Not Found
**Firestore Error:** `Document not found: TitleLogoNameContent/23-sf-90011-960`
**UI Result:** Shows error message, falls back to mock data

### Scenario 3: Invalid JSON
**Firestore Error:** `Error parsing menu data`
**UI Result:** Shows error message, falls back to mock data

### Scenario 4: Missing key Field
**Firestore Error:** `No menu data found in document`
**UI Result:** Shows error message, falls back to mock data

---

## Testing

### Manual Tests

1. **Load Menu from Firestore**
   - Open menu modal
   - Verify loading spinner shows briefly
   - Verify items from Firestore appear
   - Search and filter should work

2. **Error Handling**
   - Disconnect internet, try to open menu
   - Verify error message appears
   - Verify "Close" button works
   - Menu should fall back to mock data if needed

3. **Fallback Behavior**
   - Temporarily modify Firestore document to have empty data
   - Open menu
   - Verify fallback mock data appears instead

---

## Configuration

To customize the Firestore document being fetched, pass parameters to the hook:

```typescript
// Default (uses "23-sf-90011-960")
const menu = useFirestoreMenu();

// Custom document ID
const menu = useFirestoreMenu("custom-doc-id");

// Custom collection and document
const menu = useFirestoreMenu("custom-doc-id", "CustomCollection");
```

---

## Files Modified

1. ✅ `lib/firebase.ts` - Fixed auth initialization
2. ✅ `context/menu.tsx` - Integrated Firestore with fallback
3. ✅ `components/menu/modals/MenuSelectionModal.tsx` - Added loading/error UI
4. ✅ `hooks/use-firestore-menu.ts` - NEW hook for Firestore data

---

## Status

✅ **Complete** - Menu UI now uses live Firestore data
- Loading states properly handled
- Error messages shown when needed
- Graceful fallback to mock data
- Full backward compatibility
- No compilation errors
