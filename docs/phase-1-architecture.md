# PHASE 1: Arsitektur Sistem & Database Schema

**Tanggal**: 19 Desember 2025  
**Status**: ✅ Selesai

---

## 📋 Ringkasan

PHASE 1 membangun fondasi arsitektur lengkap untuk aplikasi Digital Business Card & Organization Directory, termasuk:

- Struktur folder Next.js App Router yang modular dan scalable
- Konfigurasi environment variables
- Database schema PostgreSQL dengan RLS (Row Level Security)
- Business logic enforcement via triggers dan functions

---

## 🏗️ Arsitektur Aplikasi

### Technology Stack

**Frontend**:
- Next.js 14+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS
- Progressive Web App (PWA)

**Backend**:
- Next.js API Routes & Server Actions
- Supabase (PostgreSQL)
- Supabase Auth (Email/Password + Google SSO)

**Storage**:
- Cloudinary (foto profil, logo organisasi, bukti pembayaran)
- Supabase Storage (backup)

**Deployment**:
- Vercel (frontend + serverless functions)
- Supabase Cloud (database + auth)

---

## 📁 Struktur Folder

```
official-id/
│
├── docs/                          # 📚 Dokumentasi proyek
│   └── phase-1-architecture.md
│
├── public/                        # Static assets
│   ├── icons/                     # PWA icons (192x192, 512x512)
│   ├── manifest.json              # PWA manifest
│   └── sw.js                      # Service worker
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   │
│   │   ├── (auth)/                # 🔐 Auth routes (no layout)
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── verify-email/
│   │   │
│   │   ├── (dashboard)/           # 📊 Protected dashboard routes
│   │   │   ├── dashboard/         # Main dashboard
│   │   │   ├── cards/             # Business card management
│   │   │   ├── organizations/     # Organization management
│   │   │   ├── contacts/          # Client/contact list
│   │   │   ├── upgrade/           # Upgrade to paid
│   │   │   └── settings/          # Account settings
│   │   │
│   │   ├── (admin)/               # 👑 Admin panel
│   │   │   └── admin/
│   │   │       ├── payments/      # Payment approval
│   │   │       └── users/         # User management
│   │   │
│   │   ├── card/[id]/             # 🎴 Public card view (QR scan landing)
│   │   │
│   │   ├── api/                   # API routes
│   │   │   ├── auth/callback/     # OAuth callback
│   │   │   ├── cards/             # Card CRUD
│   │   │   ├── organizations/     # Org CRUD
│   │   │   └── payments/          # Payment processing
│   │   │
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Landing page
│   │   └── globals.css            # Global styles
│   │
│   ├── components/                # React components
│   │   ├── ui/                    # Reusable UI (buttons, modals, etc.)
│   │   ├── cards/                 # Business card components
│   │   ├── organizations/         # Organization components
│   │   ├── auth/                  # Auth forms
│   │   └── layout/                # Layout components (header, sidebar)
│   │
│   ├── lib/                       # Utility libraries
│   │   ├── supabase/
│   │   │   ├── client.ts          # Client-side Supabase
│   │   │   ├── server.ts          # Server-side Supabase
│   │   │   └── middleware.ts      # Auth middleware
│   │   ├── cloudinary.ts          # Cloudinary helper
│   │   ├── qrcode.ts              # QR code generation
│   │   └── utils.ts               # General utilities
│   │
│   ├── types/                     # TypeScript types
│   │   ├── database.types.ts      # Supabase generated types
│   │   └── index.ts               # Custom types
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCards.ts
│   │   └── useOrganizations.ts
│   │
│   └── middleware.ts              # Next.js middleware (route protection)
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── config.toml
│
├── .env.local                     # Environment variables (gitignored)
├── .env.example                   # Environment template
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🗄️ Database Schema

### Entity Relationship Diagram (ERD)

```
┌─────────────────┐
│   auth.users    │ (Supabase managed)
└────────┬────────┘
         │
         │ 1:1
         │
