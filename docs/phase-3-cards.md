# PHASE 3: Business Card CRUD & QR Code

## 📋 Overview

Phase 3 mengimplementasikan fitur utama aplikasi: pembuatan dan manajemen kartu bisnis digital dengan QR code.

## 🎯 Features

### 3.1 Business Card CRUD
- [x] Create new card (with limit check for FREE users)
- [x] Read/View cards
- [x] Update card
- [x] Delete card

### 3.2 QR Code Generation
- [x] Generate QR code for each card
- [x] QR code links to public card view
- [x] Download QR code as image

### 3.3 Public Card View
- [x] Public page to view card (no auth required)
- [x] Track scan count
- [x] Save contact (vCard download)
- [x] Respect privacy settings

### 3.4 Card Templates
- [x] Professional template
- [x] Modern template
- [x] Minimal template

## 📁 Files Created

```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx (updated)
│   │   └── cards/
│   │       ├── page.tsx          # Card list
│   │       ├── new/
│   │       │   └── page.tsx      # Create card form
│   │       └── [id]/
│   │           ├── page.tsx      # View/Edit card
│   │           └── edit/
│   │               └── page.tsx  # Edit card form
│   └── c/
│       └── [id]/
│           └── page.tsx          # Public card view
├── components/
│   └── cards/
│       ├── CardForm.tsx          # Card create/edit form
│       ├── CardPreview.tsx       # Card preview component
│       ├── CardList.tsx          # Card list component
│       ├── QRCodeGenerator.tsx   # QR code component
│       └── templates/
│           ├── ProfessionalCard.tsx
│           ├── ModernCard.tsx
│           └── MinimalCard.tsx
├── hooks/
│   └── useCards.ts               # Card CRUD hooks
├── lib/
│   └── qrcode.ts                 # QR code utilities
└── types/
    └── index.ts (updated)        # Card types
```

## 🔧 Implementation Notes

### Card Limit Check
- FREE_USER: Max 1 card
- PAID_USER: Unlimited cards
- Enforced at database level via trigger

### QR Code
- Generated client-side using `qrcode` library
- Points to `/c/[card-id]` public route
- Stored as data URL or uploaded to storage

### Privacy Settings
- `is_public`: Card visibility
- `visible_fields`: Which fields to show publicly

## 🚀 Usage

```tsx
// Create card
const { createCard, loading } = useCards()
await createCard({
  full_name: 'John Doe',
  email: 'john@example.com',
  phone: '+62812345678',
  // ...
})

// Generate QR
import { generateQRCode } from '@/lib/qrcode'
const qrDataUrl = await generateQRCode('https://app.com/c/card-id')
```
