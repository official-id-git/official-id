#!/bin/bash

echo "=========================================="
echo "OFFICIAL ID - Structure Verification"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo "1. Checking AuthProvider placement..."
if grep -q "AuthProvider" src/app/layout.tsx; then
    echo -e "${GREEN}✓${NC} AuthProvider found in root layout"
else
    echo -e "${RED}✗${NC} AuthProvider NOT found in root layout"
    ((ERRORS++))
fi

echo ""
echo "2. Checking for duplicate layouts..."
LAYOUT_COUNT=$(find src/app -name "layout.tsx" -o -name "layout.ts" | wc -l)
if [ "$LAYOUT_COUNT" -eq 1 ]; then
    echo -e "${GREEN}✓${NC} Only 1 layout file found (correct)"
else
    echo -e "${RED}✗${NC} Found $LAYOUT_COUNT layout files (should be 1)"
    find src/app -name "layout.tsx" -o -name "layout.ts"
    ((ERRORS++))
fi

echo ""
echo "3. Checking dashboard route structure..."
if [ -f "src/app/dashboard/page.tsx" ]; then
    echo -e "${GREEN}✓${NC} Dashboard at correct path: src/app/dashboard/page.tsx"
else
    echo -e "${RED}✗${NC} Dashboard NOT at src/app/dashboard/page.tsx"
    ((ERRORS++))
fi

if [ -d "src/app/(dashboard)/dashboard" ]; then
    echo -e "${RED}✗${NC} Found nested (dashboard)/dashboard folder (should be removed)"
    ((ERRORS++))
fi

echo ""
echo "4. Checking tsconfig.json..."
if grep -q '"@/\*": \["./src/\*"\]' tsconfig.json; then
    echo -e "${GREEN}✓${NC} Path alias @/* configured correctly"
else
    echo -e "${RED}✗${NC} Path alias @/* NOT configured in tsconfig.json"
    ((ERRORS++))
fi

echo ""
echo "5. Checking useAuth.tsx..."
if [ -f "src/hooks/useAuth.tsx" ]; then
    echo -e "${GREEN}✓${NC} useAuth.tsx exists"
    
    # Check for old recursive pattern
    if grep -q "await fetchUserProfile(session.user)" src/hooks/useAuth.tsx | grep -q "setUser"; then
        echo -e "${YELLOW}⚠${NC} Warning: Check if fetchUserProfile still sets state directly"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗${NC} useAuth.tsx NOT found"
    ((ERRORS++))
fi

echo ""
echo "6. Checking middleware.ts..."
if [ -f "src/middleware.ts" ]; then
    echo -e "${GREEN}✓${NC} middleware.ts exists"
    
    if grep -q "'/dashboard'" src/middleware.ts; then
        echo -e "${GREEN}✓${NC} Dashboard protected in middleware"
    else
        echo -e "${YELLOW}⚠${NC} Dashboard may not be protected"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}✗${NC} middleware.ts NOT found"
    ((ERRORS++))
fi

echo ""
echo "7. Checking environment variables..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local exists"
    
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo -e "${GREEN}✓${NC} SUPABASE_URL configured"
    else
        echo -e "${RED}✗${NC} SUPABASE_URL missing"
        ((ERRORS++))
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo -e "${GREEN}✓${NC} SUPABASE_ANON_KEY configured"
    else
        echo -e "${RED}✗${NC} SUPABASE_ANON_KEY missing"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} .env.local NOT found"
    ((ERRORS++))
fi

echo ""
echo "=========================================="
echo "Summary:"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Structure is correct.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    fi
    exit 1
fi
