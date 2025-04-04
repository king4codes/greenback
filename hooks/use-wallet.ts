'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { 
  Connection, 
  PublicKey, 
  LAMPORTS_PER_SOL, 
  clusterApiUrl,
  Commitment
} from '@solana/web3.js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Array of fallback RPC endpoints
const FALLBACK_ENDPOINTS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-api.projectserum.com',
  'https://rpc.ankr.com/solana',
  clusterApiUrl('mainnet-beta'),
]

// RPC connection configuration
const connectionConfig = {
  commitment: 'confirmed' as Commitment,
};

// Create a connection with failover support
class RobustConnection {
  private mainConnection: Connection;
  private fallbackConnections: Connection[] = [];
  private currentConnectionIndex = 0;
  private lastFailure = 0;
  private consecutiveFailures = 0;
  
  constructor() {
    // Use the main RPC URL if available
    const customRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
    const mainEndpoint = customRpcUrl || FALLBACK_ENDPOINTS[0];
    
    // Create main connection
    this.mainConnection = new Connection(mainEndpoint, connectionConfig);
    
    // Initialize fallback connections
    FALLBACK_ENDPOINTS.forEach(endpoint => {
      if (endpoint !== mainEndpoint) {
        this.fallbackConnections.push(new Connection(endpoint, connectionConfig));
      }
    });
  }
  
  private getCurrentConnection(): Connection {
    if (this.currentConnectionIndex === 0) {
      return this.mainConnection;
    }
    return this.fallbackConnections[this.currentConnectionIndex - 1];
  }
  
  private switchToNextConnection() {
    this.lastFailure = Date.now();
    this.consecutiveFailures++;
    
    // Cycle through available connections
    this.currentConnectionIndex = 
      (this.currentConnectionIndex + 1) % (this.fallbackConnections.length + 1);
    
    console.log(`Switching to RPC endpoint ${this.currentConnectionIndex}`);
  }
  
  // Attempt to get balance with failover support
  async getBalance(publicKey: PublicKey): Promise<number> {
    // Try to use each connection until one succeeds
    for (let attempt = 0; attempt < this.fallbackConnections.length + 1; attempt++) {
      try {
        const connection = this.getCurrentConnection();
        const balance = await connection.getBalance(publicKey);
        
        // On success, reset failure counters
        this.consecutiveFailures = 0;
        return balance;
      } catch (error: any) {
        console.error(`RPC endpoint ${this.currentConnectionIndex} failed:`, error.message);
        
        // Switch to the next connection for the next attempt
        this.switchToNextConnection();
        
        // If this was the last connection, throw the error
        if (attempt === this.fallbackConnections.length) {
          throw error;
        }
      }
    }
    
    throw new Error('All RPC endpoints failed');
  }
  
  // Other methods like getParsedTransaction can be added similarly
}

// Initialize our robust connection
const robustConnection = new RobustConnection();

// Connection error tracking
let connectionErrorCount = 0;
const MAX_CONNECTION_ERRORS = 5;
const CONNECTION_ERROR_RESET_TIMEOUT = 60000; // 1 minute

interface WalletState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  chain: 'solana' | 'ethereum' | null
  balance: string | null
}

