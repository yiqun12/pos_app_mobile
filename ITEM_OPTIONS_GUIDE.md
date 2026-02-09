# Item Options and Ingredients Feature Guide

## Overview

The POS app now supports customizable menu items with options (single/multi-select) and optional ingredients (add-ons). This allows customers to customize their orders and track their selections throughout the ordering process.

## Data Model Changes

### MenuItem Type (types/menu.ts)

Extended the `MenuItem` type to include optional customization:

```typescript
export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  optionGroups?: OptionGroup[];      // NEW: Customizable options
  ingredients?: Ingredient[];        // NEW: Optional add-ons
};
```

### Option Groups

Option groups define customizable aspects of an item (e.g., "Spice Level", "Size"):

```typescript
export type OptionGroup = {
  id: string;
  name: string;
  type: "single" | "multi";  // single-select or multi-select
  required: boolean;          // Must user select at least one?
  choices: OptionChoice[];    // Available choices
};

export type OptionChoice = {
  id: string;
  name: string;
  priceAdjustment?: number;  // Additional cost (e.g., +$1.00 for extra large)
};
```

### Ingredients/Add-ons

Ingredients are optional toggleable items (e.g., "Extra cheese", "No onions"):

```typescript
export type Ingredient = {
  id: string;
  name: string;
  priceAdjustment?: number;  // Additional cost
};
```

### OrderItem Type (components/seats/types.ts)

Updated `OrderItem` to store user selections:

```typescript
export type OrderItem = {
  id: string;
  name: string;
  price: number;          // Final price including adjustments
  quantity: number;
  notes?: string;
  originalPrice?: number;
  selectedOptions?: SelectedOption[];      // NEW: User selections
  selectedIngredients?: {                  // NEW: Selected add-ons
    id: string;
    name: string;
    priceAdjustment?: number;
  }[];
};

export type SelectedOption = {
  groupId: string;
  groupName: string;
  selectedChoices: {
    id: string;
    name: string;
    priceAdjustment?: number;
  }[];
};
```

## Components

### MenuEditorModal (Enhanced)

**File**: `components/menu/modals/MenuEditorModal.tsx`

Enhanced to allow defining options and ingredients when creating/editing menu items.

**Features:**
- Basic item info (name, price)
- Collapsible "Options & Add-ons" section
- Add/edit/remove option groups with choices
- Add/edit/remove ingredients
- Configure option type (single/multi-select) and required status
- Set price adjustments for each choice and ingredient

**Usage:**
```tsx
<MenuEditorModal
  visible={visible}
  mode="add"
  onClose={() => setVisible(false)}
  onSave={(name, price, optionGroups, ingredients) => {
    // Save item with options/ingredients
  }}
/>
```

### ItemOptionsModal (New)

**File**: `components/menu/modals/ItemOptionsModal.tsx`

Modal for users to select options and ingredients when adding items to their order.

**Features:**
- Displays item name and final calculated price
- Shows all option groups with required indicator
- Single/multi-select radio buttons or checkboxes
- Shows price adjustments for each choice
- Toggleable ingredients with checkboxes
- Validates that all required options are selected before allowing confirmation
- Calculates price adjustments in real-time

**Usage:**
```tsx
<ItemOptionsModal
  visible={showOptions}
  item={selectedMenuItem}
  onClose={() => setShowOptions(false)}
  onConfirm={(selectedOptions, selectedIngredients) => {
    // Create order item with selections
    // Price already includes adjustments
  }}
/>
```

### MenuSelectionModal (Enhanced)

**File**: `components/menu/modals/MenuSelectionModal.tsx`

Enhanced to automatically open `ItemOptionsModal` when selecting items with customization options.

**Flow:**
1. User selects menu item from grid
2. If item has option groups or ingredients:
   - Opens `ItemOptionsModal` for customization
   - User selects options/ingredients
   - Confirms to add to order (with price adjustments included)
3. If item has no customization:
   - Directly adds to order

**Features:**
- Shows "Customizable" indicator on items with options
- Responsive font sizes for iPad support
- Search and category filtering still works

### OrderItemRow (Enhanced)

**File**: `components/seats/order/OrderItemRow.tsx`

Updated to display selected options and ingredients in order summary.

**Display Format:**
```
Item Name
$Price

Option Group Name: Choice 1, Choice 2
Add-ons: Ingredient 1, Ingredient 2

Quantity | Total Price
```

**Features:**
- Shows all selected options grouped by option name
- Shows all selected ingredients
- Maintains edit/delete/quantity adjustment functionality
- Responsive font sizing

