# Vestigo Insurance CRM - Backend

Django REST Framework backend for Vestigo Insurance CRM system.

## Features

- **Role-Based Authentication**: JWT authentication with 7 role types (ADMIN, BDM, UNDERWRITER, OPERATIONS, CLAIMS, FINANCE, VIEWER)
- **Business Development**: Lead tracking, opportunity management, activity logging
- **Underwriting**: Submission review, risk assessment, approval workflow
- **Operations**: Policy lifecycle management, premium payment tracking, overdue monitoring
- **Claims**: Claim filing, status transitions, approval workflow with attachments
- **Reconciliation**: Bank statement upload, auto-matching, manual reconciliation
- **Notifications**: Real-time notifications for workflow events
- **Reports**: Dashboard analytics and reporting endpoints

## Quick Start

### Prerequisites

- Python 3.9+
- pip

### Installation

1. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Seed demo data** (optional)
   ```bash
   python manage.py seed_demo_data
   ```
   This creates:
   - 6 demo users (one per role, password: `password123`)
   - Sample leads, opportunities, submissions, policies, payments, and claims
   - Complete workflow examples

6. **Create superuser** (if not using demo data)
   ```bash
   python manage.py createsuperuser
   ```

7. **Run development server**
   ```bash
   python manage.py runserver
   ```

8. **Access API**
   - API Base: http://localhost:8000/api/
   - Admin Panel: http://localhost:8000/admin/
   - Swagger Docs: http://localhost:8000/swagger/

## Environment Variables

Key variables in `.env`:

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
DATABASE_URL=sqlite:///db.sqlite3
```

See `.env.example` for all available options.

## Management Commands

### Mark Overdue Payments
Run as cron job to update payment statuses:
```bash
python manage.py mark_overdue_payments
```

### Seed Demo Data
Generate realistic test data:
```bash
python manage.py seed_demo_data
```

## API Authentication

### Obtain Tokens
```bash
POST /api/users/login/
{
  "username": "bdm",
  "password": "password123"
}
```

Response:
```json
{
  "access": "<access_token>",
  "refresh": "<refresh_token>",
  "user": {
    "id": 1,
    "username": "bdm",
    "role": "BDM"
  }
}
```

### Use Token
```bash
Authorization: Bearer <access_token>
```

### Refresh Token
```bash
POST /api/users/refresh/
{
  "refresh": "<refresh_token>"
}
```

## Role-Based Permissions

| Endpoint | ADMIN | BDM | UNDERWRITER | OPERATIONS | CLAIMS | FINANCE | VIEWER |
|----------|-------|-----|-------------|------------|--------|---------|--------|
| Users    | ✅    | ❌  | ❌          | ❌         | ❌     | ❌      | ❌     |
| Leads    | ✅    | ✅  | ❌          | ❌         | ❌     | ❌      | ❌     |
| Submissions | ✅ | ✅  | ✅          | ❌         | ❌     | ❌      | ❌     |
| Policies | ✅    | ❌  | ❌          | ✅         | ❌     | ✅      | ❌     |
| Claims   | ✅    | ❌  | ❌          | ✅         | ✅     | ❌      | ❌     |
| Reconciliation | ✅ | ❌ | ❌        | ❌         | ❌     | ✅      | ❌     |
| Notifications | ✅ | ✅ | ✅         | ✅         | ✅     | ✅      | ✅     |

## Key Workflows

### Lead → Policy Flow
1. **BDM** creates Lead
2. **BDM** converts Lead to Opportunity
3. **BDM** creates Submission from Opportunity
4. **UNDERWRITER** approves/rejects Submission
5. **OPERATIONS** generates Policy (auto-created on approval)
6. **OPERATIONS** generates payment schedule
7. **CLAIMS** processes claims against Policy

### Payment Management
- **Generate Schedule**: `POST /api/operations/policies/{id}/generate-schedule/`
- **Mark Paid**: `POST /api/operations/payments/{id}/mark-paid/`
- **Mark Failed**: `POST /api/operations/payments/{id}/mark-failed/`
- **Refresh Overdue**: `POST /api/operations/payments/refresh-overdue/`

### Claim Processing
- **File Claim**: `POST /api/claims/claims/` (with attachments)
- **Update Status**: `POST /api/claims/claims/{id}/set-status/`
  - Validates transitions: SUBMITTED → IN_REVIEW → APPROVED/REJECTED
  - Requires `approved_amount` when status=APPROVED

### Reconciliation
- **Upload Statement**: `POST /api/reconciliation/statements/upload_csv/`
  - Auto-matches transactions to policies/payments
  - Matching logic: payment_number → pending payments → policy premium
- **Auto Match**: `POST /api/reconciliation/statements/{id}/auto_match/`
- **Manual Match**: `POST /api/reconciliation/lines/{id}/manual_match/`

## Admin Panel

Access http://localhost:8000/admin/ with superuser credentials.

All models are registered with rich admin interfaces:
- User & Role management
- Lead, Opportunity, Activity tracking
- Submission review
- Policy & Payment monitoring
- Claim management
- Bank reconciliation
- Notification logs

## Production Deployment

1. **Set environment variables**
   ```env
   DEBUG=False
   SECRET_KEY=<strong-random-key>
   ALLOWED_HOSTS=yourdomain.com
   CORS_ALLOWED_ORIGINS=https://yourdomain.com
   DATABASE_URL=postgresql://user:pass@host:5432/vestigo
   ```

2. **Security settings**
   - Use PostgreSQL/MySQL instead of SQLite
   - Enable HTTPS and secure cookies
   - Set up proper CORS origins
   - Configure email backend for notifications

3. **Run migrations and collect static**
   ```bash
   python manage.py migrate
   python manage.py collectstatic
   ```

4. **Set up cron job for overdue payments**
   ```bash
   0 1 * * * /path/to/venv/bin/python /path/to/manage.py mark_overdue_payments
   ```

## Testing

Run tests:
```bash
python manage.py test
```

## Tech Stack

- **Django 4.x**: Web framework
- **Django REST Framework**: API framework
- **djangorestframework-simplejwt**: JWT authentication
- **django-environ**: Environment configuration
- **django-cors-headers**: CORS handling
- **drf-yasg**: Swagger/OpenAPI docs
- **django-filter**: Query filtering

## License

Proprietary - Vestigo Insurance CRM
