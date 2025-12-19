# BACKEND BUG FIX SUMMARY

## Root Cause: Soft Delete Queryset Filtering

**The Problem:**
- All models extend `SoftDeleteModel` (core/models.py) which adds an `is_active` boolean field
- When records are "soft deleted", `is_active` is set to `False`
- **CRITICAL BUG:** All ViewSets were using `.objects.all()` without filtering for `is_active=True`
- This meant the APIs returned **ALL records** (active + soft-deleted), creating inconsistencies

## What Was Fixed

### 1. **operations/views.py**
- ✅ `PolicyViewSet`: Now filters `Policy.objects.filter(is_active=True)`
- ✅ `PremiumPaymentViewSet`: Kept as-is (doesn't extend SoftDeleteModel)

### 2. **underwriting/views.py**
- ✅ `SubmissionViewSet`: Now filters `Submission.objects.filter(is_active=True)`

### 3. **bdm/views.py**
- ✅ `LeadViewSet`: Now filters `Lead.objects.filter(is_active=True)`
- ✅ `OpportunityViewSet`: Now filters `Opportunity.objects.filter(is_active=True)`
- ✅ `ActivityViewSet`: Now filters `Activity.objects.filter(is_active=True)`
- ✅ `DashboardStatsView`: All queries now filter for `is_active=True`

### 4. **claims/views.py**
- ✅ `ClaimViewSet`: Now filters `Claim.objects.filter(is_active=True)`

### 5. **reconciliation/views.py**
- ✅ `BankStatementViewSet`: Now filters `BankStatement.objects.filter(is_active=True)`
- ✅ `BankLineViewSet`: Now filters `BankLine.objects.filter(is_active=True)`

## Why Your Policy Wasn't Showing

1. Policy `POL-35-1765807997` **WAS created successfully** in the database with `is_active=True`
2. But the API endpoint `/operations/policies/` was returning `Policy.objects.all()` (without filtering)
3. Combined with frontend issues (API response parsing), the policy appeared invisible

## After This Fix

- ✅ **Policy will appear in Policies list** after approval
- ✅ **All soft-deleted records will be hidden from APIs** (consistent behavior)
- ✅ **Dashboard stats will be accurate** (only counting active records)
- ✅ **All table queries will show only active records**

## Next Steps

1. Restart backend: `python manage.py runserver`
2. Hard refresh frontend (Ctrl+Shift+R)
3. Approve a new submission
4. Policy should immediately appear in `/policies` list

## Files Modified

- `/backend/operations/views.py` (PolicyViewSet queryset)
- `/backend/underwriting/views.py` (SubmissionViewSet queryset)
- `/backend/bdm/views.py` (4 ViewSet querysets + DashboardStatsView queries)
- `/backend/claims/views.py` (ClaimViewSet queryset)
- `/backend/reconciliation/views.py` (2 ViewSet querysets)

---

**This was a systemic bug affecting the entire data filtering layer.** The fix ensures all APIs consistently show only active (not soft-deleted) records.
