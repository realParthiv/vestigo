# VESTIGO Insurance CRM - Complete Admin Guide

**Version 1.0** | Last Updated: 2025  
*A complete walkthrough of all features, pages, buttons, and workflows for new administrators*

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Getting Started (Login & Setup)](#getting-started)
3. [Dashboard (Home)](#dashboard)
4. [BDM Module (Sales Pipeline)](#bdm-module)
   - Leads Page
   - Opportunities Page
5. [Underwriting Module (Risk Assessment)](#underwriting-module)
   - Submission Queue Page
   - Submission Detail Page
6. [Operations Module (Policies & Payments)](#operations-module)
   - Policies List Page
   - Policy Details Page
7. [Claims Module (Claims Processing)](#claims-module)
8. [Reconciliation Module (Bank Matching)](#reconciliation-module)
9. [Reports Module (Analytics)](#reports-module)
10. [Help Center](#help-center)
11. [Common Admin Tasks](#common-admin-tasks)
12. [Troubleshooting](#troubleshooting)
13. [Reference](#reference)

---

## System Overview

### What is Vestigo?

Vestigo is a **complete insurance CRM system** that manages the entire lifecycle of insurance policies from lead acquisition through claims settlement and bank reconciliation.

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    VESTIGO INSURANCE CRM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Sales (BDM)  →  Underwriting  →  Operations  →  Claims         │
│  • Leads         • Risk Scoring    • Policies    • File Claim    │
│  • Opportunities • Approval        • Payments    • Track Status  │
│                                    • Track Overdue              │
│                                                                   │
│  ↓ All transactions match to bank via                            │
│                                                                   │
│  Reconciliation: Upload bank statements, auto-match to policies │
│                                                                   │
│  Analytics: Dashboard & Reports show all KPIs                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### The Insurance Workflow

1. **Lead Created** (BDM enters new prospect)
2. **Opportunity Generated** (BDM converts lead to sales opportunity)
3. **Underwriting Submission** (System auto-creates from approved opportunity)
4. **Approved/Rejected** (Underwriter reviews risk → approves or rejects)
5. **Policy Issued** (System auto-creates policy on approval)
6. **Payment Schedule** (Operations generates installment schedule)
7. **Payments Tracked** (Mark paid/failed as money arrives)
8. **Claims Filed** (Customer files claim against policy)
9. **Claims Approved** (Claims team approves and pays out)
10. **Bank Reconciliation** (Finance matches payments to bank statement)

### User Roles & What They Can Do

| Role | Access | Can Do | Cannot Do |
|------|--------|--------|-----------|
| **ADMIN** | All pages | Everything: approve, issue, process | N/A |
| **BDM** | Leads, Opportunities | Create leads, convert to opportunities | Approve underwriting, issue policies |
| **UNDERWRITER** | Underwriting Submissions | Review, approve/reject submissions | Issue policies, process payments |
| **OPERATIONS** | Policies, Payments | View/manage policies, mark payments | Approve submissions, file claims |
| **CLAIMS** | Claims | File claims, update status | Approve submissions, manage policies |
| **FINANCE** | Reconciliation | Upload statements, match payments | Approve submissions, file claims |
| **VIEWER** | Dashboard, Reports (read-only) | See stats and reports | Modify any data |

---

## Getting Started

### Initial Login

**URL:** `http://localhost:3000/login` (Frontend) or `http://localhost:8000` (Backend)

**Step 1: Enter Credentials**
- Username: `admin` (or see credentials below)
- Password: `password123`

**Demo User Credentials:**

| Username | Password | Role |
|----------|----------|------|
| admin | password123 | ADMIN |
| bdm | password123 | BDM |
| underwriter | password123 | UNDERWRITER |
| operations | password123 | OPERATIONS |
| claims | password123 | CLAIMS |
| finance | password123 | FINANCE |

**Step 2: On Login Screen**
- Enter username in "Username or Email" field
- Enter password in "Password" field
- Click **"Sign In"** button (blue, center of form)
- System will authenticate and redirect to Dashboard

### Admin Password Reset (If Needed)

If admin password is lost, run this command from backend directory:

```bash
python manage.py shell
>>> from django.contrib.auth.models import User
>>> user = User.objects.get(username='admin')
>>> user.set_password('newpassword123')
>>> user.save()
>>> exit()
```

### Access the Django Admin Panel

**URL:** `http://localhost:8000/admin/`

- Login with same credentials as above
- View/edit all database records
- Manage users, roles, and permissions directly
- Create test data

---

## Dashboard

### URL: `/` (Home / Dashboard)

The **Dashboard is your system overview page**—it loads when you log in.

### Dashboard Purpose

Show a **birds-eye view** of all current business metrics and alerts.

### What You See

The Dashboard displays 9 information cards:

| Card | Shows | Purpose |
|------|-------|---------|
| **Total Premium** | Sum of active policy amounts | How much total revenue is active |
| **Total Claims** | Sum of approved + pending claims | Exposure from filed claims |
| **Loss Ratio** | Claims / Premium (%) | Risk indicator; higher = more claims vs revenue |
| **Pipeline Chart** | Opportunities by stage | Sales pipeline visibility (DISCOVERY → QUOTE → NEGOTIATION → CLOSED) |
| **Pending Underwriting** | Count of submissions awaiting review | Backlog of approval work |
| **Recent Activities** | Last 5 activities (leads, opportunities) | What happened recently |
| **Upcoming Renewals** | Policies expiring in next 30 days | When to contact customers |
| **Policy Distribution** | Pie chart of policy counts/types | Portfolio composition |
| **Unread Notifications** | System alerts and events | Messages from policy/claim/payment events |

### Buttons on Dashboard

**Bell Icon (Top Right)** - Notification dropdown
- Shows unread notifications from claims, policies, payments
- Click notification to mark as read
- Notification count shows in red badge

**User Menu (Top Right)**
- Shows your username and role
- **"Logout"** button - Signs you out
- Redirects to login page

### Dashboard Actions

- Click any card to view more details about that metric
- Click notification to view related policy/claim/payment
- Use sidebar navigation to jump to specific modules

### Key Insight

**If your "Pending Underwriting" count is > 0**, submissions are waiting approval. Go to Underwriting page to process them.

---

## BDM Module

The **Sales Pipeline** - where leads become paying customers.

### Page 1: Leads

**URL:** `http://localhost:3000/leads`

**Purpose:** Manage all prospects/leads in the early sales stage.

#### What You See

A **table of all leads** with columns:
- **Lead Name** - Customer name
- **Email** - Contact email
- **Phone** - Contact phone
- **Status** - INTERESTED, QUALIFIED, NOT_INTERESTED
- **Created Date** - When lead was added
- **Actions** - Edit/Delete buttons per row

#### Buttons on Leads Page

| Button | Location | Action | When to Use |
|--------|----------|--------|-------------|
| **+ Add User** | Top left (blue) | Opens modal form to add new lead | New prospect calls; manually entering leads |
| **Convert** | Right side of each row (green) | Converts lead to an Opportunity | Lead is qualified; ready to move through sales pipeline |
| **Edit** | Right side of each row (blue) | Opens form to edit lead details | Update contact info, change status |
| **Delete** | Right side of each row (red) | Removes lead from system | Duplicate or spam lead |
| **Search** | Top right | Filter leads by name | Find specific lead |

#### Create Lead Modal Form

When you click **"+ Create Lead"**:

1. **Lead Name** (required) - Full name of prospect
2. **Email** (required) - Email address
3. **Phone** - Phone number
4. **Company** - Their company name
5. **Status** (dropdown) - INTERESTED, QUALIFIED, NOT_INTERESTED
6. **Notes** - Any additional information

Click **"Save Lead"** button (blue) to create, or **"Cancel"** to close modal.

#### What Happens Next

When you click **"Convert"** button on a lead:
1. System prompts: "Enter opportunity name"
2. You enter a name (e.g., "$10,000 Policy - John Smith")
3. System creates a new **Opportunity** with:
   - Status: DISCOVERY
   - Probability: 25% (default)
   - Expected Premium: $0 (you set later)
4. Lead status changes to **CONVERTED**
5. Opportunity appears on **Opportunities Board** immediately
6. BDM can now drag the opportunity through pipeline stages

---

### Page 2: Opportunities

**URL:** `http://localhost:3000/opportunities`

**Purpose:** Manage deals through the sales pipeline using a drag-and-drop Kanban board.

#### What You See

**Top Section - Quick Stats:**
- **Total Deals** - Count of all opportunities
- **Total Pipeline Value** - Sum of all expected premiums
- **Weighted Value** - Pipeline value × probability % (realistic forecast)

**Main Section - Kanban Board:**
A visual board with 5 columns (one per stage):
- **Discovery** - Initial conversations
- **Quote Sent** - Proposal given
- **Negotiation** - Discussing terms
- **Closed Won** - Customer accepted
- **Closed Lost** - Deal fell through

Each column shows:
- Stage name and count of deals in that stage
- Draggable deal cards with premium, probability, and notes

#### Buttons on Opportunities Page

| Button | Location | Action | When to Use |
|--------|----------|--------|-------------|
| **+ New Deal** | Top right (blue) | Opens modal to create new deal | Manually add opportunity to pipeline |
| **Edit** (pencil) | On card hover, top right | Opens form to update deal details | Update premium, probability, stage, notes |
| **Delete** (trash) | On card hover, top right | Removes opportunity from pipeline | Cancel deal or remove duplicate |
| **Submit to Underwriting** | On QUOTE stage cards (green) | Submits opportunity for risk review | Ready to send to underwriter |
| **Drag & Drop** | Any card | Drag card to different stage column | Move deal through pipeline (Discovery → Quote → Negotiation → Closed Won/Lost) |

#### Opportunities Page - How to Use

**Creating a New Deal:**
1. Click **"+ New Deal"** button (top right)
2. Modal opens with form fields
3. Fill in:
   - **Deal Name:** (e.g., "$50,000 Policy - Jane Smith")
   - **Pipeline Stage:** (DISCOVERY, QUOTE, NEGOTIATION, CLOSED_WON, CLOSED_LOST)
   - **Win Probability (%):** 0-100 (how likely to close)
   - **Expected Premium ($):** Estimated policy amount
   - **Notes:** Any details about the deal
4. Click **"Create Deal"** (blue)
5. Deal appears in chosen stage column

**Moving a Deal Through Stages:**
1. Look at the Kanban board
2. **Drag any deal card** to a different stage column
3. Card moves instantly; system updates stage
4. Example flow:
   - Drag from DISCOVERY → QUOTE (sent proposal)
   - Drag from QUOTE → NEGOTIATION (customer reviewing)
   - Drag to CLOSED_WON (customer accepted) → **Submit to Underwriting button appears**
   - Drag to CLOSED_LOST (customer declined)

**Submit Deal to Underwriting:**
1. Move deal to **QUOTE** stage (or higher)
2. When in QUOTE stage, green **"Submit to Underwriting"** button appears
3. Click the button
4. System creates an Underwriting Submission
5. Underwriter will see it in their queue and assess risk

**Edit a Deal:**
1. Hover over any deal card
2. Blue **"Edit"** pencil icon appears in top right
3. Click it
4. Modal opens with current deal details
5. Update any field (name, stage, premium, probability, notes)
6. Click **"Update Deal"** (blue)

**Delete a Deal:**
1. Hover over any deal card
2. Red **"Delete"** trash icon appears in top right
3. Click it
4. Confirmation dialog: "Are you sure?"
5. Click **"Delete"** to confirm
6. Deal is removed from pipeline

#### Deal Card Layout

Each deal card shows:
- **Deal Name** (bold)
- **Expected Premium** (large, highlighted box)
- **Win Probability** (0-100%) with progress bar
- **Notes** (if any were added)
- **Edit/Delete buttons** (appear on hover)
- **Submit to Underwriting button** (QUOTE stage only)

#### Color Coding by Stage

| Stage | Color | Meaning |
|-------|-------|---------|
| **Discovery** | Blue | Early conversations |
| **Quote Sent** | Purple | Proposal submitted |
| **Negotiation** | Amber | Terms being discussed |
| **Closed Won** | Green | Deal accepted; ready for underwriting |
| **Closed Lost** | Red | Deal rejected or fell through |

---

## Underwriting Module

Where **risk is assessed and policies are approved or rejected**.

### Page 1: Submission Queue

**URL:** `http://localhost:3000/underwriting`

**Purpose:** See all submissions awaiting underwriter review.

#### What You See

A **table of all submissions** with columns:
- **Opportunity Name** - Customer/deal name
- **Customer Name** - Person insured
- **Risk Score** - 0-100; higher = higher risk
- **Status** - PENDING, APPROVED, REJECTED, INFO_REQUESTED
- **Created Date** - When submitted for underwriting
- **Actions** - View button

#### Buttons on Submission Queue

| Button | Location | Action | When to Use |
|--------|----------|--------|-------------|
| **View Details** | Right side of each row | Opens detailed review page | Review submission before approving |
| **Search/Filter** | Top right | Filter by status (PENDING, APPROVED, etc.) | Find submissions to review |

#### Underwriting Workflow: What to Do

1. **View your queue** at `/underwriting`
2. See submissions with `Status = PENDING`
3. Click **"View Details"** on a submission
4. Review risk factors (see Submission Detail page)
5. Click **"Approve"** (green) OR **"Reject"** (red) OR **"Request Info"** (yellow)
6. When approved, system auto-creates Policy and sends notification to Operations

---

### Page 2: Submission Detail

**URL:** `http://localhost:3000/underwriting/:id`

**Purpose:** Detailed view of one submission to assess risk and make approval decision with comprehensive risk analysis and customer information.

#### Page Layout

The Submission Detail page is organized into **three main sections:**

---

#### Section 1: Header with Status and Actions

**Shows:**
- **Shield Icon** with **"Submission SUB-###"** title (e.g., SUB-001, SUB-002)
- **Status Badge** - Color-coded current status:
  - Yellow badge: PENDING
  - Green badge: APPROVED
  - Red badge: REJECTED
  - Blue badge: MORE_INFO_REQUIRED
- **Submission Date** - When it was submitted (e.g., "Submitted December 16, 2025")
- **Back Button** - "← Back to Underwriting Queue" (top left)

**Action Buttons (Right Side):**

Only visible when status is **PENDING**:

| Button | Color & Icon | Location | Action |
|--------|--------------|----------|--------|
| **Reject Submission** | Red with X icon | Top right | Rejects submission; notifies BDM |
| **Request More Info** | Amber with Warning icon | Top right | Asks BDM for clarification |
| **Approve & Issue Policy** | Green with Check icon | Top right | Approves and auto-creates Policy |

All buttons:
- Have loading states (disabled with reduced opacity during action)
- Include icons for visual clarity
- Show confirmation dialogs before executing

---

#### Section 2: Risk Assessment Section (Primary Focus)

**Location:** Top left of main content area  
**Visual:** White card with border, shield icon in header

**Displays:**

1. **Risk Icon** (Dynamic based on score):
   - 🟢 **Green Check Circle** - Risk score < 30 (Low Risk)
   - 🟡 **Yellow Warning Triangle** - Risk score 30-59 (Medium Risk)
   - 🔴 **Red X Circle** - Risk score ≥ 60 (High Risk)

2. **Risk Score Number:**
   - Large display (e.g., "45" in 3xl font)
   - Label: "Risk Score"
   - Range: 0-100 (higher = higher risk)

3. **Risk Level Badge:**
   - Green badge: "Low Risk" (score < 30)
   - Yellow badge: "Medium Risk" (score 30-59)
   - Red badge: "High Risk" (score ≥ 60)

4. **Risk Score Progress Bar:**
   - Visual bar showing score position
   - Color matches risk level (green/yellow/red)
   - Labels: "Low" | "Medium" | "High"
   - Bar fills to score percentage

5. **Recommendation Box:**
   - Gray background panel
   - Shows system-generated recommendation:
     - "Low Risk - Recommend Approval" (score < 30)
     - "Medium Risk - Review Required" (score 30-59)
     - "High Risk - Caution Advised" (score ≥ 60)
     - "Pending Review" (if no score)

---

#### Section 3: Opportunity Information

**Location:** Below Risk Assessment  
**Visual:** White card with document icon in header

**Shows All Deal Details:**

| Field | Display | Format |
|-------|---------|--------|
| **Opportunity Name** | Deal name (bold) | "Premium Insurance - John Doe" |
| **Expected Premium** | Dollar amount with currency icon | "$12,000" (green text, formatted) |
| **Win Probability** | Percentage with progress bar | 75% with indigo bar |
| **Stage** | Current pipeline stage | "QUOTE", "NEGOTIATION", etc. |
| **Expected Close Date** | Formatted date with calendar icon | "January 15, 2026" |

**Premium Display Features:**
- Green text color to highlight revenue
- Currency icon (dollar sign)
- Formatted with commas for thousands

**Probability Display:**
- Horizontal progress bar (indigo color)
- Percentage shown on right
- Visual indicator of deal strength

---

#### Section 4: Notes & Risk Factors

**Location:** Below Opportunity Information  
**Visual:** White card

**Shows:**
- Any notes or risk factors submitted with the opportunity
- If no notes: "No notes or risk factors provided." (gray italic text)
- Preserves line breaks (whitespace-pre-wrap)

---

#### Section 5: Additional Notes (For Your Decision)

**Location:** Bottom of main content  
**Visible:** Only when status is PENDING

**Purpose:** Add notes that will be included with your approval/rejection decision

**Features:**
- Multi-line textarea (4 rows)
- Placeholder: "Enter any additional notes about your decision..."
- Optional - can be left blank
- Notes are sent with action when you click Approve/Reject/Request Info

---

#### Section 6: Customer Details Sidebar (Right Column)

**Location:** Right side of page (sticky position)  
**Visual:** White card with user icon in header

**Shows Complete Customer Profile:**

1. **Customer Name** (Bold, large text)
   - Full name from Lead record
   - Example: "John Smith"

2. **Company** (with building icon)
   - Company name if available
   - From opportunity's lead company

3. **Email** (with envelope icon)
   - Clickable mailto: link
   - Blue text, hover effect
   - Opens email client when clicked

4. **Phone** (with phone icon)
   - Clickable tel: link
   - Opens phone dialer when clicked

5. **Assigned Underwriter**
   - Name of underwriter reviewing
   - Or "Unassigned" if none

6. **Submission Date**
   - Formatted date when submitted
   - Example: "December 16, 2025"

7. **Last Updated**
   - When submission was last modified
   - Shows timestamp of any status changes

**Sidebar Features:**
- Sticky positioning (stays visible while scrolling)
- All contact info is clickable (email/phone)
- Icons for visual clarity
- Uppercase labels for clean hierarchy

---

#### Buttons on Submission Detail

| Button | Color & Icon | Action | When to Use | Loading State |
|--------|--------------|--------|-------------|---------------|
| **Back to Queue** | Gray link with arrow | Return to submission list | Done reviewing; navigate away | No loading |
| **Reject Submission** | Red with XCircle icon | Marks REJECTED; notifies BDM | Risk too high; won't issue policy | Button disabled |
| **Request More Info** | Amber with Warning icon | Status → MORE_INFO_REQUIRED | Need clarification before deciding | Button disabled |
| **Approve & Issue Policy** | Green with CheckCircle icon | Marks APPROVED; auto-creates Policy | Risk is acceptable; ready to issue | Button disabled |

**Button States:**
- **Active:** Full color, clickable, icons visible
- **Loading:** Reduced opacity (50%), disabled, cursor not-allowed
- **Hidden:** Not shown if status is not PENDING

---

#### Decision Workflow

**Approve (Green Button with Check Icon):**
1. Review risk assessment (score, recommendation)
2. Review customer details and opportunity info
3. Optionally add notes in "Additional Notes" textarea
4. Click **"Approve & Issue Policy"** button (green)
5. Confirmation dialog: "Are you sure you want to approve and issue policy for this submission?"
6. Click "Approve" to confirm
7. Button shows loading state (disabled, grayed out)
8. System automatically:
   - Changes submission status to APPROVED
   - Creates a Policy record linked to this submission
   - Sends notification to Operations team
   - Includes your additional notes (if any)
9. Alert: "Submission approved successfully"
10. Redirects you back to `/underwriting` queue
11. Operations team can now generate payment schedule for the policy

**Reject (Red Button with X Icon):**
1. Review risk assessment
2. Identify why risk is unacceptable
3. Add rejection reason in "Additional Notes" textarea (recommended)
4. Click **"Reject Submission"** button (red)
5. Confirmation dialog: "Are you sure you want to reject this submission?"
6. Click "Reject" to confirm
7. Button shows loading state
8. System:
   - Changes submission status to REJECTED
   - Sends notification to BDM (deal is lost)
   - No policy created
   - Includes your rejection notes
9. Alert: "Submission rejected successfully"
10. Redirects back to queue
11. BDM will see rejection and can close or revise the opportunity

**Request Info (Amber Button with Warning Icon):**
1. Review submission and identify what's unclear or missing
2. Add specific questions/requests in "Additional Notes" textarea (important!)
3. Click **"Request More Info"** button (amber)
4. Confirmation dialog: "Are you sure you want to request more information for this submission?"
5. Click "Request Info" to confirm
6. Button shows loading state
7. System:
   - Changes submission status to MORE_INFO_REQUIRED
   - Sends notification to BDM with your questions/notes
   - Submission stays in queue
   - BDM receives alert to provide additional details
8. Alert: "Submission info requested successfully"
9. Redirects back to queue
10. You can review again once BDM updates opportunity and resubmits

---

#### Visual Design Features

**Professional Layout:**
- 3-column grid (2 columns main content + 1 column sidebar)
- Maximum width container (max-w-7xl)
- Consistent spacing and padding
- Shadow and ring effects on cards
- Responsive design (mobile-friendly)

**Color Coding:**
- Risk scores: Green (low) / Yellow (medium) / Red (high)
- Status badges: Color-coded by status type
- Action buttons: Semantic colors (green=approve, red=reject, amber=caution)
- Premium amounts: Green text to highlight revenue

**Icons Throughout:**
- Shield for risk/security
- User for customer info
- Document for opportunity details
- Phone, Email, Building for contact info
- Check, X, Warning for action buttons
- Calendar for dates
- Dollar for currency

**Loading States:**
- Spinner animation while fetching data
- "Loading submission details..." message
- Button disabled states during actions
- Smooth transitions

**Error Handling:**
- Clear error messages if submission not found
- Red X icon with "Submission not found"
- "Return to Queue" button to navigate away
- Error alerts if actions fail

---

#### What Makes a Good Approval Decision?

**Review Checklist:**

✅ **Risk Score Analysis:**
- Score < 30: Low risk, generally safe to approve
- Score 30-59: Medium risk, review carefully
- Score ≥ 60: High risk, proceed with caution or reject

✅ **Risk Recommendation:**
- Read system recommendation
- Consider if special circumstances apply

✅ **Opportunity Details:**
- Premium amount realistic?
- Win probability reasonable?
- Close date appropriate?

✅ **Customer Profile:**
- Customer name and company legitimate?
- Contact info valid?
- Any red flags?

✅ **Notes & Risk Factors:**
- Any concerns mentioned by BDM?
- Special circumstances noted?
- Missing information?

✅ **Your Additional Notes:**
- Document your decision rationale
- Note any exceptions or special conditions
- Add instructions for Operations if needed

**Best Practices:**
- Always add notes when rejecting (explain why)
- Add notes when requesting info (specify what you need)
- For borderline cases, request more info rather than immediate rejection
- Check customer contact info before approving
- Verify premium amount matches opportunity

---

#### After Actions Complete

**If Approved:**
- New policy appears in `/policies` page
- Operations team receives notification
- They will generate payment schedule
- Customer can begin making payments

**If Rejected:**
- BDM receives notification
- They can close the opportunity or revise and resubmit
- No policy is created
- Submission removed from your PENDING queue

**If Info Requested:**
- BDM receives your questions
- They update opportunity details
- They resubmit to underwriting
- Submission returns to your queue for review

---

## Operations Module

Where **policies are managed and payments are tracked**.

### Page 1: Policies List

**URL:** `http://localhost:3000/policies`

**Purpose:** View all policies and their current status.

#### What You See

A **table of all policies** with columns:
- **Policy Number** - Unique identifier
- **Customer Name** - Name of insured person
- **Premium Amount** - Total policy value
- **Status** - ACTIVE, EXPIRED, CANCELLED
- **Effective Date** - Policy start date
- **Expiration Date** - When policy ends
- **Actions** - View Details button

#### Buttons on Policies List

| Button | Location | Action | When to Use |
|--------|----------|--------|-------------|
| **+ Create Policy** | Top left (blue, admin only) | Manually create policy | Rare; usually auto-created from underwriting approval |
| **View Details** | Right side of row | Opens Policy Details page | Manage policy, generate payments, file claims |
| **Search** | Top right | Filter by policy number or customer | Find specific policy |
| **Status Filter** | Top right | Show ACTIVE / EXPIRED / CANCELLED | View policies in specific state |

#### Policy Status Explained

| Status | Meaning | Can Generate Payments? | Can File Claims? |
|--------|---------|------------------------|------------------|
| **ACTIVE** | Policy in force | Yes | Yes |
| **EXPIRED** | Policy term ended; no longer active | No | Only for existing claims |
| **CANCELLED** | Policy was cancelled early | No | Only for existing claims |

---

### Page 2: Policy Details

**URL:** `http://localhost:3000/policies/:id`

**Purpose:** Complete management of a single policy including payments and claims.

#### Page Layout

The Policy Details page has **4 main sections:**

---

#### Section 1: Policy Header

Shows:
- **Policy Number** - Unique ID
- **Customer Name** - Person insured
- **Premium Amount** - Total policy value
- **Status** - ACTIVE / EXPIRED / CANCELLED
- **Issue Date** - When policy was created

---

#### Section 2: Policy Actions (Top Buttons)

| Button | Color | Action | Purpose | Warning |
|--------|-------|--------|---------|---------|
| **Generate Schedule** | Blue | Opens modal to create payment installments | First step after policy issued; must specify number of installments | All existing schedules will be replaced |
| **Cancel Policy** | Red | Marks policy CANCELLED immediately | Customer cancels; no more payments accepted | ⚠️ **IRREVERSIBLE** - Cannot undo |
| **Mark Expired** | Gray | Marks policy EXPIRED at end of term | Policy term ended; no action needed | Automatic date can also trigger this |

#### Generate Schedule Workflow

**What happens under the hood (now accurate to system logic):**
- The system **replaces any existing schedule** for this policy (clean slate).
- It uses the **policy start date** as the first due date (or today if none is set).
- It creates **exactly N installments** (if you enter 12, you get 12).
- Due dates are generated on a **true monthly cadence** (calendar months, not fixed 30-day jumps). For custom cadences, backend also supports `frequency_days`, but UI defaults to monthly.
- Premium is split evenly; any rounding remainder is added to the **first installment**.

**Steps for the Operations user:**
1. Click **"Generate Schedule"** (blue) on the policy header.
2. When prompted, enter the **number of installments** (e.g., 12 for monthly). The system will always create that exact count.
3. Click **"Confirm"** (blue).
4. The schedule is regenerated with new dates and amounts, starting from the policy start date.
5. Payment table refreshes with the new installments.

**Example (12 monthly installments):**
- Premium: $12,000
- Installments entered: 12
- Each payment: $1,000
- Due dates: Month 1 on policy start date, then Month 2/3/.../12 on the same day each following month (calendar-aware)

#### Cancel Policy Workflow

⚠️ **WARNING: This action is IRREVERSIBLE**

1. Click **"Cancel Policy"** button (red)
2. Confirmation dialog appears: **"Are you sure you want to cancel this policy? This action cannot be undone."**
3. Click **"Cancel Policy"** to confirm (red) or **"Keep Policy"** to abort
4. If confirmed, status changes to CANCELLED
5. No more payments can be marked against this policy
6. Existing claims can still be processed

---

#### Section 3: Premium Payment History

Shows a **bar chart** of all payments with:
- Horizontal axis: Payment due dates
- Vertical axis: Amount
- Two bars per installment: "Due" (blue) vs "Paid" (green)

Below chart is a **table of all payment installments**:

| Column | Shows |
|--------|-------|
| **Due Date** | When payment is due |
| **Amount Due** | $X.XX to collect |
| **Amount Paid** | $Y.YY received so far |
| **Status** | PENDING, PAID, OVERDUE, FAILED |
| **Paid Date** | When payment was received |
| **Actions** | Mark Paid / Mark Failed buttons |

#### Payment Status Explained

| Status | Meaning | Action Needed |
|--------|---------|--------------|
| **PENDING** | Not yet due or due but unpaid | Wait or mark paid when received |
| **PAID** | Payment received | None; complete |
| **OVERDUE** | Past due date; not paid | Follow up with customer; mark paid or failed |
| **FAILED** | Payment failed (bounced check, declined card) | Contact customer; retry or write off |

#### Payment Action Buttons

Per payment installment, two buttons appear:

| Button | Color | Action | Modal Prompt | When to Use |
|--------|-------|--------|--------------|-------------|
| **Mark Paid** | Green | Record payment received | Enter exact amount received | Customer sent payment; record it |
| **Mark Failed** | Red | Record payment failure | Enter reason (bounced, declined, etc.) | Payment rejected; customer didn't pay |

#### Mark Paid Workflow

1. When customer pays, click **"Mark Paid"** button (green) next to installment
2. Modal appears: **"Enter amount received"**
3. Type exact amount received (e.g., $1,000.00)
4. Click **"Confirm Payment"** (green)
5. Loading indicator shows "Marking payment..."
6. Payment row turns green; status changes to PAID
7. System records paid_date = today

**Important:** Amount must match installment amount or you must confirm partial payment.

#### Mark Failed Workflow

1. If customer's payment bounces/is declined, click **"Mark Failed"** button (red)
2. Modal appears: **"Why did payment fail?"**
3. Select reason from dropdown:
   - Insufficient funds
   - Card declined
   - Invalid account
   - Other (enter reason)
4. Click **"Confirm Failure"** (red)
5. Payment row turns red; status changes to FAILED
6. BDM/Operations notified to follow up

---

#### Section 4: Claims & Quick Statistics (Right Sidebar)

##### Quick Statistics Box

Shows at top right:
- **Total Claims** - Number of claims filed against this policy
- **Approved** - Claims approved and paid
- **Pending** - Claims awaiting review
- **Total Claimed Amount** - Sum of all approved claim amounts

##### File a Claim Button

**"File a Claim"** button (blue) opens modal to file new claim against this policy.

See Claims module below for complete workflow.

---

## Claims Module

Where **customers file claims and you track approval and payment**.

### Page: Claims

**URL:** `http://localhost:3000/claims`

**Purpose:** Manage all claims from filing through approval and payout.

#### What You See

A **table of all claims** with columns:
- **Claim Number** - Unique identifier
- **Policy Number** - Which policy this claim is for
- **Customer Name** - Who filed the claim
- **Claim Amount** - How much is claimed
- **Status** - SUBMITTED, IN_REVIEW, APPROVED, REJECTED, PAID
- **Incident Date** - When loss occurred
- **Filed Date** - When claim was submitted
- **Actions** - Status dropdown button

#### Buttons on Claims Page

| Button | Location | Action | When to Use |
|--------|----------|--------|-------------|
| **+ File Claim** | Top left (blue) | Opens form to file new claim | Customer reports loss; file claim |
| **Status Dropdown** | Right side of each claim row | Change claim status + enter approval amount | Review and approve/reject claims |
| **Search/Filter** | Top right | Filter by claim#, policy#, or customer name | Find specific claim |
| **Status Filter** | Top right | Show SUBMITTED / IN_REVIEW / APPROVED / REJECTED / PAID | View claims by status |

---

#### File Claim Modal Form

When you click **"+ File Claim"** button:

1. **Claim Number** (auto-generated) - System assigns unique ID
2. **Policy** (dropdown, required) - Which policy this claim is for
3. **Incident Date** (required) - When the loss happened
4. **Claim Amount** (required) - How much is claimed
5. **Description** (required) - What happened (narrative)
6. **Attachments** - Upload supporting docs (receipts, photos, police report)
   - Click "Add File" button to attach documents
   - Can attach multiple files

Click **"File Claim"** button (blue) to submit, or **"Cancel"** to close.

After filing:
- Claim status set to **SUBMITTED**
- Claims team is notified
- Claim shows in Claims list with status filter

---

#### Claim Status Workflow

Claims move through these statuses:

```
SUBMITTED → IN_REVIEW → APPROVED (with approved_amount)
                     ↓
                   REJECTED
                     ↓
                    PAID (once approved_amount is paid out)
```

#### Change Claim Status

To update a claim, click the **Status Dropdown** button on the right side of claim row:

1. Click dropdown (shows current status)
2. Select new status from dropdown options
3. Modal appears with THREE required fields:

   **Field 1: Status Note** (required text)
   - Reason for this status change
   - Examples: "Reviewed medical documents", "Approved for $5,000", "Missing documentation"
   
   **Field 2: Approved Amount** (required if status = APPROVED)
   - How much to approve payout
   - Leave blank if rejecting or marking submitted
   - E.g., "$5,000" for partial approval or "$10,000" for full
   
   **Field 3: Confirmation** (required)
   - System shows: "Change claim status to [NEW_STATUS]?"
   - Click **"Confirm"** (blue) or **"Cancel"**

4. While updating, page shows "Updating…" indicator
5. Once saved, claim row updates with new status and approved amount
6. Notification sent to customer about status change

#### Claim Status Guide

| Status | Meaning | What Happens | Who Does It |
|--------|---------|--------------|-------------|
| **SUBMITTED** | Claim just filed | Waiting for claims team review | Automatic when filed |
| **IN_REVIEW** | Claims team reviewing | Examining documents and medical records | Claims analyst (you can move here) |
| **APPROVED** | Claim is valid; will pay | Approved amount is set; payout scheduled | Claims manager + Finance |
| **REJECTED** | Claim is invalid; will not pay | No payout given | Claims manager |
| **PAID** | Approved amount has been paid | Claim is fully resolved | Finance (after approved status) |

---

## Reconciliation Module

Where **bank statements are matched to policies and payments**.

### Page 1: Reconciliation Dashboard

**URL:** `http://localhost:3000/reconciliation`

**Purpose:** Upload bank statements and see all transactions matched to policies.

#### What You See

A **table of uploaded statements** with columns:
- **Statement Date** - Period of statement (e.g., Jan 2025)
- **Bank Name** - Which bank
- **Total Amount** - Sum of all transactions in statement
- **Matched** - Number of statement lines matched to policies
- **Unmatched** - Number of lines not yet matched
- **Match %** - Percentage matched (e.g., 85%)
- **Uploaded Date** - When statement was uploaded
- **Actions** - View Details button

#### Buttons on Reconciliation Dashboard

| Button | Location | Action | When to Use |
|--------|----------|--------|-------------|
| **+ Upload Statement** | Top left (blue) | Opens file picker to upload CSV | New bank statement arrived |
| **View Details** | Right side of row | Opens statement detail page | See matched/unmatched lines |

---

#### Upload Statement Workflow

1. Click **"+ Upload Statement"** button (blue)
2. File picker opens (or click to browse)
3. Select a **CSV file** from your computer
   - **Expected CSV format:**
     ```
     Date,Description,Amount,Reference
     2025-01-01,Premium Payment - Policy #POL-001,1000.00,POL-001
     2025-01-02,Premium Payment - Policy #POL-002,1500.00,POL-002
     ```
   - **Headers required:** Date, Description, Amount, Reference
   - Columns can be in any order

4. Click **"Upload"** button (blue) in file picker
5. System parses CSV and runs **auto-match algorithm**
6. Algorithm tries to match each line to a policy/payment by:
   - Looking for payment number (e.g., "POL-001") in Description
   - Matching amount to a PENDING payment for that policy
   - Checking premium amount if payment number not found
7. Upload completes; statement appears in table
8. **Matched %** shows auto-match success rate

---

### Page 2: Statement Detail

**URL:** `http://localhost:3000/reconciliation/:id`

**Purpose:** Detailed view of one bank statement; manually match any unmatched lines.

#### What You See

**Statement Header:**
- **Bank:** Bank name
- **Statement Date:** Statement period
- **Total Amount:** Sum of all lines
- **Matched/Unmatched Counts:** How many lines are matched

**Statement Lines Table:**

Each row shows:
- **Date** - Transaction date
- **Description** - What the transaction is for
- **Amount** - Dollar amount
- **Status** - MATCHED (green) or UNMATCHED (red)
- **Matched Policy** - If matched, shows policy number
- **Actions** - Depends on status

#### Buttons on Statement Detail

| Button | Location | Action | When to Use |
|--------|----------|--------|-------------|
| **Run Auto Match** | Top right (blue) | Re-run matching algorithm | New lines added; try again to match |
| **Back** | Top left | Return to statement list | Done reconciling |

#### Manual Matching Workflow

For each **UNMATCHED** line (red):

1. Line shows transaction details but no policy matched
2. Look at **Description** and **Amount** to identify policy
3. Enter **Policy ID** in text input on that row
   - Policy IDs look like: POL-2025-001, POL-2025-002, etc.
   - Find policy by checking Policies page if unsure
4. Click **"Match"** button (blue) on that row
5. System links this bank line to that policy
6. Row turns green; status changes to MATCHED
7. Continue for all unmatched lines

#### Unmatch Workflow

If a line was matched **incorrectly**:

1. Line shows "Matched to: [POLICY_NUMBER]" and **"Unmatch"** button (red)
2. Click **"Unmatch"** button (red)
3. System clears the match
4. Row turns red; status changes to UNMATCHED
5. Re-match to correct policy using workflow above

#### Why Manual Matching?

- Auto-match algorithm is ~85% successful
- Some transactions have descriptions that don't match policy numbers exactly
- Manual matching ensures 100% accuracy
- Each bank line should eventually be matched or reviewed as non-policy transaction

#### Reconciliation Complete

Statement is fully reconciled when:
- ✅ All policy-related lines are MATCHED (green)
- ✅ Any non-policy lines are reviewed and marked as not applicable
- ✅ Total of matched amounts ≈ Total of bank statement

---

## Reports Module

### Page: Reports Dashboard

**URL:** `http://localhost:3000/reports`

**Purpose:** Analytical view of business metrics and trends.

#### What You See

Similar to Dashboard but with additional detail:

| Report | Shows | Use For |
|--------|-------|---------|
| **Total Premium** | Sum of all active policies | Revenue metric |
| **Total Claims** | Sum of approved + pending claims | Liability/payout exposure |
| **Loss Ratio %** | Claims ÷ Premium | Risk analysis; if >50%, high risk |
| **Pipeline by Stage** | Count of opportunities in each stage | Sales forecasting |
| **Pending Underwriting** | Count of PENDING submissions | Workload; approval backlog |
| **Recent Activities** | Last 10 activities | Audit trail and activity log |
| **Upcoming Renewals** | Policies expiring in next 30 days | Customer retention planning |
| **Policy Distribution** | Chart of policies by type | Portfolio composition |
| **Notifications** | Recent system alerts | Important events and status changes |

#### No Special Buttons

Reports page is **read-only**. Use it to:
- Monitor business metrics
- Identify trends
- Plan follow-ups (renewals)
- Track backlog (underwriting)

---

## Help Center

### Page: Help Center

**URL:** `http://localhost:3000/help`

**Purpose:** Documentation and guidance for using Vestigo.

This page contains:
- System overview
- How to use each module
- Common questions
- Contact information

Click **"Help Center"** in sidebar at any time to access documentation.

---

## Common Admin Tasks

### Task 1: Approve a New Submission (Lead to Policy Issuance)

**Timeline:** 5-10 minutes

**Steps:**

1. **Check Dashboard**
   - See "Pending Underwriting" count on Dashboard
   - If count > 0, submissions are waiting

2. **Go to Underwriting Queue**
   - Click "Underwriting" in left sidebar
   - See all PENDING submissions

3. **Review Submission**
   - Click "View Details" on submission
   - Review customer info and risk score
   - Read risk notes

4. **Make Decision**
   - Click **"Approve"** button (green) if risk is acceptable
   - System automatically:
     - Changes status to APPROVED
     - Creates a Policy
     - Notifies Operations team
   - You're done! Policy is now ready

5. **Operations Next Steps** (another admin will do this)
   - Operations admin goes to Policies page
   - Views new policy
   - Clicks "Generate Schedule" to create payment installments

---

### Task 2: Generate Payment Schedule for Policy

**Timeline:** 2-3 minutes per policy

**Steps:**

1. **Go to Policies**
   - Click "Policies" in left sidebar
   - Search for policy by number or customer name if needed

2. **Open Policy Details**
   - Click "View Details" on the policy

3. **Generate Schedule**
   - Click **"Generate Schedule"** button (blue)
   - Modal asks: "How many installments?"
   - Enter number (e.g., 12 for monthly)
   - Click **"Confirm"** (blue)

4. **Verify**
   - Refresh page or scroll to "Premium Payment History"
   - See payment schedule with all installments
   - Each shows due date, amount, and status (PENDING)

5. **Send to Customer**
   - Customer now knows payment schedule
   - First payment is due immediately

---

### Task 3: Record a Payment (Mark Paid)

**Timeline:** 1-2 minutes per payment

**Steps:**

1. **Go to Policies**
   - Click "Policies" in left sidebar

2. **Find Policy with Payment Due**
   - Click "View Details"
   - Scroll to "Premium Payment History"
   - Find installment with status PENDING

3. **Mark Paid**
   - Click **"Mark Paid"** button (green) next to installment
   - Modal asks: "Enter amount received"
   - Type exact amount (e.g., $1,000.00)
   - Click **"Confirm Payment"** (blue)

4. **Verify**
   - Loading indicator shows "Marking payment..."
   - Payment row turns green
   - Status changes to PAID
   - Paid date is recorded

5. **Complete**
   - Reconciliation will match this payment to bank statement later

---

### Task 4: File a Claim for Customer

**Timeline:** 3-5 minutes

**Steps:**

1. **Go to Claims**
   - Click "Claims" in left sidebar

2. **File New Claim**
   - Click **"+ File Claim"** button (blue)
   - Modal opens

3. **Fill Claim Form**
   - **Claim Number:** Auto-generated
   - **Policy:** Select from dropdown (customer's policy)
   - **Incident Date:** When loss occurred
   - **Claim Amount:** How much is claimed
   - **Description:** What happened (narrative)
   - **Attachments:** Upload supporting docs (optional)
     - Click "Add File" to attach photos, receipts, police report, etc.

4. **Submit**
   - Click **"File Claim"** button (blue)
   - System creates claim
   - Claim status set to SUBMITTED
   - Claims team notified

5. **Next Steps** (Claims analyst will approve)
   - Analyst views claim at `/claims`
   - Changes status to IN_REVIEW
   - Reviews attachments
   - Changes status to APPROVED (with approved amount) or REJECTED

---

### Task 5: Approve a Claim (Authorize Payout)

**Timeline:** 2-3 minutes per claim

**Steps:**

1. **Go to Claims**
   - Click "Claims" in left sidebar

2. **Find Claim to Review**
   - Filter by status SUBMITTED or IN_REVIEW
   - Click on claim row to review details

3. **Change Status to Approved**
   - Click **Status Dropdown** (right side of claim)
   - Select "APPROVED" from dropdown
   - Modal appears with three fields:

     **Status Note (required):**
     - Example: "Approved after reviewing medical documents"
     
     **Approved Amount (required):**
     - Example: "$5,000" for partial approval
     - Or "$10,000" for full claim amount
     
     **Confirmation:**
     - Click **"Confirm"** button (blue)

4. **Verify**
   - Page shows "Updating…" indicator briefly
   - Claim row updates:
     - Status changes to APPROVED
     - Approved amount shows

5. **Finance Follow-up** (Another admin will do this)
   - Finance admin goes to Reconciliation or Reports
   - Tracks approved claim payout in bank statement
   - Marks it PAID once payout clears

---

### Task 6: Upload and Reconcile Bank Statement

**Timeline:** 5-10 minutes

**Steps:**

1. **Go to Reconciliation**
   - Click "Reconciliation" in left sidebar

2. **Upload Statement**
   - Click **"+ Upload Statement"** button (blue)
   - File picker opens
   - Select CSV file from bank

3. **Auto-Match**
   - System automatically runs matching algorithm
   - Links transaction lines to policies
   - Shows "Matched %" on completed upload

4. **View Details**
   - Click "View Details" on statement
   - See all transaction lines

5. **Manual Match Remaining**
   - For any UNMATCHED lines (red):
     - Identify which policy it's for
     - Enter Policy ID in text field
     - Click **"Match"** button (blue)
   - Repeat until all policy-related lines are matched (green)

6. **Verify Reconciliation**
   - Total of matched amounts ≈ Total of bank statement
   - All policy-related transactions are linked
   - Reconciliation is complete

---

## Troubleshooting

### Issue: I See "403 Forbidden" Error

**Cause:** Your user role doesn't have permission for that page.

**Solution:**
- Check your assigned role (see user menu in top right)
- Admin role can access everything
- Other roles have limited access per module
- Contact admin to change your role if needed

**Common Role Restrictions:**
- **BDM role:** Can only see Leads & Opportunities, not Policies
- **UNDERWRITER:** Can only see Underwriting, not Operations
- **OPERATIONS:** Can see Policies & Payments, not Claims
- **CLAIMS:** Can see Claims, not Policies
- **FINANCE:** Can see Reconciliation, not Claims

---

### Issue: "Pending Underwriting" Count Won't Decrease

**Cause:** You haven't approved/rejected submissions yet.

**Solution:**
1. Go to Underwriting page
2. See list of PENDING submissions
3. Click "View Details" on each
4. Click **"Approve"** (green) or **"Reject"** (red)
5. Count decreases as submissions are resolved

---

### Issue: Payment Shows "OVERDUE" But I Haven't Marked It

**Cause:** System automatically marks past-due payments as OVERDUE.

**Solution:**
1. You **must take action** on overdue payments:
   - Click **"Mark Paid"** if customer sent payment
   - Click **"Mark Failed"** if customer won't pay
2. Contact customer to ask status
3. Update payment accordingly

**To Trigger Overdue Check** (Admin only):
```bash
python manage.py mark_overdue_payments
```

This runs automatically daily via cron; you can also run manually.

---

### Issue: Claim Status Won't Change

**Cause:** You might have missed a required field when changing status.

**Solution:**
- Go back to claim
- Click Status Dropdown again
- Ensure you fill:
  1. **Status Note** (always required)
  2. **Approved Amount** (required ONLY if approving)
  3. **Confirmation** click
- Try again

---

### Issue: Bank Statement Upload Fails

**Cause:** CSV format incorrect.

**Solution:**
- Ensure CSV has these headers: `Date`, `Description`, `Amount`, `Reference`
- Example format:
  ```
  Date,Description,Amount,Reference
  2025-01-01,Premium Payment,1000.00,POL-001
  ```
- Re-upload with correct format

---

### Issue: Auto-Match Only Matched 50% of Lines

**Cause:** Some transactions don't have clear policy references.

**Solution:**
1. Manually match remaining lines:
   - View Statement Details
   - For each UNMATCHED line (red)
   - Enter Policy ID and click "Match"
2. If policy can't be identified:
   - This might be a non-policy transaction (interest, fees, etc.)
   - Leave unmatched and document why in notes

---

### Issue: Can't Cancel Policy

**Cause:** Policy might already be CANCELLED or EXPIRED.

**Solution:**
1. Go to Policy Details
2. Check current **Status**
3. If already CANCELLED or EXPIRED, no action needed
4. If ACTIVE:
   - Click **"Cancel Policy"** button (red)
   - Confirm in dialog
   - Policy is now CANCELLED

---

### Issue: Admin Password Forgotten

**Cause:** Original admin/password123 not working.

**Solution:**
1. Open terminal in backend directory
2. Run:
   ```bash
   python manage.py shell
   ```
3. Type:
   ```python
   from django.contrib.auth.models import User
   user = User.objects.get(username='admin')
   user.set_password('newpassword123')
   user.save()
   exit()
   ```
4. Login with: `admin` / `newpassword123`

---

## Reference

### All 14 Pages & URLs

| Page | URL | Purpose | Sidebar Link |
|------|-----|---------|--------------|
| Login | `/login` | Enter credentials | None (before login) |
| Register | `/register` | Create account | None (before login) |
| Dashboard | `/` | System overview & KPIs | Dashboard |
| Leads | `/leads` | Manage prospects | Leads |
| Opportunities | `/opportunities` | Sales pipeline | Opportunities |
| Policies | `/policies` | List all policies | Policies |
| Policy Details | `/policies/:id` | Manage single policy & payments | (from Policies) |
| Claims | `/claims` | File & track claims | Claims |
| Underwriting Queue | `/underwriting` | Review submissions | Underwriting |
| Submission Detail | `/underwriting/:id` | Approve/reject submission | (from queue) |
| Reconciliation | `/reconciliation` | Upload statements | Reconciliation |
| Statement Detail | `/reconciliation/:id` | Match transactions | (from upload) |
| Reports | `/reports` | Analytics & KPIs | Reports |
| Help | `/help` | Documentation | Help Center |

---

### All Buttons Summary

#### Authentication Pages
- **Sign In** - Login button at `/login`
- **Create Account** - Register button at `/register`

#### Navigation (Left Sidebar)
- **Dashboard** - Go to home page
- **Leads** - Go to leads list
- **Opportunities** - Go to opportunities list
- **Policies** - Go to policies list
- **Claims** - Go to claims list
- **Underwriting** - Go to submission queue
- **Reconciliation** - Go to statement dashboard
- **Reports** - Go to analytics
- **Help Center** - Go to documentation

#### Leads Page
- **+ Create Lead** - Open new lead form
- **Edit** (per row) - Modify lead
- **Delete** (per row) - Remove lead

#### Opportunities Page
- **+ New Deal** - Create new opportunity in pipeline
- **Edit** (pencil, on hover) - Update deal details
- **Delete** (trash, on hover) - Remove opportunity
- **Submit to Underwriting** (QUOTE stage) - Submit for risk review
- **Drag cards** - Move deals between pipeline stages

#### Underwriting Pages
- **View Details** - Open submission detail
- **Approve** - Approve submission, auto-create policy
- **Reject** - Reject submission
- **Request Info** - Ask for more information

#### Policies Pages
- **+ Create Policy** - Manually create policy (admin only)
- **View Details** - Open policy detail page
- **Generate Schedule** - Create payment installments
- **Cancel Policy** - Permanently cancel policy
- **Mark Expired** - Mark policy expired
- **Mark Paid** - Record payment received
- **Mark Failed** - Record payment failure
- **File a Claim** - Open claim form

#### Claims Page
- **+ File Claim** - Open claim form
- **Status Dropdown** - Change claim status + enter approval amount

#### Reconciliation Pages
- **+ Upload Statement** - Open file picker for CSV
- **View Details** - Open statement detail
- **Run Auto Match** - Re-run matching algorithm
- **Match** - Link unmatched line to policy
- **Unmatch** - Remove incorrect match

#### User Menu (Top Right)
- **Logout** - Sign out and return to login

---

### Backend API Endpoints (For Reference)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/auth/login/` | POST | Login and get tokens |
| `/api/v1/auth/refresh/` | POST | Refresh access token |
| `/api/v1/users/` | GET/POST | List/create users |
| `/api/v1/bdm/leads/` | GET/POST | List/create leads |
| `/api/v1/bdm/opportunities/` | GET/POST | List/create opportunities |
| `/api/v1/underwriting/submissions/` | GET/POST | List/create submissions |
| `/api/v1/underwriting/submissions/:id/approve/` | POST | Approve submission |
| `/api/v1/underwriting/submissions/:id/reject/` | POST | Reject submission |
| `/api/v1/operations/policies/` | GET/POST | List/create policies |
| `/api/v1/operations/policies/:id/generate-schedule/` | POST | Create payment installments |
| `/api/v1/operations/policies/:id/cancel/` | POST | Cancel policy |
| `/api/v1/operations/policies/:id/expire/` | POST | Mark policy expired |
| `/api/v1/operations/payments/` | GET/POST | List/create payments |
| `/api/v1/operations/payments/:id/mark-paid/` | POST | Mark payment paid |
| `/api/v1/operations/payments/:id/mark-failed/` | POST | Mark payment failed |
| `/api/v1/claims/claims/` | GET/POST | List/create claims |
| `/api/v1/claims/claims/:id/set-status/` | POST | Update claim status |
| `/api/v1/reconciliation/statements/upload_csv/` | POST | Upload bank statement |
| `/api/v1/reconciliation/statements/:id/auto_match/` | POST | Run matching algorithm |
| `/api/v1/reconciliation/lines/:id/manual_match/` | POST | Manually match line |
| `/api/v1/reports/dashboard-stats/` | GET | Get all KPIs |

---

### Environment Setup

**Frontend** (React):
```bash
cd frontend/vestigo_frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

**Backend** (Django):
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo_data  # Optional: load sample data
python manage.py runserver
# Runs on http://localhost:8000
```

**Admin Panel:**
- Go to `http://localhost:8000/admin/`
- Login with same credentials as frontend
- View/edit all database records directly

---

### Quick Reference: What to Do When...

| Scenario | Step 1 | Step 2 | Step 3 |
|----------|--------|--------|--------|
| **New lead signs up** | Go to Leads | Click **+ Create Lead** | Fill form; save |
| **New lead wants to buy policy** | Go to Leads | Click **Convert** button | Opportunity appears on Opportunities Board |
| **Move deal through pipeline** | Go to Opportunities | **Drag card** to next stage column | Deal progresses through Discovery → Quote → Negotiation |
| **Deal is ready for underwriting** | Opportunities Board | Move to QUOTE stage, click **Submit to Underwriting** | Underwriter can now review risk |
| **Policy created; need payment plan** | Go to Policies | Click **View Details** | Click **Generate Schedule** |
| **Customer sends payment** | Go to Policies → Details | Find payment in list | Click **Mark Paid** |
| **Customer files claim** | Go to Claims | Click **+ File Claim** | Fill form; attach docs |
| **Need to approve claim** | Go to Claims | Click Status Dropdown | Select APPROVED; enter amount |
| **Bank statement arrived** | Go to Reconciliation | Click **+ Upload Statement** | Upload CSV |
| **Statement lines unmatched** | View Statement Details | For each red line | Enter Policy ID; click **Match** |
| **Need business overview** | Go to Dashboard | Review KPI cards | Check "Pending Underwriting" |

---

### Demo Data

To populate system with sample data:

```bash
python manage.py seed_demo_data
```

Creates:
- 6 demo users (admin, bdm, underwriter, operations, claims, finance)
- Sample leads and opportunities
- Sample submissions and policies
- Sample payments and claims

---

## Summary

Vestigo is a **complete insurance lifecycle system**. As admin, you:

1. **Monitor** via Dashboard - See all KPIs and pending work
2. **Process Approvals** - Underwriter approves submissions → Operations issues policies
3. **Track Payments** - Record customer payments; flag overdue
4. **Handle Claims** - File and approve claims; set payout amounts
5. **Reconcile** - Upload bank statements; match to policies
6. **Report** - Analyze trends and metrics

**Start with Dashboard** → **Review Pending Underwriting** → **Approve Submissions** → **Generate Schedules** → **Track Payments** → **Reconcile**

Good luck! 🚀

---

**Need help?** Visit `/help` page or contact support.