┌────────▼────────┐
│     users       │ (Extended profile)
│─────────────────│
│ id (PK)         │
│ email           │
│ full_name       │
│ avatar_url      │
│ role            │ ← ENUM: FREE_USER, PAID_USER, APP_ADMIN
└────────┬────────┘
         │
         ├─────────────────────────────────────┐
         │                                     │
         │ 1:N                                 │ 1:N
         │                                     │
┌────────▼─────────────┐              ┌───────▼──────────┐
│   business_cards     │              │  organizations   │
│──────────────────────│              │──────────────────│
│ id (PK)              │              │ id (PK)          │
│ user_id (FK)         │              │ owner_id (FK)    │
│ full_name            │              │ name             │
│ job_title            │              │ description      │
│ company              │              │ logo_url         │
│ email                │              │ category         │
│ phone                │              └──────┬───────────┘
│ website              │                     │
│ profile_photo_url    │                     │ 1:N
│ social_links (JSON)  │                     │
│ qr_code_url          │              ┌──────▼──────────────────┐
│ scan_count           │              │ organization_members    │
└──────────┬───────────┘              │─────────────────────────│
           │                          │ id (PK)                 │
           │                          │ organization_id (FK)    │
           │ 1:N                      │ user_id (FK)            │
           │                          │ status                  │← ENUM: PENDING, APPROVED, REJECTED
           │                          │ is_admin                │
    ┌──────▼─────────────────┐        └─────────────────────────┘
    │  user_relationships    │
    │────────────────────────│
    │ id (PK)                │
    │ provider_id (FK)       │ ← Card owner
    │ client_id (FK)         │ ← Scanner
    │ business_card_id (FK)  │
    │ scanned_at             │
    └────────────────────────┘

    ┌────────────────────────┐
    │ payment_transactions   │
    │────────────────────────│
    │ id (PK)                │
    │ user_id (FK)           │
    │ amount                 │
    │ proof_url              │
    │ status                 │ ← ENUM: PENDING, APPROVED, REJECTED
    │ reviewed_by (FK)       │
    └────────────────────────┘
```

### Tabel Utama

#### 1. **users**
- Extends Supabase `auth.users`
- Menyimpan profil extended dan role
- Role: `FREE_USER`, `PAID_USER`, `APP_ADMIN`

#### 2. **business_cards**
- Kartu bisnis digital dengan QR code
- Privacy settings per field
- Free user: max 1 card
- Paid user: unlimited cards

#### 3. **organizations**
- Organisasi/grup yang dibuat oleh PAID users
- Owner memiliki control penuh

#### 4. **organization_members**
- Membership dengan approval workflow
- Status: `PENDING`, `APPROVED`, `REJECTED`

#### 5. **user_relationships**
- Tracking siapa scan kartu siapa
- Client-provider relationship
- Basis untuk CRM sederhana

#### 6. **payment_transactions**
- Manual payment processing
- Admin approval required
- Lifetime payment: Rp25.000

---

## 🔐 Row Level Security (RLS)

Semua tabel protected dengan RLS policies:

### Policy Highlights

**Business Cards**:
- ✅ User bisa lihat kartu sendiri
- ✅ Semua orang bisa lihat kartu public
- ✅ Member organisasi bisa lihat kartu sesama member
- ❌ User tidak bisa edit kartu orang lain

**Organizations**:
- ✅ Semua orang bisa lihat organisasi public
- ✅ Hanya PAID user yang bisa create
- ✅ Owner bisa update/delete

**Payments**:
- ✅ User bisa lihat payment sendiri
- ✅ Admin bisa lihat semua payment
- ✅ Admin bisa approve/reject

---

## ⚙️ Business Logic via Database

### Triggers & Functions

#### 1. **check_business_card_limit()**
- Enforce limit: FREE user max 1 card
- Triggered BEFORE INSERT on `business_cards`

#### 2. **check_organization_creation_permission()**
- Hanya PAID user yang bisa create org
- Triggered BEFORE INSERT on `organizations`

#### 3. **handle_payment_approval()**
- Auto-upgrade user ke PAID_USER saat payment approved
- Triggered AFTER UPDATE on `payment_transactions`

#### 4. **increment_scan_count()**
- Increment scan count saat QR code di-scan
- Triggered AFTER INSERT on `user_relationships`

#### 5. **auto_approve_organization_owner()**
- Owner otomatis jadi member pertama (approved)
- Triggered AFTER INSERT on `organizations`

---

## 🌐 Environment Variables

Lihat file `.env.example` untuk template lengkap.

### Required Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Payment Info
PAYMENT_AMOUNT=25000

# Admin
ADMIN_EMAIL=admin@official-id.app
```

