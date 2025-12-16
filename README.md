# Stripe Expo App 💳

This is an [Expo](https://expo.dev) project with Stripe integration for payment processing, featuring store credit and discount functionality.

## Prerequisites

- Node.js v10 or higher
- npm or yarn
- Expo CLI
- Stripe account with API keys
- For Android: Android Studio and Android emulator (optional)
- For iOS: Xcode and iOS simulator (macOS only, optional)

## Project Structure

```
stripe-test/              # Root directory
├── app/                  # Expo Router pages
│   ├── _layout.tsx      # Root layout with Stripe provider
│   └── index.tsx        # Home screen with payment form
├── server/              # Backend Express API
│   ├── routes/          # API routes
│   ├── clients/         # Stripe client setup
│   └── server.ts        # Main server file
├── utils/               # Utility functions
│   ├── config.ts        # API configuration
│   ├── PaymentForm.tsx  # Payment form component
│   └── stripeApi.ts     # Stripe API helpers
├── hooks/               # Custom React hooks
│   └── useCustomerSession.ts  # Customer session hook
└── package.json
```

## Setup Instructions

### 1. Backend Server Setup

#### Step 1: Navigate to the server directory

```bash
cd server
```

#### Step 2: Install dependencies

```bash
npm install
```

#### Step 3: Configure environment variables

Create a `.env` file in the `server` directory by copying the example:

```bash
copy .env.example .env
```

Edit the `.env` file with your Stripe credentials:

```dotenv
# Stripe keys (Get these from https://dashboard.stripe.com/apikeys)
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Environment variables
STATIC_DIR=../client
DOMAIN=http://localhost:4242
PORT=4242

CI=false
CHALLENGE_ID=random-bronze-sloth
```

**Important:** Replace the placeholder values with your actual Stripe API keys from your [Stripe Dashboard](https://dashboard.stripe.com/apikeys).

#### Step 4: Start the backend server

```bash
npm start
```

The server will run on `http://localhost:4242` by default.

For development with auto-reload:

```bash
npm run dev
```

### 2. Mobile App Setup

#### Step 1: Navigate to the mobile app directory

```bash
cd ..
# Or from project root: cd stripe
```

#### Step 2: Install dependencies

```bash
npm install
```

#### Step 3: Configure API URL

Edit the file `./config.ts` to point to your backend server:

**For Android Emulator:**

```typescript
export const API_URL = "http://10.0.2.2:4242";
```

**For iOS Simulator:**

```typescript
export const API_URL = "http://localhost:4242";
```

**For Physical Device:**

Find your computer's local IP address:

**Windows:**

```bash
ipconfig
```

Look for "IPv4 Address" under your active network adapter (e.g., `192.168.1.100`)

**macOS/Linux:**

```bash
ifconfig
```

Look for `inet` address under your active network interface

Then update the config:

```typescript
export const API_URL = "http://YOUR_LOCAL_IP:4242";
// Example: export const API_URL = "http://192.168.1.100:4242";
```

**Important:** Make sure your mobile device and computer are on the same network!

#### Step 4: Start the Expo app

```bash
npm start
```

Or use specific platform commands:

```bash
# Start for Android
npm run android

# Start for iOS (macOS only)
npm run ios

# Start for Web
npm run web
```

## Running the Complete Application

1. **Start the backend server first:**

   ```bash
   cd server
   npm start
   ```

2. **In a new terminal, start the mobile app:**

   ```bash
   cd ..
   npm start
   ```

3. **Open the app:**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator (macOS only)
   - Scan the QR code with Expo Go app on your physical device

## Configuration Reference

### API URL Configuration (`utils/config.ts`)

This file contains the backend API endpoint. Update it based on your development environment:

| Environment      | API_URL Value             | Use Case                                  |
| ---------------- | ------------------------- | ----------------------------------------- |
| Android Emulator | `http://10.0.2.2:4242`    | Android emulator's special alias for host |
| iOS Simulator    | `http://localhost:4242`   | iOS simulator on same machine             |
| Physical Device  | `http://YOUR_IP:4242`     | Real device on same WiFi network          |
| Production       | `https://your-domain.com` | Deployed backend server                   |

### Environment Variables (`.env`)

| Variable                 | Description                 | Required           |
| ------------------------ | --------------------------- | ------------------ |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key | Yes                |
| `STRIPE_SECRET_KEY`      | Your Stripe secret key      | Yes                |
| `STRIPE_WEBHOOK_SECRET`  | Webhook signing secret      | For webhooks       |
| `PORT`                   | Server port number          | No (default: 4242) |
| `DOMAIN`                 | Server domain               | No                 |

## Troubleshooting

### Cannot connect to backend from mobile device

1. Verify the backend server is running (`http://localhost:4242` should be accessible in your browser)
2. Check that `API_URL` in `utils/config.ts` is correct for your environment
3. Ensure your device and computer are on the same WiFi network (for physical devices)
4. Check firewall settings - port 4242 should be accessible
5. Try restarting both the server and Expo app

### Stripe payments not working

1. Verify your Stripe API keys are correct in `.env`
2. Make sure you're using test mode keys (starting with `pk_test_` and `sk_test_`)
3. Check that the backend server is running and accessible
4. Review server logs for any error messages

### App not loading after changes

1. Clear Expo cache: `npx expo start -c`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Restart Metro bundler

## Development

- **Mobile app code:** Edit files in the `app` directory (uses Expo Router file-based routing)
  - `app/_layout.tsx` - Root layout with Stripe provider initialization
  - `app/index.tsx` - Main home screen with payment functionality
- **Utilities & Components:** Located in `utils` directory
  - `utils/PaymentForm.tsx` - Reusable payment form component
  - `utils/stripeApi.ts` - Stripe API helper functions
  - `utils/config.ts` - API URL configuration
- **Custom Hooks:** Located in `hooks` directory
  - `hooks/useCustomerSession.ts` - Customer session management
- **Backend API:** Server code in `server` directory
  - `server/server.ts` - Main server file
  - `server/routes/stripe.ts` - Stripe API endpoints
  - `server/clients/stripe.ts` - Stripe client configuration

## Features

- 💳 Stripe payment processing with Payment Sheet
- 💰 Store credit management and application
- 👤 Customer session handling
- 📱 Native iOS and Android support via Expo
- 🎨 Clean, simple two-file app structure
- ⚡ Real-time payment amount calculation
- 🔄 Dynamic publishable key fetching

## Learn More

- [Expo documentation](https://docs.expo.dev/)
- [Stripe React Native SDK](https://docs.stripe.com/payments/accept-a-payment?platform=react-native)
- [Expo Router](https://docs.expo.dev/router/introduction/)

## Additional Resources

- [Stripe API Reference](BACKEND_API_REFERENCE.md)
- [Expo GitHub](https://github.com/expo/expo)
- [Stripe Dashboard](https://dashboard.stripe.com/)
