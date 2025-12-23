# Phase 4: Organizations & Membership

## Overview
Implementasi fitur organisasi yang memungkinkan pengguna berbayar membuat organisasi dan mengelola keanggotaan.

## Features

### 1. Organization CRUD
- Create organization (PAID_USER only)
- Read organization details
- Update organization info
- Delete organization

### 2. Membership Management
- Join organization (request)
- Leave organization
- Approve/Reject member requests (admin)
- View member list

### 3. Public Directory
- Browse public organizations
- Search & filter by category
- View organization details
- One-click join

## File Structure

```
src/
├── hooks/
│   └── useOrganizations.ts          # Organization & membership hooks
├── components/
│   └── organizations/
│       ├── OrgForm.tsx              # Create/Edit form
│       ├── OrgList.tsx              # Organization grid
│       └── MemberList.tsx           # Member management
├── app/
│   ├── dashboard/
│   │   └── organizations/
│   │       ├── page.tsx             # My organizations list
│   │       ├── new/
│   │       │   └── page.tsx         # Create organization
│   │       └── [id]/
│   │           ├── page.tsx         # Organization detail
│   │           └── edit/
│   │               └── page.tsx     # Edit organization
│   └── organizations/
│       └── page.tsx                 # Public directory
```

## Database Tables

### organizations
- id (UUID)
- owner_id (FK → users)
- name (VARCHAR)
- description (TEXT)
- logo_url (TEXT)
- category (VARCHAR)
- is_public (BOOLEAN)
- require_approval (BOOLEAN)
- created_at, updated_at

### organization_members
- id (UUID)
- organization_id (FK → organizations)
- user_id (FK → users)
- status (ENUM: PENDING, APPROVED, REJECTED)
- is_admin (BOOLEAN)
- joined_at (TIMESTAMP)
- approved_by (FK → users)
- approved_at (TIMESTAMP)

## Routes

| Route | Description |
|-------|-------------|
| `/dashboard/organizations` | My organizations list |
| `/dashboard/organizations/new` | Create new organization |
| `/dashboard/organizations/[id]` | Organization detail + members |
| `/dashboard/organizations/[id]/edit` | Edit organization |
| `/organizations` | Public directory |

## Access Control

| Action | FREE_USER | PAID_USER | APP_ADMIN |
|--------|-----------|-----------|-----------|
| Create Organization | ❌ | ✅ | ✅ |
| Join Organization | ✅ | ✅ | ✅ |
| Manage Members | Own Org | Own Org | All Orgs |
| Delete Organization | Own Org | Own Org | All Orgs |

## Usage

### Create Organization (PAID_USER)
```typescript
const { createOrganization } = useOrganizations()

await createOrganization({
  name: 'My Company',
  description: 'Company description',
  logo_url: 'https://...',
  category: 'Teknologi',
  is_public: true,
  require_approval: true,
})
```

### Join Organization
```typescript
const { joinOrganization } = useOrganizations()

await joinOrganization(orgId)
// If require_approval = true → status = PENDING
// If require_approval = false → status = APPROVED
```

### Approve Member (Admin)
```typescript
const { updateMemberStatus } = useOrganizations()

await updateMemberStatus(memberId, 'APPROVED')
// or
await updateMemberStatus(memberId, 'REJECTED')
```

## Categories
- Teknologi
- Pendidikan
- Kesehatan
- Keuangan
- Pemerintahan
- Non-Profit
- Retail
- Manufaktur
- Jasa
- Lainnya
