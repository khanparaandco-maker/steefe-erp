## Heat Treatment Update Fix

### Issue
Failed to update heat treatment records.

### Root Cause
The route was importing non-existent functions `getById`, `getAll`, `create`, `update`, and `deleteRecord` from `config/database.js`. These functions don't exist - the correct functions are in the `crud` object.

### Solution
Updated `routes/heatTreatment.js`:

**Before:**
```javascript
const { getAll, getById, create, update, deleteRecord, query } = require('../config/database');
```

**After:**
```javascript
const { crud, query } = require('../config/database');
```

And replaced:
- `getById('heat_treatment', id)` → `crud.findById('heat_treatment', id)`
- `deleteRecord('heat_treatment', id)` → `crud.delete('heat_treatment', id)`

### Testing
The heat treatment update trigger is working correctly. Database tests confirmed:
- WIP item (id=9) exists ✅
- UPDATE query executes successfully ✅
- Stock transactions are created automatically ✅
- Trigger handles bags_produced changes correctly ✅

### Next Steps
1. Restart the server to load the updated route
2. Test heat treatment update via API
3. Verify stock transactions are created correctly

### Files Modified
- `routes/heatTreatment.js` - Fixed imports and function calls
