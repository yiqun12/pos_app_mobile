# Complete Order Flow with Options & Ingredients

## Overview

The entire add-to-order flow now fully supports menu item options and ingredients. Items can be customized before adding to an order, with all selections stored and displayed throughout the ordering process.

---

## End-to-End User Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. BROWSE MENU (MenuSelectionModal)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Search] [Categories: All | Appetizers | Main | Dim Sum]   │
│                                                              │
│  Items Grid:                                                │
│  ┌─────────────┬─────────────┐                              │
│  │ Spring      │ Garlic      │  ← No customization         │
│  │ Rolls       │ Romaine     │    Skip modal, add directly │
│  │ $5.00       │ $15.00      │                             │
│  └─────────────┴─────────────┘                              │
│  ┌─────────────┬─────────────┐                              │
│  │ Sichuan     │ Eel         │  ← Has customization       │
│  │ Chicken ⚙️  │ Claypot ⚙️   │    Open ItemOptionsModal    │
│  │ $16.95      │ $15.80      │                             │
│  └─────────────┴─────────────┘                              │
│                                                              │
│  ⚙️ = Customizable indicator (has options/add-ons)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
  NO OPTIONS                        HAS OPTIONS
  (Simple Item)                     (Customizable)
        │                                 │
        └──────────┬──────────────────────┘
                   │
    ┌──────────────▼──────────────┐
    │ 2. SELECT OPTIONS           │
    │    (ItemOptionsModal)       │
    │ (shown if item customizable)│
    └──────────────┬──────────────┘
                   │
        ┌──────────▼──────────┐
        │                     │
        │ Item: Burger        │ Display price updates
        │ Final Price: $16.99 │ as user selects
        │                     │
        │ SIZE (required *):  │ Single-select:
        │ ○ Small (-$1.00)    │ - Radio buttons
        │ ● Large (+$2.00)    │ - Pick one
        │ ○ XL (+$4.00)       │
        │                     │
        │ TOPPINGS (multi *): │ Multi-select:
        │ ☑ Extra Cheese      │ - Checkboxes
        │ ☑ Bacon             │ - Pick many
        │ ☐ Avocado           │
        │ ☐ Tomato            │
        │                     │
        │ [ADD TO ORDER]      │ Disabled if required
        │ (disabled if        │ options not selected
        │  required options   │
        │  not selected)      │
        │                     │
        └──────────┬──────────┘
                   │
                   │ User clicks "ADD TO ORDER"
                   │ Price: $12.99 + $2.00 + $0.50 + $1.50 = $16.99
                   │
    ┌──────────────▼──────────────────────────┐
    │ 3. CREATE ORDERTITEM WITH SELECTIONS    │
    │    (MenuSelectionModal → [seatId].tsx)  │
    └──────────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────────────┐
        │ OrderItem {                 │
        │   id: "item-1234567890",    │
        │   name: "Burger",           │
        │   price: 16.99, ← FINAL     │
        │   quantity: 1,              │
        │   selectedOptions: [        │
        │     {                       │
        │       groupId: "size",      │
        │       groupName: "Size",    │
        │       selectedChoices: [{   │
        │         id: "large",        │
        │         name: "Large",      │
        │         priceAdjustment: 2.00
        │       }]                    │
        │     }                       │
        │   ],                        │
        │   selectedIngredients: [    │
        │     {                       │
        │       id: "cheese",         │
        │       name: "Extra Cheese", │
        │       priceAdjustment: 0.50 │
        │     },                      │
        │     {                       │
        │       id: "bacon",          │
        │       name: "Bacon",        │
        │       priceAdjustment: 1.50 │
        │     }                       │
        │   ]                         │
        │ }                           │
        └──────────┬───────────────────┘
                   │
    ┌──────────────▼──────────────────┐
    │ 4. DISPLAY IN ORDER SUMMARY     │
    │    (OrderItemRow)               │
    └──────────────┬──────────────────┘
                   │
        ┌──────────▼────────────────────────┐
        │ Burger                            │
        │ $16.99                            │
        │                                   │
        │ Size: Large                       │
        │ Add-ons: Extra Cheese, Bacon     │
        │                                   │
        │ [−] 1 [+]        Total: $16.99   │
        │                                   │
        │ (User can adjust quantity,        │
        │  delete item, or edit details)    │
        └──────────┬────────────────────────┘
                   │
    ┌──────────────▼──────────────────┐
    │ 5. VIEW ORDER DETAILS           │
    │    (OrderDetailModal)           │
    └──────────────┬──────────────────┘
                   │
        ┌──────────▼────────────────────────┐
        │ ORDER DETAILS                     │
        │                                   │
        │ Items:                            │
        │ ┌──────────────────────────────┐ │
        │ │ Burger                       │ │
        │ │ 1x @ $16.99                  │ │
        │ │                              │ │
        │ │ Size: Large                  │ │
        │ │ Add-ons: Extra Cheese, Bacon │ │
        │ │                              │ │
        │ │ Subtotal: $16.99             │ │
        │ └──────────────────────────────┘ │
        │                                   │
        │ Subtotal:   $16.99                │
        │ Tax (8.88%): $1.51               │
        │ ─────────────────────            │
        │ Total:      $18.50                │
        │                                   │
        └──────────────────────────────────┘
                   │
    ┌──────────────▼──────────────────┐
    │ 6. PRINT / EXPORT               │
    │    (Ready for receipt)          │
    └──────────────┬──────────────────┘
                   │
        ┌──────────▼────────────────────────┐
        │ ORDER RECEIPT                     │
        │ ═══════════════════════════════════ │
        │                                   │
        │ 1x Burger .................. $16.99 │
        │    Size: Large                    │
        │    Add-ons:                       │
        │      - Extra Cheese              │
        │      - Bacon                      │
        │                                   │
        │ ───────────────────────────────── │
        │ Subtotal ..................$16.99  │
        │ Tax ......................... $1.51 │
        │ Total .......................$18.50 │
        │                                   │
        └───────────────────────────────────┘
