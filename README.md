# ChatConnect — Modern Real-time Chat & WebRTC Video Calling Web App

ChatConnect is a production-grade full-stack real-time messaging and HD video/audio calling platform built with **Next.js 16 App Router**, **TypeScript**, **Tailwind CSS**, **Neomorphism UI**, **Supabase Auth & Realtime**, **LiveKit WebRTC**, and **Cloudflare R2**.

---

## 🌟 Key Features

### 1. Modern Neomorphism UI Design System
- Tactile soft light and dark themes with custom dual directional shadows, inset input wells, and floating modal elevations.
- Fully responsive across **Mobile (320px - 640px)**, **Tablet & Laptop (768px - 1024px)**, and **Desktop / PC (1280px+)**.
- Comprehensive design tokens with CSS variables: `Button`, `Input`, `Avatar`, `Card`, `Badge`, `Modal`, `Dropdown`, `Toast`, `Skeleton`, `EmptyState`, `LoadingState`, `ConfirmDialog`, and `Tooltip`.

### 2. Multi-Factor & Frictionless Authentication
- **Mobile Number + OTP verification**: Fast 6-digit passcode authentication.
- **Mobile Number + Password**: Secure login using Supabase Auth.
- **Profile Setup**: Choose custom username, full name, password, and avatar on first verification.
- **Forgot Password**: Secure recovery flow with OTP verification.
- **Instant Interactive Mode**: Pre-configured interactive guest session for immediate browser testing even before external provider setup.

### 3. Real-Time Chat Engine
- One-to-one direct conversations and multi-member group chats.
- Instant Supabase PostgreSQL Realtime subscriptions (`INSERT`, `UPDATE`, `DELETE`).
- Optimistic UI updates with instant message dispatch and error recovery.
- Message reply visual quoting, inline editing, and soft deletion.
- Emoji selector and rich image/attachment previews.
- Read receipts, sent status indicators, and typing indicator simulation.
- Real-time search inside conversations.

### 4. HD WebRTC Video & Audio Calling (LiveKit)
- One-to-one and group video calls with dynamic layout.
- Audio-only call mode with speaking volume indicators.
- One-tap calling initiated directly from chat headers and contacts directory.
- Participant video grid with active speaker pulse ring.
- Floating control dock: Microphone mute/unmute, Camera on/off, Screen sharing, and Leave call.
- Secure server-side LiveKit JWT token generation at `/api/livekit/token` (never exposes API secrets to client).
- Call history logging with call duration and completed/missed statuses.

### 5. Cloudflare R2 Object Storage
- Zero-egress fee media storage for chat attachments and profile pictures.
- Server-side presigned URL generation at `/api/upload/sign` with S3-compatible client.
- Secure direct browser-to-bucket upload without exposing secret credentials.

---

## 📱 Responsive Layout Architecture

- **Mobile View (320px - 640px):**
  - Mobile bottom navigation bar for quick one-thumb switching.
  - Dedicated full-screen conversation view with back-to-list navigation.
  - Floating call controls and responsive touch targets (44px+ minimum).
- **Laptop & Tablet View (768px - 1024px):**
  - Left navigation rail with middle conversation list and active chat view side-by-side.
  - Fluid split screen.
- **Desktop & PC (1280px+):**
  - Full three-column workstation with tooltips, expansive video participant gallery, and multi-chat workflows.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18.18+ (Node v20+ or v24 recommended)
