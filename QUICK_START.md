# Quick Start: Item Options and Ingredients

## Adding a Customizable Item

### Step 1: Open Menu Editor
1. Go to **Menu** tab
2. Create a new item or edit an existing one
3. Expand **"Options & Add-ons"** section

### Step 2: Add Option Groups
Click the **+** button in "Customization Options"

For each option group:
- **Name**: "Size", "Spice Level", "Temperature", etc.
- **Type**: Choose "Pick One" (single-select) or "Pick Many" (multi-select)
- **Required**: Toggle if customer MUST select an option
- **Options**: Add individual choices
  - Enter choice name (e.g., "Small", "Medium", "Large")
  - Optional: Enter price adjustment (e.g., "+2.00" for larger size)

### Step 3: Add Ingredients (Optional)
Click the **+** button in "Add-ons / Ingredients"

For each ingredient:
- **Name**: "Extra Cheese", "Extra Bacon", "No Onions", etc.
- **Price**: Optional cost (e.g., "+0.50")

### Step 4: Save
Click **Save** at the bottom

## Example: Custom Pizza Item

**Name**: Classic Margherita  
**Base Price**: $14.99

**Option Group 1: Size**
- Type: Single-select
- Required: Yes
- Choices:
  - Small (-$2.00)
  - Medium (no adjustment)
  - Large (+$3.00)
  - Extra Large (+$5.00)

**Option Group 2: Crust**
- Type: Single-select
- Required: No
- Choices:
  - Thin Crust
  - Hand-tossed
  - Stuffed Crust (+$2.50)
  - Cauliflower (+$1.50)

**Ingredients**
- Extra Cheese (+$0.50)
- Extra Pepperoni (+$1.50)
- Mushrooms (free)
- Olives (free)
- Spinach (free)
- Garlic Oil (free)

## Ordering with Options

### For Customers/Cashiers
1. Go to **Seats** tab
2. Select a seat
3. Click **"Add Item"** button
4. Browse and select an item from the menu
5. **If item is customizable**, ItemOptionsModal automatically appears
6. Select required options (marked with red *)
7. Optional: Toggle any add-ons you want
8. Final price updates automatically
9. Click **"Add to Order"**
10. Item appears in order with all selections shown

## Viewing Customizations

### In Order Summary
Selected options and ingredients display under the item name:
```
Margherita Pizza
$17.99

Size: Large
Crust: Stuffed Crust
Add-ons: Extra Cheese, Extra Pepperoni
```

### In Order Details
Full customization history appears in order detail modal (for revenue tracking)

## Tips & Tricks

### Price Management
- Use negative adjustments for downsizing (e.g., Small -$2.00)
- Use positive adjustments for upgrades (e.g., Premium +$1.50)
- Free options leave adjustment blank
- Final price always shown before customer confirms

### Option Design
- **Single-select**: For mutually exclusive choices (Size, Temperature)
- **Multi-select**: For independent selections (Toppings, Modifications)
- **Required**: For critical choices (Size on drinks/sides)
- **Optional**: For nice-to-haves (Extra sauce, Side options)

### Ingredients Best Practices
- Keep names clear and concise ("Extra Cheese" not "Cheese")
- Group similar items in order groups instead of ingredients
- Use ingredients for add-ons, modifications, and removals
- Separate pricing for premium ingredients

### Common Patterns

**Drink Sizes:**
- Option Group (single, required)
- Small, Medium, Large
- Pricing: Small -$1.00, Medium baseline, Large +$1.00

**Burger Customization:**
- Option Group 1: Cook Temperature (single, optional)
- Option Group 2: Cheese (single, optional)
- Ingredients: Bacon, Avocado, Extra Tomato, etc.

**Sandwich Builder:**
- Option Group 1: Size (single, required)
- Option Group 2: Bread Type (single, required)
- Ingredients: All possible toppings/additions

**Spice Levels:**
- Option Group (single, optional)
- Mild, Medium, Hot, Extra Spicy
- Usually no price adjustment

## Troubleshooting

**Can't find customizable item?**
- Ensure you expanded "Options & Add-ons" section
- Make sure you saved the item after adding options

**Option prices not showing?**
- Only non-zero adjustments display
- Check that you entered the adjustment value

**Customer can't select required option?**
- ItemOptionsModal shows required with red *
- Can't confirm until all required options selected
- Check that option group is marked as "Required"

**Item price seems wrong?**
- Final price includes all selected option adjustments
- Check that each option choice has correct price set
- Ingredients also add to final price

## Keyboard Shortcuts (Admin)

While editing item options:
- Tab: Move to next field
- Enter: Save item
- Esc: Close modal

## Print/Receipt Integration

When implementing print functionality:
```
Item: Margherita Pizza - $17.99
  Size: Large (+$3.00)
  Crust: Stuffed Crust (+$2.50)
  Add-ons: Extra Cheese (+$0.50), Extra Pepperoni (+$1.50)
```

## API Integration (Future)

When connecting to backend, send full OrderItem:
```json
{
  "id": "item-12345",
  "name": "Margherita Pizza",
  "price": 17.99,
  "quantity": 2,
  "selectedOptions": [
    {
      "groupId": "size",
      "groupName": "Size",
      "selectedChoices": [
        {"id": "large", "name": "Large", "priceAdjustment": 3.00}
      ]
    },
    {
      "groupId": "crust",
      "groupName": "Crust",
      "selectedChoices": [
        {"id": "stuffed", "name": "Stuffed Crust", "priceAdjustment": 2.50}
      ]
    }
  ],
  "selectedIngredients": [
    {"id": "cheese", "name": "Extra Cheese", "priceAdjustment": 0.50},
    {"id": "pepperoni", "name": "Extra Pepperoni", "priceAdjustment": 1.50}
  ]
}
```

---

For detailed technical documentation, see [ITEM_OPTIONS_GUIDE.md](ITEM_OPTIONS_GUIDE.md)
