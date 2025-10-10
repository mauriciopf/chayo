# 🔧 Tools System Refactor - Appointments → Reservations

## ✅ COMPLETED

### 1. ToolSystemService Created ✓
**File**: `apps/web/lib/features/tools/shared/services/ToolSystemService.ts`

**Features**:
- Centralized tool management service
- Type-safe `ToolType` enum with all available tools
- `TOOL_CONFIGS` registry - single source of truth for all tools
- Tool categories: engagement, commerce, support, content
- Methods:
  - `getAllTools()` - Get all available tools
  - `getToolConfig(toolType)` - Get specific tool configuration
  - `getEnabledTools(orgId, supabase)` - Get enabled tools for organization
  - `getAgentToolSettings(orgId, supabase)` - Get UI toggle settings
  - `updateToolSetting(orgId, toolType, enabled, supabase)` - Update tool status
  - `checkToolConstraints(orgId, toolType, supabase)` - Check if tool can be enabled
  - `isCoreTool(toolType)` - Check if tool is core (always enabled)

**Tool Constraints Implemented**:
- ✅ **Payments**: Requires active payment provider (Stripe/PayPal/Square)
- ✅ **Products**: Requires at least one product
- ✅ **Reservations**: Requires at least one product (products are what get reserved)

**Backward Compatibility**:
- Automatically maps old 'appointments' to 'reservations' when reading from database

### 2. Database Migration ✓
**File**: `migrations/update_agent_tools_appointments_to_reservations.sql`

**Changes**:
- Migrates existing 'appointments' entries to 'reservations'
- Updates `agent_tools_tool_type_check` constraint
- Updates `get_organization_agent_tools()` function with new tool list
- Maintains backward compatibility

**New Tool Types**:
```sql
'reservations',      -- NEW: Replaces appointments
'documents', 
'payments', 
'products',
'intake_forms',
'faqs',
'customer_support',
```

### 3. Hint Modal & Chips Updated ✓
**Files**:
- `apps/web/lib/features/chat/components/ActionableHintChips.tsx`
- `apps/web/lib/features/chat/components/ActionableHintShareModal.tsx`

**Changes**:
- Updated `AgentToolSettings` interface: `appointments` → `reservations`
- Updated hint chip:
  - ID: `schedule_appointment` → `make_reservation`
  - Label: "Agendar cita" → "Hacer reservación"
  - Description: Updated to reflect reservations system
  - Category: `appointments` → `reservations`
- Removed `AppointmentToolConfig` import
- Added simple reservations info panel (no complex config needed)
- Updated modal content renderer to use `reservations` case

### 4. Translations ✓
**File**: `apps/web/messages/es.json`

Already had `agentTools.modal.reservations` section with:
- Title: "Sistema de Reservaciones"
- Description: Product/service booking system
- Features: Real-time availability, product linkage, email confirmations, status management

## 📋 REMAINING TASKS

### 1. Update ToolIntentService (High Priority)
**File**: `apps/web/lib/features/tools/shared/services/toolIntentService.ts`

**Needs**:
- Replace with `ToolSystemService` for tool management
- Update `getEnabledTools()` to use new service
- Update function definitions to include `reservations` instead of `appointments`
- Remove old appointment-specific logic

### 2. Update Agent Tool Constraints API
**File**: `apps/web/app/api/organizations/[id]/agent-tools/constraints/route.ts`

**Needs**:
- Update to use `ToolSystemService.checkToolConstraints()`
- Remove old appointment constraint logic
- Add reservations constraint (requires products)

### 3. Update Agent Tools API
**File**: `apps/web/app/api/organizations/[id]/agent-tools/route.ts`

**Needs**:
- Update GET endpoint to use `ToolSystemService.getAgentToolSettings()`
- Update POST endpoint to use `ToolSystemService.updateToolSetting()`
- Handle `reservations` instead of `appointments`

### 4. Update System Prompts
**Files**:
- `apps/web/lib/features/chat/services/systemPrompt/SuggestedToolsSystemPrompt.yml`
- `apps/web/lib/features/chat/services/systemPrompt/businessSystemPrompt.yaml`

