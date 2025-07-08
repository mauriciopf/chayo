# Team Management Feature

This document outlines the team management functionality added to the Chayo AI Dashboard.

## Overview

The team management feature allows users to collaborate on AI projects by:
- Creating organizations to group team members
- Inviting team members via email
- Managing roles and permissions
- Sharing access to AI agents within the organization

## Database Schema

### Organizations
- **Purpose**: Groups users and manages their collaborative workspace
- **Key Fields**: 
  - `id`: Unique identifier
  - `name`: Organization display name
  - `slug`: URL-friendly identifier
  - `owner_id`: User who created the organization
  - `plan_name`: Subscription plan level

### Team Members
- **Purpose**: Tracks organization membership and roles
- **Roles**:
  - `owner`: Full control over organization (created it)
  - `admin`: Can invite/remove members, manage agents
  - `member`: Can view and use agents
- **Status**: `active`, `pending`, `suspended`

### Team Invitations
- **Purpose**: Manages pending invitations to organizations
- **Security**: Uses unique tokens with expiration dates
- **Workflow**: Email invitation → Token verification → Team membership

## API Endpoints

### Organizations
- `GET /api/organizations` - List user's organizations
- `POST /api/organizations` - Create new organization

### Team Members
- `GET /api/team-members?organizationId=X` - List organization members
- `POST /api/team-members` - Add member to organization
- `PUT /api/team-members` - Update member role/status
- `DELETE /api/team-members?memberId=X` - Remove member

### Invitations
- `GET /api/invitations?organizationId=X` - List pending invitations
- `POST /api/invitations` - Send invitation
- `PUT /api/invitations` - Accept invitation (by token)
- `DELETE /api/invitations?invitationId=X` - Cancel invitation

## User Interface

### Dashboard Integration
- New "Team Management" tab in the main dashboard
- Team member count displayed in sidebar navigation
- Role-based access controls throughout the interface

### Team Management Page
- **Active Members Section**: 
  - List all organization members
  - Display roles with color-coded badges
  - Admin/Owner controls for role changes and removal
- **Pending Invitations Section**:
  - Show invitations awaiting acceptance
  - Option to cancel pending invitations
- **Invite Modal**:
  - Email input with role selection
  - Real-time validation and feedback

## Permissions System

### Role Capabilities
| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| View agents | ✅ | ✅ | ✅ |
| Create agents | ✅ | ✅ | ✅ |
| Edit agents | ✅ | ✅ | ❌ |
| Delete agents | ✅ | ✅ | ❌ |
| Invite members | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ | ❌ |
| Change roles | ✅ | ✅ | ❌ |
| Delete organization | ✅ | ❌ | ❌ |

### Row Level Security (RLS)
- All database access is filtered by organization membership
- Users can only see/modify data for organizations they belong to
- Role-based restrictions enforced at the database level

## Migration Process

For existing installations, run the migration script:

```sql
-- Run in Supabase SQL editor
\i migrations/add_team_management.sql
```

This will:
1. Create new team management tables
2. Add organization_id columns to existing tables
3. Create default organizations for existing users
4. Set up appropriate RLS policies
5. Create necessary indexes and triggers

## Security Considerations

### Invitation Security
- Tokens are cryptographically secure (32 bytes)
- Invitations expire after 7 days
- Email verification ensures only intended recipients can join

### Data Isolation
- Organizations are completely isolated from each other
- RLS policies prevent cross-organization data access
- API endpoints verify permissions before any operations

### Role Management
- Organization owners cannot be removed or demoted
- Only owners and admins can manage team membership
- Role changes are audited through database triggers

## Future Enhancements

### Planned Features
- [ ] Email notifications for invitations
- [ ] Organization settings and branding
- [ ] Activity logs and audit trails
- [ ] Bulk member management
- [ ] Integration with external authentication providers

### Potential Integrations
- [ ] Slack/Discord notifications
- [ ] SSO with Google Workspace/Microsoft 365
- [ ] Advanced permission granularity
- [ ] Team-based analytics and reporting

## Development Notes

### Component Structure
```
components/dashboard/
├── TeamManagement.tsx        # Main team management interface
├── CreateAgentModal.tsx      # Updated to use organization context
└── ...other components
```

### State Management
- Organization context stored in dashboard state
- Real-time updates via API calls
- Optimistic UI updates for better UX

### Error Handling
- Comprehensive error messages for all operations
- Graceful degradation when features are unavailable
- User-friendly feedback for permission errors

## Testing

### Manual Testing Checklist
- [ ] Create organization as new user
- [ ] Invite team member via email
- [ ] Accept invitation and verify access
- [ ] Test role changes and permissions
- [ ] Verify agent sharing between team members
- [ ] Test removal of team members
- [ ] Validate RLS policies with different users

### Edge Cases
- [ ] Invalid email addresses
- [ ] Expired invitation tokens
- [ ] Concurrent role changes
- [ ] Organization owner scenarios
- [ ] Database connection failures
