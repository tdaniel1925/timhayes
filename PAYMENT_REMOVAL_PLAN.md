# Payment Processing Removal Plan

## Goal
Simplify AudiaPro to focus on lead generation through marketing site. Remove all payment/billing features.

## Changes Required

### Backend (app.py)

**Endpoints to Remove:**
1. `/api/subscription` (GET) - line 1750
2. `/api/billing/history` (GET) - line 1774
3. `/api/subscription/cancel` (POST) - line 1842
4. `/api/setup-requests/<request_id>/payment` (POST) - line 2080
5. `/api/setup-requests/<request_id>/payment/verify` (POST) - line 2204
6. `/api/webhooks/paypal` (POST) - line 2274

**Model Changes:**
- Tenant model: Remove paypal_subscription_id, paypal_customer_id fields
- Keep: plan, max_users, max_calls_per_month (for usage limiting)
- Remove: subscription_status (just added, but not needed for simplified model)
- BillingHistory model: Keep for Super Admin revenue tracking

**Environment Variables to Remove:**
- PAYPAL_MODE
- PAYPAL_CLIENT_ID
- PAYPAL_CLIENT_SECRET

### Frontend

**Pages to Remove:**
1. `frontend/src/pages/Checkout.jsx`
2. `frontend/src/pages/SubscriptionManagement.jsx`

**Routes to Remove from App.jsx:**
- `/checkout`
- `/subscription`

**Pages to Update:**
- `Pricing.jsx` - Change all "Subscribe" buttons to "Contact Sales"
- `Home.jsx` - Update pricing preview CTAs to "Contact Sales"

## New Simplified Model

**Plans:**
- Free Trial (14 days) - 100 calls, 2 users
- Starter - $49/month - Contact to activate
- Professional - $149/month - Contact to activate
- Enterprise - Custom pricing - Contact to activate

**User Journey:**
1. User signs up (free trial starts)
2. User configures PBX integration
3. Calls start flowing in
4. User sees value, contacts sales
5. Sales team manually upgrades plan in Super Admin

This focuses on lead generation and human sales process.