## User Flows

### Managing Items (Admin/Menu Setup)

1. Go to Menu tab
2. Create/Edit item
3. In "Options & Add-ons" section:
   - Click "+" to add option group or ingredient
   - For option group:
     - Enter group name (e.g., "Spice Level")
     - Choose single-select or multi-select
     - Toggle "Required" if option must be selected
     - Add choices with optional price adjustments
   - For ingredient:
     - Enter name (e.g., "Extra Cheese")
     - Set optional price adjustment
4. Save item

### Ordering (Customer/Cashier)

1. Select seat
2. Click "Add Item" button
3. Select item from menu:
   - If item has no customization → added to order directly
   - If item has customization → ItemOptionsModal opens
4. In ItemOptionsModal:
   - For each required option group, select at least one choice
   - For multi-select groups, can select multiple choices
   - Toggle any optional ingredients
   - Final price updates in real-time
5. Click "Add to Order"
6. Item appears in order list with selections displayed
7. Can still edit quantity, delete, or manually adjust price

### Viewing Order Details

- **In Seat Order**: Shows selected options and ingredients under item name
- **In Revenue Details**: Order detail modal displays all item selections
- **In Print**: Print output includes all selected options and ingredients

## Price Calculation

### Automatic Calculation

When user selects options/ingredients in `ItemOptionsModal`:
- Base item price is used
- All price adjustments are summed
- Final price = base price + adjustments
- This final price is stored in the `OrderItem`

### Example:
```
Burger: $10.00
Option: Size "Large" (+$2.00)
Ingredients: "Extra Cheese" (+$1.50), "Bacon" (+$2.50)

Final Price = $10.00 + $2.00 + $1.50 + $2.50 = $16.00
```

## Implementation Details

### State Management
- Menu items stored in `MenuContext` with optional `optionGroups` and `ingredients`
- Selected options/ingredients stored in `OrderItem` properties
- Order items in component state include full selection data

### Responsive Design
- All components use `useResponsiveLayout` hook
- Font sizes and spacing scale for tablet/iPad
- Touch targets meet accessibility guidelines

### Data Persistence
- Currently stores in component state (can be extended to persist)
- Full selection data included in order objects
- Ready for integration with backend API

## Example: Creating a Customizable Burger

```typescript
const burgerWithOptions: MenuItem = {
  id: "burger-1",
  categoryId: "main",
  name: "Classic Burger",
  price: 12.99,
  optionGroups: [
    {
      id: "size-group",
      name: "Size",
      type: "single",
      required: true,
      choices: [
        { id: "small", name: "Small", priceAdjustment: -1.00 },
        { id: "regular", name: "Regular", priceAdjustment: 0 },
        { id: "large", name: "Large", priceAdjustment: 2.00 },
      ],
    },
    {
      id: "cook-group",
      name: "Cooking Temperature",
      type: "single",
      required: false,
      choices: [
        { id: "rare", name: "Rare" },
        { id: "medium-rare", name: "Medium Rare" },
        { id: "medium", name: "Medium" },
        { id: "well-done", name: "Well Done" },
      ],
    },
  ],
  ingredients: [
    { id: "cheese", name: "Extra Cheese", priceAdjustment: 0.50 },
    { id: "bacon", name: "Bacon", priceAdjustment: 1.50 },
    { id: "avocado", name: "Avocado", priceAdjustment: 2.00 },
    { id: "tomato", name: "Tomato" },
    { id: "lettuce", name: "Lettuce" },
  ],
};
```

## Testing

### To Test Menu Editor:
1. Go to Menu tab
2. Edit or create an item
3. Expand "Options & Add-ons"
4. Add option groups and ingredients
5. Save and verify data persists

### To Test Ordering:
1. Create item with options
2. Go to Seats tab
3. Select seat
4. Click "Add Item"
5. Select customizable item
6. ItemOptionsModal should appear
7. Try different option/ingredient combinations
8. Verify final price updates correctly
9. Confirm order and verify item displays all selections

### To Test Order Details:
1. After adding customized items
2. View order summary in payment modal
3. Verify all options/ingredients are displayed
4. Check revenue details for order

## Future Enhancements

- Save customer preferences for quick reorder
- Recipe/instruction notes for kitchen
- Allergy warnings and dietary restrictions
- Image gallery for options
- Stock management for individual ingredients
- Quantity limits on add-ons
- Combo/bundle pricing rules
- Backend persistence and syncing
