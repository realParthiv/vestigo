# Late Charge System Documentation

## Overview

The Late Charge System provides a flexible, admin-configurable mechanism for applying charges to overdue premium payments. It supports both percentage-based and flat-fee charges with customizable triggers.

## Features

### Charge Types
- **Percentage**: Calculated as a percentage of the payment amount (e.g., 2% of due amount)
- **Flat Fee**: Fixed dollar amount (e.g., $50)

### Trigger Types
- **Days Overdue**: Apply charge after a specific number of days past due date
- **Months Overdue**: Apply charge after a specific number of months past due date

### Admin Controls
- **Create/Edit Policies**: Configure charge rules via Django admin or API
- **Waive Charges**: Completely waive a charge with reason tracking
- **Adjust Charges**: Manually modify charge amounts with admin notes
- **Mark as Paid**: Track payment status of applied charges
- **Apply Policies**: Manually run policy application or use automated scheduler

## API Endpoints

### Late Charge Policies
```
GET    /api/v1/operations/late-charge-policies/          - List all policies
POST   /api/v1/operations/late-charge-policies/          - Create new policy
GET    /api/v1/operations/late-charge-policies/{id}/     - Get policy details
PATCH  /api/v1/operations/late-charge-policies/{id}/     - Update policy
DELETE /api/v1/operations/late-charge-policies/{id}/     - Delete policy
```

### Late Charges
```
GET    /api/v1/operations/late-charges/                  - List all charges
POST   /api/v1/operations/late-charges/                  - Create charge (manual)
GET    /api/v1/operations/late-charges/{id}/             - Get charge details
PATCH  /api/v1/operations/late-charges/{id}/             - Update charge
DELETE /api/v1/operations/late-charges/{id}/             - Delete charge

POST   /api/v1/operations/late-charges/{id}/waive/       - Waive a charge
POST   /api/v1/operations/late-charges/{id}/mark-paid/   - Mark charge as paid
POST   /api/v1/operations/late-charges/{id}/adjust/      - Adjust charge amount
POST   /api/v1/operations/late-charges/apply-policy/     - Apply policy to overdue payments
```

## Management Commands

### Apply Late Charges

Automatically apply active policies to overdue payments that don't yet have charges.

```bash
# Dry run (show what would be done)
python manage.py apply_late_charges --dry-run

# Apply all active policies
python manage.py apply_late_charges

# Apply specific policy
python manage.py apply_late_charges --policy-id 1

# Schedule with cron for daily execution
0 2 * * * cd /path/to/backend && /path/to/venv/bin/python manage.py apply_late_charges
```

### Seed Sample Policies

Create example late charge policies for testing.

```bash
python manage.py seed_late_charge_policies
```

This creates:
- **2% Monthly Late Fee**: 2% of payment amount after 30 days overdue
- **$50 Flat Late Fee**: $50 flat fee after 45 days overdue
- **5% Three Month Late Fee**: 5% of payment after 90 days overdue (inactive by default)

## Model Details

### LateChargePolicy

Defines the rules for calculating late charges.

| Field | Type | Description |
|-------|------|-------------|
| `name` | CharField | Policy name (e.g., "2% Monthly Late Fee") |
| `description` | TextField | Detailed description |
| `charge_type` | CharField | PERCENTAGE or FLAT |
| `charge_amount` | DecimalField | Percentage (0-100) or dollar amount |
| `trigger_type` | CharField | DAYS_OVERDUE or MONTHS_OVERDUE |
| `trigger_threshold` | IntegerField | Days/months before charge applies |
| `maximum_charge_per_payment` | DecimalField | Optional cap on total charge per payment |
| `is_active` | BooleanField | Enable/disable this policy |
| `created_by` | ForeignKey | User who created the policy |
| `created_at` | DateTimeField | Timestamp |
| `updated_at` | DateTimeField | Timestamp |

### LateCharge

Tracks a specific late charge applied to a payment.

| Field | Type | Description |
|-------|------|-------------|
| `payment` | OneToOneField | The payment this charge applies to |
| `policy` | ForeignKey | Associated policy |
| `charge_policy` | ForeignKey | Which LateChargePolicy generated this charge |
| `charge_amount` | DecimalField | Amount of the charge |
| `reason` | CharField | Why the charge was applied |
| `is_paid` | BooleanField | Has the charge been paid? |
| `paid_date` | DateField | Date the charge was paid |
| `waived` | BooleanField | Has the charge been waived? |
| `waived_by` | ForeignKey | User who waived the charge |
| `waived_reason` | TextField | Reason for waiver |
| `waived_date` | DateField | Date waived |
| `admin_notes` | TextField | Any admin notes |
| `created_at` | DateTimeField | Timestamp |
| `updated_at` | DateTimeField | Timestamp |

## Usage Examples

### Create a Late Charge Policy via API

```bash
curl -X POST http://localhost:8000/api/v1/operations/late-charge-policies/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "3% Late Payment Charge",
    "description": "3% of payment after 60 days",
    "charge_type": "PERCENTAGE",
    "charge_amount": "3.00",
    "trigger_type": "DAYS_OVERDUE",
    "trigger_threshold": 60,
    "maximum_charge_per_payment": "500.00",
    "is_active": true
  }'
```

### Apply a Policy to Overdue Payments

```bash
curl -X POST http://localhost:8000/api/v1/operations/late-charges/apply-policy/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "policy_id": 1
  }'
```

### Waive a Late Charge

```bash
curl -X POST http://localhost:8000/api/v1/operations/late-charges/1/waive/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Customer requested waiver due to hardship"
  }'
```

### Adjust a Late Charge Amount

```bash
curl -X POST http://localhost:8000/api/v1/operations/late-charges/1/adjust/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "25.50",
    "notes": "Reduced from $75 due to partial payment arrangement"
  }'
```

## Best Practices

1. **Start Conservative**: Begin with modest charge rates and adjust based on collection data
2. **Regular Review**: Review waiver patterns to identify systemic issues
3. **Automation**: Use the `apply_late_charges` command with cron for automatic application
4. **Clear Policies**: Document which policies apply to different product lines
5. **Customer Communication**: Notify customers of pending charges before application
6. **Audit Trail**: Use admin_notes and waived_reason to maintain full history

## Database Migrations

The late charge system adds two new tables:
- `operations_latechargepolicy`: Stores policy definitions
- `operations_latecharge`: Stores applied charges

Migration file: `operations/migrations/0003_latechargepolicy_latecharge.py`

Run migrations with:
```bash
python manage.py migrate operations
```

## Permissions

Late charge features are restricted to users with:
- `Role.ADMIN`: Full access to all late charge operations
- `Role.OPERATIONS`: Can view and manage late charges

## Future Enhancements

- [ ] Bulk waive charges by policy or date range
- [ ] Charge payment tracking and reconciliation
- [ ] Customer notifications when charges are applied
- [ ] Dashboard reports on charge revenue and waiver rates
- [ ] Configurable escalation policies (increasing charges after each period)
- [ ] Integration with payment gateways to auto-deduct charges
