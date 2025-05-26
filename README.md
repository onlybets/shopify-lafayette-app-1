# Sticky Add to Cart – Lafayette App

A minimal, robust sticky add-to-cart button for Shopify Online Store 2.0 themes.

## Features

- Sticky add-to-cart button with customizable position and padding
- Works on all OS 2.0 themes (Dawn, Sense, Craft, Refresh)
- Admin UI with live preview and auto-save (Polaris v12)
- Theme App Extension for storefront injection
- Subscription billing ($5 one-time) with paywall and license checks
- Webhook cleanup on uninstall

## Setup

1. **Install dependencies:**
   ```sh
   npm install
   ```

2. **Set environment variables:**
   - `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`, `SCOPES`
   - `SHOP_SETTINGS_HMAC_SECRET` (for API auth)

3. **Database setup:**
   ```sh
   npx prisma migrate dev
   ```

4. **Start development:**
   ```sh
   npm run dev
   ```

5. **Build extension:**
   ```sh
   npm run build:extension
   ```

6. **Deploy to Shopify preview store:**
   ```sh
   npx shopify app deploy --store lafayette-dev
   ```

## Billing & Licensing

- Initiate billing: `/api/billing/create` (redirects to Shopify confirmation)
- Callback: `/api/billing/callback` (captures charge and updates Subscription)
- License check: `/api/license` (embed script aborts if inactive)
- Paywall: Admin UI blocks access if subscription is not ACTIVE

## Screenshots

Add these to your App Store listing:

1. ![Screenshot 1](screenshots/1.png)
2. ![Screenshot 2](screenshots/2.png)
3. ![Screenshot 3](screenshots/3.png)

---

## Billing & Licensing

- Merchants are prompted to choose a plan on first use (paywall).
- Billing is handled via Shopify's Billing API ($5 one-time).
- After payment, the app receives a callback and updates the Subscription status in the database.
- The embed script checks `/api/license` on every page load and aborts if the license is not active.
- Admin UI and storefront features are blocked if the subscription is not ACTIVE.
- Webhooks keep the subscription status in sync with Shopify.
- Cron job checks for expiring subscriptions and sends notification emails via SendGrid.

**Demo video:**  
[Billing & Licensing Flow Demo](screenshots/billing-demo.mp4)

---
