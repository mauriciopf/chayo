# Reservations as Product Feature - Quick Reference

> **Note**: For complete system documentation, see `RESERVATIONS_SYSTEM_AUDIT.md`

## Overview
Reservations are a **product-level feature** controlled via the product form toggle. The "Reservaciones" menu automatically appears when ANY product has reservations enabled.

## Key Changes

### 1. Database Changes
- **Removed** `reservations` from `agent_tools` table constraint
- **Removed** all existing `reservations` tool records from the database
- **Updated** `get_organization_agent_tools()` function to exclude reservations
- **Kept** `products_list_tool.supports_reservations` column as the source of truth

### 2. Web UI Changes

#### Product Form
- **Kept** the "Habilitar Reservaciones" toggle in `ProductForm.tsx`
- Users can enable/disable reservations per product
- This is the **only** place to control reservation capability

#### Agent Tools / Hint Chips
- **Removed** reservations from `ActionableHintChips.tsx`
- **Removed** reservations from `ActionableHintShareModal.tsx`
- **Removed** `ReservationToolConfig` component usage
- No more "Sistema de Reservas" chip in the chat interface

#### Navigation
- **Updated** `DesktopNavigation.tsx` to check for `hasReservableProducts` prop
- "Reservaciones" menu item shows if **ANY** product has `supports_reservations = true`
- Dashboard fetches products and checks the flag on mount

#### Dashboard Page
- **Removed** `agentToolSettings` state
- **Added** `hasReservableProducts` state
- **Added** effect to check if any products have reservations enabled:
  ```typescript
  const checkReservableProducts = async () => {
    const response = await fetch(`/api/products?organizationId=${orgId}`)
    const products = await response.json()
    const hasReservable = products.some(p => p.supports_reservations === true)
    setHasReservableProducts(hasReservable)
  }
  ```

### 3. Mobile App
- Mobile app already uses the `supports_reservations` flag on products
- "Reservar" button only shows if `product.supports_reservations === true`
- No changes needed to mobile code

### 4. API Routes
- **Existing** `/api/reservations` route validates `supports_reservations` before creating reservations
- **Existing** `/api/organizations/[id]/reservations` route for management
- No changes needed to API logic

## Migration SQL

Run this migration to remove reservations from the agent_tools system:

```bash
psql $DATABASE_URL -f migrations/remove_reservations_from_agent_tools.sql
```

Or via Supabase CLI:
```bash
npx supabase db push --file migrations/remove_reservations_from_agent_tools.sql
```

## User Flow

### Enabling Reservations for a Product
1. Go to "Agents" tab in web dashboard
2. Click "Editar" on a product
3. Toggle "Habilitar Reservaciones" ON
4. Save the product

### Viewing Reservations Menu
- The "Reservaciones" menu item in the left sidebar will **automatically appear** once ANY product has reservations enabled
- Click it to manage all reservations across all reservable products

### Making a Reservation (Mobile)
1. Browse products in the mobile marketplace
2. Tap on a product that has reservations enabled
3. Tap "Reservar" button
4. Select date and time
5. Confirm reservation

### Making a Reservation (Web)
1. Access the organization's public mobile app via QR code or deep link
2. View product with reservations enabled
3. Follow the same flow as mobile

## Benefits of This Approach

1. **Simpler UX**: One place to control reservations (product form)
2. **Less Confusion**: No duplicate controls in multiple places
3. **Automatic Menu**: Reservations menu shows/hides based on actual product configuration
4. **Product-Centric**: Makes sense that reservations are tied to specific products/services
5. **Cleaner Code**: Removed unnecessary tool system complexity for this feature

## Files Modified

### Web
- `apps/web/components/products/ProductForm.tsx` - Kept toggle
- `apps/web/lib/features/chat/components/ActionableHintChips.tsx` - Removed chip
- `apps/web/lib/features/chat/components/ActionableHintShareModal.tsx` - Removed modal config
- `apps/web/lib/features/dashboard/components/navigation/DesktopNavigation.tsx` - Check products
- `apps/web/app/[locale]/dashboard/page.tsx` - Fetch products, check flag
- `apps/web/lib/features/dashboard/components/layout/MainDashboardLayout.tsx` - Pass prop

### Database
- `migrations/remove_reservations_from_agent_tools.sql` - New migration

### Mobile
- No changes needed (already working correctly)

## Testing Checklist

- [ ] Create a product and enable reservations toggle
- [ ] Verify "Reservaciones" menu appears in sidebar
- [ ] Disable reservations on all products
- [ ] Verify "Reservaciones" menu disappears
- [ ] Test making a reservation from mobile app
- [ ] Test viewing reservations in web dashboard
- [ ] Verify API routes still work correctly

## Rollback Plan

If needed, rollback by:
1. Restoring the `reservations` tool type to agent_tools constraint
2. Re-adding the reservation chip and modal components
3. Reverting navigation logic to check tool settings

However, this is **not recommended** as the new approach is much cleaner.