- npm, pnpm, or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` or edit `.env.local`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...

# LiveKit WebRTC Configuration
NEXT_PUBLIC_LIVEKIT_URL=wss://your-subdomain.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=sec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Cloudflare R2 Storage Configuration
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=chatconnect-media
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxxxxx.r2.dev

# App Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Setup Supabase Database Schema
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to **SQL Editor**.
3. Copy and run the entire SQL script from `supabase/migrations/001_chatconnect_schema.sql`.
4. This creates tables (`profiles`, `conversations`, `conversation_members`, `messages`, `calls`, `call_participants`, `notifications`), Row Level Security policies, updated_at triggers, and Realtime publications.

### 4. Setup LiveKit Cloud
1. Sign up at [LiveKit Cloud](https://cloud.livekit.io/) (free tier available).
2. Create a project and copy your **WebSocket URL**, **API Key**, and **API Secret**.
3. Add them to `.env.local`. Tokens will automatically generate on the server via `/api/livekit/token`.

### 5. Setup Cloudflare R2 Storage
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **R2 Object Storage**.
2. Create a bucket named `chatconnect-media`.
3. In **Settings**, configure CORS:
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
       "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
4. Create an R2 API Token with **Object Read & Write** permissions and copy credentials to `.env.local`.

### 6. Run the Application
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view ChatConnect.

---

## 🏗️ Project Structure

```
├── app/
│   ├── api/
│   │   ├── livekit/token/route.ts   # Secure LiveKit JWT room token generation
│   │   └── upload/sign/route.ts     # Cloudflare R2 presigned S3 upload API
│   ├── auth/
│   │   ├── login/page.tsx           # Mobile+Password and Mobile+OTP login
│   │   ├── register/page.tsx        # Registration via mobile number
│   │   ├── verify-otp/page.tsx      # 6-digit OTP verification & resend timer
│   │   ├── set-password/page.tsx    # Password & profile setup
│   │   └── forgot-password/page.tsx # Mobile password reset flow
│   ├── call/
│   │   └── [roomId]/page.tsx        # WebRTC HD video/audio room
│   ├── calls/page.tsx               # Call history & duration logs
│   ├── chat/
│   │   └── [conversationId]/page.tsx# Dynamic conversation page
│   ├── contacts/page.tsx            # Contact directory & presence
│   ├── dashboard/page.tsx           # Main desktop/mobile chat dashboard
│   ├── profile/page.tsx             # User profile & avatar management
│   ├── settings/page.tsx            # Theme, AV diagnostics, privacy toggles
│   ├── globals.css                  # Neomorphism design tokens & CSS variables
│   ├── layout.tsx                   # Root layout with Providers
│   └── page.tsx                     # Landing page with interactive preview
├── components/
│   ├── auth/auth-provider.tsx       # Authentication state manager
│   ├── call/call-room.tsx           # LiveKit WebRTC participant grid & controls
│   ├── chat/
│   │   ├── chat-context.tsx         # Realtime chat state & mutations
│   │   ├── chat-view.tsx            # Chat stream, input bar, emoji & media
│   │   ├── conversation-list.tsx    # Sidebar conversation list & filters
│   │   └── new-chat-modal.tsx       # Start 1-on-1 or group conversation
│   ├── layout/
│   │   ├── dashboard-shell.tsx      # Responsive dashboard container
│   │   ├── sidebar-nav.tsx          # Desktop/Laptop left navigation rail
│   │   └── bottom-nav.tsx           # Mobile bottom navigation bar
│   ├── theme-provider.tsx           # Zero-cascade light/dark theme provider
│   └── ui/                          # Neomorphic atomic component library
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── confirm-dialog.tsx
│       ├── dropdown.tsx
│       ├── empty-state.tsx
│       ├── input.tsx
│       ├── loading-state.tsx
│       ├── modal.tsx
│       ├── skeleton.tsx
│       ├── toast.tsx
│       └── tooltip.tsx
├── lib/
│   ├── chat-store.ts                # Seed data & conversation structures
│   ├── utils.ts                     # cn, formatting, and duration utilities
│   └── supabase/
│       ├── client.ts                # Browser Supabase client
│       └── server.ts                # Server Supabase client
├── supabase/
│   └── migrations/
│       └── 001_chatconnect_schema.sql # Database schema, RLS & triggers
└── types/
    └── database.ts                  # Typed database models
```

---

## 🛡️ Production Verification
- `npm run build`: Compiles successfully with Turbopack and strict TypeScript check.
- `npm run lint`: Validated with zero errors.