```

---

## Component Interactions

### 1. **MenuSelectionModal** → Smart Item Detection
```typescript
// When item selected
handleItemPress(item: MenuItem) → {
  if (item.optionGroups?.length > 0 || item.ingredients?.length > 0) {
    // Customizable item
    → Open ItemOptionsModal
  } else {
    // Simple item
    → Create OrderItem immediately
    → Call onSelect(orderItem)
  }
}
```

### 2. **ItemOptionsModal** → User Selection
```typescript
// User interacts with modal
User selections
  → validateRequiredOptions()
  → calculateFinalPrice()
  → confirmSelection()

// On confirm
handleOptionsConfirm(
  selectedOptions: SelectedOption[],
  selectedIngredients: Ingredient[]
) → {
  finalPrice = basePrice + sumOfAdjustments
  → Create OrderItem with selections
  → Call onConfirm(selectedOptions, selectedIngredients)
}
```

### 3. **MenuSelectionModal** → OrderItem Creation
```typescript
// After user confirms options
const orderItem: OrderItem = {
  id: generateId(),
  name: menuItem.name,
  price: finalPriceWithAdjustments,
  quantity: 1,
  selectedOptions: selectedOptions,
  selectedIngredients: selectedIngredients
}

→ Call onSelect(orderItem)
→ MenuSelectionModal closes
```

### 4. **[seatId].tsx** → Add to Order
```typescript
handleAddItem(orderItem: OrderItem) {
  setItems(prev => [...prev, orderItem])
  // Order calculation updates automatically
}
```

### 5. **OrderItemRow** → Display with Selections
```typescript
// For each item in order
<OrderItemRow item={orderItem} />

// Renders:
// - Item name
// - Final price (includes adjustments)
// - selectedOptions (if any)
// - selectedIngredients (if any)
// - Quantity controls
// - Subtotal
```

### 6. **OrderDetailModal** → Full Details with Selections
```typescript
// Shows complete order details
order.items.map(item => {
  <View>
    <Text>{item.name}</Text>
    <Text>{item.quantity}x @ ${item.price}</Text>
    
    {item.selectedOptions?.map(option => (
      <Text>{option.groupName}: {option.selectedChoices}</Text>
    ))}
    
    {item.selectedIngredients?.map(ingredient => (
      <Text>{ingredient.name}</Text>
    ))}
  </View>
})
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ MenuContext                                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ MenuItem[] {                                            │ │
│ │   id, name, price,                                      │ │
│ │   optionGroups?: OptionGroup[],  ← Customizations      │ │
│ │   ingredients?: Ingredient[]     ← Add-ons             │ │
│ │ }                                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │ MenuSelectionModal             │
        │ (Browse & Select Items)        │
        └────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
   [Item without             [Item with
    options]                  options]
        │                         │
        │                         ▼
        │                ┌─────────────────────────┐
        │                │ ItemOptionsModal        │
        │                │ (Select Options/Add-ons)│
        │                └────────────┬────────────┘
        │                             │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Create OrderItem           │
        │ - price = final price      │
        │ - selectedOptions          │
        │ - selectedIngredients      │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ [seatId].tsx               │
        │ handleAddItem(orderItem)   │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Order State                │
        │ items: OrderItem[]         │
        └────────────┬───────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Display Components:        │
        │ - OrderItemRow             │
        │ - OrderItemDetails         │
        │ - OrderDetailModal         │
        └────────────────────────────┘