**Needs**:
- Replace `appointments` with `reservations` in tool lists
- Update prompts: "appointment booking" → "reservation system"
- Update examples and descriptions

### 5. Update Client System Prompt Service
**File**: `apps/web/lib/features/chat/services/clientPrompt/ClientSystemPromptService.ts`

**Needs**:
- Use `ToolSystemService.getEnabledTools()` instead of direct database query
- Update tool references

### 6. Clean Up Old Appointment Code

**Delete Files**:
- `apps/web/lib/features/tools/appointments/` (entire directory)
- `apps/web/app/api/appointments/route.ts` (replaced by `/api/reservations/`)
- `apps/web/app/api/organizations/[id]/appointments/route.ts` (replaced by `/api/reservations/`)
- `apps/web/app/[locale]/appointment/` pages
- `apps/web/app/[locale]/book-appointment/` pages

**Update Files**:
- Remove appointment references from types
- Update navigation/routing
- Clean up imports

### 7. Update Config Types
**File**: `apps/web/lib/shared/types/configTypes.ts`

**Needs**:
- Update `enabledTools` type to use `ToolType` from `ToolSystemService`
- Remove appointment-specific types

### 8. Update Message Types
**File**: `apps/web/lib/shared/types/types.ts`

**Needs**:
- Change `appointmentLink?` to `reservationLink?`
- Update JSDoc comments

## 🎯 BENEFITS OF NEW SYSTEM

### Centralization
- ✅ Single source of truth for all tools (`TOOL_CONFIGS`)
- ✅ Type-safe tool definitions with TypeScript enums
- ✅ Consistent tool metadata across the entire app

### Maintainability
- ✅ Easy to add new tools (just add to `TOOL_CONFIGS`)
- ✅ Centralized constraint checking logic
- ✅ Simplified tool enablement/disablement

### Consistency
- ✅ Same tool names/IDs everywhere
- ✅ Standardized tool categories
- ✅ Uniform constraint checking

### Developer Experience
- ✅ Auto-complete for tool types
- ✅ Compile-time safety
- ✅ Clear service API

## 📝 USAGE EXAMPLES

### Get Enabled Tools
```typescript
import { ToolSystemService } from '@/lib/features/tools/shared/services/ToolSystemService'

const enabledTools = await ToolSystemService.getEnabledTools(organizationId, supabase)
// Returns: ['vibe_card', 'reservations', 'products', ...]
```

### Check Tool Constraints
```typescript
const constraint = await ToolSystemService.checkToolConstraints(
  organizationId,
  'reservations',
  supabase
)

if (!constraint.canEnable) {
  console.log(constraint.reason) // "Debes agregar al menos un producto..."
}
```

### Update Tool Setting
```typescript
const result = await ToolSystemService.updateToolSetting(
  organizationId,
  'reservations',
  true,
  supabase
)
```

### Get Tool Config
```typescript
const config = ToolSystemService.getToolConfig('reservations')
console.log(config.displayName) // "Reservaciones"
console.log(config.icon) // "📅"
console.log(config.category) // "commerce"
```

## 🚀 NEXT STEPS

1. Update `ToolIntentService` to use `ToolSystemService`
2. Update API routes to use new service
3. Update system prompts
4. Remove old appointment code
5. Update mobile app tool references
6. Test all tool functionality end-to-end
7. Run database migrations

## 🔑 KEY FILES

**Core Service**:
- `apps/web/lib/features/tools/shared/services/ToolSystemService.ts`

**Migrations**:
- `migrations/update_agent_tools_appointments_to_reservations.sql`
- `migrations/replace_appointments_with_reservations.sql`

**UI Components**:
- `apps/web/lib/features/chat/components/ActionableHintChips.tsx`
- `apps/web/lib/features/chat/components/ActionableHintShareModal.tsx`

**API Routes**:
- `apps/web/app/api/reservations/route.ts` (NEW)
- `apps/web/app/api/organizations/[id]/reservations/route.ts` (NEW)

**Translations**:
- `apps/web/messages/es.json` (Updated with reservations)

