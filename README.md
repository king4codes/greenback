# InsideBaron Web App

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Solana RPC Configuration
NEXT_PUBLIC_SOLANA_RPC_URL=your-primary-rpc-endpoint
NEXT_PUBLIC_SOLANA_RPC_FALLBACK_1=your-fallback-endpoint-1
NEXT_PUBLIC_SOLANA_RPC_FALLBACK_2=your-fallback-endpoint-2
NEXT_PUBLIC_SOLANA_RPC_FALLBACK_3=your-fallback-endpoint-3
```

### 2. Supabase Setup

1. Create a new Supabase project at [app.supabase.com](https://app.supabase.com)
2. Get your project URL and anon key from Project Settings > API
3. Update the `.env.local` file with these values
4. In the Supabase SQL Editor, run the SQL scripts from:
   - `supabase-init.sql`
   - `supabase-stored-procedures.sql`

#### JWT Secret Setup
In the Supabase dashboard:
1. Go to Project Settings > API
2. In the JWT Settings section, set your JWT Secret
3. Make sure JWT expiry is set to a reasonable value (e.g., 604800 seconds for 7 days)

### 3. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

### Troubleshooting

If you encounter `supabaseUrl is required` errors:
1. Check that you've properly configured your `.env.local` file
2. Make sure the environment variables don't have extra spaces
3. Restart your development server

For detailed Supabase setup instructions, refer to `SUPABASE-SETUP-GUIDE.md`.

## Features

- Web3 Wallet Authentication with Supabase
- Daily Check-ins System
- Achievements System
- NFT Collection Tracking
- TradingView Market Integration
