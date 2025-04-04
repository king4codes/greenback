# Supabase Setup Guide for Web3 Wallet Authentication

This guide will walk you through setting up Supabase with web3 wallet authentication for your application. This implementation uses Solana wallet signatures for authentication.

## 1. Create a Supabase Project

1. Sign up or log in at [https://supabase.com](https://supabase.com)
2. Create a new project
3. Take note of your project URL and anon key (found in Project Settings > API)
4. Update your environment variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 2. Set Up Database Schema

1. Navigate to the SQL Editor in your Supabase dashboard
2. Create a new query and paste the contents of `supabase-init.sql`
3. Run the query to create the tables and policies
4. Create a new query and paste the contents of `supabase-stored-procedures.sql`
5. Run the query to create the stored procedures

## 3. Configure Authentication

Since we're using custom web3 wallet authentication, we need to:

1. Go to Authentication > Providers
2. Enable Email provider (we'll use it for virtual user accounts)
3. Disable "Confirm email" since we're using wallet signatures
4. Optional: Adjust session settings (Auth > URL Configuration)

## 4. Set Up Row-Level Security Policies

The SQL scripts already include Row Level Security (RLS) policies, but ensure they are applied correctly:

1. Go to Database > Tables
2. Check each table to ensure RLS is enabled
3. Verify the policies created by the SQL script

## 5. Testing Authentication Flow

Our authentication flow works as follows:

1. User connects their wallet
2. User clicks "Authenticate with Signature" in the wallet dropdown
3. User signs a message with their wallet
4. The signed message is verified and used for authentication
5. On first login, a new user record is created
6. The user is authenticated and can access their data

## 6. Key Files & Components

Here are the key files in the implementation:

- `lib/supabase/auth.ts` - Core authentication logic for web3 wallets
- `hooks/use-achievements.ts` - Hook for managing achievements
- `hooks/use-check-ins.ts` - Hook for managing daily check-ins
- `components/WalletConnect.tsx` - UI component for wallet connection and authentication

## 7. Data Structure

The database includes the following tables:

- `users` - User profiles linked to wallet addresses
- `achievements` - Achievement definitions
- `user_achievements` - Links users to earned achievements
- `daily_checkins` - Tracks user daily check-ins and streaks

## 8. Authentication Flow Details

1. **Wallet Connection**: 
   - User connects their wallet through the wallet adapter
   - Their address is captured but not yet authenticated

2. **Authentication**:
   - User clicks "Authenticate with Signature"
   - A nonce and timestamp are generated
   - User signs a message containing their address, nonce, and timestamp
   - The signature is verified
   - User is authenticated via Supabase

3. **New Users**:
   - If the user doesn't exist, a new account is created
   - The "Wallet Connected" achievement is unlocked
   - The user is redirected to the authenticated flow

## 9. Usage Notes

- **Multiple Wallets**: Each wallet address is treated as a separate user
- **Security**: All user data is protected by RLS policies tied to wallet address
- **Achievements**: Can be earned by reaching specific milestones
- **Daily Check-ins**: Users can check in daily to earn streak bonuses

## 10. Troubleshooting

- **Authentication Issues**: Check browser console for errors in the signing process
- **Database Errors**: Verify RLS policies are correctly configured
- **Missing Data**: Ensure the user is properly authenticated before accessing protected resources

## 11. Customizing the Authentication Flow

To customize the authentication flow:

1. Modify the signature message in `getSignatureMessage()` in `lib/supabase/auth.ts`
2. Adjust any wallet-specific logic in the `signInWithWallet()` function
3. Update the UI in `WalletConnect.tsx` to match your application's design

This implementation provides a solid foundation for web3 wallet authentication with Supabase, allowing your application to use cryptographic signatures for secure authentication. 