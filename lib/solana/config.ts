import { Connection, Commitment, PublicKey } from '@solana/web3.js';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// Connection configuration with good defaults for mainnet
const connectionConfig = {
  commitment: 'confirmed' as Commitment,
};

// Mainnet cluster
export const network = WalletAdapterNetwork.Mainnet;

// Get RPC URLs from environment variables with fallbacks
export const getRpcUrls = (): string[] => {
  const urls: string[] = [];
  
  // Primary RPC URL (Helius - paid)
  const primaryRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (primaryRpcUrl) urls.push(primaryRpcUrl);
  
  // Fallback RPCs
  for (let i = 1; i <= 5; i++) {
    const fallbackUrl = process.env[`NEXT_PUBLIC_SOLANA_RPC_FALLBACK_${i}`];
    if (fallbackUrl) urls.push(fallbackUrl);
  }
  
  // Add default fallbacks if no environment variables exist
  if (urls.length === 0) {
    urls.push(
      'https://api.mainnet-beta.solana.com',          // Default mainnet endpoint
      'https://solana-api.projectserum.com'           // Project Serum endpoint
    );
  }
  
  return urls;
};

// List of supported wallet adapters - add/remove as needed
export const getSupportedWalletAdapters = () => {
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];
};

// Robust connection class with automatic failover
export class RobustConnection {
  private connections: Connection[] = [];
  private currentIndex = 0;
  private consecutiveFailures = 0;
  private readonly maxFailures = 3;
  
  constructor() {
    const rpcUrls = getRpcUrls();
    
    // Initialize connections to all RPC endpoints
    rpcUrls.forEach(url => {
      this.connections.push(new Connection(url, connectionConfig));
    });
    
    if (this.connections.length === 0) {
      throw new Error('No RPC URLs configured. Please check your environment variables.');
    }
  }
  
  private getCurrentConnection(): Connection {
    return this.connections[this.currentIndex];
  }
  
  private switchToNextConnection() {
    this.consecutiveFailures++;
    this.currentIndex = (this.currentIndex + 1) % this.connections.length;
    console.log(`Switched to RPC endpoint ${this.currentIndex} after failure`);
  }
  
  async getBalance(publicKey: PublicKey): Promise<number> {
    for (let attempt = 0; attempt < this.connections.length; attempt++) {
      try {
        const connection = this.getCurrentConnection();
        const balance = await connection.getBalance(publicKey);
        this.consecutiveFailures = 0; // Reset on success
        return balance;
      } catch (error) {
        console.error(`RPC endpoint ${this.currentIndex} failed:`, error);
        if (attempt < this.connections.length - 1) {
          this.switchToNextConnection();
        } else {
          throw error; // Rethrow if all connections fail
        }
      }
    }
    throw new Error('All RPC endpoints failed');
  }
  
  async getAccountInfo(publicKey: PublicKey): Promise<any> {
    for (let attempt = 0; attempt < this.connections.length; attempt++) {
      try {
        const connection = this.getCurrentConnection();
        const accountInfo = await connection.getAccountInfo(publicKey);
        this.consecutiveFailures = 0;
        return accountInfo;
      } catch (error) {
        console.error(`RPC endpoint ${this.currentIndex} failed:`, error);
        if (attempt < this.connections.length - 1) {
          this.switchToNextConnection();
        } else {
          throw error;
        }
      }
    }
    throw new Error('All RPC endpoints failed');
  }
  
  async getSignaturesForAddress(publicKey: PublicKey, options = {}): Promise<any[]> {
    for (let attempt = 0; attempt < this.connections.length; attempt++) {
      try {
        const connection = this.getCurrentConnection();
        const signatures = await connection.getSignaturesForAddress(publicKey, options);
        this.consecutiveFailures = 0;
        return signatures;
      } catch (error) {
        console.error(`RPC endpoint ${this.currentIndex} failed:`, error);
        if (attempt < this.connections.length - 1) {
          this.switchToNextConnection();
        } else {
          throw error;
        }
      }
    }
    throw new Error('All RPC endpoints failed');
  }
  
  async getParsedTransaction(signature: string, options = {}): Promise<any> {
    for (let attempt = 0; attempt < this.connections.length; attempt++) {
      try {
        const connection = this.getCurrentConnection();
        const tx = await connection.getParsedTransaction(signature, options);
        this.consecutiveFailures = 0;
        return tx;
      } catch (error) {
        console.error(`RPC endpoint ${this.currentIndex} failed:`, error);
        if (attempt < this.connections.length - 1) {
          this.switchToNextConnection();
        } else {
          throw error;
        }
      }
    }
    throw new Error('All RPC endpoints failed');
  }
  
  async getRecentBlockhash(): Promise<any> {
    for (let attempt = 0; attempt < this.connections.length; attempt++) {
      try {
        const connection = this.getCurrentConnection();
        const blockhash = await connection.getLatestBlockhash();
        this.consecutiveFailures = 0;
        return blockhash;
      } catch (error) {
        console.error(`RPC endpoint ${this.currentIndex} failed:`, error);
        if (attempt < this.connections.length - 1) {
          this.switchToNextConnection();
        } else {
          throw error;
        }
      }
    }
    throw new Error('All RPC endpoints failed');
  }
  
  // Add more methods as needed for your application
}

// Create a singleton instance to be used throughout the app
export const solanaConnection = new RobustConnection(); 