---

## 🚀 User Flow Overview

### 1. Registration Flow
```
Visitor → Landing Page
  ↓
  Scan QR Code on business card
  ↓
  /card/{id} (not authenticated)
  ↓
  Redirect to /login or /register
  ↓
  Register via Email or Google SSO
  ↓
  Email verification (if email/password)
  ↓
  Auto-login
  ↓
  Redirect back to /card/{id}
  ↓
  Automatically create user_relationship (client-provider link)
  ↓
  Show business card with "Simpan Kontak" button
```

### 2. Business Card Creation Flow
```
User → Dashboard → Kartu Bisnis → Buat Kartu Baru
  ↓
  Fill form (name, job, company, email, phone, etc.)
  ↓
  Upload photo (Cloudinary)
  ↓
  Submit
  ↓
  Backend:
    - Check card limit (FREE user)
    - Generate QR code URL (/card/{id})
    - Save to database
  ↓
  Redirect to card detail page
  ↓
  Display QR code for sharing
```

### 3. Organization Join Flow
```
User → Explore → Temukan Organisasi
  ↓
  Click "Gabung"
  ↓
  Request sent (status: PENDING)
  ↓
  Owner/Admin gets notification
  ↓
  Admin reviews request
  ↓
  Approve or Reject
  ↓
  If APPROVED:
    - User becomes member
    - Can view member directory
    - Can see other members' business cards
```

### 4. Payment Flow
```
FREE User → Dashboard → Upgrade ke Akun Berbayar
  ↓
  View payment instructions:
    - Bank: Mandiri
    - Account: 1234567890
    - Amount: Rp25.000
  ↓
  User makes transfer
  ↓
  Upload payment proof (Cloudinary)
  ↓
  Payment status: PENDING
  ↓
  Admin reviews proof
  ↓
  Approve or Reject
  ↓
  If APPROVED:
    - User role → PAID_USER (lifetime)
    - Can create unlimited cards
    - Can create organizations
```

---

## 🔒 Security Considerations

### Authentication
- Supabase Auth handles JWT tokens
- Email verification required for email/password signup
- Google SSO for seamless registration

### Authorization
- Middleware checks auth status on protected routes
- RLS policies enforce data access control
- Role-based permissions (FREE, PAID, ADMIN)

### Data Privacy
- Users control which card fields are public
- Full card data requires authentication
- Organization member list only visible to members

### Input Validation
- Server-side validation on all API routes
- SQL injection prevented by Supabase parameterized queries
- XSS protection via React's default escaping

---

## 📊 Scalability Notes

### Database
- Indexes on frequently queried columns
- Views for complex queries (user_card_summary, organization_summary)
- Efficient RLS policies

### Caching Strategy (Future)
- Redis for session data
- CDN for static assets
- Edge caching via Vercel

### Performance
- Image optimization via Cloudinary transformations
- Lazy loading for organization member lists
- Server-side rendering for public card pages (SEO)

---

## 🎯 Next Steps

**PHASE 2: Authentication Implementation**
- Setup Supabase client & server instances
- Implement Google SSO
- Email/password registration with verification
- Role & permission middleware
- Protected route guards

---

## 📝 Notes

- Database schema is production-ready
- All business rules enforced at database level (triggers)
- RLS policies ensure data security
- Environment variables template provided
- Folder structure supports clean code separation

---

**Status**: ✅ PHASE 1 Complete  
**Next**: PHASE 2 - Authentication & Middleware