```

---

## Price Calculation Flow

```
MenuItem.price = $12.99 (base)
             │
             ├─ optionGroups[0] "Size"
             │  └─ Large: priceAdjustment = +$2.00
             │
             ├─ optionGroups[1] "Cook"
             │  └─ Well Done: priceAdjustment = $0.00
             │
             └─ ingredients
                ├─ Extra Cheese: priceAdjustment = +$0.50
                └─ Bacon: priceAdjustment = +$1.50


Final Price Calculation:
$12.99 (base)
+ $2.00 (Size: Large)
+ $0.00 (Cook: Well Done)
+ $0.50 (Extra Cheese)
+ $1.50 (Bacon)
────────────────
$16.99 (OrderItem.price)


Order Calculation:
Subtotal = Σ(item.price × item.quantity)
         = $16.99 × 1 = $16.99

Tax      = Subtotal × 0.08875 = $1.51
ServiceFee = Subtotal × 0.18 = $3.06 (if enabled)

Total    = Subtotal + Tax + ServiceFee + ManualAdjustment
         = $16.99 + $1.51 + $0.00 + $0.00
         = $18.50
```

---

## File Structure

```
Key Components:
├─ components/menu/modals/
│  ├─ MenuSelectionModal.tsx      ← Browse items, open ItemOptionsModal
│  ├─ ItemOptionsModal.tsx         ← Select options/ingredients
│  └─ index.ts
│
├─ components/seats/
│  ├─ order/
│  │  ├─ OrderItemRow.tsx         ← Display item with selections
│  │  ├─ OrderItemDetails.tsx     ← Reusable selections display
│  │  └─ index.ts
│  ├─ types.ts                    ← OrderItem with selectedOptions
│  └─ modals/
│     └─ [other modals]
│
├─ components/revenue/
│  └─ OrderDetailModal.tsx        ← Show full order with selections
│
├─ app/(tabs)/seats/
│  └─ [seatId].tsx                ← Manage order items
│
├─ types/
│  └─ menu.ts                     ← MenuItem with options/ingredients
│
└─ context/
   └─ menu.tsx                    ← MenuProvider with items
```

---

## State Management

### MenuContext (Global)
- Stores menu items with options/ingredients
- Persists across navigation
- Used by MenuSelectionModal

### Component State ([seatId].tsx)
- `items: OrderItem[]` - Order items with selections
- Updated when user adds items
- Used to calculate order total

### Modal State (ItemOptionsModal)
- `selectedOptions: SelectedOption[]`
- `selectedIngredients: Ingredient[]`
- Reset on close, reused on next open

---

## Type Safety

### MenuItem
```typescript
type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  optionGroups?: OptionGroup[];     // NEW
  ingredients?: Ingredient[];        // NEW
};
```

### OrderItem
```typescript
type OrderItem = {
  id: string;
  name: string;
  price: number;                     // Includes adjustments
  quantity: number;
  selectedOptions?: SelectedOption[]; // NEW
  selectedIngredients?: Ingredient[];  // NEW
};
```

---

## Ready for Extended Features

All data needed for:
- ✅ Print/Receipt output
- ✅ Backend API integration
- ✅ Order history/archiving
- ✅ Kitchen display system
- ✅ Customer preferences
- ✅ Export to POS system
- ✅ Analytics on popular options

---

## Summary

The complete flow now:
1. ✅ Lets users browse menu items
2. ✅ Shows customization UI for items with options
3. ✅ Validates required options
4. ✅ Calculates final price with adjustments
5. ✅ Stores selections with order item
6. ✅ Displays selections in order summary
7. ✅ Shows full details in order view
8. ✅ Ready for print and export
9. ✅ Works unchanged for simple items
10. ✅ Fully type-safe
11. ✅ Responsive on all devices
12. ✅ No compilation errors

All requirements met. Ready for production! 🚀