const RETRY_DELAY = 1500 // 1.5 seconds between retries
const MAX_RETRIES = 3

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    chain: null,
    balance: null
  })

  // Add a ref to track connection attempts
  const connectionAttemptsRef = useRef(0)
  const lastConnectionAttemptRef = useRef(0)

  // Reset connection error count periodically
  useEffect(() => {
    const resetTimer = setInterval(() => {
      if (connectionErrorCount > 0) {
        connectionErrorCount = 0
      }
    }, CONNECTION_ERROR_RESET_TIMEOUT)

    return () => clearInterval(resetTimer)
  }, [])

  // Get real Solana balance with improved error handling
  const getSolanaBalance = async (address: string): Promise<string> => {
    try {
      const publicKey = new PublicKey(address)
      
      // Validate public key
      if (!PublicKey.isOnCurve(publicKey.toBytes())) {
        throw new Error('Invalid public key')
      }

      // Use robust connection with fallback support
      const balance = await robustConnection.getBalance(publicKey)
      connectionErrorCount = 0 // Reset error count on success
      return (balance / LAMPORTS_PER_SOL).toFixed(4)
    } catch (error: any) {
      console.error('Error fetching Solana balance:', error)
      
      // Track RPC connection errors
      if (error.message.includes('403') || 
          error.message.includes('429') ||
          error.message.includes('Access forbidden') ||
          error.message.includes('rate limit')) {
        connectionErrorCount++
        
        if (connectionErrorCount >= MAX_CONNECTION_ERRORS) {
          throw new Error('RPC connection issues. Please try again later.')
        }
      }

      // Handle specific error cases
      if (error.message.includes('Invalid public key')) {
        throw new Error('Invalid wallet address')
      }
      
      return '0.0000'
    }
  }

  // Check if Phantom is installed
  const checkIfWalletIsInstalled = () => {
    if (typeof window !== 'undefined' && 'solana' in window) {
      const solana = window.solana
      if (solana?.isPhantom) {
        return true
      }
    }
    return false
  }

  // Check if wallet is already connected with improved error handling
  const checkIfWalletIsConnected = async () => {
    try {
      if (!checkIfWalletIsInstalled()) {
        setState(prev => ({ ...prev, error: 'Phantom wallet is not installed' }))
        return
      }

      const now = Date.now()
      if (now - lastConnectionAttemptRef.current < RETRY_DELAY) {
        console.log('Throttling wallet connection check')
        return
      }
      
      lastConnectionAttemptRef.current = now
      connectionAttemptsRef.current += 1

      const solana = window.solana
      if (!solana) return

      try {
        const response = await solana.connect({ onlyIfTrusted: true })
        const address = response.publicKey.toString()
        
        connectionAttemptsRef.current = 0
        
        // Get real balance with error handling
        try {
          const balance = await getSolanaBalance(address)
          
          // Store wallet connection in Supabase
          try {
            await supabase.from('wallet_connections').upsert({
              wallet_address: address,
              last_connected: new Date().toISOString()
            })
          } catch (dbError) {
            console.error("Database error:", dbError)
            // Don't throw - database errors shouldn't break wallet functionality
          }

          setState({
            address,
            isConnected: true,
            isConnecting: false,
            error: null,
            chain: 'solana',
            balance
          })
        } catch (balanceError: any) {
          setState(prev => ({
            ...prev,
            address,
            isConnected: true,
            isConnecting: false,
            error: balanceError.message,
            chain: 'solana',
            balance: '0.0000'
          }))
        }
      } catch (error: any) {
        handleWalletError(error)
      }
    } catch (error: any) {
      console.log('No existing connection found:', error)
    }
  }

  // Handle wallet errors
  const handleWalletError = (error: any) => {
    if (error?.message?.includes('rate limit') || 
        error?.name === 'WalletConnectionError' ||
        error?.message?.includes('requested method has been rate limited')) {
      console.log(`Rate limited (attempt ${connectionAttemptsRef.current}/${MAX_RETRIES})`)
      
      if (connectionAttemptsRef.current < MAX_RETRIES) {
        return
      } else {
        setState(prev => ({ 
          ...prev, 
          error: 'Wallet connection rate limited. Please try again later.'
        }))
      }
    } else {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: `Wallet error: ${error?.message || 'Unknown error'}`
      }))
    }
  }

  // Connect wallet with rate limit handling
  const connectWallet = async () => {
    try {
      if (!checkIfWalletIsInstalled()) {
        window.open('https://phantom.app/', '_blank')
        return
      }

      setState(prev => ({ ...prev, isConnecting: true, error: null }))
      
      const now = Date.now()
      if (now - lastConnectionAttemptRef.current < RETRY_DELAY) {
        setState(prev => ({ 
          ...prev, 
          isConnecting: false, 
          error: 'Please wait a moment before trying again' 
        }))
        return
      }
      
      lastConnectionAttemptRef.current = now
      connectionAttemptsRef.current += 1

      const solana = window.solana
      if (!solana) {
        setState(prev => ({ 
          ...prev, 
          isConnecting: false, 
          error: 'Phantom wallet is not available' 
        }))
        return
      }

      const response = await solana.connect()
      const address = response.publicKey.toString()

      connectionAttemptsRef.current = 0

      // Get real balance from Solana blockchain
      const balance = await getSolanaBalance(address)

      // Store wallet connection in Supabase
      try {
        await supabase.from('wallet_connections').upsert({
          wallet_address: address,
          last_connected: new Date().toISOString()
        })
      } catch (dbError) {
        console.error("Database error:", dbError)
      }

      setState({
        address,
        isConnected: true,
        isConnecting: false,
        error: null,
        chain: 'solana',
        balance
      })

      // Set up balance polling
      const pollBalance = setInterval(async () => {
        if (state.address) {
          const newBalance = await getSolanaBalance(state.address)
          setState(prev => ({ ...prev, balance: newBalance }))
        }
      }, 30000) // Poll every 30 seconds

      return () => clearInterval(pollBalance)

    } catch (error: any) {
      if (error?.message?.includes('rate limit') || 
          error?.name === 'WalletConnectionError' ||
          error?.message?.includes('requested method has been rate limited')) {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: 'Wallet connection rate limited. Please try again in a moment.'
        }))
      } else {
        setState(prev => ({
          ...prev,
          isConnecting: false,
          error: 'Failed to connect wallet: ' + (error?.message || 'Unknown error')
        }))
      }
      console.error('Wallet connection error:', error)
    }
  }

  // Disconnect wallet
  const disconnectWallet = async () => {
    try {
      if (!checkIfWalletIsInstalled()) return

      const solana = window.solana
      if (!solana) return

      await solana.disconnect()

      // Update connection status in Supabase
      if (state.address) {
        await supabase.from('wallet_connections').update({
          last_disconnected: new Date().toISOString()
        }).eq('wallet_address', state.address)
      }

      setState({
        address: null,
        isConnected: false,
        isConnecting: false,
        error: null,
        chain: null,
        balance: null
      })
    } catch (error) {
      console.error('Wallet disconnection error:', error)
    }
  }

  // Handle account changes
  const handleAccountChange = async (publicKey: any) => {
    if (publicKey) {
      const address = publicKey.toString()
      const balance = await getSolanaBalance(address)
      
      setState(prev => ({
        ...prev,
        address,
        balance,
        isConnected: true
      }))
    } else {
      setState({
        address: null,
        isConnected: false,
        isConnecting: false,
        error: null,
        chain: null,
        balance: null
      })
    }
  }

  // Set up event listeners
  useEffect(() => {
    const solana = window.solana
    
    if (solana?.on) {
      solana.on('accountChanged', handleAccountChange)
      checkIfWalletIsConnected()
    }

    return () => {
      if (solana?.removeListener) {
        solana.removeListener('accountChanged', handleAccountChange)
      }
    }
  }, [])

  return {
    address: state.address,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    chain: state.chain,
    balance: state.balance,
    connectWallet,
    disconnectWallet
  }
}

// Type definitions for browser extensions
declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean
      connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>
      disconnect: () => Promise<void>
      on?: (event: string, callback: (publicKey: any) => void) => void
      removeListener?: (event: string, callback: (publicKey: any) => void) => void
    }
    ethereum?: {
      isMetaMask?: boolean
      request: (args: { method: string, params?: any[] }) => Promise<any>
    }
  }
} 