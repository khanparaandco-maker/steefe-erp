
---

## Error 1 - Column reference "grn_no" is ambiguous

**Date:** 2025-12-28
**Environment:** Local & Production

**Error Message:**
```
ERROR: column reference "grn_no" is ambiguous
```

**What I was doing:**
1. Working with scrap GRN module
2. Query failing with ambiguous column error

**What should happen:**
Query should reference the correct grn_no column

**What actually happened:**
Database error - multiple tables have grn_no column

**Status:** ❌ NEEDS INVESTIGATION

---

## Error 2 - Missing default Minerals items in production

**Date:** 2025-12-28
**Environment:** Production

**Error Message:**
```
Default Minerals items not found in production database
```

**What I was doing:**
1. Created default Minerals items in local item master
2. These items are linked to material issued in melting process
3. Items missing in production environment

**What should happen:**
Default mineral items should exist in production for melting process

**What actually happened:**
Production database missing default mineral items

**Status:** ❌ NEEDS DATA SYNC

---

## Error 3 - Failed to create heat treatment record

**Date:** 2025-12-28
**Environment:** Production

**Error Message:**
```
Failed to create heat treatment record
```

**What I was doing:**
1. Trying to create heat treatment record
2. Form submission fails

**What should happen:**
Heat treatment record should be created successfully

**What actually happened:**
Record creation fails with error

**Status:** ❌ NEEDS INVESTIGATION

---

## Error 4 - Change application name from Steelmelt ERP to SSCPL

**Date:** 2025-12-28
**Environment:** Local & Production

**What needs to be changed:**
1. Frontend display name: "Steelmelt ERP" → "SSCPL"
2. Browser tab title: "Frontend" → "SSCPL"
3. All UI references to company name

**Files to update:**
- Frontend HTML title tag
- Header/navbar component
- Login page
- Any branding text

**Status:** ❌ NEEDS UPDATE

---

## Error 5 - Permission management not working properly

**Date:** 2025-12-28
**Environment:** Local & Production

**Error Message:**
```
Manufacturing permissions not being updated when disabled
```

**What I was doing:**
1. Disallow manufacturing module for a user
2. Save permission changes
3. Check user permissions

**What should happen:**
User should not have access to manufacturing module

**What actually happened:**
Permission changes not being saved/applied correctly

**Status:** ❌ NEEDS FIX

